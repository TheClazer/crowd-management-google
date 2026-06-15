-- Seed data for CrowdGuard platform
-- Insert sample event, users, zones, and initial data

-- Insert sample event
INSERT INTO events (id, name, description, location, start_date, end_date, capacity, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Summer Music Festival 2025', 'Annual outdoor music festival featuring top artists', 'Central Park, New York', '2025-07-15 10:00:00+00', '2025-07-17 23:00:00+00', 15000, 'active');

-- Insert sample users
INSERT INTO users (id, email, password_hash, first_name, last_name, role, responder_type, phone) VALUES
-- Admin users
('550e8400-e29b-41d4-a716-446655440001', 'admin@crowdguard.com', '$2b$10$example_hash_1', 'John', 'Admin', 'admin', NULL, '+1-555-0101'),
-- Responders
('550e8400-e29b-41d4-a716-446655440002', 'sarah.johnson@crowdguard.com', '$2b$10$example_hash_2', 'Sarah', 'Johnson', 'responder', 'medical', '+1-555-0102'),
('550e8400-e29b-41d4-a716-446655440003', 'mike.chen@crowdguard.com', '$2b$10$example_hash_3', 'Mike', 'Chen', 'responder', 'security', '+1-555-0103'),
('550e8400-e29b-41d4-a716-446655440004', 'lisa.wong@crowdguard.com', '$2b$10$example_hash_4', 'Lisa', 'Wong', 'responder', 'fire', '+1-555-0104'),
('550e8400-e29b-41d4-a716-446655440005', 'alex.kim@crowdguard.com', '$2b$10$example_hash_5', 'Alex', 'Kim', 'responder', 'technical', '+1-555-0105'),
-- Regular users
('550e8400-e29b-41d4-a716-446655440006', 'user1@example.com', '$2b$10$example_hash_6', 'Emma', 'Wilson', 'user', NULL, '+1-555-0106'),
('550e8400-e29b-41d4-a716-446655440007', 'user2@example.com', '$2b$10$example_hash_7', 'David', 'Brown', 'user', NULL, '+1-555-0107');

-- Insert event zones
INSERT INTO zones (id, event_id, name, description, capacity, zone_type, coordinates) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Main Stage', 'Primary performance area', 8000, 'stage', '{"type": "polygon", "coordinates": [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]]}'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'Food Court', 'Food vendors and dining area', 2000, 'food', '{"type": "polygon", "coordinates": [[[200, 0], [300, 0], [300, 100], [200, 100], [200, 0]]]}'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'Entrance A', 'Main entrance gate', 1000, 'entrance', '{"type": "polygon", "coordinates": [[[400, 0], [450, 0], [450, 50], [400, 50], [400, 0]]]}'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', 'VIP Area', 'VIP seating and amenities', 500, 'vip', '{"type": "polygon", "coordinates": [[[500, 0], [600, 0], [600, 80], [500, 80], [500, 0]]]}'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440000', 'Parking Lot', 'Vehicle parking area', 2000, 'parking', '{"type": "polygon", "coordinates": [[[700, 0], [900, 0], [900, 200], [700, 200], [700, 0]]]}'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440000', 'Backstage', 'Artist and crew area', 200, 'backstage', '{"type": "polygon", "coordinates": [[[50, 150], [150, 150], [150, 200], [50, 200], [50, 150]]]}');

-- Insert CCTV cameras
INSERT INTO cameras (id, event_id, zone_id, camera_id, name, location, status, coordinates) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'CAM-001', 'Main Stage Camera 1', 'Front of main stage', 'online', '{"lat": 40.7829, "lng": -73.9654}'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'CAM-002', 'Main Stage Camera 2', 'Side of main stage', 'online', '{"lat": 40.7830, "lng": -73.9655}'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', 'CAM-003', 'Food Court Camera 1', 'Food court entrance', 'online', '{"lat": 40.7825, "lng": -73.9650}'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', 'CAM-004', 'Entrance A Camera', 'Main entrance monitoring', 'online', '{"lat": 40.7820, "lng": -73.9645}'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440013', 'CAM-005', 'VIP Area Camera', 'VIP section overview', 'online', '{"lat": 40.7835, "lng": -73.9660}'),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440014', 'CAM-006', 'Parking Lot Camera 1', 'Parking lot entrance', 'online', '{"lat": 40.7815, "lng": -73.9640}');

