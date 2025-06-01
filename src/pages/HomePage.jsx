import { Box, Typography, Button, Container, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { People, Fingerprint, QrCodeScanner, Dashboard } from '@mui/icons-material';

export default function HomePage() {
    const theme = useTheme();
    const navigate = useNavigate();

    const features = [
        {
            icon: <Fingerprint fontSize="large" />,
            title: "Fingerprint Scanning",
            description: "Secure biometric check-in using fingerprint technology"
        },
        {
            icon: <QrCodeScanner fontSize="large" />,
            title: "QR Code Support",
            description: "Alternative check-in method using QR codes"
        },
        {
            icon: <Dashboard fontSize="large" />,
            title: "Real-time Dashboard",
            description: "Live attendance tracking and analytics"
        },
        {
            icon: <People fontSize="large" />,
            title: "User Management",
            description: "Comprehensive attendee registration system"
        }
    ];

    return (
        <Container maxWidth="lg">
            <Box sx={{
                textAlign: 'center',
                my: 8
            }}>
                <Typography
                    variant="h2"
                    component="h1"
                    sx={{
                        fontWeight: 700,
                        mb: 2,
                        color: theme.palette.primary.main
                    }}
                >
                    Biometric Attendance System
                </Typography>

                <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
                    Modern solution for event attendance tracking and management
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 8 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/kiosk')}
                    >
                        Kiosk Mode
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/admin')}
                    >
                        Admin Dashboard
                    </Button>
                </Box>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                    gap: 4,
                    mt: 8
                }}>
                    {features.map((feature, index) => (
                        <Box
                            key={index}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                boxShadow: 1,
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: 3
                                }
                            }}
                        >
                            <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                                {feature.icon}
                            </Box>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                {feature.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {feature.description}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Container>
    );
}