// Image upload helper — local ya cloudinary

const fs = require('fs');
const path = require('path');
const multer = require('multer');

let cloudinary = null;

// Cloudinary config agar env me ho
if (process.env.CLOUDINARY_URL) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  } catch (err) {
    console.warn('Cloudinary config error:', err.message);
  }
}

// Serverless check
const isServerless = process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Local upload folder (sirf local dev ke liye)
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'artworks');
const isLocalUploadAvailable = (() => {
  if (isServerless) return false;
  
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return true;
  } catch (err) {
    return false;
  }
})();

// Storage strategy decide karo
const storage = isLocalUploadAvailable 
  ? multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'artwork-' + uniqueSuffix + ext);
      }
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|jpe/;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.test(ext));
  }
});

// Image upload handle karke URL return karo
async function handleImageUpload(file, imageUrl = '') {
  if (!file) return imageUrl;

  // Local storage try karo
  if (isLocalUploadAvailable) {
    try {
      return `/uploads/artworks/${file.filename}`;
    } catch (err) {
      console.warn('Local save fail:', err.message);
    }
  }

  // Cloudinary upload
  if (cloudinary) {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'rangkala/artworks',
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        
        if (file.buffer) {
          const bufferStream = require('stream').Readable.from(file.buffer);
          bufferStream.pipe(uploadStream);
          bufferStream.on('error', reject);
        } else {
          const readStream = fs.createReadStream(file.path);
          readStream.pipe(uploadStream);
          readStream.on('error', reject);
        }
      });
    } catch (err) {
      throw err;
    }
  }

  if (isServerless) {
    throw new Error('Cloudinary credentials configure nahi hain');
  }

  return imageUrl;
}

// Multer error handling
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE' || err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File size 10MB se badi hai' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
  next();
};

module.exports = {
  upload,
  uploadErrorHandler,
  handleImageUpload,
  isLocalUploadAvailable,
  cloudinary
};
