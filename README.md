# Eat Fast Backend API

## 🚀 Overview

Eat Fast is a comprehensive food delivery platform backend built with Node.js, Express, and PostgreSQL. The API provides secure authentication, restaurant management, order processing, and admin functionalities with advanced security features and Cameroon-specific optimizations.

---

**Frontend-Backend Field Mapping Compatibility**

> **Note:** The backend now includes middleware that automatically maps frontend field names (e.g., `first_name`, `user_type`, `businessName`) to backend model fields (e.g., `firstName`, `role`, `restaurantName`). This ensures seamless integration with the frontend without requiring changes to frontend code. See the `src/middleware/validation.js` file for details and extension instructions.

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Security Features](#-security-features)
- [Installation & Setup](#-installation--setup)
- [Configuration](#-configuration)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Frontend-Backend Field Mapping](#frontend-backend-field-mapping)

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based authentication** with refresh tokens
- **Two-factor authentication (2FA)** with SMS/email
- **Role-based access control** (Admin, Restaurant Manager, Client, Delivery)
- **Password hashing** with Argon2
- **Rate limiting** and anti-spam protection
- **File upload security** with malware scanning
- **GDPR compliance** with data anonymization

### 🏪 Restaurant Management
- **Menu management** with categories and dishes
- **Order processing** and status tracking
- **Analytics dashboard** for restaurants
- **Document management** for business verification

### 📦 Order System
- **Guest order creation** without registration
- **Order tracking** and status updates
- **Receipt generation** and download
- **Payment integration** (mobile money, cards)

### 📧 Communication
- **Newsletter subscription** with email confirmation
- **Contact form** with spam protection
- **Partner application** system
- **Email notifications** and alerts

### 👨‍💼 Admin Panel
- **User management** with role assignment
- **Restaurant approval** workflow
- **System analytics** and reporting
- **Content management** for public pages

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │   (Sessions)    │
                       └─────────────────┘
```

## 🛠️ Tech Stack

### Core Technologies
- **Node.js** (v16+) - Runtime environment
- **Express.js** (v4.21+) - Web framework
- **PostgreSQL** (v15+) - Primary database
- **Redis** (v7+) - Session storage & caching
- **Sequelize** (v6.37+) - ORM

### Security & Middleware
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection
- **Multer** - File upload handling
- **JWT** - Token-based authentication
- **Argon2** - Password hashing

### Development Tools
- **Nodemon** - Development server
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Sequelize CLI** - Database migrations

## 📁 Project Structure

```
eat-fast-backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.js            # Database configuration
│   │   ├── redis.js               # Redis configuration
│   │   └── security.js            # Security settings
│   │
│   ├── controllers/            # Route handlers
│   │   ├── authController.js      # Authentication logic
│   │   ├── adminController.js     # Admin operations
│   │   ├── menuController.js      # Menu management
│   │   ├── orderController.js     # Order processing
│   │   ├── contactController.js   # Contact form handling
│   │   ├── newsletterController.js # Newsletter operations
│   │   └── partnerController.js   # Partner applications
│   │
│   ├── middleware/             # Custom middleware
│   │   ├── auth.js                # Authentication middleware
│   │   ├── validation.js          # Input validation & field mapping
│   │   ├── upload.js              # File upload handling
│   │   ├── rateLimiter.js         # Rate limiting
│   │   └── security.js            # Security middleware
│   │
│   ├── models/                 # Database models
│   │   ├── index.js               # Sequelize configuration
│   │   ├── user.js                # User model
│   │   ├── role.js                # Role model
│   │   ├── restaurant.js          # Restaurant model
│   │   ├── category.js            # Menu categories
│   │   ├── dish.js                # Dish model
│   │   ├── order.js               # Order model
│   │   ├── orderItem.js           # Order items
│   │   ├── contact.js             # Contact inquiries
│   │   ├── newsletter.js          # Newsletter subscriptions
│   │   └── partnerApplication.js  # Partner applications
│   │
│   ├── routes/                 # API routes
│   │   ├── auth.js                # Authentication routes
│   │   ├── admin.js               # Admin routes
│   │   ├── menu.js                # Menu routes
│   │   ├── orders.js              # Order routes
│   │   ├── contact.js             # Contact routes
│   │   ├── newsletter.js          # Newsletter routes
│   │   ├── partner.js             # Partner routes
│   │   └── public.js              # Public routes
│   │
│   ├── services/               # Business logic
│   │   ├── authService.js         # Authentication service
│   │   ├── emailService.js        # Email notifications
│   │   ├── orderService.js        # Order processing
│   │   ├── menuService.js         # Menu operations
│   │   └── userService.js         # User management
│   │
│   ├── migrations/             # Database migrations
│   │   ├── 001-create-roles.js
│   │   ├── 002-create-users.js
│   │   ├── 003-create-categories.js
│   │   ├── 004-create-restaurants.js
│   │   ├── 005-create-dishes.js
│   │   ├── 006-create-orders.js
│   │   ├── 007-create-order-items.js
│   │   └── 008-create-additional-tables.js
│   │
│   └── seeders/                # Database seeders
│       ├── 001-seed-roles.js
│       ├── 002-seed-admin-user.js
│       ├── 003-seed-categories.js
│       ├── 004-seed-sample-restaurant.js
│       └── 005-seed-sample-dishes.js
│
├── tests/                      # Test files
├── uploads/                    # File uploads
├── server.js                   # Main server file
├── package.json                # Dependencies
├── docker-compose.yml          # Docker configuration
├── Dockerfile                  # Docker image
├── api-docs.yaml               # API documentation
└── README.md                   # This file
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Register new user | ❌ |
| `POST` | `/auth/login` | User login | ❌ |
| `POST` | `/auth/verify-2fa` | Verify 2FA code | ❌ |
| `POST` | `/auth/resend-2fa` | Resend 2FA code | ❌ |
| `POST` | `/auth/refresh` | Refresh JWT token | ✅ |
| `POST` | `/auth/logout` | User logout | ✅ |
| `POST` | `/auth/forgot-password` | Request password reset | ❌ |
| `POST` | `/auth/reset-password` | Reset password | ❌ |

### 👨‍💼 Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/admin/dashboard` | Dashboard statistics | ✅ Admin |
| `GET` | `/admin/users` | List all users | ✅ Admin |
| `GET` | `/admin/users/:id` | Get user by ID | ✅ Admin |
| `PUT` | `/admin/users/:id` | Update user | ✅ Admin |
| `PATCH` | `/admin/users/:id/status` | Update user status | ✅ Admin |
| `DELETE` | `/admin/users/:id` | Delete user | ✅ Admin |

### 🏪 Menu Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/menu/dishes` | List restaurant dishes | ✅ Restaurant |
| `POST` | `/menu/dishes` | Create new dish | ✅ Restaurant |
| `PUT` | `/menu/dishes/:id` | Update dish | ✅ Restaurant |
| `DELETE` | `/menu/dishes/:id` | Delete dish | ✅ Restaurant |
| `PUT` | `/menu/dishes/:id/availability` | Toggle availability | ✅ Restaurant |
| `PUT` | `/menu/dishes/:id/featured` | Toggle featured status | ✅ Restaurant |
| `GET` | `/menu/categories` | List categories | ✅ Restaurant |
| `GET` | `/menu/statistics` | Menu analytics | ✅ Restaurant |

### 📦 Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/orders/guest` | Create guest order | ❌ |
| `POST` | `/orders/guest/attach-user` | Link guest order to user | ✅ |
| `GET` | `/orders/receipt/:orderId` | Get order receipt | ✅/Token |
| `PATCH` | `/orders/:orderId/status` | Update order status | ✅ |

### 🌐 Public Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/public/menu` | Get public menu | ❌ |
| `GET` | `/public/restaurants` | Get restaurants | ❌ |

### 📧 Contact & Newsletter Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/contact/submit` | Submit contact form | ❌ |
| `GET` | `/contact` | List contact inquiries | ✅ Admin |
| `GET` | `/contact/:id` | Get inquiry by ID | ✅ Admin |
| `POST` | `/contact/:id/reply` | Reply to inquiry | ✅ Admin |
| `POST` | `/newsletter/subscribe` | Subscribe to newsletter | ❌ |
| `GET` | `/newsletter/confirm/:token` | Confirm subscription | ❌ |
| `GET` | `/newsletter/unsubscribe/:token` | Unsubscribe | ❌ |
| `POST` | `/newsletter/unsubscribe/:token` | Unsubscribe with reason | ❌ |

### 🤝 Partner Application Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/partner` | Submit application | ❌ |
| `GET` | `/partner/status/:id` | Check status | ❌ |
| `GET` | `/partner/admin` | List applications | ✅ Admin |
| `GET` | `/partner/admin/:id` | Get application | ✅ Admin |
| `PATCH` | `/partner/admin/:id/status` | Update status | ✅ Admin |

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255), -- Now nullable for OAuth users
  google_id VARCHAR(255) UNIQUE, -- New field
  profile_picture VARCHAR(500), -- New field  
  provider ENUM('local', 'google') DEFAULT 'local', -- New field
  role_id UUID REFERENCES roles(id),
  status ENUM('pending', 'active', 'suspended', 'banned'),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### Restaurants Table
```sql
restaurants (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  cuisine_type VARCHAR(50),
  owner_id UUID REFERENCES users(id),
  status ENUM('pending', 'approved', 'rejected'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### Dishes Table
```sql
dishes (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(255),
  category_id UUID REFERENCES categories(id),
  restaurant_id UUID REFERENCES restaurants(id),
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### Orders Table
```sql
orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  restaurant_id UUID REFERENCES restaurants(id),
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'),
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_address TEXT,
  guest_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** with RS256 algorithm
- **Refresh Token Rotation** for enhanced security
- **Role-based Access Control** (RBAC)
- **Two-Factor Authentication** (2FA) with SMS/email
- **Session Management** with Redis

### Data Protection
- **Password Hashing** with Argon2 (memory-hard)
- **Input Validation** with express-validator
- **SQL Injection Prevention** with Sequelize ORM
- **XSS Protection** with helmet middleware
- **CSRF Protection** with secure cookies

### API Security
- **Rate Limiting** per IP and per user
- **Request Size Limits** (10MB max)
- **CORS Configuration** for frontend
- **Security Headers** with helmet
- **Request Logging** with morgan

### File Upload Security
- **File Type Validation** (PDF, JPG, PNG only)
- **File Size Limits** (10MB max)
- **Malware Scanning** with ClamAV
- **Metadata Stripping** with ExifTool
- **Secure Storage** in uploads directory

### Cameroon-Specific Security
- **Phone Number Validation** for Cameroonian format
- **SMS Fraud Detection** for 2FA
- **SIM Swap Detection** for sensitive operations
- **Local Compliance** with data protection laws

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v15 or higher)
- Redis (v7 or higher)
- npm or yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd eat-fast-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eatfast_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-key
```

### 4. Database Setup
```bash
# Create database
npm run db:create

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

## ⚙️ Configuration

### Database Configuration
The database connection is configured in `src/config/database.js`:
```javascript
module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log
  },
  production: {
    // Production configuration
  }
};
```

### Security Configuration
Security settings are in `src/config/security.js`:
```javascript
module.exports = {
  securityHeaders: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
  generalLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  })
};
```

## 🛠️ Development

### Available Scripts
```bash
# Development
npm run dev              # Start development server with nodemon
npm start               # Start production server

