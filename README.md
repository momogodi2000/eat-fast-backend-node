# Eat Fast Backend

## Overview
Eat Fast is a full-stack food delivery platform with a robust Node.js/Express backend, PostgreSQL database, and a React frontend. The backend is designed for security, scalability, and maintainability, supporting advanced authentication, admin management, and integrations for newsletters, contact forms, and partner applications.

## Recent Updates

- **Cleanup & Standardization:** Removed old/dummy seeders, migrations, and legacy files (old models, routes, controllers, and seeders). Table and model names have been standardized (e.g., `menu_categories`).
- **Comprehensive Data Seeding:** Added new seeders for all major tables, including roles, users (with real Cameroonian data), categories, restaurants, dishes, newsletters, partner applications, contact inquiries, orders, payments, and receipts. See the `seeders/` directory for details.
- **Restaurant Menu Management:** All `/api/v1/menu` endpoints are now strictly protected by both authentication and role/status middleware (`authenticateToken` and `requireRestaurantManager`). Only authenticated, approved restaurant managers can access or modify their menu.
- **Public Menu & Guest Order Flow:** Implemented guest order creation (`POST /api/v1/orders/guest`), guest order linking after login (`POST /api/v1/orders/guest/attach-user`), and secure receipt download (`GET /api/v1/orders/receipt/:orderId`). Guest orders use a `guest_token` for secure access. Orders and receipts are linked to user accounts after login/registration.
- **Seeder & Migration Troubleshooting:** If you encounter npm/ENOENT errors when running seeders or migrations, use the local `node_modules` version of sequelize-cli (e.g., `npx sequelize-cli db:seed:all`) to avoid global npm path issues.

## Architecture
- **Node.js/Express**: RESTful API server
- **Sequelize**: ORM for PostgreSQL
- **PostgreSQL**: Main database
- **Redis**: Session and cache management
- **Modular Structure**: Models, services, controllers, and routes are organized for clarity and scalability

## Security Features
- **Password Hashing**: Argon2id for secure password storage
- **JWT Authentication**: RS256 with key rotation, device binding
- **Session Management**: Redis-backed, encrypted sessions
- **GeoIP Validation**: For login and sensitive actions
- **Strict Cookies & CSP**: Secure cookie flags, Content Security Policy headers
- **MFA**: TOTP, SMS fallback, SIM swap detection
- **File Upload Security**: ClamAV and ExifTool scanning
- **Audit Logging**: All sensitive actions are logged
- **GDPR & PCI Compliance**: Data handling and deletion policies
- **Behavioral Analysis & Honeypots**: Detect and block suspicious activity
- **Cameroon-Specific Telecom Threat Mitigations**

## API Endpoint Summary

### Authentication
- `POST /api/v1/auth/register` — Register a new user (with validation, sends 2FA code)
- `POST /api/v1/auth/login` — Login (sends 2FA code)
- `POST /api/v1/auth/verify-2fa` — Verify 2FA code
- `POST /api/v1/auth/resend-2fa` — Resend 2FA code
- `POST /api/v1/auth/refresh` — Refresh JWT tokens
- `POST /api/v1/auth/logout` — Logout (revoke tokens)
- `POST /api/v1/auth/forgot-password` — Request password reset
- `POST /api/v1/auth/reset-password` — Reset password with token

### Admin User Management
- `GET /api/v1/admin/users` — List users (filter, search, pagination)
- `GET /api/v1/admin/users/:id` — Get user by ID
- `PUT /api/v1/admin/users/:id` — Update user profile, role, or status
- `PATCH /api/v1/admin/users/:id/status` — Update user status
- `POST /api/v1/admin/users/:id/reset-password` — Send password reset email
- `DELETE /api/v1/admin/users/:id` — GDPR-compliant user deletion (soft delete/anonymize, audit logged)

### Contact System
- `POST /api/v1/contact/submit` — Public contact form (with validation, anti-spam, rate limiting)
- `GET /api/v1/contact` — Admin: List all contact inquiries
- `GET /api/v1/contact/:id` — Admin: Get inquiry by ID
- `POST /api/v1/contact/:id/reply` — Admin: Reply to inquiry

### Become Partner System
- `POST /api/v1/partner-applications` — Public partner application (file upload, validation, rate limiting)
- `GET /api/v1/partner-applications/status/:id` — Public: Check application status
- `GET /api/v1/partner-applications/admin` — Admin: List/filter/search applications
- `GET /api/v1/partner-applications/admin/:id` — Admin: Get application by ID
- `PATCH /api/v1/partner-applications/admin/:id/status` — Admin: Update application status

### Newsletter System
- `POST /api/v1/newsletter/subscribe` — Subscribe to newsletter (with email confirmation, rate limiting)
- `GET /api/v1/newsletter/confirm/:token` — Confirm subscription
- `GET /api/v1/newsletter/unsubscribe/:token` — Unsubscribe
- `POST /api/v1/newsletter/unsubscribe/:token` — Unsubscribe with reason
- `GET /api/v1/newsletter/admin/stats` — Admin: Newsletter statistics

