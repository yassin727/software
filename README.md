# Home Maid Tracking System - Phase 1 Prototype

## 📋 Overview
A comprehensive web-based platform for managing home maid services with three distinct user roles: Homeowners, Maids, and Administrators. This prototype aligns with the Software Requirements Specification (SRS) document and demonstrates all key features defined in Phase 1.

## ✨ Key Features Implemented

### 👥 For Homeowners
- **Search & Discovery**: Search maids by location, specialization, availability, and ratings
- **Smart Booking**: Book maid services with detailed task lists and special instructions
- **Real-time Tracking**: 
  - Live location tracking with geo-fence verification
  - Task progress monitoring with completion updates
  - Check-in/check-out notifications
- **Communication**: Direct messaging with maids
- **Review System**: Rate and review maids after service completion
- **History Management**: View complete service history with invoices
- **Dashboard**: Quick overview of active bookings, pending tasks, and spending

### 🏠 For Maids
- **Registration & Approval**: Register with document uploads, wait for admin approval
- **Availability Control**: Toggle online/offline status in real-time
- **Job Management**:
  - View incoming job requests with full details
  - Accept or decline jobs
  - View schedule and upcoming jobs
- **Check-in/Check-out**: Location-verified attendance tracking
- **Task Updates**: Update task completion status in real-time
- **Earnings Dashboard**: Track daily, weekly, and monthly earnings
- **Review Management**: View all client reviews and ratings
- **Calendar**: Visual schedule with weekly/monthly views

### 🔐 For Administrators
- **Maid Approval System**: 
  - Review pending maid registrations
  - View uploaded documents (ID, certificates, health records)
  - Approve or reject applications with reasons
- **User Management**: Monitor and manage all users and maids
- **Analytics Dashboard**: 
  - System-wide statistics
  - Performance metrics
  - Revenue tracking
- **Reports Generation**: Generate comprehensive reports
- **Task Monitoring**: Oversee all active jobs and tasks
- **Payment Oversight**: Track all transactions and payments

## 📁 Files Structure
```
/workspace/
├── index.html              # Admin Dashboard (Main entry point for admins)
├── homeowner.html          # Homeowner Interface
├── maid.html              # Maid Interface
├── styles.css             # Shared stylesheet (45KB - comprehensive styling)
├── script.js              # Main JavaScript functions
├── homeowner-script.js    # Homeowner-specific functions
├── maid-script.js         # Maid-specific functions
└── README.md              # This documentation
```

## 🚀 How to Use

### Quick Start
1. **For Admin Dashboard**: Open `index.html` in your web browser
2. **For Homeowner Interface**: Open `homeowner.html` in your web browser
3. **For Maid Interface**: Open `maid.html` in your web browser

### Demo Scenarios

#### Scenario 1: Homeowner Books a Maid
1. Open `homeowner.html`
2. Navigate to "Search Maids" section
3. Filter by location, specialization, or rating
4. Click "Book Now" on a maid card
5. Fill in the booking form with date, time, and tasks
6. Submit booking and wait for maid acceptance

#### Scenario 2: Maid Accepts Job & Completes Tasks
1. Open `maid.html`
2. Toggle "Availability" switch to go Online
3. Navigate to "Job Requests" section
4. Review job details and click "Accept Job"
5. On job day, use "Check In" button
6. Mark tasks as completed one by one
7. Click "Complete & Check Out" when finished

#### Scenario 3: Admin Approves Maid
1. Open `index.html`
2. Click "Review Now" on the pending approvals alert
3. Review maid's documents and information
4. Click "View" to see uploaded documents
5. Click "Approve" or "Reject" with reason

## 🎨 UI/UX Features

### Modern Design
- **Gradient Sidebar**: Purple gradient with smooth animations
- **Card-based Layout**: Clean, organized content cards
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Transitions**: Fade-in animations and hover effects
- **Color-coded Status**: Visual indicators for different states
  - Green: Active/Online/Completed
  - Orange: Pending/Upcoming
  - Red: Urgent/Payment
  - Blue: Information
  - Gray: Inactive/Offline

### Interactive Elements
- **Real-time Notifications**: Toast notifications for user actions
- **Modal Forms**: Popup forms for booking, reviews, and data entry
- **Star Rating**: Interactive star rating system
- **Progress Bars**: Visual task completion indicators
- **Timeline**: Activity timeline with color-coded markers
- **Toggle Switches**: Modern availability toggle for maids

## 🔧 Technical Implementation

