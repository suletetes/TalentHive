// Export API core
export { apiCore } from './core';

// Export all services
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

// Export service instances
export { authService } from './auth.service';
export { projectsService } from './projects.service';
export { proposalsService } from './proposals.service';
export { contractsService } from './contracts.service';
export { paymentsService } from './payments.service';
export { messagesService } from './messages.service';
export { reviewsService } from './reviews.service';
export { notificationsService } from './notifications.service';
export { timeTrackingService } from './timeTracking.service';
export { organizationsService } from './organizations.service';
export { servicesService } from './services.service';
export { searchService } from './search.service';
export { uploadService } from './upload.service';

// Export types
export type { LoginCredentials, RegisterData, AuthResponse } from './auth.service';
export type {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectFilters,
  PaginatedResponse,
} from './projects.service';
export type { Proposal, CreateProposalDto, UpdateProposalDto } from './proposals.service';
export type { Contract, CreateContractDto, Amendment } from './contracts.service';
export type { Payment, ProcessPaymentDto, PayoutRequest } from './payments.service';
export type { Message, Conversation, SendMessageDto } from './messages.service';
export type { Review, CreateReviewDto } from './reviews.service';
export type {
  Notification,
  NotificationPreferences,
} from './notifications.service';
export type { TimeEntry, CreateTimeEntryDto, TimeReport } from './timeTracking.service';
export type {
  Organization,
  CreateOrganizationDto,
  BudgetApproval,
} from './organizations.service';
export type {
  ServicePackage,
  CreateServicePackageDto,
  ProjectTemplate,
} from './services.service';
export type { SearchResult, SearchFilters } from './search.service';
export type { UploadResponse } from './upload.service';
