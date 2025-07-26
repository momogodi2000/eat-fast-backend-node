const express = require('express');
const uploadController = require('../../controllers/upload/uploadController');
const uploadMiddleware = require('../../middleware/upload/upload');
const { authenticateToken, requireRole } = require('../../middleware/auth/auth');
const { handleValidationErrors } = require('../../middleware/validation/validation');

const router = express.Router();

// Serve uploaded files (public access)
router.get('/files/:filename', uploadController.serveFile);

// Get file info (public access for now)
router.get('/info/:filename', uploadController.getFileInfo);

// Protected upload routes
router.use(authenticateToken);

// Single file upload
router.post('/single', 
  uploadMiddleware.single('file'), 
  uploadController.uploadSingle
);

// Multiple file upload
router.post('/multiple', 
  uploadMiddleware.multiple('files', 5), 
  uploadController.uploadMultiple
);

// User document upload (for verification)
router.post('/user-documents', 
  uploadMiddleware.fields([
    { name: 'id_document', maxCount: 2 },
    { name: 'business_license', maxCount: 1 },
    { name: 'health_certificate', maxCount: 1 },
    { name: 'driving_license', maxCount: 2 },
    { name: 'vehicle_registration', maxCount: 1 },
    { name: 'education_certificate', maxCount: 1 },
    { name: 'language_proficiency', maxCount: 1 },
    { name: 'profile_picture', maxCount: 1 }
  ]), 
  uploadController.uploadUserDocuments
);

// Restaurant image upload (requires restaurant_manager role)
router.post('/restaurant/:restaurantId/images', 
  requireRole(['restaurant_manager', 'administrator']),
  uploadMiddleware.multiple('images', 10), 
  uploadController.uploadRestaurantImages
);

// Dish image upload (requires restaurant_manager role)
router.post('/dish/:dishId/images', 
  requireRole(['restaurant_manager', 'administrator']),
  uploadMiddleware.multiple('images', 5), 
  uploadController.uploadDishImages
);

// Delete file (requires authentication)
router.delete('/files/:filename', 
  uploadController.deleteFile
);

// Partner application document upload
router.post('/partner-documents', 
  uploadMiddleware.fields([
    { name: 'business_license', maxCount: 1 },
    { name: 'id_document', maxCount: 2 },
    { name: 'health_certificate', maxCount: 1 },
    { name: 'menu_sample', maxCount: 1 },
    { name: 'restaurant_photos', maxCount: 5 }
  ]), 
  uploadController.uploadUserDocuments
);

// Admin-only routes
router.use(requireRole(['administrator']));

// Admin file management
router.get('/admin/files', uploadController.getFileInfo);

module.exports = router; 