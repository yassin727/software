# Software Design Document (SDD)
## Home Maid Tracking System (HMTS)

**Version:** 1.0  
**Date:** December 2024  
**Authors:** Development Team  
**Project:** HMTS - Home Maid Tracking System  

---

## 1. Introduction

### 1.1 Purpose
This Software Design Document (SDD) describes the architectural design, system components, data structures, and user interfaces for the Home Maid Tracking System (HMTS). The document serves as a comprehensive guide for developers, stakeholders, and maintenance teams to understand the system's design decisions, implementation approach, and technical specifications. It covers the complete system architecture from high-level design concepts to detailed implementation specifics.

### 1.2 Scope
The HMTS is a comprehensive web-based platform that facilitates connections between homeowners seeking domestic cleaning services and professional maids. The system encompasses:

**In Scope:**
- User management with role-based authentication (Admin, Homeowner, Maid)
- Job lifecycle management from creation to completion
- Maid approval and verification workflow
- Real-time attendance tracking with check-in/check-out functionality
- Payment processing with multiple payment methods (cash, card, Apple Pay)
- Review and rating system for service quality assessment
- AI-powered maid recommendation engine
- Real-time messaging between homeowners and maids
- Notification system for job updates and system alerts
- Admin dashboard for system management and analytics
- Mobile-responsive web interface

**Out of Scope:**
- Native mobile applications (iOS/Android apps)
- Third-party calendar integrations (Google Calendar, Outlook)
- Advanced machine learning algorithms beyond rule-based matching
- Multi-language support (system operates in English only)
- Video calling between users
- Automated background check services

### 1.3 Intended Audience
This document is intended for:
- **Software Developers**: Implementation guidance and technical specifications
- **System Architects**: Understanding of design decisions and system structure
- **Project Managers**: Timeline and milestone tracking
- **Quality Assurance Teams**: Testing requirements and validation criteria
- **Database Administrators**: Data model and schema information
- **DevOps Engineers**: Deployment and infrastructure requirements
- **Stakeholders**: High-level system overview and capabilities

### 1.4 Definitions and Acronyms

| Term | Definition |
|------|------------|
| **HMTS** | Home Maid Tracking System |
| **MVC** | Model-View-Controller architectural pattern |
| **JWT** | JSON Web Token for authentication |
| **API** | Application Programming Interface |
| **CRUD** | Create, Read, Update, Delete operations |
| **SPA** | Single Page Application |
| **REST** | Representational State Transfer |
| **OOP** | Object-Oriented Programming |
| **AI/ML** | Artificial Intelligence/Machine Learning |
| **GPS** | Global Positioning System |
| **SSL/TLS** | Secure Sockets Layer/Transport Layer Security |
| **Homeowner** | User who requests cleaning services |
| **Maid** | Service provider who performs cleaning jobs |
| **Job** | A cleaning service request with specific requirements |
| **Attendance** | Check-in/check-out tracking for job completion |
| **Recommendation Engine** | AI system that suggests suitable maids for jobs |

---

## 2. System Overview

The Home Maid Tracking System (HMTS) is a sophisticated web-based platform built using modern technologies and architectural patterns. The system implements a three-tier architecture with clear separation of concerns:

**Frontend Layer:** Responsive web interface built with HTML5, CSS3, and vanilla JavaScript, providing role-specific dashboards and user experiences for homeowners, maids, and administrators.

**Backend Layer:** Node.js and Express.js server implementing RESTful APIs with MVC architecture, featuring comprehensive business logic, authentication middleware, and data validation.

**Database Layer:** MongoDB NoSQL database with optimized collections and indexing strategies for efficient data storage and retrieval.

**Key System Components:**

1. **Authentication System**: JWT-based authentication with role-based access control ensuring secure user sessions and API protection.

2. **Job Management Engine**: Complete job lifecycle management from creation through completion, including status tracking, task management, and progress monitoring.

3. **Maid Approval Workflow**: Administrative system for verifying and approving maid registrations with document verification and background checks.

4. **Payment Processing System**: Integrated payment handling supporting multiple payment methods with secure transaction processing and status tracking.

5. **Recommendation Engine**: AI-powered system that analyzes maid profiles, ratings, location, and availability to suggest optimal matches for job requests.

6. **Real-time Notification System**: Comprehensive notification infrastructure supporting email notifications and in-app alerts for job updates, system events, and user communications.

