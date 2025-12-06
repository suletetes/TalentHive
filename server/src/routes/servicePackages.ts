import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import {
  createServicePackage,
  getServicePackages,
  getServicePackageById,
  updateServicePackage,
  orderServicePackage,
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
router.use(authenticate);

// Service package routes (freelancers)
router.post('/packages', authorize('freelancer'), createServicePackage);
router.get('/packages', getServicePackages);
router.get('/packages/:packageId', getServicePackageById);
router.patch('/packages/:packageId', authorize('freelancer'), updateServicePackage);
router.post('/packages/:packageId/order', authorize('client'), orderServicePackage);

// Project template routes (clients)
router.post('/templates', authorize('client'), createProjectTemplate);
router.get('/templates', authorize('client'), getProjectTemplates);
router.post('/templates/:templateId/create-project', authorize('client'), createProjectFromTemplate);

// Preferred vendor routes (clients)
router.post('/preferred-vendors', authorize('client'), addPreferredVendor);
router.get('/preferred-vendors', authorize('client'), getPreferredVendors);
router.patch('/preferred-vendors/:vendorId', authorize('client'), updatePreferredVendor);
router.delete('/preferred-vendors/:vendorId', authorize('client'), removePreferredVendor);

export default router;
