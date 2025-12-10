-- Home Maid Tracking System (HMTS) schema
CREATE DATABASE IF NOT EXISTS hmts DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hmts;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'homeowner', 'maid') NOT NULL DEFAULT 'homeowner',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Maids table
CREATE TABLE IF NOT EXISTS maids (
  maid_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  documents TEXT,
  approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  availability TINYINT(1) NOT NULL DEFAULT 1,
  rating FLOAT NOT NULL DEFAULT 0,
  CONSTRAINT fk_maids_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  job_id INT AUTO_INCREMENT PRIMARY KEY,
  homeowner_id INT NOT NULL,
  maid_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(255),
  scheduled_datetime DATETIME,
  status ENUM('requested', 'pending', 'scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'requested',
  hourly_rate DECIMAL(10, 2),
  cost DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_jobs_homeowner FOREIGN KEY (homeowner_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_jobs_maid FOREIGN KEY (maid_id) REFERENCES maids(maid_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  check_in_time DATETIME,
  check_out_time DATETIME,
  duration_minutes INT,
  CONSTRAINT fk_attendance_job FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  reviewee_id INT NOT NULL,
  rating INT NOT NULL,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_job FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

