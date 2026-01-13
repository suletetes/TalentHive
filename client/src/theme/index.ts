import { createTheme, PaletteMode } from '@mui/material/styles';

// Define custom color palette
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    primary: {
      main: '#2563eb', // Blue
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed', // Purple
      light: '#8b5cf6',
      dark: '#6d28d9',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981', // Green
      light: '#34d399',
      dark: '#059669',
      ...(mode === 'light'
        ? {
            lighter: 'rgba(16, 185, 129, 0.1)',
          }
        : {
            lighter: 'rgba(16, 185, 129, 0.15)',
          }),
    },
    warning: {
      main: '#f59e0b', // Amber
      light: '#fbbf24',
      dark: '#d97706',
      ...(mode === 'light'
        ? {
            lighter: 'rgba(245, 158, 11, 0.1)',
          }
        : {
            lighter: 'rgba(245, 158, 11, 0.15)',
          }),
    },
    error: {
      main: '#ef4444', // Red
      light: '#f87171',
      dark: '#dc2626',
      ...(mode === 'light'
        ? {
            lighter: 'rgba(239, 68, 68, 0.1)',
          }
        : {
            lighter: 'rgba(239, 68, 68, 0.15)',
          }),
    },
    info: {
      main: '#06b6d4', // Cyan
      light: '#22d3ee',
      dark: '#0891b2',
      ...(mode === 'light'
        ? {
            lighter: 'rgba(6, 182, 212, 0.1)',
          }
        : {
            lighter: 'rgba(6, 182, 212, 0.15)',
          }),
    },
    ...(mode === 'light'
      ? {
          // Light mode
          background: {
            default: '#f9fafb',
            paper: '#ffffff',
          },
          text: {
            primary: '#111827',
            secondary: '#6b7280',
          },
        }
      : {
          // Dark mode
          background: {
            default: '#0f172a',
            paper: '#1e293b',
          },
          text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
          },
        }),
  },
});

export const createAppTheme = (mode: PaletteMode) => {
  // First create a base theme with breakpoints and spacing
  const baseTheme = createTheme({
    ...getDesignTokens(mode),
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    spacing: 8, // Base spacing unit
    shape: {
      borderRadius: 8,
    },
  });

  // Then create the full theme with component overrides
  return createTheme(baseTheme, {
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
        '@media (max-width:899px)': { // md breakpoint down
          fontSize: '2rem',
        },
        '@media (max-width:599px)': { // sm breakpoint down
          fontSize: '1.75rem',
        },
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        '@media (max-width:899px)': { // md breakpoint down
          fontSize: '1.75rem',
        },
        '@media (max-width:599px)': { // sm breakpoint down
          fontSize: '1.5rem',
        },
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
        '@media (max-width:899px)': { // md breakpoint down
          fontSize: '1.5rem',
        },
        '@media (max-width:599px)': { // sm breakpoint down
          fontSize: '1.25rem',
        },
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        '@media (max-width:899px)': { // md breakpoint down
          fontSize: '1.25rem',
        },
        '@media (max-width:599px)': { // sm breakpoint down
          fontSize: '1.125rem',
        },
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
        '@media (max-width:599px)': { // sm breakpoint down
          fontSize: '1.125rem',
        },
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
        '@media (max-width:599px)': { // sm breakpoint down
          fontSize: '1rem',
        },
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        '@media (max-width:599px)': { // sm breakpoint down
          fontSize: '0.875rem',
        },
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
        '@media (max-width:599px)': { // sm breakpoint down
          fontSize: '0.8125rem',
        },
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
        '@media (max-width:599px)': { // sm breakpoint down
          fontSize: '0.8125rem',
        },
      },
    },
    components: {
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingLeft: 16, // 2 * 8px spacing
            paddingRight: 16,
            '@media (min-width:600px)': { // sm breakpoint
              paddingLeft: 24, // 3 * 8px spacing
              paddingRight: 24,
            },
            '@media (min-width:900px)': { // md breakpoint
              paddingLeft: 32, // 4 * 8px spacing
              paddingRight: 32,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
            boxShadow: 'none',
            minHeight: 36,
            '@media (max-width:599px)': { // sm breakpoint down
              padding: '6px 12px',
              fontSize: '0.8125rem',
              minHeight: 32,
            },
            '&:hover': {
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            },
          },
          sizeSmall: {
            padding: '4px 8px',
            fontSize: '0.75rem',
            minHeight: 28,
          },
          sizeLarge: {
            padding: '12px 24px',
            fontSize: '1rem',
            minHeight: 44,
            '@media (max-width:599px)': { // sm breakpoint down
              padding: '10px 20px',
              fontSize: '0.875rem',
              minHeight: 40,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.3)',
            '&:hover': {
              boxShadow: mode === 'light' ? '0 4px 12px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.4)',
            },
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 24, // 3 * 8px spacing
            '@media (max-width:599px)': { // sm breakpoint down
              padding: 16, // 2 * 8px spacing
            },
            '&:last-child': {
              paddingBottom: 24, // 3 * 8px spacing
              '@media (max-width:599px)': { // sm breakpoint down
                paddingBottom: 16, // 2 * 8px spacing
              },
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
            '& .MuiInputBase-input': {
              '@media (max-width:599px)': { // sm breakpoint down
                fontSize: '0.875rem',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            '@media (max-width:599px)': { // sm breakpoint down
              fontSize: '0.75rem',
              height: 24,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.3)',
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: '64px !important',
            '@media (max-width:599px)': { // sm breakpoint down
              minHeight: '56px !important',
              paddingLeft: 16, // 2 * 8px spacing
              paddingRight: 16,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiGrid: {
        styleOverrides: {
          container: {
            '&.MuiGrid-container': {
              '@media (max-width:599px)': { // sm breakpoint down
                margin: -8, // -1 * 8px spacing
                '& > .MuiGrid-item': {
                  padding: 8, // 1 * 8px spacing
                },
              },
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '@media (max-width:599px)': { // sm breakpoint down
              padding: 8, // 1 * 8px spacing
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          gutterBottom: {
            marginBottom: '0.75em',
            '@media (max-width:599px)': { // sm breakpoint down
              marginBottom: '0.5em',
            },
          },
        },
      },
    },
  });
};

// Default light theme for backward compatibility
export const theme = createAppTheme('light');