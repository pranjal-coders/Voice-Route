-- VoiceRoute Database Exploration Script
-- Run this script in MySQL to explore your database

-- Use the database
USE voiceroute_db;

-- Show all tables
SHOW TABLES;

-- Show table structures
DESCRIBE users;
DESCRIBE routes;
DESCRIBE bookings;
DESCRIBE vehicles;
DESCRIBE drivers;
DESCRIBE reviews;
DESCRIBE payments;
DESCRIBE route_schedules;
DESCRIBE user_favorites;
DESCRIBE api_usage_logs;
DESCRIBE feedback;
DESCRIBE system_settings;

-- Show sample data (first 5 rows from each table)
SELECT 'USERS TABLE' as table_name;
SELECT * FROM users LIMIT 5;

SELECT 'ROUTES TABLE' as table_name;
SELECT * FROM routes LIMIT 5;

SELECT 'BOOKINGS TABLE' as table_name;
SELECT * FROM bookings LIMIT 5;

SELECT 'VEHICLES TABLE' as table_name;
SELECT * FROM vehicles LIMIT 5;

SELECT 'DRIVERS TABLE' as table_name;
SELECT * FROM drivers LIMIT 5;

-- Show table counts
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
    'routes' as table_name, 
    COUNT(*) as record_count 
FROM routes
UNION ALL
SELECT 
    'bookings' as table_name, 
    COUNT(*) as record_count 
FROM bookings
UNION ALL
SELECT 
    'vehicles' as table_name, 
    COUNT(*) as record_count 
FROM vehicles
UNION ALL
SELECT 
    'drivers' as table_name, 
    COUNT(*) as record_count 
FROM drivers;

-- Show database size
SELECT 
    table_schema as 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'voiceroute_db'
GROUP BY table_schema;