# Deploy HMTS to Railway

Railway is a modern deployment platform that's easier than Heroku and has better free tier.

## Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub account

## Step 2: Install Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login
```

## Step 3: Initialize Railway Project
```bash
# In your project directory
railway init

# Select "Empty Project"
# Give it a name like "hmts-app"
```

## Step 4: Add MySQL Database
```bash
# Add MySQL service
railway add mysql

# This automatically creates a MySQL database and sets environment variables
```

## Step 5: Set Environment Variables
```bash
# Set JWT secret
railway variables set JWT_SECRET="your-super-secure-jwt-secret-key-here"

# Set Node environment
railway variables set NODE_ENV=production
```

## Step 6: Update Database Configuration
Railway automatically provides these environment variables:
- `MYSQL_URL` - Complete connection string
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

Update `config/db.js`:
```javascript
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

let pool;

if (process.env.MYSQL_URL) {
  // Railway MySQL connection
  pool = mysql.createPool(process.env.MYSQL_URL + '?ssl={"rejectUnauthorized":false}');
} else {
  // Local development
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hmts',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

module.exports = pool.promise();
```

## Step 7: Create railway.json (Optional)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

## Step 8: Deploy
```bash
# Deploy to Railway
railway up

# Or connect to GitHub for automatic deployments
railway connect
```

## Step 9: Setup Database
```bash
# Run database setup
railway run npm run setup

# Create admin user  
railway run node create-admin.js

# Seed menu data
railway run node seed-menu.js
```

## Step 10: Get Your URL
```bash
# Generate domain
railway domain

# Your app will be available at the generated URL
```

## Advantages of Railway:
- ✅ Generous free tier ($5/month credit)
- ✅ Automatic HTTPS
- ✅ Built-in database
- ✅ GitHub integration
- ✅ Easy environment variables
- ✅ Better performance than Heroku free tier