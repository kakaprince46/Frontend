import { useState, useEffect } from 'react';
import { Box, Button, Typography, Card, CardContent, Avatar, Chip, TextField, CircularProgress } from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { checkInUser } from '../services/api'; // Import your API service

export default function KioskPage() {
    const [scanMode, setScanMode] = useState('fallback_id'); // 'fingerprint', 'qr', 'fallback_id', 'phone'
    const [userData, setUserData] = useState(null);
    const [status, setStatus] = useState('ready'); // 'ready', 'scanning', 'found', 'not_found', 'error'
    const [identifierValue, setIdentifierValue] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Placeholder: You'll need to get actual event and session IDs
    // This could come from URL params, a selection screen, or be hardcoded for a specific kiosk.
    const MOCK_EVENT_ID = 1; // Replace with actual event ID logic
    const MOCK_SESSION_ID = 1; // Replace with actual session ID logic
    const MOCK_DEVICE_ID = "Kiosk-001"; // Identifier for this kiosk device

    const resetState = () => {
        setUserData(null);
        setStatus('ready');
        setIdentifierValue('');
        setErrorMessage('');
    };

    const handleIdentifierSubmit = async (event) => {
        if (event) event.preventDefault(); // If using a form
        if (!identifierValue.trim()) {
            setErrorMessage("Please enter an ID or Phone Number.");
            return;
        }

        setStatus('scanning');
        setErrorMessage('');
        setUserData(null);

        const payload = {
            identifier_type: scanMode, // 'fallback_id' or 'phone'
            identifier_value: identifierValue,
            event_id: MOCK_EVENT_ID,
            session_id: MOCK_SESSION_ID,
            device_id: MOCK_DEVICE_ID,
            created_at_local: new Date().toISOString(), // For sync later if needed
            method: scanMode // Method of check-in
        };
        console.log("Kiosk Check-in: Submitting payload:", payload);

        try {
            const response = await checkInUser(payload);
            console.log("Kiosk Check-in: API Response:", response.data);
            if (response.data.status === 'success' && response.data.user) {
                setUserData(response.data.user); // Backend should return user details
                setStatus('found');
            } else if (response.data.status === 'warning' && response.data.message === 'User already checked into this session.') {
                setUserData(response.data.user); // Still show user data for already checked-in
                setStatus('already_checked_in');
                setErrorMessage(response.data.message);
            }
            else {
                // Handle cases where backend indicates success but no user, or other non-error status
                setErrorMessage(response.data.error || "User not found or not registered.");
                setStatus('not_found');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || "Check-in failed.";
            console.error("Kiosk Check-in: API Error:", errorMsg);
            setErrorMessage(errorMsg);
            setStatus('error');
        }
    };

    const handleConfirmCheckIn = async () => {
        // In this flow, check-in is already done by handleIdentifierSubmit
        // This button could be used for a secondary confirmation or just to clear the screen
        alert(`User ${userData?.name || 'User'} already processed. Ready for next scan.`);
        resetState();
    };

    const renderScanInput = () => {
        let label = "Enter Fallback ID";
        if (scanMode === 'phone') label = "Enter Phone Number";
        // Add cases for 'fingerprint' or 'qr' when you implement them
        // For now, 'fingerprint' and 'qr' modes won't show an input, just a message

        if (scanMode === 'fingerprint' || scanMode === 'qr') {
            return (
                <Box sx={{ width: 300, height: 300, border: '4px dashed #ccc', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'white' }}>
                    {scanMode === 'fingerprint' ? <FingerprintIcon sx={{ fontSize: 80, color: '#666' }} /> : <QrCodeScannerIcon sx={{ fontSize: 80, color: '#666' }} />}
                    <Typography sx={{ mt: 2 }}>
                        {scanMode === 'fingerprint' ? "Place Finger on Scanner" : "Scan QR Code"}
                    </Typography>
                    <Typography variant="caption">(UI Placeholder)</Typography>
                </Box>
            );
        }

        return (
            <Box component="form" onSubmit={handleIdentifierSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 400 }}>
                <TextField
                    label={label}
                    variant="outlined"
                    fullWidth
                    value={identifierValue}
                    onChange={(e) => setIdentifierValue(e.target.value)}
                    required
                />
                <Button type="submit" variant="contained" size="large" disabled={status === 'scanning'}>
                    {status === 'scanning' ? <CircularProgress size={24} /> : "Find Attendee"}
                </Button>
            </Box>
        );
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
            <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 2, textAlign: 'center' }}>
                <Typography variant="h5">Event Check-In Kiosk</Typography>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, gap: 2 }}>
                {errorMessage && <Typography color="error" sx={{ mb: 2 }}>{errorMessage}</Typography>}

                {!userData && status !== 'found' && status !== 'already_checked_in' && (
                    <>
                        {renderScanInput()}
                        <Typography>
                            {status === 'ready' ? 'Ready for check-in.' :
                                status === 'scanning' ? 'Processing...' :
                                    status === 'not_found' ? 'Attendee not found or not registered for this event.' :
                                        status === 'error' ? 'An error occurred.' : 'Enter details to proceed.'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Button variant={scanMode === 'fallback_id' ? "contained" : "outlined"} onClick={() => { setScanMode('fallback_id'); resetState(); }}>Use Fallback ID</Button>
                            <Button variant={scanMode === 'phone' ? "contained" : "outlined"} onClick={() => { setScanMode('phone'); resetState(); }}>Use Phone</Button>
                            {/* Placeholder for actual scan buttons */}
                            <Button variant={scanMode === 'fingerprint' ? "contained" : "outlined"} onClick={() => { setScanMode('fingerprint'); resetState(); }} disabled>Fingerprint (UI)</Button>
                            <Button variant={scanMode === 'qr' ? "contained" : "outlined"} onClick={() => { setScanMode('qr'); resetState(); }} disabled>QR Code (UI)</Button>
                        </Box>
                    </>
                )}

                {(userData && (status === 'found' || status === 'already_checked_in')) && (
                    <Card sx={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
                        <CardContent>
                            <Avatar src={userData.photo || "/placeholder-user.jpg"} sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }} />
                            <Typography variant="h5">{userData.name}</Typography>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>{userData.phone}</Typography>
                            <Chip label={userData.event || `Event ID: ${MOCK_EVENT_ID}`} color="primary" sx={{ mb: 1 }} />
                            {status === 'already_checked_in' && <Chip label="Already Checked In" color="warning" sx={{ mb: 2 }} />}
                            {status === 'found' && <Chip label="Check-In Successful!" color="success" sx={{ mb: 2 }} />}


                            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                                <Button variant="outlined" fullWidth onClick={resetState}>
                                    Next Scan
                                </Button>
                                {/* The actual check-in is done when user is found. 
                                    This button might not be needed or could do something else.
                                    For now, it also resets.
                                <Button variant="contained" fullWidth onClick={handleConfirmCheckIn} >
                                    Confirm & Clear
                                </Button> */}
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Box>

            <Box sx={{ bgcolor: '#333', color: 'white', p: 1, textAlign: 'center', fontSize: 12 }}>
                System Version 1.0 | {new Date().toLocaleString()} | Device: {MOCK_DEVICE_ID}
            </Box>
        </Box>
    );
}