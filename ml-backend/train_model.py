import pandas as pd
import glob
import os
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import pickle
import hashlib

def hash_zone(zone_id_str):
    return int(hashlib.md5(str(zone_id_str).encode('utf-8')).hexdigest(), 16) % 1000

def train():
    # Read all crowd_density_*.csv files in the parent directory
    csv_files = glob.glob("../crowd_density_*.csv")
    if not csv_files:
        print("No CSV files found matching crowd_density_*.csv in the root directory.")
        return

    df_list = []
    for file in csv_files:
        print(f"Reading {file}...")
        df_list.append(pd.read_csv(file))
    
    data = pd.concat(df_list, ignore_index=True)
    
    # Ensure timestamp is datetime
    data['timestamp'] = pd.to_datetime(data['timestamp'], format='mixed')
    data.sort_values(by=['event_type', 'timestamp'], inplace=True)
    
    # Create target variable: prediction_15min (shifted by -1 within each event_type)
    data['prediction_15min'] = data.groupby('event_type')['crowd_density'].shift(-1)
    
    # Drop rows with NaN in target
    data = data.dropna(subset=['prediction_15min'])
    
    # We need to map 'zone' or 'event_id'. The CSV has event_type. 
    # The API will receive event_id and zone_id. We can hash event_type to simulate zone_id for training.
    data['zone_id_encoded'] = data['event_type'].apply(hash_zone)
    data['hour'] = data['timestamp'].dt.hour
    data['minute'] = data['timestamp'].dt.minute
    
    # Features: current density, time (hour, minute), and zone (encoded)
    features = ['crowd_density', 'hour', 'minute', 'zone_id_encoded']
    target = 'prediction_15min'
    
    X = data[features]
    y = data[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost model...")
    model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    print(f"Model trained. Test MSE: {mse:.4f}")
    
    # Calculate error standard deviation for confidence scoring
    residuals = y_test - y_pred
    std_dev = residuals.std()
    
    # Save the model and the std_dev
    model_data = {
        'model': model,
        'std_dev': std_dev
    }
    
    model_path = "xgboost_crowd_model.pkl"
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
    
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train()
