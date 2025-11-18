import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "assets", "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

// File filter for allowed types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow PDF and image files
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed"));
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware for single file upload
export const uploadSingle = upload.single("file");

// Middleware for multiple file uploads
export const uploadMultiple = upload.array("files", 5); // Max 5 files

// File cleanup utility
export const cleanupFile = (filePath: string): void => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log("File cleaned up:", filePath);
  }
};

// File cleanup middleware for error handling
export const cleanupOnError = (req: any, res: any, next: any) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    // Clean up files if response indicates error
    if (res.statusCode >= 400 && req.file) {
      cleanupFile(req.file.path);
    }
    return originalSend.call(this, data);
  };
  
  next();
};

// File validation middleware
export const validateFile = (req: any, res: any, next: any) => {
  if (req.file) {
    const file = req.file;
    
    // Check file size (additional check)
    if (file.size > 5 * 1024 * 1024) {
      cleanupFile(file.path);
      return res.status(400).json({
        success: false,
        error: "File size exceeds 5MB limit"
      });
    }
    
    // Check file type (additional check)
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (!mimetype || !extname) {
      cleanupFile(file.path);
      return res.status(400).json({
        success: false,
        error: "Invalid file type. Only PDF and image files are allowed"
      });
    }
    
    console.log("File validation passed:", {
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    });
  }
  
  next();
};

// Combined middleware for file upload with validation and cleanup
export const fileUploadMiddleware = [
  uploadSingle,
  validateFile,
  cleanupOnError
];
