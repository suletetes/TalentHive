// Import all service instances explicitly
import { authService } from './auth.service';
import { projectsService } from './projects.service';
import { proposalsService } from './proposals.service';
import { contractsService } from './contracts.service';
import { paymentsService } from './payments.service';
import { messagesService } from './messages.service';
import { reviewsService } from './reviews.service';
import { notificationsService } from './notifications.service';
import { timeTrackingService } from './timeTracking.service';
import { organizationsService } from './organizations.service';
import { servicesService } from './services.service';
import { searchService } from './search.service';
import { uploadService } from './upload.service';
import { supportTicketService } from './supportTicket.service';
import { rbacService } from './rbac.service';
import { usersService } from './users.service';
import { skillsService } from './skills.service';

// Export API core
export { apiCore } from './core';

// Export service instances explicitly
export {
  authService,
  projectsService,
  proposalsService,
  contractsService,
  paymentsService,
  messagesService,
  reviewsService,
  notificationsService,
  timeTrackingService,
  organizationsService,
  servicesService,
  searchService,
  uploadService,
  supportTicketService,
  rbacService,
  usersService,
  skillsService,
};

// Export all types and additional exports from service modules
export * from './auth.service';
export * from './projects.service';
export * from './proposals.service';
export * from './contracts.service';
export * from './payments.service';
export * from './messages.service';
export * from './reviews.service';
export * from './notifications.service';
export * from './timeTracking.service';
export * from './organizations.service';
export * from './services.service';
export * from './search.service';
export * from './upload.service';
export * from './supportTicket.service';
export * from './rbac.service';
export * from './users.service';
export * from './skills.service';
