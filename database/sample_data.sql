-- Sample Data for VoiceRoute Database
-- Populates tables with realistic transportation data for testing

USE voiceroute_db;

-- Sample users (passwords are hashed version of 'password123')
INSERT INTO users (username, email, password_hash, phone, full_name, preferences) VALUES
('john_traveler', 'john@example.com', '$2b$10$rQNqWpjJKPQ8QJmJQJmJQOl.QJmJQJmJQJmJQJmJQJmJQJmJQ', '+91-9876543210', 'John Singh', 
 '{"preferred_transport": "train", "max_budget": 2000, "preferred_time": "morning", "language": "en-US"}'),
('priya_commuter', 'priya@example.com', '$2b$10$rQNqWpjJKPQ8QJmJQJmJQOl.QJmJQJmJQJmJQJmJQJmJQJmJQ', '+91-9876543211', 'Priya Sharma',
 '{"preferred_transport": "both", "max_budget": 1500, "preferred_time": "evening", "language": "hi-IN"}'),
('rahul_student', 'rahul@example.com', '$2b$10$rQNqWpjJKPQ8QJmJQJmJQOl.QJmJQJmJQJmJQJmJQJmJQJmJQ', '+91-9876543212', 'Rahul Kumar',
 '{"preferred_transport": "bus", "max_budget": 800, "preferred_time": "any", "language": "en-US"}'),
('guest_user', 'guest@voiceroute.com', '$2b$10$rQNqWpjJKPQ8QJmJQJmJQOl.QJmJQJmJQJmJQJmJQJmJQJmJQ', NULL, 'Guest User',
 '{"preferred_transport": "both", "max_budget": 5000, "preferred_time": "any", "language": "en-US"}');

-- Sample train routes (Major Indian Railway routes)
INSERT INTO routes (transport_type, operator_name, route_name, route_number, source, destination, departure_time, arrival_time, journey_duration, fare_base, fare_sleeper, fare_ac, total_seats, available_seats, data_source) VALUES
-- Delhi to Mumbai routes
('train', 'Indian Railways', 'Rajdhani Express', '12951', 'New Delhi', 'Mumbai Central', '16:55:00', '08:35:00', 945, 1200.00, 2500.00, 4500.00, 800, 45, 'irctc_api'),
('train', 'Indian Railways', 'August Kranti Rajdhani', '12953', 'New Delhi', 'Mumbai Central', '17:20:00', '09:05:00', 965, 1200.00, 2500.00, 4500.00, 800, 67, 'irctc_api'),
('train', 'Indian Railways', 'Mumbai Rajdhani', '12951', 'New Delhi', 'Mumbai Central', '20:30:00', '12:40:00', 970, 1200.00, 2500.00, 4500.00, 800, 23, 'irctc_api'),

-- Delhi to Bangalore routes  
('train', 'Indian Railways', 'Rajdhani Express', '12429', 'New Delhi', 'Bangalore City', '20:05:00', '06:00:00', 2055, 1500.00, 3200.00, 5800.00, 800, 156, 'irctc_api'),
('train', 'Indian Railways', 'Karnataka Express', '12627', 'New Delhi', 'Bangalore City', '20:20:00', '23:15:00', 1735, 800.00, 1200.00, 2100.00, 1200, 234, 'irctc_api'),

-- Mumbai to Bangalore routes
('train', 'Indian Railways', 'Udyan Express', '11301', 'Mumbai CST', 'Bangalore City', '08:05:00', '22:30:00', 865, 600.00, 950.00, 1800.00, 1000, 89, 'irctc_api'),
('train', 'Indian Railways', 'Chalukya Express', '11139', 'Mumbai CST', 'Bangalore City', '11:40:00', '05:40:00', 1080, 650.00, 1000.00, 1900.00, 1000, 167, 'irctc_api'),

-- Delhi to Kolkata routes
('train', 'Indian Railways', 'Rajdhani Express', '12313', 'New Delhi', 'Howrah Junction', '16:55:00', '10:05:00', 1030, 1100.00, 2200.00, 4000.00, 800, 78, 'irctc_api'),
('train', 'Indian Railways', 'Duronto Express', '12273', 'New Delhi', 'Howrah Junction', '21:50:00', '13:35:00', 945, 900.00, 1800.00, 3200.00, 900, 123, 'irctc_api'),

-- Chennai to Bangalore routes
('train', 'Indian Railways', 'Shatabdi Express', '12007', 'Chennai Central', 'Bangalore City', '06:00:00', '11:00:00', 300, 450.00, NULL, 850.00, 500, 45, 'irctc_api'),
('train', 'Indian Railways', 'Brindavan Express', '12639', 'Chennai Central', 'Bangalore City', '07:40:00', '13:30:00', 350, 200.00, 300.00, 550.00, 800, 178, 'irctc_api');

