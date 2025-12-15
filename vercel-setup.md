# Deploy HMTS to Vercel + PlanetScale

This is the most modern and scalable approach using Vercel for hosting and PlanetScale for MySQL database.

## Step 1: Setup PlanetScale Database
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up and create new database: `hmts-db`
3. Create a branch: `main`
4. Get connection string from "Connect" button

## Step 2: Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

## Step 3: Create vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Step 4: Update Database Configuration
Install PlanetScale client:
```bash
npm install @planetscale/database
```

Update `config/planetscale-db.js`:
```javascript
const { connect } = require('@planetscale/database');

let db;

if (process.env.DATABASE_URL) {
  // PlanetScale connection
  db = connect({
    url: process.env.DATABASE_URL
  });
} else {
  // Local MySQL fallback
  const mysql = require('mysql2');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hmts',
  });
  db = pool.promise();
}

module.exports = db;
```

## Step 5: Deploy to Vercel
```bash
# In your project directory
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: hmts-app
# - Directory: ./
```

## Step 6: Set Environment Variables
```bash
# Set environment variables
vercel env add JWT_SECRET
# Enter your JWT secret when prompted

vercel env add DATABASE_URL
# Enter your PlanetScale connection string
```

## Step 7: Setup Database Schema
Use PlanetScale CLI or web interface to run your schema:
```bash
# Install PlanetScale CLI
# Then connect and run schema
pscale shell hmts-db main < database/schema.sql
```

## Advantages:
- ✅ Serverless (scales automatically)
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Git-based deployments
- ✅ PlanetScale has excellent MySQL compatibility