### Restaurant Menu Management
- All `/api/v1/menu` endpoints require:
  - JWT authentication
  - User role: `restaurant_manager` or `restaurant`
  - Account status: `active` or `approved`
- Endpoints:
  - `GET /api/v1/menu/dishes` — List/filter/search dishes (restaurant only)
  - `POST /api/v1/menu/dishes` — Create a new dish
  - `PUT /api/v1/menu/dishes/:dishId` — Update a dish
  - `DELETE /api/v1/menu/dishes/:dishId` — Delete a dish
  - `PUT /api/v1/menu/dishes/:dishId/availability` — Toggle dish availability
  - `PUT /api/v1/menu/dishes/:dishId/featured` — Toggle dish featured status
  - `GET /api/v1/menu/categories` — List menu categories (restaurant only)
  - `GET /api/v1/menu/statistics` — Get menu analytics/statistics
- **Security:**
  - All routes are protected by `authenticateToken` and `requireRestaurantManager` middleware.
  - Only authenticated, approved restaurant managers can access or modify their menu.
  - Attempts by unauthorized or unapproved users are rejected with 403 errors.
- **Seeder:**
  - See `20240710-menu-categories.js` for demo menu categories with Cameroonian data.

### Public Menu & Guest Order Flow
- `GET /api/v1/public/menu` — Public: List all available dishes and categories
- `POST /api/v1/orders/guest` — Public: Create a guest order (returns guest_token for receipt access)
- `POST /api/v1/orders/guest/attach-user` — Link a guest order to a user after login/registration (migrates cart/orders)
- `GET /api/v1/orders/receipt/:orderId` — Download/view receipt (accessible by guest_token or authenticated user)
- `PATCH /api/v1/orders/:orderId/status` — Update order status (delivery flow, protected)

#### Logic
- Guests can browse menu, add to cart, and place orders without login.
- Guest orders are assigned a `guest_token` for secure receipt access.
- If a guest logs in/registers, their cart and orders are migrated to their user account.
- Receipts are downloadable by guest token or user.
- All order, payment, and receipt info is stored in the DB.

## Audit Logging & GDPR Compliance
- All sensitive actions (user deletion, login, password reset, contact/partner submissions) are logged for audit.
- User deletion is GDPR-compliant: data is anonymized, not hard-deleted, and audit logs are kept.
- Data export and erasure requests are supported (contact admin).

## Business Logic & Security Best Practices
- All endpoints are protected by JWT authentication and role-based access control where appropriate.
- Rate limiting, input validation, and anti-spam/honeypot techniques are used on public forms.
- File uploads are scanned for malware and metadata leaks.
- All emails use secure SMTP headers and anti-phishing protections.
- Behavioral analysis and fraud detection are in place for sensitive flows.

## Cameroon-Specific Protections
- Phone validation and SMS logic are tailored for Cameroonian telecoms.
- SIM swap and SMS fraud detection are implemented for 2FA and notifications.
- Localized error messages and compliance with regional data laws.

## Setup Instructions
1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure environment**: Copy `.env.example` to `.env` and set DB, Redis, and email credentials
4. **Run migrations**: `npx sequelize-cli db:migrate`
5. **Start the server**: `npm start`

## Directory Structure
- `model/` — Sequelize models (canonical user model: `user_model.js`)
- `services/` — Business logic (userService, emailService, etc.)
- `controller/` — Route handlers (admin, public, etc.)
- `route/` — Express route definitions
- `middleware/` — Auth, validation, and security middleware

## Contributing & Support
For issues or contributions, please open an issue or pull request on the repository.

* `npm run dev` pour lancer le fichier server.js





(API Endpoints Summary
Authentication

POST /api/v1/auth/register - Register user
POST /api/v1/auth/login - Login user
POST /api/v1/auth/verify-2fa - Verify 2FA code
POST /api/v1/auth/refresh - Refresh tokens
POST /api/v1/auth/logout - Logout user

Public

GET /api/v1/public/menu - Get public menu
GET /api/v1/public/restaurants - Get restaurants

Orders

POST /api/v1/orders/guest - Create guest order
GET /api/v1/orders/receipt/:orderId - Get order receipt
POST /api/v1/orders/guest/attach-user - Attach guest order to user

Contact & Newsletter

POST /api/v1/contact/submit - Submit contact form
POST /api/v1/newsletter/subscribe - Subscribe to newsletter
GET /api/v1/newsletter/confirm/:token - Confirm subscription

Admin

GET /api/v1/admin/dashboard - Dashboard stats
GET /api/v1/admin/users - List users
PUT /api/v1/admin/users/:id - Update user

Restaurant Menu (Protected)

GET /api/v1/menu/dishes - List dishes
POST /api/v1/menu/dishes - Create dish
PUT /api/v1/menu/dishes/:id - Update dish
DELETE /api/v1/menu/dishes/:id - Delete dish

Your Eat Fast Backend is now complete and production-ready! 🚀)