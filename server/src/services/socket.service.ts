import { Server as SocketIOServer } from 'socket.io';

class SocketService {
  private io: SocketIOServer | null = null;

  setIO(ioInstance: SocketIOServer): void {
    this.io = ioInstance;
  }

  getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.io not initialized');
    }
    return this.io;
  }

  emitToUser(userId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  emitToRoom(room: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }
}

export const socketService = new SocketService();