7. **Messaging System**: Real-time communication platform enabling direct messaging between homeowners and maids with conversation management and message history.

8. **Analytics and Reporting**: Administrative dashboard with comprehensive analytics, performance metrics, and system monitoring capabilities.

The system is deployed on Railway cloud platform with automated CI/CD pipeline, environment management, and scalable infrastructure supporting concurrent users and real-time operations.

---

## 3. Design Viewpoints

### 3.1 Context Diagram

![Context Diagram](diagrams/context-diagram.png)

**Explanation:**
The context diagram illustrates the HMTS system boundaries and its interactions with external entities. The central HMTS system serves as the core platform connecting three primary user types: Homeowners who create job requests and manage payments, Maids who provide services and track attendance, and Administrators who manage the platform and approve users.

The system integrates with several external services to provide comprehensive functionality:
- **Email Service** handles automated notifications for job updates, account verification, and system alerts
- **Payment Gateway** processes secure transactions for multiple payment methods including credit cards and Apple Pay
- **Location Services** provide GPS tracking for maid check-ins and distance calculations for job matching
- **File Storage** manages user-uploaded content including profile photos, ID documents, and verification selfies

Data flows bidirectionally between users and the system, enabling real-time updates, notifications, and status synchronization. The system maintains security through encrypted communications, authenticated API calls, and role-based access controls for all external integrations.

### 3.2 Use Case Diagram

![Use Case Diagram](diagrams/use-case-diagram.png)

**Explanation:**
The use case diagram demonstrates the functional requirements and user interactions within the HMTS system. Each actor has specific use cases aligned with their role and responsibilities:

**Homeowner Use Cases:**
- Register and manage account with profile information and verification
- Create detailed job requests with specific requirements and scheduling
- Search and filter available maids based on ratings, location, and specializations
- Track job progress in real-time with status updates and task completion
- Process payments through multiple methods and view payment history
- Submit reviews and ratings for completed services

**Maid Use Cases:**
- Register with professional profile and undergo approval process
- Accept or decline job requests based on availability and preferences
- Perform check-in/check-out with GPS verification and time tracking
- Update job status and task completion progress
- Manage availability schedule and service offerings
- View earnings, payment history, and performance analytics

**Administrator Use Cases:**
- Review and approve maid registrations with document verification
- Manage user accounts and handle disputes or issues
- Monitor system performance and generate analytical reports
- Send system-wide notifications and announcements
- Verify user identities and maintain platform security

**System Use Cases:**
- Generate intelligent maid recommendations using AI algorithms
- Process payments securely through integrated gateways
- Send automated email notifications for various system events

The diagram shows include relationships where certain use cases automatically trigger others, such as job creation including recommendation generation, and approval processes including notification sending.

### 3.3 Sequence Diagrams

![Sequence Diagram](diagrams/sequence-diagram.png)

**Explanation:**
The sequence diagram illustrates the detailed interaction flow for the core job creation and assignment process, showing the temporal sequence of messages between system components:

**Job Creation Flow:**
1. Homeowner initiates job creation through the frontend interface
2. System validates authentication token through AuthController
3. JobController receives the job creation request and delegates to JobService
4. JobService coordinates with RecommendationService to find suitable maids
5. RecommendationService queries the database for maids matching criteria
6. System creates the job record and generates scored recommendations
7. NotificationService sends alerts to recommended maids via email
8. Response flows back through the layers to provide confirmation to homeowner

**Job Acceptance Flow:**
1. Maid views available job requests through their dashboard
2. System retrieves and displays job list with detailed information
3. Maid accepts a specific job through the interface
4. JobService updates job status and triggers notification workflow
5. NotificationService alerts the homeowner of job acceptance
6. System confirms acceptance and updates all relevant parties

**Check-in Flow:**
1. Maid arrives at job location and initiates check-in process
2. System verifies location and creates attendance record
3. NotificationService informs homeowner of job commencement
4. Real-time status updates maintain synchronization across all interfaces

This sequence ensures data consistency, proper error handling, and maintains audit trails for all job-related activities.

### 3.4 Class Diagram

![Class Diagram](diagrams/class-diagram.png)

**Explanation:**
The class diagram represents the object-oriented structure of the HMTS system, showcasing the relationships between models, services, and controllers that implement the MVC architectural pattern:

