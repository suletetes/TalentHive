import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { socketService } from '@/services/socket/socket.service';

export function useSocket() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();

  useEffect(() => {
    if (isAuthenticated) {
      // Connect socket when user is authenticated
      socketService.connect();

      // Set up connection status tracking
      const checkConnection = () => {
        setIsConnected(socketService.isConnected());
        setSocketId(socketService.getSocketId());
      };

      // Check immediately
      checkConnection();

      // Set up interval to check connection status
      const interval = setInterval(checkConnection, 1000);

      return () => {
        clearInterval(interval);
        // Don't disconnect on unmount, keep connection alive
      };
    } else {
      // Disconnect when user logs out
      socketService.disconnect();
      setIsConnected(false);
      setSocketId(undefined);
    }
  }, [isAuthenticated]);

  return {
    isConnected,
    socketId,
    socket: socketService,
  };
}

// Hook for message events
export function useSocketMessages(conversationId?: string) {
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!isConnected || !conversationId) return;

    const handleTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });

        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
        }, 3000);
      }
    };

    socket.onTyping(handleTyping);

    return () => {
      socket.offTyping(handleTyping);
    };
  }, [socket, isConnected, conversationId]);

  const emitTyping = () => {
    if (conversationId) {
      socket.emitTyping(conversationId);
    }
  };

  return {
    typingUsers,
    emitTyping,
  };
}

// Hook for notifications
export function useSocketNotifications(onNotification?: (notification: any) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onNotification) return;

    socket.onNotification(onNotification);

    return () => {
      socket.offNotification(onNotification);
    };
  }, [socket, isConnected, onNotification]);
}

// Hook for proposal updates
export function useSocketProposals(onUpdate?: (proposal: any) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onUpdate) return;

    socket.onProposalUpdate(onUpdate);

    return () => {
      socket.offProposalUpdate(onUpdate);
    };
  }, [socket, isConnected, onUpdate]);
}

// Hook for contract updates
export function useSocketContracts(onUpdate?: (contract: any) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onUpdate) return;

    socket.onContractUpdate(onUpdate);

    return () => {
      socket.offContractUpdate(onUpdate);
    };
  }, [socket, isConnected, onUpdate]);
}

// Hook for milestone updates
export function useSocketMilestones(onUpdate?: (milestone: any) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onUpdate) return;

    socket.onMilestoneUpdate(onUpdate);

    return () => {
      socket.offMilestoneUpdate(onUpdate);
    };
  }, [socket, isConnected, onUpdate]);
}

// Hook for payment updates
export function useSocketPayments(onUpdate?: (payment: any) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onUpdate) return;

    socket.onPaymentUpdate(onUpdate);

    return () => {
      socket.offPaymentUpdate(onUpdate);
    };
  }, [socket, isConnected, onUpdate]);
}
