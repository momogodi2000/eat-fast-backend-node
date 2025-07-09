// Create this file as validate-setup.js in your root directory
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Eat Fast Backend Setup...\n');

// Check required files
const requiredFiles = [
  'server.js',
  '.env',
  'package.json',
  'src/config/database.js',
  'src/config/redis.js',
  'src/config/security.js',
  'src/models/index.js',
  'src/models/user.js',
  'src/models/role.js',
  'src/models/restaurant.js',
  'src/models/dish.js',
  'src/models/category.js',
  'src/models/order.js',
  'src/models/orderItem.js',
  'src/models/newsletter.js',
  'src/models/contact.js',
  'src/models/partnerApplication.js',
  'src/services/authService.js',
  'src/services/emailService.js',
  'src/controllers/authController.js',
  'src/controllers/menuController.js',
  'src/controllers/orderController.js',
  'src/controllers/publicController.js',
  'src/routes/auth.js',
  'src/routes/menu.js',
  'src/routes/orders.js',
  'src/routes/public.js',
  'src/middleware/auth.js'
];

// Check required directories
const requiredDirectories = [
  'src',
  'src/config',
  'src/models',
  'src/services',
  'src/controllers',
  'src/routes',
  'src/middleware',
  'uploads'
];

let missingFiles = [];
let missingDirectories = [];

// Check directories
requiredDirectories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    missingDirectories.push(dir);
  }
});

// Check files
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    missingFiles.push(file);
  }
});

// Check .env file content
let envIssues = [];
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASS',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (!envContent.includes(envVar)) {
      envIssues.push(envVar);
    }
  });
}

// Report results
console.log('📁 Directory Check:');
if (missingDirectories.length === 0) {
  console.log('✅ All required directories exist');
} else {
  console.log('❌ Missing directories:');
  missingDirectories.forEach(dir => console.log(`   - ${dir}`));
}

console.log('\n📄 File Check:');
if (missingFiles.length === 0) {
  console.log('✅ All required files exist');
} else {
  console.log('❌ Missing files:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
}

console.log('\n🔧 Environment Check:');
if (envIssues.length === 0) {
  console.log('✅ All required environment variables are set');
} else {
  console.log('❌ Missing environment variables:');
  envIssues.forEach(env => console.log(`   - ${env}`));
}

// Check package.json dependencies
console.log('\n📦 Dependencies Check:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'express', 'sequelize', 'pg', 'redis', 'jsonwebtoken', 
    'argon2', 'cors', 'helmet', 'morgan', 'dotenv'
  ];
  
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missingDeps.length === 0) {
    console.log('✅ All required dependencies are installed');
  } else {
    console.log('❌ Missing dependencies:');
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
  }
} catch (error) {
  console.log('❌ Error reading package.json');
}

// Summary
console.log('\n📊 Summary:');
const totalIssues = missingFiles.length + missingDirectories.length + envIssues.length;

if (totalIssues === 0) {
  console.log('🎉 Setup validation passed! Your project is ready to run.');
  console.log('Run: npm run dev');
} else {
  console.log(`❌ Found ${totalIssues} issue(s) that need to be fixed.`);
  console.log('\n🔧 Quick fixes:');
  
  if (missingDirectories.length > 0) {
    console.log('Create missing directories:');
    missingDirectories.forEach(dir => {
      console.log(`   mkdir -p ${dir}`);
    });
  }
  
  if (missingFiles.length > 0) {
    console.log('Create missing files (refer to the setup guide)');
  }
  
  if (envIssues.length > 0) {
    console.log('Add missing environment variables to .env file');
  }
}

console.log('\n🆘 If you need help, check the troubleshooting guide!');