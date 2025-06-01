import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path if needed
import { CircularProgress, Box } from '@mui/material';

export default function ProtectedRoute({ children }) {
    const { currentUser, loadingAuth } = useAuth();
    const location = useLocation();

    if (loadingAuth) {
        // Show a loading indicator while auth state is being determined
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!currentUser) {
        // User not logged in, redirect to login page
        // Pass the current location so we can redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // User is logged in, render the requested component
    // Later, you can add role checks here: e.g., if (currentUser.role !== 'admin') return <Navigate to="/unauthorized" />;
    return children;
}