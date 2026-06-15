from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pickle
import pandas as pd
import datetime
import hashlib
import os
import cv2
import numpy as np
import base64
from ultralytics import YOLO
import uuid

# Graceful import of face_recognition in case dlib failed to build (common on Windows)
try:
    import face_recognition
    FACE_REC_AVAILABLE = True
except ImportError:
    FACE_REC_AVAILABLE = False

# Load models on startup
MODEL_PATH = "xgboost_crowd_model.pkl"
model_data = None
yolo_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models once on startup using the FastAPI lifespan protocol."""
    global model_data, yolo_model

    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            model_data = pickle.load(f)
        print("Model loaded successfully.")
    else:
        print(f"Warning: {MODEL_PATH} not found. Please train the model first.")

    try:
        yolo_model = YOLO("yolov8n.pt")
        print("YOLOv8 model loaded successfully.")
    except Exception as e:
        print(f"Failed to load YOLOv8 model: {e}")

    yield
    # (No teardown required — process exit releases the loaded models.)


app = FastAPI(title="Crowd Management ML Backend", lifespan=lifespan)

# Allow direct calls in dev (the Next.js API routes proxy here, but the backend
# may also be hit straight from a browser / tooling during development).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Liveness probe + model availability flags."""
    return {
        "status": "ok",
        "models": {
            "xgboost": model_data is not None,
            "yolo": yolo_model is not None,
            "face": FACE_REC_AVAILABLE,
        },
    }

class PredictionRequest(BaseModel):
    event_id: str
    zone_id: str
    current_density: float
    timestamp: str

class PredictionResponse(BaseModel):
    predicted_density: float
    confidence_score: float

class AnomalyDetectionResponse(BaseModel):
    detection_type: str
    confidence: float
    bounding_box: dict

def hash_zone(zone_id_str):
    return int(hashlib.md5(str(zone_id_str).encode('utf-8')).hexdigest(), 16) % 1000

@app.post("/predict/crowd-density", response_model=PredictionResponse)
def predict_crowd_density(req: PredictionRequest):
    if model_data is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")
        
    model = model_data['model']
    std_dev = model_data['std_dev']
    
    try:
        dt = pd.to_datetime(req.timestamp)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid timestamp format: {e}")
        
    hour = dt.hour
    minute = dt.minute
    
    zone_encoded = hash_zone(req.zone_id)
    
    features = pd.DataFrame([{
        'crowd_density': req.current_density,
        'hour': hour,
        'minute': minute,
        'zone_id_encoded': zone_encoded
    }])
    
    try:
        prediction = model.predict(features)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")
        
    predicted_density = float(max(0.0, min(1.0, prediction)))
    
    error_margin = std_dev / (predicted_density + 0.1)
    confidence = max(0.0, min(100.0, 100.0 * (1.0 - error_margin)))
    
    return PredictionResponse(
        predicted_density=predicted_density,
        confidence_score=round(confidence, 2)
    )

@app.post("/analyze/anomaly", response_model=AnomalyDetectionResponse)
async def analyze_anomaly(file: Optional[UploadFile] = File(None), base64_image: Optional[str] = Form(None), metadata_duration: Optional[int] = Form(0)):
    if yolo_model is None:
        raise HTTPException(status_code=503, detail="YOLOv8 model is not loaded.")
        
    img = None
    if file:
        img_data = await file.read()
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif base64_image:
        try:
            if "," in base64_image:
                base64_image = base64_image.split(",")[1]
            img_data = base64.b64decode(base64_image)
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image: {e}")
    else:
        raise HTTPException(status_code=400, detail="Must provide either file or base64_image")

    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    # Run YOLOv8 inference
    results = yolo_model(img)
    
    detections = []
    if len(results) > 0:
        for box in results[0].boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            name = results[0].names[cls_id]
            detections.append({
                "class": name,
                "confidence": conf,
                "box": {"x": int(x1), "y": int(y1), "w": int(x2-x1), "h": int(y2-y1)},
                "raw_box": (x1, y1, x2, y2)
            })
            
    # 1. Abandoned Object: backpack or suitcase alone for extended period (simulated via metadata)
    abandoned_objects = [d for d in detections if d["class"] in ["backpack", "suitcase"]]
    if abandoned_objects and metadata_duration > 60:
        top_obj = max(abandoned_objects, key=lambda x: x["confidence"])
        return AnomalyDetectionResponse(
            detection_type="abandoned_object",
            confidence=top_obj["confidence"],
            bounding_box=top_obj["box"]
        )
        
    # 2. Unusual Movement: Overlapping bounding boxes of 'person' classes
    persons = [d for d in detections if d["class"] == "person"]
    overlap_detected = False
    top_person_overlap = None
    if len(persons) >= 2:
        for i in range(len(persons)):
            for j in range(i+1, len(persons)):
                b1 = persons[i]["raw_box"]
                b2 = persons[j]["raw_box"]
                
                x_left = max(b1[0], b2[0])
                y_top = max(b1[1], b2[1])
                x_right = min(b1[2], b2[2])
                y_bottom = min(b1[3], b2[3])
                
                if x_right > x_left and y_bottom > y_top:
                    intersection_area = (x_right - x_left) * (y_bottom - y_top)
                    a1 = (b1[2] - b1[0]) * (b1[3] - b1[1])
                    a2 = (b2[2] - b2[0]) * (b2[3] - b2[1])
                    iou = intersection_area / float(a1 + a2 - intersection_area)
                    if iou > 0.3: # overlap threshold
                        overlap_detected = True
                        top_person_overlap = persons[i] if persons[i]["confidence"] > persons[j]["confidence"] else persons[j]
                        break
            if overlap_detected:
                break
                
    if overlap_detected and top_person_overlap:
        return AnomalyDetectionResponse(
            detection_type="unusual_movement",
            confidence=top_person_overlap["confidence"],
            bounding_box=top_person_overlap["box"]
        )
        
    # Default: None detected
    return AnomalyDetectionResponse(
        detection_type="none",
        confidence=0.0,
        bounding_box={"x": 0, "y": 0, "w": 0, "h": 0}
    )

