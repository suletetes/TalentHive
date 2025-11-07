import { Router } from 'express';
import { protect, restrictTo } from '@/middleware/auth';
import {
  createServicePackage,
  getServicePackages,
  updateServicePackage,
  createProjectTemplate,
  getProjectTemplates,
  createProjectFromTemplate,
  addPreferredVendor,
  getPreferredVendors,
  updatePreferredVendor,
  removePreferredVendor,
} from '@/controllers/servicePackageController';

const router = Router();

// All routes require authentication
router.use(protect);

// Service package routes (freelancers)
router.post('/packages', restrictTo('freelancer'), createServicePackage);
router.get('/packages', getServicePackages);
router.patch('/packages/:packageId', restrictTo('freelancer'), updateServicePackage);

// Project template routes (clients)
router.post('/templates', restrictTo('client'), createProjectTemplate);
router.get('/templates', restrictTo('client'), getProjectTemplates);
router.post('/templates/:templateId/create-project', restrictTo('client'), createProjectFromTemplate);

// Preferred vendor routes (clients)
router.post('/preferred-vendors', restrictTo('client'), addPreferredVendor);
router.get('/preferred-vendors', restrictTo('client'), getPreferredVendors);
router.patch('/preferred-vendors/:vendorId', restrictTo('client'), updatePreferredVendor);
router.delete('/preferred-vendors/:vendorId', restrictTo('client'), removePreferredVendor);

export default router;
