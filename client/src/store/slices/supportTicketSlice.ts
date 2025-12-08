import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  supportTicketService,
  SupportTicket,
  CreateTicketData,
  AddMessageData,
  UpdateStatusData,
  AssignTicketData,
  UpdateTagsData,
  TicketStats,
} from '@/services/api/supportTicket.service';

interface SupportTicketState {
  tickets: SupportTicket[];
  currentTicket: SupportTicket | null;
  stats: TicketStats | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
}

const initialState: SupportTicketState = {
  tickets: [],
  currentTicket: null,
  stats: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pages: 1,
    total: 0,
  },
};

// Async thunks
export const createTicket = createAsyncThunk(
  'supportTicket/create',
  async (data: CreateTicketData, { rejectWithValue }) => {
    try {
      const ticket = await supportTicketService.createTicket(data);
      return ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create ticket');
    }
  }
);

export const fetchTickets = createAsyncThunk(
  'supportTicket/fetchAll',
  async (
    params: {
      status?: string;
      priority?: string;
      category?: string;
      page?: number;
      limit?: number;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await supportTicketService.getTickets(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets');
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'supportTicket/fetchById',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const ticket = await supportTicketService.getTicketById(ticketId);
      return ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ticket');
    }
  }
);

export const addMessage = createAsyncThunk(
  'supportTicket/addMessage',
  async ({ ticketId, data }: { ticketId: string; data: AddMessageData }, { rejectWithValue }) => {
    try {
      const ticket = await supportTicketService.addMessage(ticketId, data);
      return ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add message');
    }
  }
);

export const updateTicketStatus = createAsyncThunk(
  'supportTicket/updateStatus',
  async ({ ticketId, data }: { ticketId: string; data: UpdateStatusData }, { rejectWithValue }) => {
    try {
      const ticket = await supportTicketService.updateStatus(ticketId, data);
      return ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

export const assignTicket = createAsyncThunk(
  'supportTicket/assign',
  async ({ ticketId, data }: { ticketId: string; data: AssignTicketData }, { rejectWithValue }) => {
    try {
      const ticket = await supportTicketService.assignTicket(ticketId, data);
      return ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign ticket');
    }
  }
);

export const updateTicketTags = createAsyncThunk(
  'supportTicket/updateTags',
  async ({ ticketId, data }: { ticketId: string; data: UpdateTagsData }, { rejectWithValue }) => {
    try {
      const ticket = await supportTicketService.updateTags(ticketId, data);
      return ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tags');
    }
  }
);

export const fetchTicketStats = createAsyncThunk(
  'supportTicket/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await supportTicketService.getTicketStats();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

// Slice
const supportTicketSlice = createSlice({
  name: 'supportTicket',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
  },
  extraReducers: (builder) => {
    // Create ticket
    builder
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action: PayloadAction<SupportTicket>) => {
        state.loading = false;
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch tickets
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTickets.fulfilled,
        (
          state,
          action: PayloadAction<{
            tickets: SupportTicket[];
            total: number;
            page: number;
            pages: number;
          }>
        ) => {
          state.loading = false;
          state.tickets = action.payload.tickets;
          state.pagination = {
            page: action.payload.page,
            pages: action.payload.pages,
            total: action.payload.total,
          };
        }
      )
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch ticket by ID
    builder
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action: PayloadAction<SupportTicket>) => {
        state.loading = false;
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add message
    builder
      .addCase(addMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMessage.fulfilled, (state, action: PayloadAction<SupportTicket>) => {
        state.loading = false;
        state.currentTicket = action.payload;
        // Update in tickets list if present
        const index = state.tickets.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      .addCase(addMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update status
    builder
      .addCase(updateTicketStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicketStatus.fulfilled, (state, action: PayloadAction<SupportTicket>) => {
        state.loading = false;
        state.currentTicket = action.payload;
        // Update in tickets list
        const index = state.tickets.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      .addCase(updateTicketStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Assign ticket
    builder
      .addCase(assignTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignTicket.fulfilled, (state, action: PayloadAction<SupportTicket>) => {
        state.loading = false;
        state.currentTicket = action.payload;
        // Update in tickets list
        const index = state.tickets.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      .addCase(assignTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update tags
    builder
      .addCase(updateTicketTags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicketTags.fulfilled, (state, action: PayloadAction<SupportTicket>) => {
        state.loading = false;
        state.currentTicket = action.payload;
        // Update in tickets list
        const index = state.tickets.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      .addCase(updateTicketTags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch stats
    builder
      .addCase(fetchTicketStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketStats.fulfilled, (state, action: PayloadAction<TicketStats>) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchTicketStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentTicket } = supportTicketSlice.actions;
export default supportTicketSlice.reducer;
