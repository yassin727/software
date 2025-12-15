# Deploy HMTS to Render

Render offers free hosting with good performance and automatic SSL.

## Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account

## Step 2: Create Database
1. In Render dashboard, click "New +"
2. Select "PostgreSQL" (free tier available)
3. Name: `hmts-database`
4. Database: `hmts`
5. User: `hmts_user`
6. Click "Create Database"

## Step 3: Update Database Configuration
Since Render uses PostgreSQL, update your dependencies:

```bash
npm install pg
npm uninstall mysql2
```

Create `config/render-db.js`:
```javascript
const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  // Render PostgreSQL connection
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  // Local development (you can keep MySQL for local)
  const mysql = require('mysql2');
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hmts',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }).promise();
}

module.exports = pool;
```

## Step 4: Convert SQL to PostgreSQL
Create `database/postgres-schema.sql`:
```sql
-- PostgreSQL version of schema
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'homeowner', 'maid')) NOT NULL,
    photo_url VARCHAR(255) DEFAULT NULL,
    id_document_url VARCHAR(255) DEFAULT NULL,
    selfie_url VARCHAR(255) DEFAULT NULL,
    verification_status VARCHAR(20) CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    verification_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Continue with other tables...
-- (Convert all MySQL-specific syntax to PostgreSQL)
```

## Step 5: Create Web Service
1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `hmts-app`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

## Step 6: Set Environment Variables
In the web service settings, add:
```
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-here
DATABASE_URL=(automatically provided by database)
```

## Step 7: Deploy
1. Click "Create Web Service"
2. Render will automatically deploy from your GitHub repo
3. Get your URL: `https://your-app-name.onrender.com`

## Note: Database Conversion
If you prefer to keep MySQL, you can use:
- **PlanetScale** (free MySQL hosting)
- **Railway** (easier MySQL setup)
- **Heroku** with JawsDB addon

Render's free PostgreSQL is very reliable, but requires converting your MySQL schema.