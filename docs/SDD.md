# Software Design Document (SDD)
## Home Maid Tracking System (HMTS)

**Version:** 1.0  
**Date:** December 2024  
**Project:** HMTS - Home Maid Tracking System  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Design Viewpoints](#2-design-viewpoints)
3. [Data Design](#3-data-design)
4. [User Interface Design](#4-user-interface-design)
5. [Project Plan and Task Distribution](#5-project-plan-and-task-distribution)

---

## 1. Introduction

### 1.1 Purpose
This Software Design Document (SDD) describes the architectural design, data structures, user interfaces, and implementation details for the Home Maid Tracking System (HMTS). The system facilitates connections between homeowners and domestic cleaning service providers through a comprehensive web-based platform.

### 1.2 Scope
HMTS supports three primary user roles:
- **Homeowners**: Create job requests, find and review maids, manage payments
- **Maids**: Accept jobs, track attendance, manage availability, view earnings
- **Administrators**: Approve maid registrations, manage users, view system analytics

### 1.3 System Overview
The system implements a Model-View-Controller (MVC) architecture using Node.js, Express.js, and MongoDB, with role-based authentication, real-time notifications, payment processing, and AI-powered maid recommendations.

---

## 2. Design Viewpoints

### 2.1 Use Case Diagram
![Use Case Diagram](diagrams/use-case-diagram.png)

**Description:** The use case diagram illustrates the primary interactions between system actors (Homeowner, Maid, Admin, System) and the core functionalities. Key use cases include:

- **Homeowner Use Cases**: Register, create jobs, find maids, make payments, leave reviews
- **Maid Use Cases**: Register, accept jobs, check-in/out, update status, manage profile
- **Admin Use Cases**: Approve maids, manage users, view reports, verify identities
- **System Use Cases**: Generate recommendations, process payments, send notifications

### 2.2 Sequence Diagram
![Sequence Diagram](diagrams/sequence-diagram.png)

**Description:** The sequence diagram shows the detailed flow of job creation and assignment process, including:

1. **Job Creation Flow**: Homeowner creates job → System generates recommendations → Notifications sent to maids
2. **Job Acceptance Flow**: Maid accepts job → Status updated → Homeowner notified
3. **Check-in Flow**: Maid arrives → Location verified → Attendance tracked → Notifications sent

### 2.3 Class Diagram
![Class Diagram](diagrams/class-diagram.png)

**Description:** The class diagram represents the object-oriented structure of the system, showing:

- **Model Classes**: User, Maid, Job, Attendance, Review, Payment, Message, Notification, Menu
- **Service Classes**: UserService, JobService, RecommendationService, NotificationService, MessageService
- **Controller Classes**: AuthController, JobController, MaidController, AdminController
- **Relationships**: Inheritance, associations, and dependencies between classes

### 2.4 Context Diagram
![Context Diagram](diagrams/context-diagram.png)

**Description:** The context diagram shows the system boundaries and external entities:

- **Internal System**: HMTS core platform with all business logic
- **External Services**: Email service, payment gateway, location services, file storage
- **User Interactions**: Bidirectional data flows between users and system
- **Security Features**: Authentication, encryption, and access control

### 2.5 Architecture Diagram
![Architecture Diagram](diagrams/architecture-diagram.png)

**Description:** The architecture diagram illustrates the layered system structure:

- **Client Layer**: Web browsers, HTML/CSS/JS frontend
- **Application Layer**: Express.js server with MVC components
- **Data Layer**: MongoDB with organized collections
- **External Services**: Third-party integrations
- **Infrastructure**: Railway deployment platform

### 2.6 Data Flow Diagram
![Data Flow Diagram](diagrams/data-flow-diagram.png)

**Description:** The data flow diagram shows how information moves through the system:

- **Level 1 DFD**: Major processes and data stores
- **Process Interactions**: User management, job management, payment processing
- **Data Stores**: Users, jobs, maids, reviews, payments, notifications
- **External Flows**: Email notifications, payment processing

---

## 3. Data Design

### 3.1 Entity Relationship Diagram
![ER Diagram](diagrams/er-diagram.png)

### 3.2 Database Schema

The system uses MongoDB with the following collections:

#### 3.2.1 Core Entities

**Users Collection:**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  password_hash: String,
  role: Enum['admin', 'homeowner', 'maid'],
  photo_url: String,
  verification_status: Enum['pending', 'verified', 'rejected'],
  createdAt: Date,
  updatedAt: Date
}
```

**Jobs Collection:**
```javascript
{
  _id: ObjectId,
  homeowner_id: ObjectId (ref: User),
  maid_id: ObjectId (ref: Maid),
  title: String,
  description: String,
  address: String,
  scheduled_datetime: Date,
  status: Enum['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
  hourly_rate: Decimal,
  estimated_duration: Number,
  actual_duration: Number,
  tasks: Array,
  progress_percentage: Number,
  payment_method: Enum['cash', 'card', 'apple_pay'],
  payment_status: Enum['pending', 'awaiting_payment', 'paid']
}
```

#### 3.2.2 Relationships
- **User → Maid**: One-to-one extension relationship
- **User → Job**: One-to-many (homeowner creates, maid performs)
- **Job → Attendance**: One-to-one tracking relationship
- **Job → Review**: One-to-many feedback relationship
- **Job → Payment**: One-to-one payment relationship

#### 3.2.3 Indexing Strategy
- Primary indexes on all `_id` fields
- Compound indexes on frequently queried fields:
  - `{email: 1}` for user lookup
  - `{homeowner_id: 1, status: 1}` for job queries
  - `{maid_id: 1, scheduled_datetime: 1}` for maid schedules
  - `{reviewee_id: 1, rating: 1}` for review aggregations

### 3.3 Data Validation
- **Input Validation**: express-validator middleware for all API endpoints
- **Schema Validation**: Mongoose schema validation with custom validators
- **Business Rules**: Service layer validation for complex business logic
- **Security**: Password hashing, JWT token validation, role-based access control

---

## 4. User Interface Design

### 4.1 Design Principles
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Role-Based Interfaces**: Customized dashboards for each user type
- **Accessibility**: WCAG 2.1 AA compliance with semantic HTML and ARIA labels
- **Performance**: Optimized loading with lazy loading and efficient API calls

### 4.2 Interface Components

#### 4.2.1 Common Components
- **Navigation**: Role-based sidebar navigation with dynamic menu system
- **Authentication**: Login/register forms with validation feedback
- **Notifications**: Real-time notification panel with read/unread status
- **Modals**: Reusable modal components for forms and confirmations

#### 4.2.2 Homeowner Interface
- **Dashboard**: Job statistics, active jobs, recent reviews
- **Job Creation**: Multi-step form with maid recommendations
- **Maid Search**: Filter and search interface with rating display
- **Payment**: Secure payment forms with multiple payment methods
- **Reviews**: Rating interface with comment submission

#### 4.2.3 Maid Interface
- **Dashboard**: Earnings, schedule, performance metrics
- **Job Requests**: Card-based layout with accept/decline actions
- **Active Jobs**: Real-time job tracking with task checklist
- **Check-in/out**: Location-based attendance with photo capture
- **Earnings**: Detailed payment history and analytics

#### 4.2.4 Admin Interface
- **Dashboard**: System-wide analytics and key metrics
- **User Management**: User list with search, filter, and bulk actions
- **Maid Approval**: Verification workflow with document review
- **Reports**: Data visualization with charts and export functionality
- **System Settings**: Configuration management interface

### 4.3 Wireframes and Mockups

#### 4.3.1 Homeowner Dashboard Wireframe
```
+----------------------------------+
|  HMTS Logo    [Notifications] [Profile] |
+----------------------------------+
| Dashboard | My Jobs | Find Maids | Reviews |
+----------------------------------+
| Welcome back, John!              |
| +----------+ +----------+ +----------+ |
| | Active   | | Completed| | Pending  | |
| | Jobs: 2  | | Jobs: 15 | | Reviews:1| |
| +----------+ +----------+ +----------+ |
|                                  |
| Recent Activity                  |
| +------------------------------+ |
| | Job #123 - In Progress       | |
| | Maria G. - Kitchen Cleaning  | |
| | Started: 10:30 AM            | |
| +------------------------------+ |
+----------------------------------+
```

#### 4.3.2 Maid Mobile Interface Mockup
```
+------------------+
| ☰ HMTS    🔔 👤 |
+------------------+
| 🟢 Online        |
| Earnings Today   |
| $85.00          |
+------------------+
| Current Job      |
| John D.         |
| Kitchen Clean   |
| ⏰ 2h 15m       |
| [Update Tasks]  |
| [Check Out]     |
+------------------+
| Job Requests (3) |
| [View All]      |
+------------------+
```

### 4.4 User Experience Flow

#### 4.4.1 Job Creation Flow
1. Homeowner logs in → Dashboard
2. Click "Create Job" → Job form
3. Fill details → Select date/time
4. Review recommendations → Select maid
5. Confirm job → Payment method selection
6. Job created → Notification sent

#### 4.4.2 Maid Workflow
1. Maid receives notification → Job request
2. Review job details → Accept/decline
3. Job accepted → Add to schedule
4. Arrive at location → Check-in
5. Complete tasks → Update progress
6. Finish job → Check-out → Payment processed

---

## 5. Project Plan and Task Distribution

### 5.1 Development Phases

#### Phase 1: Foundation (Weeks 1-2)
**Tasks:**
- Database schema design and setup
- User authentication system
- Basic MVC structure
- Role-based access control

**Deliverables:**
- MongoDB database with core collections
- JWT authentication middleware
- User registration and login functionality
- Basic routing structure

#### Phase 2: Core Features (Weeks 3-5)
**Tasks:**
- Job management system
- Maid approval workflow
- Basic dashboard interfaces
- Notification system foundation

**Deliverables:**
- Complete job lifecycle management
- Admin approval interface
- Email notification system
- Basic frontend interfaces

#### Phase 3: Advanced Features (Weeks 6-7)
**Tasks:**
- Payment processing integration
- Review and rating system
- Location tracking
- Recommendation engine

**Deliverables:**
- Payment gateway integration
- Review submission and display
- GPS-based check-in system
- AI-powered maid recommendations

#### Phase 4: Enhancement & Testing (Weeks 8-9)
**Tasks:**
- Messaging system
- Advanced analytics
- Performance optimization
- Comprehensive testing

**Deliverables:**
- Real-time messaging
- Dashboard analytics
- Automated test suite
- Performance benchmarks

#### Phase 5: Deployment & Documentation (Week 10)
**Tasks:**
- Production deployment
- Documentation completion
- User acceptance testing
- Final optimizations

**Deliverables:**
- Live production system
- Complete documentation
- Deployment guides
- User manuals

### 5.2 Team Structure and Responsibilities

#### 5.2.1 Backend Development
**Responsibilities:**
- API design and implementation
- Database schema and optimization
- Authentication and security
- Business logic implementation
- Testing and validation

**Key Files:**
- `controllers/` - HTTP request handlers
- `services/` - Business logic layer
- `models/` - Data access layer
- `middleware/` - Authentication and validation
- `tests/` - Automated test suite

#### 5.2.2 Frontend Development
**Responsibilities:**
- User interface design and implementation
- Responsive web design
- API integration
- User experience optimization
- Cross-browser compatibility

**Key Files:**
- `public/*.html` - Page templates
- `public/styles.css` - Styling and layout
- `public/*-script.js` - Client-side functionality
- `public/api.js` - API client library

#### 5.2.3 DevOps and Deployment
**Responsibilities:**
- Infrastructure setup
- Deployment automation
- Environment configuration
- Monitoring and logging
- Performance optimization

**Key Files:**
- `railway.json` - Deployment configuration
- `.env.example` - Environment template
- `package.json` - Dependencies and scripts
- `deploy.md` - Deployment documentation

### 5.3 Risk Management

#### 5.3.1 Technical Risks
- **Database Performance**: Mitigated by proper indexing and query optimization
- **Security Vulnerabilities**: Addressed through input validation and security middleware
- **Scalability Issues**: Handled by modular architecture and efficient algorithms
- **Third-party Dependencies**: Managed through version pinning and fallback mechanisms

#### 5.3.2 Project Risks
- **Scope Creep**: Controlled through clear requirements and change management
- **Timeline Delays**: Mitigated by iterative development and regular reviews
- **Resource Constraints**: Addressed through prioritization and MVP approach
- **Quality Issues**: Prevented through automated testing and code reviews

### 5.4 Quality Assurance

#### 5.4.1 Testing Strategy
- **Unit Tests**: Jest framework for individual component testing
- **Integration Tests**: Supertest for API endpoint testing
- **Manual Testing**: User acceptance testing for each feature
- **Performance Testing**: Load testing for critical endpoints

#### 5.4.2 Code Quality Standards
- **Linting**: ESLint for code consistency
- **Documentation**: JSDoc for function documentation
- **Version Control**: Git with feature branches and pull requests
- **Code Reviews**: Peer review process for all changes

---

## Conclusion

This Software Design Document provides a comprehensive blueprint for the Home Maid Tracking System implementation. The design emphasizes scalability, security, and user experience while maintaining clean architecture principles and industry best practices.

The system successfully implements all required features including MVC architecture, automated testing, data validation, design patterns, dynamic menus, role-based authentication, and AI-powered recommendations, making it a complete solution for home maid service management.