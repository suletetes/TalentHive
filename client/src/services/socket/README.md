# Socket.io Real-Time Integration

This directory contains the Socket.io client implementation for real-time communication in the TalentHive application.

## Architecture

The Socket service provides a centralized way to manage WebSocket connections and real-time events across the application.

### Components

1. **SocketService** (`socket.service.ts`)
   - Singleton service managing the Socket.io connection
   - Automatic reconnection with exponential backoff
   - Event listeners for all real-time features
   - Connection status tracking

2. **useSocket Hook** (`../hooks/useSocket.ts`)
   - React hook for managing socket connection lifecycle
   - Automatic connection/disconnection based on auth state
   - Connection status tracking
   - Specialized hooks for different features

## Usage

### Basic Connection

The socket automatically connects when a user is authenticated:

```typescript
import { useSocket } from '@/hooks/useSocket';

function MyComponent() {
  const { isConnected, socketId } = useSocket();

  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
      {socketId && <p>Socket ID: {socketId}</p>}
    </div>
  );
}
```

### Real-Time Messages

```typescript
import { useSocketMessages } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { messageKeys } from '@/hooks/api/useMessages';

function ChatComponent({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const { typingUsers, emitTyping } = useSocketMessages(conversationId);

  // Listen for new messages
  const { socket } = useSocket();
  
  useEffect(() => {
    const handleNewMessage = (message: any) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({ 
        queryKey: messageKeys.conversation(conversationId) 
      });
    };

    socket.onNewMessage(handleNewMessage);

    return () => {
      socket.offNewMessage(handleNewMessage);
    };
  }, [socket, conversationId, queryClient]);

  const handleTyping = () => {
    emitTyping();
  };

  return (
    <div>
      {typingUsers.length > 0 && <p>Someone is typing...</p>}
      <input onChange={handleTyping} />
    </div>
  );
}
```

### Real-Time Notifications

```typescript
import { useSocketNotifications } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from '@/hooks/api/useNotifications';
import { toast } from 'react-hot-toast';

function NotificationListener() {
  const queryClient = useQueryClient();

  useSocketNotifications((notification) => {
    // Show toast notification
    toast.info(notification.message);

    // Invalidate notifications query
    queryClient.invalidateQueries({ 
      queryKey: notificationKeys.list() 
    });
    queryClient.invalidateQueries({ 
      queryKey: notificationKeys.unreadCount() 
    });
  });

  return null;
}
```

### Real-Time Proposals

```typescript
import { useSocketProposals } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { proposalKeys } from '@/hooks/api/useProposals';

function ProposalListener() {
  const queryClient = useQueryClient();

  useSocketProposals((proposal) => {
    // Invalidate proposal queries
    queryClient.invalidateQueries({ 
      queryKey: proposalKeys.detail(proposal._id) 
    });
    queryClient.invalidateQueries({ 
      queryKey: proposalKeys.lists() 
    });
  });

  return null;
}
```

### Real-Time Contracts & Milestones

```typescript
import { useSocketContracts, useSocketMilestones } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { contractKeys } from '@/hooks/api/useContracts';

function ContractListener() {
  const queryClient = useQueryClient();

  useSocketContracts((contract) => {
    queryClient.invalidateQueries({ 
      queryKey: contractKeys.detail(contract._id) 
    });
  });

  useSocketMilestones((milestone) => {
    queryClient.invalidateQueries({ 
      queryKey: contractKeys.detail(milestone.contractId) 
    });
  });

  return null;
}
```

### Real-Time Payments

```typescript
import { useSocketPayments } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { paymentKeys } from '@/hooks/api/usePayments';

function PaymentListener() {
  const queryClient = useQueryClient();

  useSocketPayments((payment) => {
    queryClient.invalidateQueries({ 
      queryKey: paymentKeys.history() 
    });
    queryClient.invalidateQueries({ 
      queryKey: paymentKeys.escrow() 
    });
  });

  return null;
}
```

## Event Types

### Message Events
- `message:new` - New message received
- `message:typing` - User is typing
- `message:send` - Send a message (emit)

### Notification Events
- `notification:new` - New notification received

### Proposal Events
- `proposal:update` - Proposal updated
- `proposal:status` - Proposal status changed

### Contract Events
- `contract:update` - Contract updated
- `milestone:update` - Milestone status changed

### Payment Events
- `payment:update` - Payment updated
- `payment:status` - Payment status changed

## Connection Management

The socket service automatically:
- Connects when user authenticates
- Disconnects when user logs out
- Reconnects on connection loss (up to 5 attempts)
- Tracks connection status
- Handles authentication with JWT tokens

## Configuration

Configure the Socket.io server URL in your `.env` file:

```
VITE_SOCKET_URL=http://localhost:5000
```

For production:

```
VITE_SOCKET_URL=https://api.talenthive.com
```

## Best Practices

1. **Use Hooks**: Always use the provided hooks instead of accessing socketService directly
2. **Clean Up**: Hooks automatically clean up listeners on unmount
3. **Query Invalidation**: Invalidate React Query caches when receiving real-time updates
4. **Toast Notifications**: Show user-friendly notifications for important events
5. **Connection Status**: Display connection status to users when disconnected
6. **Error Handling**: Handle connection errors gracefully

## Troubleshooting

### Socket Not Connecting
- Check if user is authenticated
- Verify VITE_SOCKET_URL is correct
- Check browser console for connection errors
- Ensure backend Socket.io server is running

### Events Not Received
- Verify event names match backend
- Check if listener is properly registered
- Ensure socket is connected before emitting events
- Check backend is emitting events correctly

### Multiple Connections
- The service uses a singleton pattern to prevent multiple connections
- Don't create new SocketService instances
- Use the exported `socketService` instance
