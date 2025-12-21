# Design Patterns Implementation

This document explains the **Gang of Four (GoF) Design Patterns** implemented in the Home Maid Tracking System (HMTS).

---

## 1. Singleton Pattern (Creational)

**Definition**: Ensures that a class has only one instance, while providing a global access point to this instance.

**Location**: `config/mongodb.js`

**Purpose**: Ensures only one database connection instance exists throughout the application lifecycle.

**Implementation**:
```javascript
// config/mongodb.js
const mongoose = require('mongoose');

let connectionInstance = null;

const connectDB = async () => {
  // Return existing connection if already connected (Singleton)
  if (connectionInstance && mongoose.connection.readyState === 1) {
    console.log('✅ Using existing MongoDB connection');
    return connectionInstance;
  }
  
  try {
    connectionInstance = await mongoose.connect(connectionString);
    console.log('✅ MongoDB connected successfully');
    return connectionInstance;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**Benefits**:
- Prevents multiple database connections
- Provides global access to the database
- Reduces resource consumption
- Ensures data consistency

---

## 2. Factory Method Pattern (Creational)

**Definition**: Provides an interface for creating objects in a superclass, but allows subclasses to alter the type of objects that will be created.

**Location**: `services/notificationService.js`

**Purpose**: Creates different types of notifications based on the notification type without exposing creation logic.

**Implementation**:
```javascript
// services/notificationService.js
class NotificationService {
  /**
   * Factory Method - Creates notifications based on type
   * Each notification type has different default properties
   */
  static async createNotification(type, userId, data) {
    let notification;
    
    switch (type) {
      case 'job_request':
        notification = {
          user_id: userId,
          type: 'job_request',
          title: 'New Job Request',
          message: `You have a new job request: ${data.jobTitle}`,
          related_id: data.jobId,
          priority: 'high'
        };
        break;
        
      case 'job_accepted':
        notification = {
          user_id: userId,
          type: 'job_accepted',
          title: 'Job Accepted',
          message: `Your job "${data.jobTitle}" has been accepted`,
          related_id: data.jobId,
          priority: 'medium'
        };
        break;
        
      case 'maid_approval':
        notification = {
          user_id: userId,
          type: 'maid_approval',
          title: 'Account Approved',
          message: 'Your maid account has been approved! You can now accept jobs.',
          priority: 'high'
        };
        break;
        
      case 'payment':
        notification = {
          user_id: userId,
          type: 'payment',
          title: 'Payment Received',
          message: `Payment of $${data.amount} received for job "${data.jobTitle}"`,
          related_id: data.paymentId,
          priority: 'medium'
        };
        break;
        
      default:
        notification = {
          user_id: userId,
          type: 'system',
          title: data.title || 'System Notification',
          message: data.message || 'You have a new notification',
          priority: 'low'
        };
    }
    
    return await Notification.create(notification);
  }
}
```

**Benefits**:
- Encapsulates object creation logic
- Easy to add new notification types
- Consistent notification structure
- Decouples notification creation from business logic

---

## 3. Observer Pattern (Behavioral)

**Definition**: Lets you define a subscription mechanism to notify multiple objects about any events that happen to the object they're observing.

**Location**: `services/notificationService.js`, `controllers/jobController.js`

**Purpose**: When job status changes, automatically notify relevant users (homeowner, maid, admin).

**Implementation**:
```javascript
// services/notificationService.js
class NotificationService {
  // Observer registry - stores callbacks for different events
  static observers = {
    'job_status_change': [],
    'maid_approval': [],
    'new_review': []
  };
  
  /**
   * Subscribe to an event (Observer Pattern)
   */
  static subscribe(event, callback) {
    if (this.observers[event]) {
      this.observers[event].push(callback);
    }
  }
  
  /**
   * Notify all observers when an event occurs
   */
  static async notify(event, data) {
    if (this.observers[event]) {
      for (const callback of this.observers[event]) {
        await callback(data);
      }
    }
  }
  
