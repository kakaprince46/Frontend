import React, { useState, useEffect } from 'react'; // <--- CORRECTED IMPORT
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, CircularProgress } from '@mui/material';
import { signInWithEmailAndPassword, auth } from '../services/firebaseService'; // Or your firebase.js path
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();

    // Redirect if user is already logged in
    useEffect(() => { // This line (or around here) was causing the error
        if (currentUser) {
            const from = location.state?.from?.pathname || "/admin"; // Default redirect to admin after login
            console.log("LoginPage: User already logged in, redirecting to:", from);
            navigate(from, { replace: true });
        }
    }, [currentUser, navigate, location.state]);


    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            console.log("LoginPage: Attempting sign-in with email:", email);
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged in AuthContext will handle setting currentUser
            // The useEffect above will handle redirection.
            // Or you can explicitly navigate here too if preferred after successful login:
            // const from = location.state?.from?.pathname || "/admin";
            // navigate(from, { replace: true });
            console.log("LoginPage: Sign-in successful via submit.");
        } catch (err) {
            console.error("LoginPage: Login failed:", err);
            let errorMessage = "Failed to log in. Please check your credentials.";
            if (err.code) { // Firebase auth errors have a 'code' property
                switch (err.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        errorMessage = "Invalid email or password.";
                        break;
                    case 'auth/invalid-email':
                        errorMessage = "Please enter a valid email address.";
                        break;
                    default:
                        errorMessage = err.message;
                }
            }
            setError(errorMessage);
        }
        setLoading(false);
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)', p: 2 }}> {/* Adjust minHeight if your AppBar height is different */}
            <Paper component="form" onSubmit={handleSubmit} sx={{ padding: { xs: 2, sm: 3, md: 4 }, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h5" component="h1" sx={{ textAlign: 'center', mb: 2 }}>
                    Admin/Kiosk Login
                </Typography>
                <TextField
                    label="Email"
                    type="email"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                />
                <TextField
                    label="Password"
                    type="password"
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth
                />
                {error && <Typography color="error" sx={{ mt: 1, textAlign: 'center' }}>{error}</Typography>}
                <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ mt: 2, py: 1.5 }}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
                </Button>
            </Paper>
        </Box>
    );
}