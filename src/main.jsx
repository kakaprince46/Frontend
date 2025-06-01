// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider, createTheme } from '@mui/material/styles'; // createTheme is still needed if defined here
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx'; // <-- IMPORTED AuthProvider
import './index.css'; // Import your global styles

// MUI Theme Configuration
// You can keep your theme definition here or move it to a separate theme.js file and import it.
// If theme.js is used as per the update snippet, this definition might be redundant here.
// For clarity, if you have a theme.js, you'd import it: import theme from './theme';
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f5f5f5',
        },
    },
    typography: {
        fontFamily: [
            'Roboto',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
    },
});

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <AuthProvider> {/* <-- AuthProvider WRAPS App */}
                    <App />
                </AuthProvider> {/* <-- AuthProvider WRAPS App */}
            </BrowserRouter>
        </ThemeProvider>
    </React.StrictMode>
);