  /**
   * Notify users about job status changes
   */
  static async notifyJobStatusChange(job, oldStatus, newStatus) {
    // Notify homeowner
    await this.createNotification('job_status_change', job.homeowner_id, {
      jobId: job._id,
      jobTitle: job.title,
      oldStatus,
      newStatus
    });
    
    // Notify maid if assigned
    if (job.maid_id) {
      await this.createNotification('job_status_change', job.maid_id.user_id, {
        jobId: job._id,
        jobTitle: job.title,
        oldStatus,
        newStatus
      });
    }
  }
}

// controllers/jobController.js - Using the Observer
const updateJobStatus = async (req, res) => {
  const { jobId, status } = req.body;
  const job = await Job.findById(jobId);
  const oldStatus = job.status;
  
  job.status = status;
  await job.save();
  
  // Notify observers about the status change
  await NotificationService.notifyJobStatusChange(job, oldStatus, status);
  
  return res.json({ success: true });
};
```

**Benefits**:
- Loose coupling between components
- Easy to add new notification recipients
- Automatic updates when state changes
- Supports multiple subscribers

---

## 4. Strategy Pattern (Behavioral)

**Definition**: Lets you define a family of algorithms, put each of them into a separate class, and make their objects interchangeable.

**Location**: `services/recommendationService.js`

**Purpose**: Different recommendation strategies can be used to suggest maids to homeowners.

**Implementation**:
```javascript
// services/recommendationService.js

/**
 * Strategy Interface - Different recommendation algorithms
 */
class RecommendationStrategy {
  async getRecommendations(homeownerId, limit) {
    throw new Error('Method must be implemented');
  }
}

/**
 * Concrete Strategy 1: Rating-based recommendations
 */
class RatingBasedStrategy extends RecommendationStrategy {
  async getRecommendations(homeownerId, limit) {
    const maids = await Maid.find({ approval_status: 'approved' })
      .populate('user_id', 'name')
      .lean();
    
    // Sort by average rating
    return maids
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      .slice(0, limit);
  }
}

/**
 * Concrete Strategy 2: Experience-based recommendations
 */
class ExperienceBasedStrategy extends RecommendationStrategy {
  async getRecommendations(homeownerId, limit) {
    const maids = await Maid.find({ approval_status: 'approved' })
      .populate('user_id', 'name')
      .lean();
    
    // Sort by completed jobs count
    const maidsWithJobs = await Promise.all(maids.map(async (maid) => {
      const completedJobs = await Job.countDocuments({ 
        maid_id: maid._id, 
        status: 'completed' 
      });
      return { ...maid, completedJobs };
    }));
    
    return maidsWithJobs
      .sort((a, b) => b.completedJobs - a.completedJobs)
      .slice(0, limit);
  }
}

/**
 * Concrete Strategy 3: Hybrid scoring (AI-like)
 */
