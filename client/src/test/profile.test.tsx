import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { SkillsManager } from '@/components/profile/SkillsManager';
import { FreelancerCard } from '@/components/profile/FreelancerCard';
import authReducer from '@/store/slices/authSlice';
import uiReducer from '@/store/slices/uiSlice';
import userReducer from '@/store/slices/userSlice';

// Mock the API service
vi.mock('@/services/api', () => ({
  apiService: {
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      user: userReducer,
    },
    preloadedState: initialState,
  });
};

const TestWrapper = ({ children, initialState = {} }: any) => {
  const store = createTestStore(initialState);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

const mockFreelancer = {
  _id: '1',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Experienced developer',
    location: 'San Francisco, CA',
    timezone: 'PST',
  },
  freelancerProfile: {
    title: 'Full Stack Developer',
    hourlyRate: 50,
    skills: ['React', 'Node.js', 'TypeScript'],
    availability: {
      status: 'available' as const,
    },
  },
  rating: {
    average: 4.8,
    count: 25,
  },
  isVerified: true,
  role: 'freelancer' as const,
};

describe('Profile Components', () => {
  describe('ProfileHeader', () => {
    it('renders user information correctly', () => {
      render(
        <TestWrapper>
          <ProfileHeader user={mockFreelancer} />
        </TestWrapper>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByText('4.8 (25 reviews)')).toBeInTheDocument();
    });

    it('shows edit button for own profile', () => {
      const mockOnEdit = vi.fn();
      
      render(
        <TestWrapper>
          <ProfileHeader 
            user={mockFreelancer} 
            isOwnProfile={true}
            onEdit={mockOnEdit}
          />
        </TestWrapper>
      );

      const editButton = screen.getByText('Edit Profile');
      expect(editButton).toBeInTheDocument();
      
      fireEvent.click(editButton);
      expect(mockOnEdit).toHaveBeenCalled();
    });

    it('shows profile completeness for own profile', () => {
      render(
        <TestWrapper>
          <ProfileHeader user={mockFreelancer} isOwnProfile={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
    });

    it('displays availability status correctly', () => {
      render(
        <TestWrapper>
          <ProfileHeader user={mockFreelancer} />
        </TestWrapper>
      );

      expect(screen.getByText('Available for work')).toBeInTheDocument();
    });

    it('shows hourly rate for freelancers', () => {
      render(
        <TestWrapper>
          <ProfileHeader user={mockFreelancer} />
        </TestWrapper>
      );

      expect(screen.getByText('$50/hour')).toBeInTheDocument();
      expect(screen.getByText('Starting rate')).toBeInTheDocument();
    });
  });

  describe('SkillsManager', () => {
    const mockSkills = ['React', 'Node.js', 'TypeScript'];
    const mockSkillRates = [
      { skill: 'React', rate: 60 },
      { skill: 'Node.js', rate: 55 },
    ];

    it('displays skills correctly', () => {
      render(
        <TestWrapper>
          <SkillsManager 
            skills={mockSkills}
            skillRates={mockSkillRates}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Skills (3)')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('shows skill rates when available', () => {
      render(
        <TestWrapper>
          <SkillsManager 
            skills={mockSkills}
            skillRates={mockSkillRates}
          />
        </TestWrapper>
      );

      // React should show rate
      expect(screen.getByText(/\$60\/hr/)).toBeInTheDocument();
      // Node.js should show rate
      expect(screen.getByText(/\$55\/hr/)).toBeInTheDocument();
    });

    it('shows add skill button when editable', () => {
      render(
        <TestWrapper>
          <SkillsManager 
            skills={mockSkills}
            skillRates={mockSkillRates}
            isEditable={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Add Skill')).toBeInTheDocument();
    });

    it('opens add skill dialog when button clicked', async () => {
      render(
        <TestWrapper>
          <SkillsManager 
            skills={mockSkills}
            skillRates={mockSkillRates}
            isEditable={true}
          />
        </TestWrapper>
      );

      const addButton = screen.getByText('Add Skill');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Skill')).toBeInTheDocument();
        expect(screen.getByLabelText('Skill Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Hourly Rate (Optional)')).toBeInTheDocument();
      });
    });

    it('shows empty state when no skills', () => {
      render(
        <TestWrapper>
          <SkillsManager 
            skills={[]}
            skillRates={[]}
          />
        </TestWrapper>
      );

      expect(screen.getByText('No skills listed')).toBeInTheDocument();
    });
  });

  describe('FreelancerCard', () => {
    it('renders freelancer information correctly', () => {
      render(
        <TestWrapper>
          <FreelancerCard freelancer={mockFreelancer} />
        </TestWrapper>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByText('$50/hr')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
    });

    it('displays skills with overflow indicator', () => {
      const freelancerWithManySkills = {
        ...mockFreelancer,
        freelancerProfile: {
          ...mockFreelancer.freelancerProfile,
          skills: ['React', 'Node.js', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust'],
        },
      };

      render(
        <TestWrapper>
          <FreelancerCard freelancer={freelancerWithManySkills} />
        </TestWrapper>
      );

      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('shows verified badge for verified freelancers', () => {
      render(
        <TestWrapper>
          <FreelancerCard freelancer={mockFreelancer} />
        </TestWrapper>
      );

      // Check for verified icon (using aria-label attribute)
      const verifiedIcon = screen.getByLabelText('Verified freelancer');
      expect(verifiedIcon).toBeInTheDocument();
    });

    it('shows favorite button when enabled', () => {
      const mockOnFavorite = vi.fn();
      
      render(
        <TestWrapper>
          <FreelancerCard 
            freelancer={mockFreelancer}
            showFavorite={true}
            onFavorite={mockOnFavorite}
          />
        </TestWrapper>
      );

      const favoriteButton = screen.getByTestId('FavoriteBorderIcon').closest('button');
      expect(favoriteButton).toBeInTheDocument();
      
      fireEvent.click(favoriteButton!);
      expect(mockOnFavorite).toHaveBeenCalledWith('1');
    });

    it('displays different availability statuses correctly', () => {
      const busyFreelancer = {
        ...mockFreelancer,
        freelancerProfile: {
          ...mockFreelancer.freelancerProfile,
          availability: { status: 'busy' as const },
        },
      };

      render(
        <TestWrapper>
          <FreelancerCard freelancer={busyFreelancer} />
        </TestWrapper>
      );

      expect(screen.getByText('Busy')).toBeInTheDocument();
    });

    it('has view profile link', () => {
      render(
        <TestWrapper>
          <FreelancerCard freelancer={mockFreelancer} />
        </TestWrapper>
      );

      const viewProfileLink = screen.getByText('View Profile');
      expect(viewProfileLink).toBeInTheDocument();
      expect(viewProfileLink.closest('a')).toHaveAttribute('href', '/freelancers/1');
    });
  });
});