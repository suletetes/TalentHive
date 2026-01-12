import { io, Socket } from 'socket.io-client';
import { store } from '@/store';

export class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  connect() {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const state = store.getState();
    const token = state.auth.token;

    if (!token) {
      this.isConnecting = false;
      return;
    }

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
    this.isConnecting = false;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      // Socket disconnected
    });

    this.socket.on('connect_error', () => {
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.disconnect();
      }
    });

    this.socket.on('reconnect', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('error', () => {
      // Socket error occurred
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    }
  }

  // Message events
  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('new_message', callback);
  }

  offNewMessage(callback?: (message: any) => void) {
    this.socket?.off('new_message', callback);
  }

  sendMessage(data: any) {
    this.socket?.emit('message:send', data);
  }

  onTyping(callback: (data: any) => void) {
    this.socket?.on('message:typing', callback);
  }

  offTyping(callback?: (data: any) => void) {
    this.socket?.off('message:typing', callback);
  }

  emitTyping(conversationId: string) {
    this.socket?.emit('message:typing', { conversationId });
  }

  // Notification events
  onNotification(callback: (notification: any) => void) {
    this.socket?.on('notification:new', callback);
  }

  offNotification(callback?: (notification: any) => void) {
    this.socket?.off('notification:new', callback);
  }

  // Proposal events
  onProposalUpdate(callback: (proposal: any) => void) {
    this.socket?.on('proposal:update', callback);
  }

  offProposalUpdate(callback?: (proposal: any) => void) {
    this.socket?.off('proposal:update', callback);
  }

  onProposalStatusChange(callback: (data: any) => void) {
    this.socket?.on('proposal:status', callback);
  }

  offProposalStatusChange(callback?: (data: any) => void) {
    this.socket?.off('proposal:status', callback);
  }

  // Contract events
  onContractUpdate(callback: (contract: any) => void) {
    this.socket?.on('contract:update', callback);
  }

  offContractUpdate(callback?: (contract: any) => void) {
    this.socket?.off('contract:update', callback);
  }

  onMilestoneUpdate(callback: (milestone: any) => void) {
    this.socket?.on('milestone:update', callback);
  }

  offMilestoneUpdate(callback?: (milestone: any) => void) {
    this.socket?.off('milestone:update', callback);
  }

  // Payment events
  onPaymentUpdate(callback: (payment: any) => void) {
    this.socket?.on('payment:update', callback);
  }

  offPaymentUpdate(callback?: (payment: any) => void) {
    this.socket?.off('payment:update', callback);
  }

  onPaymentStatusChange(callback: (data: any) => void) {
    this.socket?.on('payment:status', callback);
  }

  offPaymentStatusChange(callback?: (data: any) => void) {
    this.socket?.off('payment:status', callback);
  }

  // Generic event listener
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  // Generic event emitter
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  // Remove event listener
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Reconnect manually
  reconnect() {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    } else if (!this.socket) {
      this.connect();
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();
