import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext'; // <-- IMPORT useAuth

export default function Layout() {
    const { currentUser, logout } = useAuth(); // <-- Get currentUser and logout
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login'); // Redirect to login after logout
        } catch (error) {
            console.error("Logout failed in Layout:", error);
            // Handle error, maybe show a notification
        }
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    {/* Updated Typography to be a Link to the home page */}
                    <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
                        Biometric Attendance System
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {currentUser ? (
                            <>
                                <Button color="inherit" component={Link} to="/admin"> Admin </Button>
                                <Button color="inherit" component={Link} to="/kiosk"> Kiosk </Button>
                                <Button color="inherit" onClick={handleLogout}> Logout </Button>
                            </>
                        ) : (
                            <Button color="inherit" component={Link} to="/login"> Login </Button>
                        )}
                        {/* Changed Link destination for Pre-Register */}
                        <Button color="inherit" component={Link} to="/preregister"> Pre-Register </Button>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box sx={{ p: 3 }}>
                <Outlet />
            </Box>
        </>
    );
}