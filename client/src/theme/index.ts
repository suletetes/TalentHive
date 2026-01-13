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
  const theme = createTheme({
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
  });

  return createTheme(theme, {
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
        [theme.breakpoints.down('md')]: {
          fontSize: '2rem',
        },
        [theme.breakpoints.down('sm')]: {
          fontSize: '1.75rem',
        },
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        [theme.breakpoints.down('md')]: {
          fontSize: '1.75rem',
        },
        [theme.breakpoints.down('sm')]: {
          fontSize: '1.5rem',
        },
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
        [theme.breakpoints.down('md')]: {
          fontSize: '1.5rem',
        },
        [theme.breakpoints.down('sm')]: {
          fontSize: '1.25rem',
        },
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        [theme.breakpoints.down('md')]: {
          fontSize: '1.25rem',
        },
        [theme.breakpoints.down('sm')]: {
          fontSize: '1.125rem',
        },
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
        [theme.breakpoints.down('sm')]: {
          fontSize: '1.125rem',
        },
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
        [theme.breakpoints.down('sm')]: {
          fontSize: '1rem',
        },
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        [theme.breakpoints.down('sm')]: {
          fontSize: '0.875rem',
        },
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
        [theme.breakpoints.down('sm')]: {
          fontSize: '0.8125rem',
        },
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
        [theme.breakpoints.down('sm')]: {
          fontSize: '0.8125rem',
        },
      },
    },
    spacing: 8, // Base spacing unit
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingLeft: theme.spacing(2),
            paddingRight: theme.spacing(2),
            [theme.breakpoints.up('sm')]: {
              paddingLeft: theme.spacing(3),
              paddingRight: theme.spacing(3),
            },
            [theme.breakpoints.up('md')]: {
              paddingLeft: theme.spacing(4),
              paddingRight: theme.spacing(4),
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
            [theme.breakpoints.down('sm')]: {
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
            [theme.breakpoints.down('sm')]: {
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
            padding: theme.spacing(3),
            [theme.breakpoints.down('sm')]: {
              padding: theme.spacing(2),
            },
            '&:last-child': {
              paddingBottom: theme.spacing(3),
              [theme.breakpoints.down('sm')]: {
                paddingBottom: theme.spacing(2),
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
              [theme.breakpoints.down('sm')]: {
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
            [theme.breakpoints.down('sm')]: {
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
            [theme.breakpoints.down('sm')]: {
              minHeight: '56px !important',
              paddingLeft: theme.spacing(2),
              paddingRight: theme.spacing(2),
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
              [theme.breakpoints.down('sm')]: {
                margin: theme.spacing(-1),
                '& > .MuiGrid-item': {
                  padding: theme.spacing(1),
                },
              },
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            [theme.breakpoints.down('sm')]: {
              padding: theme.spacing(1),
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          gutterBottom: {
            marginBottom: '0.75em',
            [theme.breakpoints.down('sm')]: {
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