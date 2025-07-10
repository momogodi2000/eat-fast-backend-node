#!/bin/bash

# Eat Fast Backend Setup Script
echo "🚀 Setting up Eat Fast Backend with Enhanced Authentication..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install additional dependencies for enhanced features
echo "📦 Installing enhanced authentication dependencies..."
npm install bcryptjs argon2 jsonwebtoken google-auth-library express-rate-limit helmet validator express-validator

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created from .env.example"
    else
        echo "📝 Creating basic .env file..."
        cat > .env << EOL
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eat_fast_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-change-this-in-production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Security Configuration
MAX_RECORDS_PER_REQUEST=1000
MAX_RESPONSE_SIZE=10485760
BCRYPT_ROUNDS=12

# Email Configuration (for 2FA)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EOL
        echo "✅ Basic .env file created. Please update with your actual values."
    fi
fi

# Check PostgreSQL connection
echo "🔍 Checking database connection..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "⚠️  PostgreSQL client not found. Please install PostgreSQL."
fi

# Check Redis connection
echo "🔍 Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is not running. Please start Redis server."
    fi
else
    echo "⚠️  Redis client not found. Please install Redis."
fi

# Verify critical dependencies
echo "🔍 Verifying dependencies..."
DEPS=("bcryptjs" "argon2" "jsonwebtoken" "google-auth-library" "express-rate-limit" "helmet" "validator")

for dep in "${DEPS[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        echo "✅ $dep installed"
    else
        echo "❌ $dep missing - installing..."
        npm install "$dep"
    fi
done

# Run database migrations if sequelize-cli is available
if command -v npx &> /dev/null; then
    echo "🔍 Checking for database migrations..."
    if [ -d "migrations" ]; then
        echo "📊 Running database migrations..."
        npx sequelize-cli db:migrate
        echo "✅ Database migrations completed"
    else
        echo "⚠️  Migrations directory not found. You may need to set up Sequelize migrations."
    fi
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env file with actual database credentials"
echo "2. Set up Google OAuth in Google Cloud Console"
echo "3. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
echo "4. Ensure PostgreSQL and Redis are running"
echo "5. Run: npm run dev"
echo ""
echo "🔧 Common commands:"
echo "  npm run dev      - Start development server"
echo "  npm run migrate  - Run database migrations"
echo "  npm test         - Run tests"
echo ""
echo "🐛 If you encounter issues:"
echo "  - Check your .env file configuration"
echo "  - Ensure database is running and accessible"
echo "  - Verify Redis connection"
echo "  - Check Node.js version (requires 16+)"