# In-memory storage for registered lost persons
registered_persons = {}

class PersonRegisterResponse(BaseModel):
    person_id: str
    message: str

class PersonMatchResponse(BaseModel):
    person_id: Optional[str]
    confidence: float
    bounding_box: Optional[dict]

@app.post("/person/register", response_model=PersonRegisterResponse)
async def register_person(file: UploadFile = File(...)):
    if not FACE_REC_AVAILABLE:
        raise HTTPException(status_code=503, detail="face_recognition library is not available. Please install dlib and face_recognition.")
    
    img_data = await file.read()
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image.")
        
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    face_encodings = face_recognition.face_encodings(rgb_img)
    
    if len(face_encodings) == 0:
        raise HTTPException(status_code=400, detail="No face found in the image.")
        
    person_id = str(uuid.uuid4())
    # Take the first face found
    registered_persons[person_id] = face_encodings[0]
    
    return PersonRegisterResponse(person_id=person_id, message="Person registered successfully.")

@app.post("/person/match", response_model=PersonMatchResponse)
async def match_person(file: Optional[UploadFile] = File(None), base64_image: Optional[str] = Form(None)):
    if not FACE_REC_AVAILABLE:
        raise HTTPException(status_code=503, detail="face_recognition library is not available. Please install dlib and face_recognition.")
        
    img = None
    if file:
        img_data = await file.read()
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif base64_image:
        try:
            if "," in base64_image:
                base64_image = base64_image.split(",")[1]
            img_data = base64.b64decode(base64_image)
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image: {e}")
    else:
        raise HTTPException(status_code=400, detail="Must provide either file or base64_image")

    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image")
        
    if not registered_persons:
        return PersonMatchResponse(person_id=None, confidence=0.0, bounding_box=None)
        
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_img)
    face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
    
    if len(face_encodings) == 0:
        return PersonMatchResponse(person_id=None, confidence=0.0, bounding_box=None)
        
    best_match_id = None
    best_match_distance = 1.0 # Max distance
    best_match_box = None
    
    for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
        for p_id, reg_encoding in registered_persons.items():
            # face_distance returns an array, but we compare one vs one, so it's a 1-element array
            distance = face_recognition.face_distance([reg_encoding], face_encoding)[0]
            if distance < best_match_distance:
                best_match_distance = distance
                best_match_id = p_id
                best_match_box = {"x": left, "y": top, "w": right - left, "h": bottom - top}
                
    # Confidence is roughly 1 - distance. A good match is < 0.6 distance
    if best_match_distance < 0.6:
        confidence = max(0.0, min(100.0, (1.0 - best_match_distance) * 100))
        return PersonMatchResponse(
            person_id=best_match_id,
            confidence=round(confidence, 2),
            bounding_box=best_match_box
        )

    return PersonMatchResponse(person_id=None, confidence=0.0, bounding_box=None)


# Documented run port is 8001:
#   uvicorn main:app --host 0.0.0.0 --port 8001
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
