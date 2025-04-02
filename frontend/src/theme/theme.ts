import { createTheme } from '@mui/material/styles';

// Color palette
export const colors = {
  primary: {
    main: '#0419EC', // Primary blue
    light: '#3344FF',
    dark: '#0012B3',
  },
  secondary: {
    main: '#E73B05', // Accent orange
    light: '#FF4F1A',
    dark: '#B32D04',
  },
  background: {
    default: '#F2EFE7', // Light background
    paper: '#FFFFFF',
    dark: '#070A1A', // Dark background
  },
  text: {
    primary: '#120605', // Dark text
    secondary: '#4A4A4A',
    light: '#F2EFE7', // Light text
  },
};

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: '#FFFFFF',
    },
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      color: colors.text.primary,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      color: colors.text.primary,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      color: colors.text.primary,
    },
    body1: {
      fontSize: '1rem',
      color: colors.text.primary,
    },
    body2: {
      fontSize: '0.875rem',
      color: colors.text.secondary,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

export default theme; 