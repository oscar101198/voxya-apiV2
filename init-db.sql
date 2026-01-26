-- Initialize Voxya Database
-- This script runs when the PostgreSQL container starts for the first time
-- TypeORM will handle table creation, this script handles PostgreSQL-specific setup

-- Create extensions that TypeORM cannot create
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
-- CREATE EXTENSION IF NOT EXISTS "postgis"; -- Uncomment if you need geospatial data

-- Set timezone for the database
SET timezone = 'UTC';
ALTER DATABASE voxya SET timezone TO 'UTC';

-- Create additional schemas for organization
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS analytics;
