---
inclusion: always
---

# TalentHive Design System Rules

This document defines the design system structure and integration patterns for TalentHive's Figma-to-code workflow.

## Design System Structure

### Token Definitions

**Location**: `client/src/theme/index.ts`

**Color Palette**:
```typescript
// Primary colors
primary: { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8' }
secondary: { main: '#7c3aed', light: '#8b5cf6', dark: '#6d28d9' }
success: { main: '#10b981', light: '#34d399', dark: '#059669' }
warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' }
error: { main: '#ef4444', light: '#f87171', dark: '#dc2626' }
info: { main: '#06b6d4', light: '#22d3ee', dark: '#0891b2' }
```

**Typography Scale**:
```typescript
h1: { fontSize: '2.5rem', fontWeight: 600, lineHeight: 1.2 }
h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.3 }
h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 }
h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 }
h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 }
h6: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 }
body1: { fontSize: '1rem', lineHeight: 1.6 }
body2: { fontSize: '0.875rem', lineHeight: 1.6 }
```

**Spacing & Shape**:
- Border radius: `8px` (buttons, inputs), `12px` (cards), `6px` (chips)
- Button padding: `8px 16px`
- Font family: `"Roboto", "Helvetica", "Arial", sans-serif`

**Breakpoints**:
```typescript
xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536
```

### Component Library

**Location**: `client/src/components/`

**Organization**:
- `ui/` - Generic reusable components (buttons, inputs, cards, loaders)
- `auth/` - Authentication components
- `contracts/` - Contract and milestone management
- `layout/` - Header, footer, navigation
- `profile/` - User profile components
- `projects/` - Project creation and management
- `proposals/` - Proposal submission and review
- `payments/` - Payment and escrow components
- `messaging/` - Real-time chat components
- `notifications/` - Notification system
- `organizations/` - Team management
- `admin/` - Admin dashboard components
- `analytics/` - Charts and data visualization

**Key Reusable Components**:
```typescript
// From client/src/components/ui/
LoadingSpinner, LoadingButton, PageLoader, SkeletonLoader
ConfirmationDialog, ErrorState, EmptyState
FormTextField, FormSection, FormAlert
DataTable, Pagination, CardList
ThemeToggle, Toast, ToastProvider
```

### Frameworks & Libraries

**UI Framework**: React 18 with TypeScript
**Styling**: Material-UI (MUI) v5 with Emotion
**Build Tool**: Vite
**State Management**: Redux Toolkit + Redux Persist
**Server State**: TanStack Query (React Query)
**Forms**: Formik + Yup validation
**Routing**: React Router v6

### Asset Management

**Images & Media**:
- Stored in: `client/src/assets/` and `client/public/`
- User uploads: Cloudinary integration (server-side)
- Referenced via: Import statements or public URL paths

**Optimization**:
- Vite handles asset bundling and optimization
- Code splitting configured for vendor, MUI, router, and Redux chunks

### Icon System

**Library**: `@mui/icons-material`

**Usage Pattern**:
```typescript
import { IconName } from '@mui/icons-material';

// Example
import { Dashboard, Person, Work } from '@mui/icons-material';
```

**Common Icons**:
- Navigation: Dashboard, Person, Work, Message, Notifications
- Actions: Add, Edit, Delete, Save, Cancel, Search
- Status: CheckCircle, Error, Warning, Info

### Styling Approach

**Method**: Material-UI's `sx` prop with theme tokens

**Pattern**:
```typescript
<Box sx={{ 
  p: 2,                    // padding: theme.spacing(2)
  bgcolor: 'background.paper',
  borderRadius: 2,         // 8px * 2 = 16px
  boxShadow: 1
}}>
```

**Global Styles**: CssBaseline from MUI (applied in `main.tsx`)

**Theme Mode**: Light/dark mode support via Redux state (`state.ui.theme`)

**Responsive Design**:
```typescript
sx={{
  display: { xs: 'block', md: 'flex' },
  width: { xs: '100%', sm: '50%', md: '33%' }
}}
```

### Project Structure

**Path Aliases** (defined in `tsconfig.json` and `vite.config.ts`):
```typescript
@/* → src/*
@/components/* → src/components/*
@/pages/* → src/pages/*
@/hooks/* → src/hooks/*
@/store/* → src/store/*
@/services/* → src/services/*
@/utils/* → src/utils/*
@/theme/* → src/theme/*
```

**Component File Structure**:
```
ComponentName.tsx       // Main component file
```