-- Sample bus routes (State transport and private operators)
INSERT INTO routes (transport_type, operator_name, route_name, route_number, source, destination, departure_time, arrival_time, journey_duration, fare_base, fare_sleeper, fare_ac, total_seats, available_seats, data_source) VALUES
-- Delhi to Mumbai bus routes
('bus', 'Delhi Transport Corporation', 'Delhi-Mumbai Express', 'DTC-101', 'Delhi ISBT', 'Mumbai Central Bus Terminal', '20:00:00', '08:00:00', 720, 800.00, 1200.00, 1500.00, 45, 12, 'redbus_api'),
('bus', 'Raj Travels', 'Luxury Coach', 'RT-205', 'Delhi ISBT', 'Mumbai Central Bus Terminal', '21:30:00', '11:30:00', 840, 900.00, 1400.00, 1800.00, 40, 8, 'redbus_api'),
('bus', 'VRL Travels', 'Sleeper Coach', 'VRL-301', 'Delhi ISBT', 'Mumbai Central Bus Terminal', '19:45:00', '09:15:00', 810, 850.00, 1300.00, 1600.00, 35, 15, 'redbus_api'),

-- Delhi to Jaipur bus routes
('bus', 'RSRTC', 'Rajasthan Roadways', 'RSRTC-501', 'Delhi ISBT', 'Jaipur Bus Terminal', '06:00:00', '11:30:00', 330, 200.00, 300.00, 450.00, 50, 23, 'rsrtc_api'),
('bus', 'RSRTC', 'AC Express', 'RSRTC-502', 'Delhi ISBT', 'Jaipur Bus Terminal', '14:30:00', '20:00:00', 330, 250.00, 350.00, 500.00, 45, 18, 'rsrtc_api'),
('bus', 'Purple Travels', 'Luxury Bus', 'PT-401', 'Delhi ISBT', 'Jaipur Bus Terminal', '22:00:00', '03:30:00', 330, 300.00, 450.00, 600.00, 35, 7, 'redbus_api'),

-- Mumbai to Pune bus routes
('bus', 'MSRTC', 'Shivneri Bus', 'MSRTC-201', 'Mumbai Central', 'Pune Station', '06:30:00', '10:00:00', 210, 150.00, NULL, 250.00, 45, 28, 'msrtc_api'),
('bus', 'MSRTC', 'AC Shivneri', 'MSRTC-202', 'Mumbai Central', 'Pune Station', '08:00:00', '11:30:00', 210, 200.00, NULL, 300.00, 40, 15, 'msrtc_api'),
('bus', 'Neeta Travels', 'Volvo Multi-Axle', 'NT-301', 'Mumbai Central', 'Pune Station', '19:30:00', '23:00:00', 210, 250.00, NULL, 400.00, 35, 9, 'redbus_api'),

-- Bangalore to Chennai bus routes  
('bus', 'KSRTC', 'Airavat Club Class', 'KSRTC-401', 'Bangalore Majestic', 'Chennai CMBT', '22:00:00', '06:00:00', 480, 400.00, 600.00, 800.00, 40, 12, 'ksrtc_api'),
('bus', 'SRS Travels', 'Sleeper Coach', 'SRS-501', 'Bangalore Majestic', 'Chennai CMBT', '21:30:00', '05:30:00', 480, 450.00, 650.00, 850.00, 35, 8, 'redbus_api'),
('bus', 'VRL Travels', 'Multi-Axle AC', 'VRL-601', 'Bangalore Majestic', 'Chennai CMBT', '23:15:00', '07:15:00', 480, 500.00, 700.00, 900.00, 45, 19, 'redbus_api'),

-- Local city routes
('bus', 'DTC', 'City Bus Route', 'DTC-001', 'Connaught Place', 'Airport', '05:00:00', '07:00:00', 120, 25.00, NULL, 50.00, 60, 32, 'local_transport'),
('bus', 'BMTC', 'Vayu Vajra', 'BMTC-201', 'Bangalore City Railway Station', 'Kempegowda Airport', '04:30:00', '06:00:00', 90, 100.00, NULL, 150.00, 35, 18, 'bmtc_api'),
('bus', 'BEST', 'AC Bus', 'BEST-101', 'Mumbai CST', 'Airport', '05:15:00', '07:15:00', 120, 45.00, NULL, 75.00, 40, 22, 'best_api');

