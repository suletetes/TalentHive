import { describe, it, expect } from 'vitest';
import {
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
} from '../index';

describe('API Services', () => {
  it('should export authService', () => {
    expect(authService).toBeDefined();
    expect(authService.login).toBeDefined();
    expect(authService.register).toBeDefined();
    expect(authService.logout).toBeDefined();
    expect(authService.refreshToken).toBeDefined();
    expect(authService.verifyEmail).toBeDefined();
  });

  it('should export projectsService', () => {
    expect(projectsService).toBeDefined();
    expect(projectsService.getProjects).toBeDefined();
    expect(projectsService.getProjectById).toBeDefined();
    expect(projectsService.createProject).toBeDefined();
    expect(projectsService.updateProject).toBeDefined();
    expect(projectsService.deleteProject).toBeDefined();
    expect(projectsService.getMyProjects).toBeDefined();
    expect(projectsService.searchProjects).toBeDefined();
    expect(projectsService.toggleProjectStatus).toBeDefined();
    expect(projectsService.getProjectStats).toBeDefined();
  });

  it('should export proposalsService', () => {
    expect(proposalsService).toBeDefined();
    expect(proposalsService.createProposal).toBeDefined();
    expect(proposalsService.getProposalsForProject).toBeDefined();
    expect(proposalsService.getMyProposals).toBeDefined();
    expect(proposalsService.getProposalById).toBeDefined();
    expect(proposalsService.updateProposal).toBeDefined();
    expect(proposalsService.withdrawProposal).toBeDefined();
    expect(proposalsService.acceptProposal).toBeDefined();
    expect(proposalsService.rejectProposal).toBeDefined();
  });

  it('should export contractsService', () => {
    expect(contractsService).toBeDefined();
    expect(contractsService.getMyContracts).toBeDefined();
    expect(contractsService.getContractById).toBeDefined();
    expect(contractsService.signContract).toBeDefined();
    expect(contractsService.submitMilestone).toBeDefined();
    expect(contractsService.approveMilestone).toBeDefined();
    expect(contractsService.rejectMilestone).toBeDefined();
  });

  it('should export paymentsService', () => {
    expect(paymentsService).toBeDefined();
    expect(paymentsService.createPaymentIntent).toBeDefined();
    expect(paymentsService.confirmPayment).toBeDefined();
    expect(paymentsService.releaseEscrow).toBeDefined();
    expect(paymentsService.refundPayment).toBeDefined();
    expect(paymentsService.getTransactionHistory).toBeDefined();
    expect(paymentsService.getBalance).toBeDefined();
  });

  it('should export messagesService', () => {
    expect(messagesService).toBeDefined();
    expect(messagesService.sendMessage).toBeDefined();
    expect(messagesService.getMessages).toBeDefined();
    expect(messagesService.getConversations).toBeDefined();
    expect(messagesService.markAsRead).toBeDefined();
    expect(messagesService.createConversation).toBeDefined();
    expect(messagesService.uploadAttachments).toBeDefined();
  });

  it('should export reviewsService', () => {
    expect(reviewsService).toBeDefined();
    expect(reviewsService.createReview).toBeDefined();
    expect(reviewsService.getReviews).toBeDefined();
    expect(reviewsService.respondToReview).toBeDefined();
  });

  it('should export notificationsService', () => {
    expect(notificationsService).toBeDefined();
    expect(notificationsService.getNotifications).toBeDefined();
    expect(notificationsService.markAsRead).toBeDefined();
    expect(notificationsService.markAllAsRead).toBeDefined();
    expect(notificationsService.getUnreadCount).toBeDefined();
    expect(notificationsService.deleteNotification).toBeDefined();
  });

  it('should export timeTrackingService', () => {
    expect(timeTrackingService).toBeDefined();
    expect(timeTrackingService.startTimeEntry).toBeDefined();
    expect(timeTrackingService.stopTimeEntry).toBeDefined();
    expect(timeTrackingService.getTimeEntries).toBeDefined();
    expect(timeTrackingService.getTimeReports).toBeDefined();
    expect(timeTrackingService.getActiveTimer).toBeDefined();
    expect(timeTrackingService.createManualEntry).toBeDefined();
  });

  it('should export organizationsService', () => {
    expect(organizationsService).toBeDefined();
    expect(organizationsService.createOrganization).toBeDefined();
    expect(organizationsService.getOrganization).toBeDefined();
    expect(organizationsService.getMyOrganizations).toBeDefined();
    expect(organizationsService.inviteMember).toBeDefined();
    expect(organizationsService.getMembers).toBeDefined();
    expect(organizationsService.updateBudget).toBeDefined();
  });

  it('should export servicesService', () => {
    expect(servicesService).toBeDefined();
    expect(servicesService.createPackage).toBeDefined();
    expect(servicesService.getPackages).toBeDefined();
    expect(servicesService.getPackage).toBeDefined();
    expect(servicesService.updatePackage).toBeDefined();
    expect(servicesService.deletePackage).toBeDefined();
    expect(servicesService.purchasePackage).toBeDefined();
  });

  it('should export searchService', () => {
    expect(searchService).toBeDefined();
    expect(searchService.search).toBeDefined();
    expect(searchService.advancedSearch).toBeDefined();
    expect(searchService.getSearchSuggestions).toBeDefined();
  });

  it('should export uploadService', () => {
    expect(uploadService).toBeDefined();
    expect(uploadService.uploadFile).toBeDefined();
    expect(uploadService.uploadMultipleFiles).toBeDefined();
    expect(uploadService.deleteFile).toBeDefined();
    expect(uploadService.validateFile).toBeDefined();
  });
});