**Naming Conventions**:
- Components: PascalCase (e.g., `ProjectCard.tsx`)
- Hooks: camelCase with "use" prefix (e.g., `useAuth.ts`)
- Utilities: camelCase (e.g., `formatDate.ts`)

## Figma Integration Guidelines

### Converting Figma Designs to Code

1. **Use Material-UI Components**: Replace Tailwind/generic divs with MUI components
   ```typescript
   // ❌ Avoid
   <div className="bg-blue-500 p-4 rounded">
   
   // ✅ Prefer
   <Box sx={{ bgcolor: 'primary.main', p: 2, borderRadius: 2 }}>
   ```

2. **Apply Theme Tokens**: Use theme values instead of hardcoded colors
   ```typescript
   // ❌ Avoid
   sx={{ color: '#2563eb' }}
   
   // ✅ Prefer
   sx={{ color: 'primary.main' }}
   ```

3. **Reuse Existing Components**: Check `client/src/components/ui/` before creating new ones
   - Buttons → Use MUI `Button` or `LoadingButton`
   - Inputs → Use `FormTextField` or MUI `TextField`
   - Cards → Use MUI `Card` with custom styling
   - Loaders → Use `LoadingSpinner`, `PageLoader`, or `SkeletonLoader`

4. **Typography**: Use MUI Typography component
   ```typescript
   <Typography variant="h4" color="text.primary">
     Title
   </Typography>
   ```

5. **Spacing**: Use theme spacing units (multiples of 8px)
   ```typescript
   sx={{ mt: 2, mb: 3, px: 4 }}  // 16px, 24px, 32px
   ```

6. **Icons**: Import from `@mui/icons-material`
   ```typescript
   import { Add, Edit, Delete } from '@mui/icons-material';
   ```

7. **Responsive Design**: Use breakpoint-based values
   ```typescript
   sx={{
     flexDirection: { xs: 'column', md: 'row' },
     gap: { xs: 2, md: 4 }
   }}
   ```

### Component Integration Checklist

When implementing a Figma design:

- [ ] Use MUI components as base (Button, Card, TextField, etc.)
- [ ] Apply theme colors via `sx` prop (primary.main, secondary.main, etc.)
- [ ] Use theme typography variants (h1-h6, body1, body2)
- [ ] Apply consistent spacing (theme.spacing units)
- [ ] Use theme border radius (8px, 12px)
- [ ] Import icons from `@mui/icons-material`
- [ ] Implement responsive breakpoints (xs, sm, md, lg, xl)
- [ ] Support light/dark mode via theme tokens
- [ ] Follow naming conventions (PascalCase for components)
- [ ] Place in appropriate directory (ui/, feature-specific/)
- [ ] Use path aliases (@/components, @/utils, etc.)

### State Management Patterns

**Local State**: `useState` for component-specific state
**Form State**: Formik + Yup for forms
**Global State**: Redux Toolkit slices in `client/src/store/slices/`
**Server State**: TanStack Query for API data fetching

### Common Patterns

**Loading States**:
```typescript
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

{isLoading && <LoadingSpinner />}
```

**Error Handling**:
```typescript
import { ErrorState } from '@/components/ui/ErrorState';

{error && <ErrorState message={error.message} />}
```

**Empty States**:
```typescript
import { EmptyState } from '@/components/ui/EmptyState';

{items.length === 0 && <EmptyState message="No items found" />}
```

**Confirmation Dialogs**:
```typescript
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
```

**Toast Notifications**:
```typescript
import toast from 'react-hot-toast';

toast.success('Action completed');
toast.error('Something went wrong');
```

## Design-Code Consistency Rules

1. **Visual Parity**: Strive for 1:1 match with Figma designs
2. **Token Priority**: Always use theme tokens over hardcoded values
3. **Component Reuse**: Check existing components before creating new ones
4. **Responsive First**: Implement mobile-first responsive designs
5. **Accessibility**: Use semantic HTML and ARIA labels
6. **Performance**: Lazy load routes and heavy components
7. **Type Safety**: Use TypeScript interfaces for all props
8. **Testing**: Write tests for new components (Vitest + Testing Library)

## File Organization Example

```typescript
// client/src/components/projects/ProjectCard.tsx
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { Work } from '@mui/icons-material';
import { IProject } from '@/types/project';

interface ProjectCardProps {
  project: IProject;
  onView: (id: string) => void;
}

export const ProjectCard = ({ project, onView }: ProjectCardProps) => {
  return (
    <Card sx={{ borderRadius: 3, '&:hover': { boxShadow: 3 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Work sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">{project.title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {project.description}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => onView(project._id)}
          sx={{ textTransform: 'none' }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};
```
