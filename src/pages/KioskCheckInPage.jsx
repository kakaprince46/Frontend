import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Card, CardContent, Avatar, Chip, TextField, CircularProgress, FormControl, InputLabel, Select, MenuItem, Paper } from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { getEvents, getSessionsForEvent, checkInUser } from '../services/api';

export default function KioskPage() {
    // Kiosk configuration state
    const [isKioskConfigured, setIsKioskConfigured] = useState(false);
    const [events, setEvents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [loadingConfig, setLoadingConfig] = useState(true);

    // Check-in process state
    const [scanMode, setScanMode] = useState('fallback_id');
    const [userData, setUserData] = useState(null);
    const [status, setStatus] = useState('ready'); // 'ready', 'scanning', 'found', 'not_found', 'error', 'warning'
    const [identifierValue, setIdentifierValue] = useState('');
    const [message, setMessage] = useState('');
    
    const MOCK_DEVICE_ID = "Kiosk-001";

    // Fetch all events for the setup dropdown
    useEffect(() => {
        const fetchEvents = async () => {
            setLoadingConfig(true);
            try {
                const response = await getEvents();
                setEvents(response.data || []);
            } catch (err) {
                console.error("Kiosk: Failed to fetch events", err);
                setMessage("Error: Could not load events for selection.");
            }
            setLoadingConfig(false);
        };
        fetchEvents();
    }, []);

    // Fetch sessions when an event is selected
    useEffect(() => {
        if (!selectedEventId) {
            setSessions([]);
            setSelectedSessionId('');
            return;
        }
        const fetchSessions = async () => {
            setMessage('Loading sessions...');
            try {
                const response = await getSessionsForEvent(selectedEventId);
                setSessions(response.data || []);
                setMessage('');
            } catch (err) {
                console.error("Kiosk: Failed to fetch sessions", err);
                setMessage("Error: Could not load sessions for the selected event.");
                setSessions([]);
            }
        };
        fetchSessions();
    }, [selectedEventId]);

    const resetForNextScan = () => {
        setUserData(null);
        setStatus('ready');
        setIdentifierValue('');
        setMessage('');
    };

    const handleIdentifierSubmit = async (event) => {
        if (event) event.preventDefault();
        if (!identifierValue.trim()) {
            setMessage("Please enter an ID or Phone Number.");
            return;
        }
        
        setStatus('scanning');
        setMessage(`Searching for user with ${scanMode}...`);

        const payload = {
            identifier_type: scanMode,
            identifier_value: identifierValue,
            event_id: selectedEventId,
            session_id: selectedSessionId,
            device_id: MOCK_DEVICE_ID,
            method: scanMode
        };

        try {
            const response = await checkInUser(payload);
            if (response.data.status === 'success') {
                setUserData(response.data.user);
                setStatus('found');
                setMessage(response.data.message || 'Check-in Successful!');
            } else if (response.data.status === 'warning') { // For already checked-in
                setUserData(response.data.user);
                setStatus('warning');
                setMessage(response.data.message);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || "Check-in failed.";
            console.error("Kiosk Check-in: API Error:", errorMsg);
            setMessage(errorMsg);
            setStatus('not_found');
        }
    };
    
    // --- Render Logic ---
    if (!isKioskConfigured) {
        return ( // Kiosk Configuration View
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f5f5f5' }}>
                <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3, width: '100%', maxWidth: 500 }}>
                    <Typography variant="h4" component="h1" textAlign="center">Kiosk Setup</Typography>
                    <FormControl fullWidth required>
                        <InputLabel id="event-select-label">Select Event</InputLabel>
                        <Select
                            labelId="event-select-label"
                            value={selectedEventId}
                            label="Select Event"
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            disabled={loadingConfig}
                        >
                            {loadingConfig ? <MenuItem value=""><em>Loading...</em></MenuItem> :
                            events.map((event) => (
                                <MenuItem key={event.id} value={event.id}>{event.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth required disabled={!selectedEventId || sessions.length === 0}>
                        <InputLabel id="session-select-label">Select Session</InputLabel>
                        <Select
                            labelId="session-select-label"
                            value={selectedSessionId}
                            label="Select Session"
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                        >
                            {sessions.map((session) => (
                                <MenuItem key={session.id} value={session.id}>{session.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => { setIsKioskConfigured(true); setStatus('ready'); }}
                        disabled={!selectedEventId || !selectedSessionId}
                    >
                        Start Check-in Session
                    </Button>
                    {message && <Typography color="error" textAlign="center">{message}</Typography>}
                </Paper>
            </Box>
        );
    }

    return ( // Kiosk Check-in View
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
            <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Event Check-In Kiosk</Typography>
                <Button size="small" variant="contained" color="secondary" onClick={() => setIsKioskConfigured(false)}>Change Session</Button>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, gap: 2 }}>
                {message && <Typography color={status === 'found' ? 'green' : (status === 'warning' ? 'orange' : 'error')} variant="h6" sx={{ mb: 2, textAlign: 'center' }}>{message}</Typography>}

                {!userData ? (
                    <>
                        <Box component="form" onSubmit={handleIdentifierSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 400 }}>
                            <TextField
                                label={`Enter ${scanMode === 'phone' ? 'Phone Number' : 'Fallback ID'}`}
                                variant="outlined"
                                fullWidth
                                value={identifierValue}
                                onChange={(e) => setIdentifierValue(e.target.value)}
                                required
                                autoFocus
                            />
                            <Button type="submit" variant="contained" size="large" disabled={status === 'scanning'}>
                                {status === 'scanning' ? <CircularProgress size={24} /> : "Find Attendee"}
                            </Button>
                        </Box>
                        <Box sx={{display: 'flex', gap: 1, mt: 1}}>
                            <Button variant={scanMode === 'fallback_id' ? "contained" : "outlined"} onClick={() => { setScanMode('fallback_id'); resetForNextScan(); }}>Use Fallback ID</Button>
                            <Button variant={scanMode === 'phone' ? "contained" : "outlined"} onClick={() => { setScanMode('phone'); resetForNextScan(); }}>Use Phone</Button>
                        </Box>
                    </>
                ) : (
                    <Card sx={{ width: '100%', maxWidth: 400, textAlign: 'center', border: status === 'found' ? '2px solid green' : (status === 'warning' ? '2px solid orange' : 'none') }}>
                        <CardContent>
                            <Avatar src={userData.photo || "/placeholder-user.jpg"} sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }} />
                            <Typography variant="h5">{userData.name}</Typography>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>{userData.phone}</Typography>
                            <Button variant="contained" fullWidth size="large" onClick={resetForNextScan} sx={{mt:3}}>
                                Ready for Next Scan
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
}