# Database
npm run db:create       # Create database
npm run db:drop         # Drop database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed data
npm run db:reset        # Reset database (drop, create, migrate, seed)

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run security:audit  # Run security audit
npm run security:fix    # Fix security vulnerabilities
```

### Code Structure Guidelines
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Models**: Define database schema and relationships
- **Middleware**: Handle authentication, validation, and security
- **Routes**: Define API endpoints and HTTP methods

### Environment Variables
All configuration is done through environment variables. See the `.env` example above for all available options.

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── auth.test.js        # Authentication tests
├── admin.test.js       # Admin functionality tests
├── menu.test.js        # Menu management tests
└── setup.js           # Test configuration
```

### Test Database
Tests use a separate test database to avoid affecting development data.

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Build image
docker build -t eat-fast-backend .

# Run container
docker run -p 3000:3000 eat-fast-backend
```

### Production Environment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up monitoring and logging

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-production-jwt-secret
REDIS_URL=your-production-redis-url
```

## 📚 API Documentation

### Interactive Documentation
The API documentation is available in OpenAPI 3.0 format in `api-docs.yaml`.

### Request/Response Examples

#### User Registration
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+237612345678"
}
```

#### User Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Create Dish (Restaurant Manager)
```bash
POST /api/v1/menu/dishes
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Ndolé Complet",
  "description": "Traditional Cameroonian dish",
  "price": 4500,
  "categoryId": "uuid-here",
  "isAvailable": true
}
```

### Error Responses
All endpoints return consistent error responses:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details if available"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- Use ESLint configuration
- Follow existing code patterns
- Add JSDoc comments for functions
- Write meaningful commit messages

## 📞 Support

For support and questions:
- Email: support@eatfast.com
- Issues: GitHub Issues
- Documentation: API docs in `api-docs.yaml`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Eat Fast Backend** - Powering the future of food delivery in Cameroon 🍽️🇨🇲

---

## Frontend-Backend Field Mapping

The backend uses middleware in `src/middleware/validation.js` to automatically map frontend field names to backend model fields for registration, contact, and partner application. If you add new fields to the frontend, simply update the relevant mapping function in this middleware to ensure compatibility.

**Example:**
- Frontend sends `first_name`, backend maps to `firstName`.
- Frontend sends `businessName`, backend maps to `restaurantName`.

This allows the frontend and backend to evolve independently while maintaining seamless integration.