import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';

import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { ProjectForm } from '@/components/projects/ProjectForm';
import authReducer from '@/store/slices/authSlice';
import uiReducer from '@/store/slices/uiSlice';
import userReducer from '@/store/slices/userSlice';

// Mock the API service
vi.mock('@/services/api', () => ({
  apiService: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
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

const mockProject = {
  _id: '1',
  title: 'E-commerce Website Development',
  description: 'Looking for a skilled developer to build a modern e-commerce platform with React and Node.js.',
  category: 'Web Development',
  skills: ['React', 'Node.js', 'MongoDB'],
  budget: {
    type: 'fixed' as const,
    min: 2000,
    max: 5000,
  },
  timeline: {
    duration: 2,
    unit: 'months' as const,
  },
  client: {
    _id: 'client1',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'https://example.com/avatar.jpg',
    },
    rating: {
      average: 4.5,
      count: 10,
    },
    clientProfile: {
      companyName: 'TechCorp Inc.',
    },
  },
  proposalCount: 5,
  viewCount: 25,
  isUrgent: false,
  isFeatured: true,
  createdAt: '2024-01-15T10:00:00Z',
  applicationDeadline: '2024-02-15T23:59:59Z',
};

describe('Project Components', () => {
  describe('ProjectCard', () => {
    it('renders project information correctly', () => {
      render(
        <TestWrapper>
          <ProjectCard project={mockProject} />
        </TestWrapper>
      );

      expect(screen.getByText('E-commerce Website Development')).toBeInTheDocument();
      expect(screen.getByText('Web Development')).toBeInTheDocument();
      expect(screen.getByText('TechCorp Inc.')).toBeInTheDocument();
      expect(screen.getByText('$2000 - $5000')).toBeInTheDocument();
      expect(screen.getByText('2 months')).toBeInTheDocument();
    });

    it('displays featured badge for featured projects', () => {
      render(
        <TestWrapper>
          <ProjectCard project={mockProject} />
        </TestWrapper>
      );

      expect(screen.getByText('FEATURED')).toBeInTheDocument();
    });

    it('shows urgent flag for urgent projects', async () => {
      const urgentProject = { ...mockProject, isUrgent: true };
      
      render(
        <TestWrapper>
          <ProjectCard project={urgentProject} />
        </TestWrapper>
      );

      // Check for urgent flag icon (using title attribute)
      await waitFor(() => {
        const urgentIcon = screen.getByTitle('Urgent project');
        expect(urgentIcon).toBeInTheDocument();
      });
    });

    it('displays skills with overflow indicator', () => {
      render(
        <TestWrapper>
          <ProjectCard project={mockProject} />
        </TestWrapper>
      );

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('MongoDB')).toBeInTheDocument();
    });

    it('shows bookmark button when enabled', () => {
      const mockOnBookmark = vi.fn();
      
      render(
        <TestWrapper>
          <ProjectCard 
            project={mockProject}
            showBookmark={true}
            onBookmark={mockOnBookmark}
          />
        </TestWrapper>
      );

      const bookmarkButton = screen.getByRole('button');
      expect(bookmarkButton).toBeInTheDocument();
      
      fireEvent.click(bookmarkButton);
      expect(mockOnBookmark).toHaveBeenCalledWith('1');
    });

    it('displays project stats correctly', () => {
      render(
        <TestWrapper>
          <ProjectCard project={mockProject} />
        </TestWrapper>
      );

      expect(screen.getByText('5 proposals')).toBeInTheDocument();
      expect(screen.getByText('25 views')).toBeInTheDocument();
    });

    it('shows application deadline', () => {
      render(
        <TestWrapper>
          <ProjectCard project={mockProject} />
        </TestWrapper>
      );

      expect(screen.getByText(/Deadline:/)).toBeInTheDocument();
    });

    it('has view details link', () => {
      render(
        <TestWrapper>
          <ProjectCard project={mockProject} />
        </TestWrapper>
      );

      const viewDetailsLink = screen.getByText('View Details');
      expect(viewDetailsLink).toBeInTheDocument();
      expect(viewDetailsLink.closest('a')).toHaveAttribute('href', '/projects/1');
    });
  });

  describe('ProjectFilters', () => {
    const mockFilters = {
      search: '',
      category: '',
      skills: [],
      budgetType: '',
      budgetRange: [0, 10000] as [number, number],
      timeline: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      featured: false,
      urgent: false,
    };

    const mockOnFiltersChange = vi.fn();
    const mockOnClearFilters = vi.fn();

    it('renders search input', () => {
      render(
        <TestWrapper>
          <ProjectFilters
            filters={mockFilters}
            onFiltersChange={mockOnFiltersChange}
            onClearFilters={mockOnClearFilters}
          />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
    });

    it('renders quick filter buttons', () => {
      render(
        <TestWrapper>
          <ProjectFilters
            filters={mockFilters}
            onFiltersChange={mockOnFiltersChange}
            onClearFilters={mockOnClearFilters}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Featured')).toBeInTheDocument();
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });

    it('calls onFiltersChange when search input changes', () => {
      render(
        <TestWrapper>
          <ProjectFilters
            filters={mockFilters}
            onFiltersChange={mockOnFiltersChange}
            onClearFilters={mockOnClearFilters}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'React' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        search: 'React',
      });
    });

    it('toggles featured filter when button clicked', () => {
      render(
        <TestWrapper>
          <ProjectFilters
            filters={mockFilters}
            onFiltersChange={mockOnFiltersChange}
            onClearFilters={mockOnClearFilters}
          />
        </TestWrapper>
      );

      const featuredButton = screen.getByText('Featured');
      fireEvent.click(featuredButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        featured: true,
      });
    });

    it('expands advanced filters when button clicked', async () => {
      render(
        <TestWrapper>
          <ProjectFilters
            filters={mockFilters}
            onFiltersChange={mockOnFiltersChange}
            onClearFilters={mockOnClearFilters}
          />
        </TestWrapper>
      );

      const advancedFiltersButton = screen.getByText('Advanced Filters');
      fireEvent.click(advancedFiltersButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Category')).toBeInTheDocument();
        expect(screen.getByLabelText('Budget Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Timeline')).toBeInTheDocument();
      });
    });

    it('shows clear all button when filters are active', () => {
      const activeFilters = { ...mockFilters, category: 'Web Development' };
      
      render(
        <TestWrapper>
          <ProjectFilters
            filters={activeFilters}
            onFiltersChange={mockOnFiltersChange}
            onClearFilters={mockOnClearFilters}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('calls onClearFilters when clear all button clicked', () => {
      const activeFilters = { ...mockFilters, category: 'Web Development' };
      
      render(
        <TestWrapper>
          <ProjectFilters
            filters={activeFilters}
            onFiltersChange={mockOnFiltersChange}
            onClearFilters={mockOnClearFilters}
          />
        </TestWrapper>
      );

      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);

      expect(mockOnClearFilters).toHaveBeenCalled();
    });
  });

  describe('ProjectForm', () => {
    it('renders basic information step initially', () => {
      render(
        <TestWrapper>
          <ProjectForm />
        </TestWrapper>
      );

      expect(screen.getByText('Create New Project')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByLabelText('Project Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Project Description')).toBeInTheDocument();
    });

    it('shows validation errors for empty required fields', async () => {
      render(
        <TestWrapper>
          <ProjectForm />
        </TestWrapper>
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled(); // Should be disabled when form is invalid
    });

    it('enables next button when basic info is valid', async () => {
      render(
        <TestWrapper>
          <ProjectForm />
        </TestWrapper>
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Project Title'), {
        target: { value: 'Test Project' },
      });
      
      fireEvent.change(screen.getByLabelText('Project Description'), {
        target: { value: 'This is a test project description that is long enough.' },
      });

      // Select category
      const categorySelect = screen.getByLabelText('Category');
      fireEvent.mouseDown(categorySelect);
      
      await waitFor(() => {
        const webDevOption = screen.getByText('Web Development');
        fireEvent.click(webDevOption);
      });

      // The next button should become enabled after filling required fields
      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('navigates through form steps', async () => {
      render(
        <TestWrapper>
          <ProjectForm />
        </TestWrapper>
      );

      // Fill basic info and go to next step
      fireEvent.change(screen.getByLabelText('Project Title'), {
        target: { value: 'Test Project' },
      });
      
      fireEvent.change(screen.getByLabelText('Project Description'), {
        target: { value: 'This is a test project description that is long enough.' },
      });

      // Navigate to budget step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Budget & Timeline')).toBeInTheDocument();
      });
    });
  });
});