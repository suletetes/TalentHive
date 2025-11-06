import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  role: 'admin' | 'freelancer' | 'client';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchUserStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchUserSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchUserFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    clearUserData: (state) => {
      state.profile = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,
  updateUserProfile,
  clearUserData,
} = userSlice.actions;

export default userSlice.reducer;