class HybridScoringStrategy extends RecommendationStrategy {
  async getRecommendations(homeownerId, limit) {
    const maids = await Maid.find({ approval_status: 'approved' })
      .populate('user_id', 'name email')
      .lean();
    
    const scores = await Promise.all(maids.map(async (maid) => {
      const reviews = await Review.find({ reviewee_id: maid.user_id?._id });
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      const completedJobs = await Job.countDocuments({ 
        maid_id: maid._id, 
        status: 'completed' 
      });
      
      // Weighted scoring formula
      const score = (avgRating * 2) + (completedJobs * 0.5);
      
      return { ...maid, avgRating, completedJobs, score };
    }));
    
    return scores.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

/**
 * Context class that uses the strategy
 */
class RecommendationService {
  static strategy = new HybridScoringStrategy(); // Default strategy
  
  static setStrategy(strategy) {
    this.strategy = strategy;
  }
  
  static async getRecommendedMaidsForHomeowner(homeownerId, limit = 5) {
    return await this.strategy.getRecommendations(homeownerId, limit);
  }
}

module.exports = RecommendationService;
```

**Benefits**:
- Easy to switch between algorithms
- Open for extension, closed for modification
- Algorithms can be tested independently
- Runtime algorithm selection

---

## 5. Chain of Responsibility Pattern (Behavioral)

**Definition**: Lets you pass requests along a chain of handlers. Upon receiving a request, each handler decides either to process the request or to pass it to the next handler in the chain.

**Location**: `middleware/` directory (Express middleware chain)

**Purpose**: Request passes through authentication, validation, and authorization middleware before reaching the controller.

**Implementation**:
```javascript
// The middleware chain in Express routes

// middleware/auth.js - First handler in chain
const auth = (allowedRoles = null) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.slice(7);
      if (!token) {
        return res.status(401).json({ message: 'Missing token' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { userId: decoded.userId, role: decoded.role };
      
      // Pass to next handler if roles match
      if (!allowedRoles || allowedRoles.includes(req.user.role)) {
        return next(); // Continue chain
      }
      
      return res.status(403).json({ message: 'Forbidden' });
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
};

// middleware/validate.js - Second handler in chain
const validate = (rules = []) => {
  return async (req, res, next) => {
    await Promise.all(rules.map((rule) => rule.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    return next(); // Continue chain
  };
};

// routes/jobRoutes.js - Chain of handlers
router.post('/jobs',
  auth(['homeowner']),           // Handler 1: Authentication
  validate(jobValidationRules),  // Handler 2: Validation
  JobController.createJob        // Handler 3: Controller (final)
);
```

**Benefits**:
- Decouples sender from receivers
- Flexible handler ordering
- Single Responsibility Principle
- Easy to add/remove handlers

---

## 6. Facade Pattern (Structural)

**Definition**: Provides a simplified interface to a library, a framework, or any other complex set of classes.

**Location**: `public/api.js`

**Purpose**: Provides a simple interface for frontend to interact with complex backend API.

**Implementation**:
```javascript
// public/api.js - Facade for API calls

/**
 * API Facade - Simplifies complex HTTP operations
 */
const API_BASE = '/api';

// Internal complex HTTP handler
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
}

// Simplified facade methods
async function apiLogin(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

async function apiGetMyJobs() {
  return apiRequest('/jobs/my');
}

async function apiCreateJob(jobData) {
  return apiRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData)
  });
}

async function apiGetRecommendedMaids() {
  return apiRequest('/maids/recommend');
}
```

**Benefits**:
- Simplifies complex subsystem
- Reduces dependencies
- Provides unified interface
- Hides implementation details

---

## Summary: Patterns Used in HMTS

| Pattern | Type | Location | Purpose |
|---------|------|----------|---------|
| **Singleton** | Creational | `config/mongodb.js` | Single database connection |
| **Factory Method** | Creational | `services/notificationService.js` | Create different notification types |
| **Observer** | Behavioral | `services/notificationService.js` | Notify users on events |
| **Strategy** | Behavioral | `services/recommendationService.js` | Interchangeable recommendation algorithms |
| **Chain of Responsibility** | Behavioral | `middleware/` | Request processing pipeline |
| **Facade** | Structural | `public/api.js` | Simplified API interface |

---

## Architecture Diagram with Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FACADE PATTERN (api.js)                      │   │
│  │   apiLogin() | apiGetJobs() | apiCreateJob() | etc.      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CHAIN OF RESPONSIBILITY                       │
│                                                                  │
│  Request → [Auth Middleware] → [Validate Middleware] → Controller│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONTROLLERS (MVC)                           │
│                                                                  │
│  AuthController | JobController | MaidController | etc.          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICES                                  │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ FACTORY METHOD  │  │ OBSERVER        │  │ STRATEGY        │  │
│  │ Notification    │  │ Event Notify    │  │ Recommendation  │  │
│  │ Service         │  │ Service         │  │ Service         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MODELS (Repository)                           │
│                                                                  │
│  User | Maid | Job | Review | Notification | Menu | etc.         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SINGLETON PATTERN                              │
│                                                                  │
│              MongoDB Connection (Single Instance)                │
└─────────────────────────────────────────────────────────────────┘
```

This implementation demonstrates proper use of GoF design patterns to create a maintainable, scalable, and well-structured application.
