# Home Maid Tracking System (HMTS)

A comprehensive web-based platform for managing home maid services with three distinct user roles: Homeowners, Maids, and Administrators. This system implements MVC architecture, automated testing, data validation, and role-based authentication.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MySQL 8.0+
- Git

### Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd software
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
# Copy .env file and update with your database credentials
cp .env.example .env
# Edit .env with your MySQL credentials
```

4. **Setup database**
```bash
# Create database and run migrations
npm run setup

# Create admin user
npm run seed-admin

# Seed menu items
npm run seed-menu
```

5. **Start the server**
```bash
npm start
# Server will run on http://localhost:4000
```

6. **Run tests**
```bash
npm test
```

## 📁 Project Structure

```
├── config/           # Database configuration
├── controllers/      # HTTP request handlers (MVC Controllers)
├── middleware/       # Authentication, validation, file upload
├── models/          # Data access layer (Repository Pattern)
├── services/        # Business logic layer (Service Pattern)
├── routes/          # Express route definitions
├── public/          # Frontend files (HTML, CSS, JS)
├── tests/           # Automated unit tests (Jest + Supertest)
├── migrations/      # Database migration scripts
├── docs/           # Documentation (patterns.md)
├── database/       # Database schema
└── deploy.md       # Production deployment guide
```

## 🏗️ Architecture & Design Patterns

### MVC Architecture
- **Models** (`models/`): Data access using Repository pattern
- **Views** (`public/`): Frontend HTML/CSS/JS files  
- **Controllers** (`controllers/`): HTTP request/response handling

### Service Layer Pattern
- Business logic encapsulated in `services/` directory
- Clean separation between controllers and data access
- Reusable business operations

### Repository Pattern
- Database operations abstracted in model classes
- Consistent data access interface
- Easy to mock for testing

See [docs/patterns.md](docs/patterns.md) for detailed pattern documentation.

## 🔐 Authentication & Authorization

### Role-Based Access Control
- **Admin**: Manage maids, view all data, approve registrations
- **Homeowner**: Create jobs, review maids, manage bookings
- **Maid**: Accept jobs, check-in/out, update location

### JWT Authentication
- Secure token-based authentication
- Role-based route protection
- Session management

## 📊 Key Features

### ✅ Implemented Features

1. **User Management**
   - Registration with role selection
   - JWT-based authentication
   - Profile management with photo upload
   - Identity verification system

2. **Maid Approval System**
   - Admin approval workflow
   - Pending maid notifications
   - Approval/rejection with reasons
   - Email notifications

3. **Job Management**
   - Job creation by homeowners
   - Job assignment to maids
   - Status tracking (requested → in_progress → completed)
   - Check-in/check-out system

4. **Review System**
   - Rating system (1-5 stars)
   - Comments and feedback
   - Maid rating aggregation

5. **Dashboard Analytics**
   - Role-specific dashboards
   - Real-time statistics
   - Performance metrics

6. **Location Tracking**
   - Maid location updates
   - Job-based location sharing
   - Privacy controls

7. **Notification System**
   - Email notifications
   - In-app notifications
   - Admin notification management

8. **Dynamic Menu System**
   - Role-based navigation
   - Self-referencing menu structure
   - Hierarchical menu items

9. **AI/ML Recommendation**
   - Rule-based maid recommendations
   - Scoring algorithm based on ratings and history
   - Homeowner-specific suggestions

### 🧪 Testing & Quality Assurance

- **Automated Unit Tests**: Jest + Supertest
- **Data Validation**: express-validator middleware
- **Error Handling**: Centralized error management
- **Code Quality**: Consistent naming, JSDoc documentation

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Jobs
- `POST /api/jobs` - Create job (homeowner)
- `GET /api/jobs/my` - Get user's jobs
- `POST /api/jobs/checkin` - Maid check-in
- `POST /api/jobs/checkout` - Maid check-out

### Maids
- `GET /api/maids/pending` - Get pending approvals (admin)
- `POST /api/maids/approve` - Approve maid (admin)
- `GET /api/maids/recommend` - Get recommended maids

### Dashboard
- `GET /api/dashboard/my` - Get dashboard stats

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/maid/:id` - Get maid reviews

## 🔧 Configuration

### Environment Variables
```bash
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hmts
JWT_SECRET=your_jwt_secret
```

### Database Configuration
- MySQL 8.0+ required
- UTF8MB4 character set
- Automated migrations included

## 🚀 Deployment

See [deploy.md](deploy.md) for comprehensive production deployment guide including:
- PM2 process management
- Nginx reverse proxy configuration
- SSL/HTTPS setup with Let's Encrypt
- Database optimization
- Security best practices

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/auth.test.js

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage
- Authentication endpoints
- Job management
- Data validation
- Error handling

## 📋 Commands Reference

```bash
# Development
npm start              # Start server
npm run dev           # Start server (alias)
npm test              # Run tests

# Database
npm run setup         # Setup database & migrations
npm run seed-admin    # Create admin user
npm run seed-menu     # Seed menu items

# Production
npm run start         # Production server start
```

## 🔍 Troubleshooting

### Database Connection Issues
1. Ensure MySQL server is running
2. Check credentials in `.env` file
3. Verify database exists: `npm run setup`

### Authentication Issues
1. Check JWT_SECRET in `.env`
2. Clear browser localStorage
3. Verify user roles in database

### File Upload Issues
1. Check `public/uploads/` directory permissions
2. Verify multer configuration
3. Check file size limits

## 📈 Performance Considerations

- Database indexing on frequently queried columns
- JWT token expiration (8 hours)
- File upload size limits (5MB profiles, 10MB verification)
- Connection pooling for database
- Gzip compression in production

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- File upload restrictions
- SQL injection prevention
- XSS protection headers

## 🤝 Contributing

1. Follow MVC architecture patterns
2. Add tests for new features
3. Use JSDoc for documentation
4. Follow existing code style
5. Update README for new features

## 📄 License

This project is licensed under the ISC License.