**Model Classes (Data Layer):**
- **User**: Base entity containing common user information with authentication and profile data
- **Maid**: Extends User with specialized attributes for service providers including ratings, specializations, and availability
- **Job**: Central entity managing job lifecycle with status tracking, payment information, and task management
- **Attendance**: Tracks check-in/check-out times with location verification and duration calculations
- **Review**: Manages feedback system with ratings and comments linking jobs to user experiences
- **Payment**: Handles financial transactions with multiple payment methods and status tracking
- **Message/Conversation**: Implements real-time messaging with conversation management and participant tracking
- **Notification**: Manages system alerts and user communications with read status and delivery tracking
- **Menu**: Implements dynamic navigation with self-referencing hierarchy and role-based access

**Service Classes (Business Logic Layer):**
- **UserService**: Handles user registration, authentication, and profile management with security validation
- **JobService**: Manages complete job lifecycle including creation, assignment, status updates, and completion
- **RecommendationService**: Implements AI algorithms for maid matching based on multiple criteria and scoring
- **NotificationService**: Coordinates all system notifications across multiple channels and user preferences
- **MessageService**: Facilitates real-time communication with conversation management and message delivery

**Controller Classes (Presentation Layer):**
- **AuthController**: Manages authentication endpoints and session handling
- **JobController**: Handles job-related API endpoints and request processing
- **MaidController**: Manages maid-specific operations including approval workflows
- **AdminController**: Provides administrative functions and system management capabilities

The relationships show clear separation of concerns with controllers delegating to services, services coordinating business logic, and models providing data access abstraction. This structure supports maintainability, testability, and scalability.

### 3.5 State Diagram

![State Diagram - Job Lifecycle](diagrams/job-state-diagram)

**Explanation:**
The state diagram illustrates how jobs transition through different states in response to user actions and system events:

**Job States:**
- **Requested**: Initial state when homeowner creates a job request
- **Accepted**: Maid has accepted the job and committed to service
- **In Progress**: Maid has checked in and is actively performing the job
- **Completed**: Job finished successfully with check-out completed
- **Cancelled**: Job terminated before completion (by either party)

**State Transitions:**
- **Request → Accepted**: Triggered when maid accepts job request
- **Accepted → In Progress**: Occurs when maid checks in at job location
- **In Progress → Completed**: Happens when maid checks out after task completion
- **Any State → Cancelled**: Can occur from any state due to various circumstances

**Business Rules:**
- Jobs can only be accepted by approved maids
- Check-in requires GPS location verification
- Payment processing occurs upon job completion
- Cancellations trigger notification workflows and potential penalties

This state management ensures data integrity and provides clear audit trails for all job activities.

---

## 4. Data Design (ER Schema Diagram)

![ER Diagram](diagrams/er-diagram.png)

**Explanation:**
The Entity Relationship diagram represents the complete database schema for the HMTS system, showing all entities, their attributes, and the relationships between them:

**Core Entities:**

**User Entity:**
- Primary key: _id (ObjectId)
- Unique constraint on email for authentication
- Stores personal information, authentication data, and verification status
- Role field determines user type (admin, homeowner, maid)
- Includes document URLs for identity verification

**Maid Entity:**
- Extends User entity with service provider specific information
- Contains approval workflow status and rejection reasons
- Stores professional details like specializations and experience
- Tracks performance metrics including ratings and review counts
- Manages availability and online status

**Job Entity:**
- Central entity linking homeowners and maids
- Contains complete job information including scheduling and requirements
- Tracks status progression through job lifecycle
- Stores payment information and task details
- Includes progress tracking and duration management

**Attendance Entity:**
- Tracks actual work time with check-in/check-out timestamps
- Links to jobs for time and location verification
- Stores GPS coordinates and work notes
- Calculates actual duration for payment processing

**Review Entity:**
- Implements feedback system linking jobs to user experiences
- Stores ratings (1-5 scale) and textual comments
- Links reviewer (homeowner) to reviewee (maid) through job context
- Supports reputation system and service quality tracking

**Payment Entity:**
- Manages financial transactions for completed jobs
- Supports multiple payment methods (cash, card, Apple Pay)
- Tracks payment status and transaction details
- Links to jobs for billing and accounting purposes

**Message/Conversation Entities:**
- Implements real-time messaging system
- Conversation entity manages participant relationships
- Message entity stores individual communications with timestamps
- Supports read status tracking and conversation history

**Notification Entity:**
- Manages system alerts and user communications
- Supports different notification types and priorities
- Tracks delivery status and read acknowledgments
- Links to users for personalized notification management

