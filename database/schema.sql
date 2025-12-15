-- HMTS Database Schema
-- Home Maid Tracking System

-- Create database
CREATE DATABASE IF NOT EXISTS hmts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hmts;

-- Users table (base for all user types)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'homeowner', 'maid') NOT NULL,
    photo_url VARCHAR(255) NULL DEFAULT NULL,
    id_document_url VARCHAR(255) NULL DEFAULT NULL,
    selfie_url VARCHAR(255) NULL DEFAULT NULL,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verification_notes TEXT NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_verification_status (verification_status)
);

-- Maids table (extends users for maid-specific data)
CREATE TABLE IF NOT EXISTS maids (
    maid_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT DEFAULT NULL,
    specializations TEXT,
    experience_years INT DEFAULT 0,
    hourly_rate DECIMAL(8,2) DEFAULT 0.00,
    availability_schedule JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_approval_status (approval_status)
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    homeowner_id INT NOT NULL,
    maid_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    scheduled_datetime DATETIME NOT NULL,
    status ENUM('requested', 'accepted', 'in_progress', 'completed', 'cancelled') DEFAULT 'requested',
    hourly_rate DECIMAL(8,2) NOT NULL,
    estimated_duration DECIMAL(5,2) DEFAULT 4.00,
    actual_duration DECIMAL(5,2) NULL DEFAULT NULL,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (hourly_rate * COALESCE(actual_duration, estimated_duration)) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (homeowner_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (maid_id) REFERENCES maids(maid_id) ON DELETE CASCADE,
    INDEX idx_homeowner_id (homeowner_id),
    INDEX idx_maid_id (maid_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_datetime (scheduled_datetime)
);

-- Attendance table (for check-in/check-out tracking)
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    check_in_time TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP NULL,
    duration_minutes INT GENERATED ALWAYS AS (TIMESTAMPDIFF(MINUTE, check_in_time, check_out_time)) STORED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    INDEX idx_job_id (job_id),
    INDEX idx_check_in_time (check_in_time)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_job_id (job_id),
    INDEX idx_reviewee_id (reviewee_id),
    INDEX idx_rating (rating)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    channel ENUM('email', 'sms', 'console') DEFAULT 'email',
    destination VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Maid locations table
CREATE TABLE IF NOT EXISTS maid_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    maid_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (maid_id) REFERENCES maids(maid_id) ON DELETE CASCADE,
    INDEX idx_maid_id (maid_id),
    INDEX idx_updated_at (updated_at)
);

-- Menus table (for dynamic menu system)
CREATE TABLE IF NOT EXISTS menus (
    menu_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    path VARCHAR(255),
    icon VARCHAR(50),
    parent_id INT NULL,
    role ENUM('admin', 'homeowner', 'maid', 'all') DEFAULT 'all',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(menu_id) ON DELETE CASCADE,
    INDEX idx_role (role),
    INDEX idx_parent_id (parent_id),
    INDEX idx_sort_order (sort_order)
);

-- Insert default admin user
INSERT IGNORE INTO users (name, email, password_hash, role, verification_status) 
VALUES ('Admin User', 'admin@hmts.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'verified');

-- Sample data for testing (optional)
-- Insert sample homeowner
INSERT IGNORE INTO users (name, email, password_hash, role, phone, verification_status) 
VALUES ('John Doe', 'homeowner@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'homeowner', '1234567890', 'verified');

-- Insert sample maid user
INSERT IGNORE INTO users (name, email, password_hash, role, phone, verification_status) 
VALUES ('Maria Garcia', 'maid@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'maid', '0987654321', 'verified');

-- Insert maid profile for the sample maid
INSERT IGNORE INTO maids (user_id, approval_status, specializations, experience_years, hourly_rate)
SELECT user_id, 'approved', 'General Cleaning, Deep Cleaning', 3, 25.00 
FROM users WHERE email = 'maid@test.com' LIMIT 1;