-- Sample search history (realistic user searches)
INSERT INTO search_history (user_id, query_text, source_location, destination, transport_type, search_results, response_time_ms, user_agent, ip_address) VALUES
(1, 'find trains from delhi to mumbai', 'New Delhi', 'Mumbai Central', 'train', 
 '{"results_found": 3, "api_calls": 1, "cache_hit": false}', 1200, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.100'),
(1, 'show me bus routes to jaipur', 'Delhi ISBT', 'Jaipur Bus Terminal', 'bus',
 '{"results_found": 3, "api_calls": 1, "cache_hit": true}', 450, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.100'),
(2, 'mumbai se pune bus', 'Mumbai Central', 'Pune Station', 'bus',
 '{"results_found": 3, "api_calls": 1, "cache_hit": false}', 890, 'Mozilla/5.0 (Android 12; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', '192.168.1.101'),
(3, 'cheapest way to reach bangalore from chennai', 'Chennai Central', 'Bangalore City', 'both',
 '{"results_found": 5, "api_calls": 2, "cache_hit": false}', 1650, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', '192.168.1.102'),
(1, 'fastest train to kolkata', 'New Delhi', 'Howrah Junction', 'train',
 '{"results_found": 2, "api_calls": 1, "cache_hit": true}', 320, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.100'),
(2, 'airport bus from bangalore city station', 'Bangalore City Railway Station', 'Kempegowda Airport', 'bus',
 '{"results_found": 1, "api_calls": 1, "cache_hit": false}', 567, 'Mozilla/5.0 (Android 12; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', '192.168.1.101'),
(4, 'delhi to mumbai travel options', 'New Delhi', 'Mumbai Central', 'both',
 '{"results_found": 6, "api_calls": 2, "cache_hit": false}', 1890, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.103');

-- Sample user favorites
INSERT INTO user_favorites (user_id, route_id, alias, notification_enabled) VALUES
(1, 1, 'Office Trip Delhi-Mumbai', TRUE),
(1, 14, 'Delhi Airport Bus', FALSE),
(2, 9, 'Weekend Mumbai-Pune', TRUE),
(3, 7, 'College Route', FALSE),
(1, 5, 'Bangalore Business Trip', TRUE);

-- Sample feedback
INSERT INTO user_feedback (user_id, route_id, rating, feedback_type, comments) VALUES
(1, 1, 5, 'route_accuracy', 'Excellent service and timing was perfect. Rajdhani is always reliable.'),
(2, 9, 4, 'route_accuracy', 'Good bus service but could be more punctual during monsoon.'),
(3, 7, 3, 'route_accuracy', 'Average experience. Bus was delayed by 30 minutes.'),
(1, 14, 5, 'route_accuracy', 'Perfect for airport connectivity. Clean and comfortable.'),
(2, 10, 4, 'general', 'AC bus service is good value for money.'),
(1, 5, 5, 'route_accuracy', 'Karnataka Express is economical and comfortable for long journeys.');

-- Sample voice analytics
INSERT INTO voice_analytics (user_id, voice_command, recognized_intent, confidence_score, processing_time_ms, language_detected, success) VALUES
(1, 'find trains from delhi to mumbai', 'route_search', 0.9500, 1200, 'en-US', TRUE),
(1, 'show me bus routes to jaipur', 'route_search', 0.8900, 890, 'en-US', TRUE),
(2, 'mumbai se pune bus', 'route_search', 0.7800, 1100, 'hi-IN', TRUE),
(3, 'cheapest way to reach bangalore from chennai', 'route_search_with_filter', 0.8200, 1400, 'en-US', TRUE),
(1, 'fastest train to kolkata', 'route_search_with_filter', 0.9100, 980, 'en-US', TRUE),
(2, 'airport bus from bangalore city station', 'route_search', 0.8600, 1050, 'en-US', TRUE),
(4, 'delhi to mumbai travel options', 'route_search', 0.9200, 1200, 'en-US', TRUE);

-- Sample notifications
INSERT INTO notifications (user_id, title, message, type, priority) VALUES
(1, 'Route Alert: Delhi-Mumbai', 'Rajdhani Express is running 15 minutes late today due to fog.', 'route_alert', 'medium'),
(2, 'New Bus Service Available', 'MSRTC has launched a new AC service on Mumbai-Pune route with every 30-minute frequency.', 'system_update', 'low'),
(1, 'Booking Reminder', 'Don't forget to book your Bangalore trip for next week. Only 23 seats remaining!', 'booking_reminder', 'high'),
(3, 'Weekend Offer', 'Get 20% off on all bus bookings this weekend. Use code WEEKEND20.', 'promotional', 'low');

-- Sample API usage tracking
INSERT INTO api_usage (user_id, ip_address, endpoint, method, status_code, response_time_ms, request_size_bytes, response_size_bytes, user_agent) VALUES
(1, '192.168.1.100', '/api/search/routes', 'POST', 200, 1200, 256, 2048, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(1, '192.168.1.100', '/api/user/favorites', 'GET', 200, 150, 128, 512, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(2, '192.168.1.101', '/api/search/routes', 'POST', 200, 890, 198, 1789, 'Mozilla/5.0 (Android 12; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0'),
(3, '192.168.1.102', '/api/search/routes', 'POST', 200, 1650, 312, 3456, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'),
(4, '192.168.1.103', '/api/voice/process', 'POST', 200, 1890, 445, 2789, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

-- Verify data insertion
SELECT 'Database populated successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_routes FROM routes;
SELECT COUNT(*) as total_searches FROM search_history;
SELECT COUNT(*) as total_favorites FROM user_favorites;
SELECT COUNT(*) as total_feedback FROM user_feedback;
SELECT COUNT(*) as total_voice_analytics FROM voice_analytics;
