# Deploy HMTS to Heroku

## Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed
- Git repository

## Step 1: Install Heroku CLI
```bash
# Windows (using chocolatey)
choco install heroku-cli

# Or download from: https://devcenter.heroku.com/articles/heroku-cli
```

## Step 2: Login to Heroku
```bash
heroku login
```

## Step 3: Create Heroku App
```bash
# Create new app (replace 'your-app-name' with unique name)
heroku create your-hmts-app

# Or let Heroku generate a name
heroku create
```

## Step 4: Add Database (JawsDB MySQL)
```bash
# Add JawsDB MySQL addon (free tier)
heroku addons:create jawsdb:kitefin

# Get database URL
heroku config:get JAWSDB_URL
```

## Step 5: Set Environment Variables
```bash
# Set JWT secret
heroku config:set JWT_SECRET="your-super-secure-jwt-secret-key-here"

# Set Node environment
heroku config:set NODE_ENV=production

# The database URL is automatically set by JawsDB addon
```

## Step 6: Update Database Configuration
Create `config/heroku-db.js`:
```javascript
const mysql = require('mysql2');
const url = require('url');

let pool;

if (process.env.JAWSDB_URL) {
  // Parse Heroku JawsDB URL
  const dbUrl = url.parse(process.env.JAWSDB_URL);
  
  pool = mysql.createPool({
    host: dbUrl.hostname,
    port: dbUrl.port,
    user: dbUrl.auth.split(':')[0],
    password: dbUrl.auth.split(':')[1],
    database: dbUrl.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
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

## Step 7: Update package.json for Heroku
Add these scripts to package.json:
```json
{
  "scripts": {
    "start": "node server.js",
    "heroku-postbuild": "npm run setup-heroku",
    "setup-heroku": "node heroku-setup.js"
  }
}
```

## Step 8: Create Heroku Setup Script
Create `heroku-setup.js`:
```javascript
const db = require('./config/heroku-db');
const fs = require('fs');
const path = require('path');

async function setupHerokuDatabase() {
  try {
    console.log('Setting up Heroku database...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim() && !statement.includes('CREATE DATABASE')) {
          try {
            await db.execute(statement);
          } catch (error) {
            if (!error.message.includes('already exists')) {
              console.warn('Schema warning:', error.message);
            }
          }
        }
      }
    }
    
    // Run migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
      
      for (const file of migrationFiles) {
        const migrationPath = path.join(migrationsDir, file);
        const migration = fs.readFileSync(migrationPath, 'utf8');
        const statements = migration.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await db.execute(statement);
            } catch (error) {
              if (!error.message.includes('already exists')) {
                console.warn(`Migration warning in ${file}:`, error.message);
              }
            }
          }
        }
      }
    }
    
    console.log('Heroku database setup completed!');
  } catch (error) {
    console.error('Heroku database setup failed:', error);
  }
}

if (require.main === module) {
  setupHerokuDatabase().then(() => process.exit(0));
}

module.exports = { setupHerokuDatabase };
```

## Step 9: Deploy to Heroku
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Deploy to Heroku
git push heroku main

# Or if your branch is master
git push heroku master
```

## Step 10: Setup Database and Seed Data
```bash
# Run database setup
heroku run npm run setup-heroku

# Create admin user
heroku run node create-admin.js

# Seed menu data
heroku run node seed-menu.js
```

## Step 11: Open Your App
```bash
heroku open
```

## Troubleshooting

### View Logs
```bash
heroku logs --tail
```

### Check Config
```bash
heroku config
```

### Restart App
```bash
heroku restart
```

### Connect to Database
```bash
heroku run node -e "
const db = require('./config/heroku-db');
db.execute('SELECT COUNT(*) as count FROM users')
  .then(([rows]) => console.log('Users:', rows[0].count))
  .catch(console.error);
"
```

## Custom Domain (Optional)
```bash
# Add custom domain
heroku domains:add yourdomain.com

# Get DNS target
heroku domains
```

Your HMTS app will be available at: `https://your-app-name.herokuapp.com`