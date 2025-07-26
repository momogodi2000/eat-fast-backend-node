const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class UploadController {
  /**
   * Upload single file
   */
  async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      const { fieldname, filename, originalname, mimetype, size, path: filePath } = req.file;
      
      const fileInfo = {
        id: uuidv4(),
        originalName: originalname,
        filename: filename,
        path: filePath,
        mimetype: mimetype,
        size: size,
        fieldname: fieldname,
        url: `/uploads/${filename}`,
        uploadedAt: new Date()
      };

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        file: fileInfo
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload file',
        error: error.message 
      });
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No files uploaded' 
        });
      }

      const files = req.files.map(file => ({
        id: uuidv4(),
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        fieldname: file.fieldname,
        url: `/uploads/${file.filename}`,
        uploadedAt: new Date()
      }));

      res.status(201).json({
        success: true,
        message: `${files.length} files uploaded successfully`,
        files: files
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload files',
        error: error.message 
      });
    }
  }

  /**
   * Upload user documents (for verification)
   */
  async uploadUserDocuments(req, res) {
    try {
      if (!req.files) {
        return res.status(400).json({ 
          success: false, 
          message: 'No documents uploaded' 
        });
      }

      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'User ID is required' 
        });
      }

      const documents = {};
      
      // Process each uploaded document type
      Object.keys(req.files).forEach(fieldName => {
        const files = req.files[fieldName];
        if (Array.isArray(files)) {
          documents[fieldName] = files.map(file => ({
            id: uuidv4(),
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            url: `/uploads/${file.filename}`,
            uploadedAt: new Date(),
            userId: userId,
            documentType: fieldName
          }));
        } else {
          documents[fieldName] = {
            id: uuidv4(),
            originalName: files.originalname,
            filename: files.filename,
            path: files.path,
            url: `/uploads/${files.filename}`,
            uploadedAt: new Date(),
            userId: userId,
            documentType: fieldName
          };
        }
      });

      res.status(201).json({
        success: true,
        message: 'Documents uploaded successfully',
        documents: documents,
        userId: userId
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload documents',
        error: error.message 
      });
    }
  }

  /**
   * Upload restaurant images
   */
  async uploadRestaurantImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No images uploaded' 
        });
      }

      const restaurantId = req.params.restaurantId || req.body.restaurantId;
      if (!restaurantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Restaurant ID is required' 
        });
      }

      const images = req.files.map(file => ({
        id: uuidv4(),
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        url: `/uploads/${file.filename}`,
        uploadedAt: new Date(),
        restaurantId: restaurantId,
        imageType: 'restaurant'
      }));

      res.status(201).json({
        success: true,
        message: 'Restaurant images uploaded successfully',
        images: images,
        restaurantId: restaurantId
      });
    } catch (error) {
      console.error('Restaurant image upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload restaurant images',
        error: error.message 
      });
    }
  }

  /**
   * Upload dish images
   */
  async uploadDishImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No images uploaded' 
        });
      }

      const dishId = req.params.dishId || req.body.dishId;
      if (!dishId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dish ID is required' 
        });
      }

      const images = req.files.map(file => ({
        id: uuidv4(),
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        url: `/uploads/${file.filename}`,
        uploadedAt: new Date(),
        dishId: dishId,
        imageType: 'dish'
      }));

      res.status(201).json({
        success: true,
        message: 'Dish images uploaded successfully',
        images: images,
        dishId: dishId
      });
    } catch (error) {
      console.error('Dish image upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload dish images',
        error: error.message 
      });
    }
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(req, res) {
    try {
      const { filename } = req.params;
      if (!filename) {
        return res.status(400).json({ 
          success: false, 
          message: 'Filename is required' 
        });
      }

      const filePath = path.join(process.env.UPLOAD_PATH || 'uploads/', filename);
      
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return res.status(404).json({ 
            success: false, 
            message: 'File not found' 
          });
        }
        throw error;
      }

      res.json({
        success: true,
        message: 'File deleted successfully',
        filename: filename
      });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete file',
        error: error.message 
      });
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(req, res) {
    try {
      const { filename } = req.params;
      if (!filename) {
        return res.status(400).json({ 
          success: false, 
          message: 'Filename is required' 
        });
      }

      const filePath = path.join(process.env.UPLOAD_PATH || 'uploads/', filename);
      
      try {
        const stats = await fs.stat(filePath);
        const fileInfo = {
          filename: filename,
          path: filePath,
          url: `/uploads/${filename}`,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          exists: true
        };

        res.json({
          success: true,
          file: fileInfo
        });
      } catch (error) {
        if (error.code === 'ENOENT') {
          return res.status(404).json({ 
            success: false, 
            message: 'File not found' 
          });
        }
        throw error;
      }
    } catch (error) {
      console.error('Get file info error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get file info',
        error: error.message 
      });
    }
  }

  /**
   * Serve uploaded files
   */
  async serveFile(req, res) {
    try {
      const { filename } = req.params;
      if (!filename) {
        return res.status(400).json({ 
          success: false, 
          message: 'Filename is required' 
        });
      }

      const filePath = path.join(process.env.UPLOAD_PATH || 'uploads/', filename);
      
      try {
        await fs.access(filePath);
        res.sendFile(path.resolve(filePath));
      } catch (error) {
        if (error.code === 'ENOENT') {
          return res.status(404).json({ 
            success: false, 
            message: 'File not found' 
          });
        }
        throw error;
      }
    } catch (error) {
      console.error('Serve file error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to serve file',
        error: error.message 
      });
    }
  }
}

module.exports = new UploadController(); 