-- Initial database setup for boilerplate
CREATE DATABASE blrplt_db;
CREATE USER blrplt_user WITH PASSWORD 'blrplt_password';
GRANT ALL PRIVILEGES ON DATABASE blrplt_db TO blrplt_user;

-- Connect to the database
\c blrplt_db;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO blrplt_user;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";