### Technology Stack
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: 
  - CSS Grid and Flexbox for layouts
  - CSS Variables for theming
  - Animations and transitions
  - Responsive media queries
- **Vanilla JavaScript**: 
  - No external frameworks required
  - Modular function organization
  - Event-driven architecture
- **Font Awesome 6.4.0**: Icon library
- **Placeholder Images**: Via placeholder.com

### Code Organization
- **Separation of Concerns**: Separate JS files for each user role
- **Reusable Components**: Shared styles and functions
- **Clean Code**: Well-commented and organized
- **Consistent Naming**: Clear variable and function names

## 📊 Features Mapping to SRS

### Functional User Requirements ✅
- ✅ Homeowner registration, login, booking, tracking, and reviews
- ✅ Maid registration with approval workflow
- ✅ Maid online/offline status control
- ✅ Admin approval/rejection of maids
- ✅ Task viewing and status updates

### Functional System Requirements ✅
- ✅ User credential management (simulated)
- ✅ Check-in/check-out timestamp logging (simulated)
- ✅ Admin approval workflow for maids
- ✅ Dashboard for all user roles
- ✅ Notification system (simulated)
- ✅ Real-time task synchronization (simulated)

### Non-functional Requirements ✅
- ✅ **Performance**: Lightweight, fast loading
- ✅ **Usability**: Intuitive, mobile-friendly UI
- ✅ **Maintainability**: Modular code structure
- ✅ **Scalability**: Organized for future expansion
- ✅ **Portability**: Web-based, cross-platform

### Prototype Pages ✅
- ✅ Maid registration and status control
- ✅ Admin dashboard with approval system
- ✅ Homeowner maid search and booking
- ✅ Task tracking and progress sharing
- ✅ Rating and review system

## 🎯 Key Interactions Demonstrated

1. **Maid Approval Flow**: Admin reviews documents → Approves/Rejects → Maid notified
2. **Booking Flow**: Homeowner searches → Selects maid → Books → Maid accepts
3. **Job Execution**: Maid checks in → Completes tasks → Updates status → Checks out
4. **Review Flow**: Job completes → Homeowner rates → Review visible to all
5. **Real-time Updates**: Status changes reflected across dashboards

## 📱 Responsive Breakpoints
- **Desktop**: > 768px (Full sidebar, multi-column layouts)
- **Tablet**: 481px - 768px (Responsive grid, collapsible sidebar)
- **Mobile**: < 480px (Single column, hamburger menu)

## ⚠️ Prototype Limitations

### What This IS:
- ✅ Complete UI/UX prototype
- ✅ Interactive frontend demonstration
- ✅ Visual representation of all features
- ✅ User flow demonstration
- ✅ Responsive design showcase

### What This IS NOT:
- ❌ No backend server or database
- ❌ No real authentication
- ❌ No data persistence
- ❌ No actual payment processing
- ❌ No real GPS/location tracking
- ❌ No email notifications

### Simulated Features:
- User authentication (alerts instead of actual login)
- Database operations (in-memory only)
- Real-time notifications (JavaScript alerts/toasts)
- Payment processing (UI only)
- Location tracking (placeholder map)
- File uploads (no actual file handling)

## 🔮 Future Enhancements (Phase 2+)

### Backend Integration
- Node.js/Express or Django backend
- PostgreSQL/MongoDB database
- RESTful API architecture
- JWT authentication
- WebSocket for real-time updates

### Additional Features
- Push notifications (Firebase Cloud Messaging)
- Real GPS tracking (Google Maps API)
- Payment gateway integration (Stripe/PayPal)
- SMS/Email notifications (Twilio/SendGrid)
- Document verification (OCR/AI)
- Chat with file sharing
- Advanced analytics and reporting
- Multi-language support
- Dark mode theme

## 👨‍💻 Development Team

**Course**: Software Engineering  
**Date**: October 2025

**Team Members**:
- Yassin Wefky
- Mayar Hossam
- Shahd Ahmed
- Elie George
- Jana Tarek

## 📝 Documentation

This prototype is accompanied by:
- Software Requirements Specification (SRS) document
- Use case diagrams
- Form specifications
- Tabular specifications
- System scenarios

## 🎓 Academic Context

This project is developed as part of a Software Engineering course to demonstrate:
- Requirements analysis and specification
- User interface design principles
- User experience considerations
- Responsive web design
- Software prototyping
- Agile development practices

## 📄 License

This is an academic project for educational purposes.

---

**Note**: This is a Phase 1 prototype demonstrating the user interface and user experience. For production use, backend development, security implementation, and thorough testing are required.