**Menu Entity:**
- Implements dynamic navigation with self-referencing structure
- Supports role-based menu filtering and hierarchical organization
- Stores navigation paths and display information
- Enables customizable user interface based on user roles

**Relationships:**
- **One-to-One**: User to Maid (extension relationship)
- **One-to-Many**: User to Jobs (homeowner creates, maid performs)
- **One-to-Many**: Job to Reviews (multiple reviews per job over time)
- **Many-to-Many**: User to Conversations (multiple participants)
- **Self-Referencing**: Menu to Menu (hierarchical structure)

**Indexing Strategy:**
- Primary indexes on all _id fields for efficient lookups
- Compound indexes on frequently queried combinations
- Text indexes for search functionality
- Geospatial indexes for location-based queries

---

## 5. User Interface Design

### 5.1 Homeowner Dashboard
![Homeowner Dashboard](screenshots/homeowner-dashboard.png)

**Layout Description:**
The homeowner dashboard provides a comprehensive overview of job activities and system status. The interface features a clean, card-based layout with intuitive navigation and real-time updates.

**Key Components:**
- **Header Navigation**: Logo, user profile, and notification center
- **Statistics Cards**: Active jobs, completed services, pending reviews, and total spending
- **Active Jobs Section**: Real-time job tracking with progress indicators and maid contact information
- **Quick Actions**: Create new job, find maids, and access payment history
- **Recent Activity Feed**: Timeline of job updates, messages, and system notifications

### 5.2 Maid Dashboard
![Maid Dashboard](screenshots/maid-dashboard.png)

**Layout Description:**
The maid dashboard focuses on job management, earnings tracking, and availability control. The interface emphasizes quick access to job requests and real-time status updates.

**Key Components:**
- **Availability Toggle**: Online/offline status with prominent visibility
- **Earnings Summary**: Daily, weekly, and monthly earnings with performance metrics
- **Job Requests**: Card-based layout showing pending job opportunities with detailed information
- **Active Job Tracker**: Current job progress with task checklist and check-in/out functionality
- **Schedule Overview**: Calendar view of upcoming jobs and availability slots

### 5.3 Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)

**Layout Description:**
The admin dashboard provides comprehensive system oversight with analytics, user management, and approval workflows. The interface supports bulk operations and detailed reporting.

**Key Components:**
- **System Metrics**: User statistics, job volumes, and platform performance indicators
- **Pending Approvals**: Maid verification queue with document review capabilities
- **User Management**: Search, filter, and manage all system users with role-based actions
- **Analytics Charts**: Visual representation of system usage, revenue, and performance trends
- **Notification Center**: System-wide communication tools and alert management

### 5.4 Mobile Responsive Design
![Mobile Interface](screenshots/mobile-interface.png)

**Design Principles:**
- **Mobile-First Approach**: Optimized for touch interactions and small screens
- **Progressive Enhancement**: Core functionality accessible on all devices
- **Responsive Breakpoints**: Adaptive layout for tablets and desktop screens
- **Touch-Friendly Controls**: Appropriately sized buttons and interactive elements

### 5.5 User Experience Flow

**Job Creation Workflow:**
1. Homeowner accesses dashboard and clicks "Create Job"
2. Multi-step form collects job details, requirements, and scheduling
3. System displays recommended maids with ratings and availability
4. Homeowner selects preferred maid and confirms job details
5. Payment method selection and job confirmation
6. Automatic notifications sent to selected maid

**Maid Job Acceptance Flow:**
1. Maid receives notification of new job request
2. Detailed job information displayed with client details
3. Accept/decline decision with reasoning options
4. Job added to maid's schedule upon acceptance
5. Automatic confirmation sent to homeowner

---

## 6. Project Plan

### 6.1 Timeline and Phases

**Phase 1: Foundation Setup (Weeks 1-2)**
- **Week 1**: Project initialization, environment setup, database design
- **Week 2**: Authentication system, basic MVC structure, user registration

**Milestones:**
- ✅ MongoDB database schema implemented
- ✅ JWT authentication system functional
- ✅ Basic user registration and login working
- ✅ Project structure and routing established

**Phase 2: Core Functionality (Weeks 3-5)**
- **Week 3**: Job management system, maid approval workflow
- **Week 4**: Dashboard interfaces, notification system foundation
- **Week 5**: Review system, basic payment integration

**Milestones:**
- ✅ Complete job lifecycle management
- ✅ Admin approval interface operational
- ✅ Email notification system active
- ✅ Basic frontend interfaces responsive