-- Insert sample incidents
INSERT INTO incidents (id, event_id, zone_id, incident_id, type, severity, status, title, description, location, reported_by, assigned_to, reported_at) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'MED-001', 'Medical Emergency', 'high', 'active', 'Person Collapsed', 'Person collapsed near main stage, unconscious', 'Main Stage - Section A', 'Security Team', NULL, NOW() - INTERVAL '5 minutes'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', 'MED-002', 'Minor Injury', 'medium', 'claimed', 'Cut on Hand', 'Cut on hand from broken glass', 'Food Court - Vendor 3', 'Vendor Staff', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '10 minutes'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', 'SEC-001', 'Crowd Control', 'high', 'active', 'Crowd Bottleneck', 'Large crowd gathering at entrance, potential bottleneck', 'Entrance Gate B', 'AI System', NULL, NOW() - INTERVAL '3 minutes'),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440014', 'SEC-002', 'Suspicious Activity', 'medium', 'investigating', 'Unattended Bag', 'Unattended bag reported in parking lot', 'Parking Lot C', 'Event Attendee', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '15 minutes');

-- Insert crowd density data (last 2 hours)
INSERT INTO crowd_density (event_id, zone_id, timestamp, current_count, density_percentage, prediction_15min, prediction_30min, ai_confidence) VALUES
-- Main Stage data
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '2 hours', 6800, 85.0, 88.5, 92.0, 87.5),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '1 hour', 7200, 90.0, 92.5, 89.0, 89.2),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '30 minutes', 7360, 92.0, 90.0, 85.5, 91.0),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', NOW(), 6800, 85.0, 87.5, 90.0, 88.7),
-- Food Court data
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '2 hours', 1200, 60.0, 65.0, 70.0, 82.3),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '1 hour', 1400, 70.0, 72.5, 68.0, 85.1),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '30 minutes', 1560, 78.0, 75.0, 72.0, 86.8),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', NOW(), 1440, 72.0, 68.5, 65.0, 84.9),
-- Entrance A data
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '2 hours', 600, 60.0, 68.0, 74.0, 83.5),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '1 hour', 780, 78.0, 84.0, 88.0, 85.9),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '30 minutes', 880, 88.0, 91.0, 86.0, 88.4),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', NOW(), 820, 82.0, 79.0, 75.0, 87.1),
-- VIP Area data
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '2 hours', 210, 42.0, 46.0, 50.0, 80.0),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '1 hour', 260, 52.0, 55.0, 58.0, 81.7),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '30 minutes', 300, 60.0, 62.0, 64.0, 83.2),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440013', NOW(), 280, 56.0, 54.0, 52.0, 82.5),
-- Parking Lot data
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440014', NOW() - INTERVAL '2 hours', 1500, 75.0, 70.0, 66.0, 79.4),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440014', NOW() - INTERVAL '1 hour', 1300, 65.0, 60.0, 56.0, 80.8),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440014', NOW() - INTERVAL '30 minutes', 1100, 55.0, 52.0, 50.0, 82.1),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440014', NOW(), 1000, 50.0, 48.0, 46.0, 83.0);

-- Insert AI anomaly detections
INSERT INTO anomaly_detections (id, event_id, camera_id, zone_id, detection_type, confidence, description, status, detected_at) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 'crowd_behavior', 85.7, 'Unusual crowd movement pattern detected near main stage', 'active', NOW() - INTERVAL '8 minutes'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440014', 'abandoned_object', 92.3, 'Unattended bag detected for over 10 minutes', 'investigating', NOW() - INTERVAL '12 minutes'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440011', 'unusual_movement', 78.9, 'Person moving against crowd flow in food court', 'resolved', NOW() - INTERVAL '20 minutes');

-- Insert sample lost person report
INSERT INTO lost_persons (id, event_id, reporter_name, reporter_contact, person_name, description, last_seen_location, last_seen_time, status) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440000', 'Jennifer Smith', '+1-555-0201', 'Tommy Smith', 'Young boy, 8 years old, wearing red t-shirt and blue jeans, brown hair', 'Food Court', NOW() - INTERVAL '45 minutes', 'active');

-- Insert system metrics
INSERT INTO system_metrics (event_id, metric_type, metric_name, value, unit, timestamp) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'camera', 'cameras_online', 24, 'count', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'camera', 'cameras_total', 24, 'count', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'system', 'uptime_percentage', 98.5, 'percent', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'ai', 'prediction_accuracy', 87.2, 'percent', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'response', 'avg_response_time', 4.2, 'minutes', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'incidents', 'total_resolved_today', 23, 'count', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'incidents', 'total_active', 7, 'count', NOW());
