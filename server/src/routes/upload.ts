import express from 'express';
import { uploadFile, uploadMultipleFiles, deleteFile } from '../controllers/uploadController';
import { upload } from '../utils/fileUpload';
import { auth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Upload single file
router.post('/single', upload.single('file'), uploadFile);

// Upload multiple files
router.post('/multiple', upload.array('files', 10), uploadMultipleFiles);

// Delete file
router.delete('/', deleteFile);

export default router;
