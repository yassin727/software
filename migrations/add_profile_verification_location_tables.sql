-- Migration script to add profile photo and verification columns

-- Add columns to users table
ALTER TABLE users 
ADD COLUMN photo_url VARCHAR(255) NULL DEFAULT NULL AFTER role,
ADD COLUMN id_document_url VARCHAR(255) NULL DEFAULT NULL AFTER photo_url,
ADD COLUMN selfie_url VARCHAR(255) NULL DEFAULT NULL AFTER id_document_url,
ADD COLUMN verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending' AFTER selfie_url,
ADD COLUMN verification_notes TEXT NULL DEFAULT NULL AFTER verification_status;

-- Create table for maid locations
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

-- Add actual_duration column to jobs table (for accurate earnings calculation)
ALTER TABLE jobs 
ADD COLUMN actual_duration DECIMAL(5,2) NULL DEFAULT NULL AFTER estimated_duration;
