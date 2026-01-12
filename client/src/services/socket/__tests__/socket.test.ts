import { describe, it, expect, beforeEach } from 'vitest';
import { SocketService } from '../socket.service';

describe('SocketService', () => {
  let socketService: SocketService;

  beforeEach(() => {
    socketService = new SocketService();
  });

  it('should create a socket service instance', () => {
    expect(socketService).toBeDefined();
    expect(socketService).toBeInstanceOf(SocketService);
  });

  it('should have connection methods', () => {
    expect(socketService.connect).toBeDefined();
    expect(socketService.disconnect).toBeDefined();
    expect(socketService.reconnect).toBeDefined();
    expect(socketService.isConnected).toBeDefined();
  });

  it('should have message event methods', () => {
    expect(socketService.onNewMessage).toBeDefined();
    expect(socketService.offNewMessage).toBeDefined();
    expect(socketService.sendMessage).toBeDefined();
    expect(socketService.onTyping).toBeDefined();
    expect(socketService.offTyping).toBeDefined();
    expect(socketService.emitTyping).toBeDefined();
  });

  it('should have notification event methods', () => {
    expect(socketService.onNotification).toBeDefined();
    expect(socketService.offNotification).toBeDefined();
  });

  it('should have proposal event methods', () => {
    expect(socketService.onProposalUpdate).toBeDefined();
    expect(socketService.offProposalUpdate).toBeDefined();
    expect(socketService.onProposalStatusChange).toBeDefined();
    expect(socketService.offProposalStatusChange).toBeDefined();
  });

  it('should have contract event methods', () => {
    expect(socketService.onContractUpdate).toBeDefined();
    expect(socketService.offContractUpdate).toBeDefined();
    expect(socketService.onMilestoneUpdate).toBeDefined();
    expect(socketService.offMilestoneUpdate).toBeDefined();
  });

  it('should have payment event methods', () => {
    expect(socketService.onPaymentUpdate).toBeDefined();
    expect(socketService.offPaymentUpdate).toBeDefined();
    expect(socketService.onPaymentStatusChange).toBeDefined();
    expect(socketService.offPaymentStatusChange).toBeDefined();
  });

  it('should have generic event methods', () => {
    expect(socketService.on).toBeDefined();
    expect(socketService.off).toBeDefined();
    expect(socketService.emit).toBeDefined();
  });

  it('should return false for isConnected when not connected', () => {
    expect(socketService.isConnected()).toBe(false);
  });

  it('should return undefined for getSocketId when not connected', () => {
    expect(socketService.getSocketId()).toBeUndefined();
  });
});
