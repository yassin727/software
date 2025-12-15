# Design Patterns Implementation

This document explains the design patterns implemented in the Home Maid Tracking System (HMTS).

## 1. Service Layer Pattern

**Location**: `services/` directory

**Purpose**: Encapsulates business logic and provides a clean interface between controllers and data access layers.

**Implementation**:
- All business logic is contained within service classes
- Controllers only handle HTTP request/response and delegate to services
- Services coordinate between multiple models when needed
- Services handle complex business rules and validations

**Examples**:
```javascript
// services/userService.js
class UserService {
  static async register({ name, email, phone, password, role }) {
    // Business logic: check existing user, hash password, create maid profile if needed
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await User.create({ name, email, phone, passwordHash, role });
    
    // If maid, create maid profile with pending status
    if (role === 'maid') {
      await Maid.create(userId);
    }
    
    return { id: userId, name, email, role };
  }
}
```

**Benefits**:
- Separation of concerns
- Reusable business logic
- Easier testing and maintenance
- Clean controller code

## 2. Repository Pattern

**Location**: `models/` directory

**Purpose**: Provides a uniform interface for data access and abstracts database operations.

**Implementation**:
- Each model class represents a data entity
- Static methods provide CRUD operations
- Database queries are encapsulated within model methods
- Models return plain objects, not ORM instances

**Examples**:
```javascript
// models/userModel.js
class UserModel {
  static async create({ name, email, phone, passwordHash, role }) {
    const [result] = await db.execute(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, passwordHash, role]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }
}
```

**Benefits**:
- Database abstraction
- Centralized data access logic
- Easy to mock for testing
- Consistent data access patterns

## 3. MVC (Model-View-Controller) Architecture

**Implementation**:
- **Models** (`models/`): Data access and entity representation
- **Views** (`public/`): Frontend HTML/CSS/JS files
- **Controllers** (`controllers/`): Handle HTTP requests, coordinate between models and services

**Flow**:
1. Route receives HTTP request
2. Controller method is called
3. Controller delegates to Service
4. Service uses Models for data operations
5. Controller returns JSON response

**Example**:
```javascript
// controllers/authController.js
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const user = await UserService.register({ name, email, phone, password, role });
    return res.status(201).json({ user });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};
```

## 4. Middleware Pattern

**Location**: `middleware/` directory

**Purpose**: Provides cross-cutting concerns like authentication, validation, and file uploads.

**Implementation**:
- Authentication middleware validates JWT tokens
- Validation middleware uses express-validator
- Upload middleware handles file uploads with multer

**Examples**:
```javascript
// middleware/auth.js
const auth = (allowedRoles = null) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role };
    
    if (allowedRoles && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    next();
  };
};
```

## 5. Factory Pattern (Implicit)

**Location**: Service classes and model creation methods

**Purpose**: Encapsulates object creation logic.

**Implementation**:
- Service methods act as factories for creating complex objects
- Model creation methods handle entity instantiation
- Notification service creates different types of notifications

## Pattern Benefits Summary

1. **Maintainability**: Clear separation of concerns makes code easier to maintain
2. **Testability**: Each layer can be tested independently
3. **Scalability**: Patterns support adding new features without breaking existing code
4. **Consistency**: Standardized approaches across the application
5. **Reusability**: Business logic in services can be reused across different controllers

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Routes      │───▶│   Controllers   │───▶│    Services     │
│   (Express)     │    │  (HTTP Layer)   │    │ (Business Logic)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Middleware    │    │   Frontend      │    │     Models      │
│ (Auth/Validate) │    │  (Public HTML)  │    │  (Data Access)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │    Database     │
                                               │     (MySQL)     │
                                               └─────────────────┘
```