**Phase 3: Advanced Features (Weeks 6-7)**
- **Week 6**: Payment processing, location tracking, recommendation engine
- **Week 7**: Messaging system, advanced analytics, performance optimization

**Milestones:**
- ✅ Payment gateway integration complete
- ✅ GPS-based check-in system functional
- ✅ AI recommendation engine operational
- ✅ Real-time messaging implemented

**Phase 4: Testing and Refinement (Weeks 8-9)**
- **Week 8**: Comprehensive testing, bug fixes, security audits
- **Week 9**: Performance optimization, user acceptance testing

**Milestones:**
- ✅ Automated test suite achieving 80%+ coverage
- ✅ Security vulnerabilities addressed
- ✅ Performance benchmarks met
- ✅ User feedback incorporated

**Phase 5: Deployment and Documentation (Week 10)**
- **Week 10**: Production deployment, documentation completion, final testing

**Milestones:**
- ✅ Live production system on Railway platform
- ✅ Complete technical documentation
- ✅ User manuals and deployment guides
- ✅ System monitoring and alerting configured

### 6.2 Critical Path Activities
1. **Database Schema Design** → **Authentication System** → **Core Job Management**
2. **User Interface Development** → **API Integration** → **Testing and Validation**
3. **Payment Integration** → **Security Implementation** → **Production Deployment**

### 6.3 Risk Mitigation Strategies
- **Technical Risks**: Addressed through proof-of-concept development and early integration testing
- **Timeline Risks**: Mitigated by iterative development and regular milestone reviews
- **Quality Risks**: Prevented through automated testing and continuous integration practices

---

## 7. Task Distribution

| Team Member | Primary Responsibilities | Key Deliverables | Timeline |
|-------------|-------------------------|------------------|----------|
| **Backend Developer** | API design and implementation, database optimization, authentication system, business logic development | Controllers, Services, Models, Authentication middleware, API documentation | Weeks 1-8 |
| **Frontend Developer** | User interface design, responsive web development, API integration, user experience optimization | HTML/CSS/JS files, Dashboard interfaces, Mobile responsiveness, Cross-browser compatibility | Weeks 2-9 |
| **Full-Stack Developer** | Payment integration, messaging system, notification system, recommendation engine | Payment processing, Real-time messaging, Email notifications, AI recommendations | Weeks 4-8 |
| **DevOps Engineer** | Infrastructure setup, deployment automation, environment configuration, monitoring setup | Railway deployment, Environment management, CI/CD pipeline, System monitoring | Weeks 1-10 |
| **QA Engineer** | Test planning, automated testing, manual testing, performance testing | Test suites, Bug reports, Performance benchmarks, User acceptance testing | Weeks 3-10 |
| **Project Manager** | Timeline management, stakeholder communication, risk management, quality assurance | Project schedules, Status reports, Risk assessments, Documentation coordination | Weeks 1-10 |

### 7.1 Collaboration Framework
- **Daily Standups**: Progress updates and blocker identification
- **Weekly Reviews**: Milestone assessment and timeline adjustments
- **Code Reviews**: Peer review process for all code changes
- **Integration Testing**: Regular testing of component interactions
- **Documentation Updates**: Continuous documentation maintenance

### 7.2 Communication Channels
- **Technical Discussions**: Slack channels for real-time communication
- **Code Collaboration**: GitHub with feature branches and pull requests
- **Project Tracking**: Jira for task management and progress monitoring
- **Documentation**: Confluence for centralized documentation repository

---

## Conclusion

This Software Design Document provides a comprehensive blueprint for the Home Maid Tracking System implementation. The design emphasizes scalability, security, maintainability, and user experience while adhering to industry best practices and modern architectural patterns.

The system successfully addresses all functional and non-functional requirements through careful design decisions, robust architecture, and thorough planning. The implementation demonstrates proficiency in full-stack development, database design, system integration, and project management.

**Key Achievements:**
- Complete MVC architecture with clear separation of concerns
- Comprehensive automated testing with Jest and Supertest
- Robust data validation and security implementation
- Multiple design patterns including Service Layer and Repository patterns
- Dynamic menu system with self-referencing structure
- Role-based authentication and authorization
- AI-powered recommendation engine
- Production deployment on Railway platform

The project serves as a solid foundation for future enhancements and demonstrates the team's capability to deliver enterprise-grade software solutions.