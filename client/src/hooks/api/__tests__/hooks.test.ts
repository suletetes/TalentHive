import { describe, it, expect } from 'vitest';
import {
  projectKeys,
  proposalKeys,
  contractKeys,
  paymentKeys,
  messageKeys,
  reviewKeys,
  notificationKeys,
  timeTrackingKeys,
  organizationKeys,
  serviceKeys,
  searchKeys,
} from '../index';

describe('API Hooks Query Keys', () => {
  it('should have correct project query keys', () => {
    expect(projectKeys.all).toEqual(['projects']);
    expect(projectKeys.lists()).toEqual(['projects', 'list']);
    expect(projectKeys.detail('123')).toEqual(['projects', 'detail', '123']);
    expect(projectKeys.my()).toEqual(['projects', 'my']);
  });

  it('should have correct proposal query keys', () => {
    expect(proposalKeys.all).toEqual(['proposals']);
    expect(proposalKeys.lists()).toEqual(['proposals', 'list']);
    expect(proposalKeys.detail('123')).toEqual(['proposals', 'detail', '123']);
  });

  it('should have correct contract query keys', () => {
    expect(contractKeys.all).toEqual(['contracts']);
    expect(contractKeys.detail('123')).toEqual(['contracts', 'detail', '123']);
  });

  it('should have correct payment query keys', () => {
    expect(paymentKeys.all).toEqual(['payments']);
    expect(paymentKeys.escrow()).toEqual(['payments', 'escrow']);
  });

  it('should have correct message query keys', () => {
    expect(messageKeys.all).toEqual(['messages']);
    expect(messageKeys.conversations()).toEqual(['messages', 'conversations']);
  });

  it('should have correct review query keys', () => {
    expect(reviewKeys.all).toEqual(['reviews']);
    expect(reviewKeys.user('123')).toEqual(['reviews', 'user', '123']);
  });

  it('should have correct notification query keys', () => {
    expect(notificationKeys.all).toEqual(['notifications']);
    expect(notificationKeys.unreadCount()).toEqual(['notifications', 'unreadCount']);
  });

  it('should have correct time tracking query keys', () => {
    expect(timeTrackingKeys.all).toEqual(['timeTracking']);
    expect(timeTrackingKeys.active()).toEqual(['timeTracking', 'active']);
  });

  it('should have correct organization query keys', () => {
    expect(organizationKeys.all).toEqual(['organizations']);
    expect(organizationKeys.my()).toEqual(['organizations', 'my']);
  });

  it('should have correct service query keys', () => {
    expect(serviceKeys.all).toEqual(['services']);
    expect(serviceKeys.stats()).toEqual(['services', 'stats']);
  });

  it('should have correct search query keys', () => {
    expect(searchKeys.all).toEqual(['search']);
    expect(searchKeys.results('test', {})).toEqual(['search', 'results', 'test', {}]);
  });
});
