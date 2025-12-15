# Home Maid Tracking System (HMTS)

A comprehensive web-based platform for managing home maid services with three distinct user roles: Homeowners, Maids, and Administrators.

## 🚀 Features Implemented

### Authentication & Authorization
- Role-based login system (Admin, Homeowner, Maid)
- JWT token authentication with localStorage storage
- Protected routes with automatic redirection
- Maid approval workflow (pending → approved/rejected)

### Dashboards with Real Data
- **Admin Dashboard**: Statistics, pending maids, job tracking
- **Homeowner Dashboard**: Bookings, reviews, spending tracking
- **Maid Dashboard**: Job management, earnings, ratings

### Core Functionality
- Job creation and management
- Real-time location tracking
- Attendance check-in/check-out
- Review system with ratings
- Profile management with photo upload
- Identity verification (document + selfie)
- Notification system

### Technical Highlights
- Full MVC architecture with Node.js + Express
- MySQL database with proper relationships
- RESTful API design
- Responsive frontend with vanilla JavaScript
- File upload with Multer
- Geolocation tracking
- Comprehensive error handling

## 📁 Project Structure

```
/workspace/
├── config/                 # Database configuration
├── controllers/            # Request handlers
├── middleware/             # Authentication, validation
├── migrations/             # Database schema updates
├── models/                 # Database models
├── public/                 # Frontend assets
│   ├── uploads/           # Uploaded files (photos, docs)
│   ├── api.js             # Shared API functions
│   ├── script.js          # Admin dashboard
│   ├── homeowner-script.js # Homeowner dashboard
│   ├── maid-script.js     # Maid dashboard
│   └── *.html             # Page templates
├── routes/                 # API route definitions
├── services/               # Business logic
├── .env                   # Environment variables
├── server.js              # Main application entry
└── package.json           # Dependencies
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- npm package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd software
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=4000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=hmts
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Set up the database**
   Create the MySQL database:
   ```sql
   CREATE DATABASE hmts;
   ```

5. **Run database migrations**
   Execute the SQL files in the `migrations/` directory in order:
   ```bash
   # Run each migration file
   mysql -u your_username -p hmts < migrations/*.sql
   ```

6. **Create admin user**
   ```bash
   node create-admin.js
   ```

### Running the Application

1. **Start the server**
   ```bash
   npm start
   ```
   or
   ```bash
   node server.js
   ```

2. **Access the application**
   Open your browser and navigate to:
   - **Home Page**: http://localhost:4000/
   - **Admin Dashboard**: http://localhost:4000/index.html
   - **Homeowner Dashboard**: http://localhost:4000/homeowner.html
   - **Maid Dashboard**: http://localhost:4000/maid.html

## 👥 User Roles & Access

### Administrator
- **Credentials**: Created via `create-admin.js`
- **Access**: http://localhost:4000/index.html
- **Permissions**:
  - Manage maid registrations (approve/reject)
  - View system statistics
  - Monitor all jobs
  - Process identity verifications

### Homeowner
- **Registration**: http://localhost:4000/signup.html (select "Homeowner")
- **Access**: http://localhost:4000/homeowner.html
- **Permissions**:
  - Search and book maids
  - Track job progress
  - Submit reviews
  - View spending history

### Maid
- **Registration**: http://localhost:4000/signup.html (select "Maid")
- **Access**: http://localhost:4000/maid.html (after admin approval)
- **Permissions**:
  - Set availability status
  - Accept job requests
  - Check-in/check-out of jobs
  - Track earnings
  - Receive location-based job alerts

## 🔐 Authentication Flow

1. Users register at `/signup.html` selecting their role
2. Maids require admin approval before accessing the system
3. All users login at `/login.html`
4. JWT token stored in localStorage
5. Automatic role-based redirection to appropriate dashboard
6. Token validation on all protected routes

## 📱 Key Features

### Real-time Location Tracking
- Maids can share their location during active jobs
- Homeowners can view maid's last known location
- Integrated with Google Maps for visualization

### Identity Verification
- Secure document upload (ID + selfie)
- Admin review process
- Verification status tracking

### Notification System
- Email-like notifications stored in database
- Console logging for development
- Read/unread status tracking

### Profile Management
- Photo upload with preview
- Personal information update
- Verification status display

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Dashboard
- `GET /api/dashboard/my` - Current user statistics
- `GET /api/dashboard/admin` - Admin statistics
- `GET /api/dashboard/homeowner` - Homeowner statistics
- `GET /api/dashboard/maid` - Maid statistics

### Jobs
- `POST /api/jobs` - Create job (homeowner)
- `GET /api/jobs/my` - Get user's jobs
- `POST /api/jobs/checkin` - Maid check-in
- `POST /api/jobs/checkout` - Maid check-out

### Maids
- `GET /api/maids/pending` - List pending maids (admin)
- `POST /api/maids/approve` - Approve maid (admin)
- `POST /api/maids/reject` - Reject maid (admin)
- `GET /api/maids/recommend` - Recommended maids (homeowner)

### Reviews
- `POST /api/reviews` - Submit review (homeowner)
- `GET /api/reviews/maid/:id` - Get maid reviews

### Location
- `POST /api/location/update` - Update maid location
- `GET /api/location/job/:id` - Get job maid location

### Profile
- `POST /api/profile/photo` - Upload profile photo
- `POST /api/profile/verify` - Submit verification docs
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile

### Notifications
- `GET /api/notifications/my` - Get user notifications
- `POST /api/notifications/:id/read` - Mark notification read
- `POST /api/notifications/read-all` - Mark all read

### Admin
- `GET /api/admin/notifications` - All notifications
- `GET /api/admin/notifications/pending` - Pending notifications
- `GET /api/admin/verifications/pending` - Pending verifications
- `POST /api/admin/verifications/process` - Process verification

## 🧪 Testing

Run the built-in test suite:
```bash
npm test
```

Or test individual components:
```bash
node test-apis.js
```

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🆘 Support

For issues and questions, please contact the development team.