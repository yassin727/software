const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create subdirectories based on file type
    let subDir = 'misc';
    if (file.fieldname === 'photo' || file.fieldname === 'profilePhoto') {
      subDir = 'profiles';
    } else if (file.fieldname === 'idDocument' || file.fieldname === 'selfie') {
      subDir = 'verification';
    }
    
    const destDir = path.join(uploadsDir, subDir);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    cb(null, destDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

// Different upload configurations
const uploadProfile = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter
}).single('photo');

const uploadVerification = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: imageFilter
}).fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]);

const uploadMultiple = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
}).array('photos', 5);

// Middleware wrapper with error handling
const handleUpload = (uploadFn) => {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

module.exports = {
  uploadProfile: handleUpload(uploadProfile),
  uploadVerification: handleUpload(uploadVerification),
  uploadMultiple: handleUpload(uploadMultiple),
  uploadsDir
};
