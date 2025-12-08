import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { onboardingService } from '@/services/api/onboarding.service';

interface OnboardingState {
  status: {
    onboardingCompleted: boolean;
    onboardingStep: number;
    onboardingSkippedAt: string | null;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: OnboardingState = {
  status: null,
  loading: false,
  error: null,
};

export const fetchOnboardingStatus = createAsyncThunk(
  'onboarding/fetchStatus',
  async () => {
    const response = await onboardingService.getOnboardingStatus();
    return response.data;
  }
);

export const updateOnboardingStep = createAsyncThunk(
  'onboarding/updateStep',
  async (step: number) => {
    const response = await onboardingService.updateOnboardingStep(step);
    return response.data;
  }
);

export const completeOnboarding = createAsyncThunk(
  'onboarding/complete',
  async () => {
    const response = await onboardingService.completeOnboarding();
    return response.data;
  }
);

export const skipOnboarding = createAsyncThunk(
  'onboarding/skip',
  async () => {
    const response = await onboardingService.skipOnboarding();
    return response.data;
  }
);

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    resetOnboarding: (state) => {
      state.status = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch status
      .addCase(fetchOnboardingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOnboardingStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
      })
      .addCase(fetchOnboardingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch onboarding status';
      })
      // Update step
      .addCase(updateOnboardingStep.fulfilled, (state, action) => {
        state.status = action.payload;
      })
      // Complete onboarding
      .addCase(completeOnboarding.fulfilled, (state, action) => {
        state.status = action.payload;
      })
      // Skip onboarding
      .addCase(skipOnboarding.fulfilled, (state, action) => {
        state.status = action.payload;
      });
  },
});

export const { resetOnboarding } = onboardingSlice.actions;
export default onboardingSlice.reducer;
