const bcrypt = require('bcrypt');
const db = require('./config/db');

async function createAdmin() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  await db.execute(
    'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    ['Administrator', 'admin@maidtrack.com', '1234567890', passwordHash, 'admin']
  );
  console.log('Admin created! Email: admin@maidtrack.com, Password: admin123');
  process.exit(0);
}

createAdmin().catch(err => { console.error(err); process.exit(1); });