import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, Select, MenuItem, Grid,
    Card, CardContent, LinearProgress,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    CircularProgress, TextField,
    FormControl, InputLabel,
    Collapse, IconButton // Added Collapse and IconButton
} from '@mui/material';
import {
    Timeline, // Note: Timeline itself might not be fully utilized in this version yet
    TimelineItem,
    TimelineOppositeContent,
    TimelineSeparator,
    TimelineDot,
    TimelineConnector,
    TimelineContent
} from '@mui/lab'; // Ensure @mui/lab is installed and compatible
import {
    People,
    Fingerprint,
    QrCode,
    Sync,
    Download
} from '@mui/icons-material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'; // Added
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';   // Added

import {
    getUsers,
    getDashboardData,
    createEvent,
    getEvents,
    createSessionForEvent,
    getSessionsForEvent // <-- ADDED API function
} from '../services/api'; // Ensure this path is correct

export default function AdminPage() {
    const [timeRange, setTimeRange] = useState('today');
    const [eventFilter, setEventFilter] = useState('all');

    // State for main dashboard data (users, check-in stats)
    const [stats, setStats] = useState({
        totalAttendees: 0,
        checkedIn: 0,
        checkinRate: 0,
        fingerprintCheckins: 0,
        qrCheckins: 0
    });
    const [registeredUsersList, setRegisteredUsersList] = useState([]);
    const [loadingMainData, setLoadingMainData] = useState(true);
    const [mainDataError, setMainDataError] = useState('');

    // State for events management
    const [eventsList, setEventsList] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [eventManagementError, setEventManagementError] = useState('');
    const [openNewEventDialog, setOpenNewEventDialog] = useState(false);
    const [newEventData, setNewEventData] = useState({ name: '', start_date: '', end_date: '' });
    const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

    // State for new SESSION form/dialog
    const [openNewSessionDialog, setOpenNewSessionDialog] = useState(false);
    const [selectedEventIdForSession, setSelectedEventIdForSession] = useState(null);
    const [newSessionData, setNewSessionData] = useState({ name: '', start_time: '', end_time: '' });
    const [isSubmittingSession, setIsSubmittingSession] = useState(false);
    const [sessionManagementError, setSessionManagementError] = useState('');

    // --- NEW STATE FOR DISPLAYING SESSIONS ---
    const [expandedEventId, setExpandedEventId] = useState(null); // Tracks which event's sessions are shown
    const [eventSessions, setEventSessions] = useState([]);         // Stores sessions for the expanded event
    const [loadingEventSessions, setLoadingEventSessions] = useState(false);
    const [eventSessionsError, setEventSessionsError] = useState('');
    // --- END NEW STATE ---

    const isAdminLoggedIn = true; // Placeholder

    const fetchMainAdminData = async () => {
        if (!isAdminLoggedIn) {
            setLoadingMainData(false);
            setMainDataError("Admin not logged in. Please log in.");
            return;
        }
        setLoadingMainData(true);
        setMainDataError('');
        try {
            const usersResponse = await getUsers();
            console.log("AdminDashboard: Fetched users for table:", usersResponse.data);
            setRegisteredUsersList(Array.isArray(usersResponse.data) ? usersResponse.data : []);

            const currentEventFilterForAPI = (eventFilter === 'all' || !Number.isInteger(parseInt(eventFilter))) ? null : parseInt(eventFilter);
            const dashboardResponse = await getDashboardData({
                event_id: currentEventFilterForAPI,
                time_range: timeRange
            });
            console.log("AdminDashboard: Fetched dashboard data:", dashboardResponse.data);

            const totalRegisteredFromStats = dashboardResponse.data?.stats?.total_registered_users;
            const fallbackTotalRegistered = Array.isArray(usersResponse.data) ? usersResponse.data.length : 0;
            const totalAttendeesValue = totalRegisteredFromStats !== undefined ? totalRegisteredFromStats : fallbackTotalRegistered;

            const uniqueCheckedIn = dashboardResponse.data?.stats?.unique_attendees || 0;

            setStats({
                totalAttendees: totalAttendeesValue,
                checkedIn: uniqueCheckedIn,
                checkinRate: (totalAttendeesValue > 0 && uniqueCheckedIn > 0) ?
                    Math.round((uniqueCheckedIn / totalAttendeesValue) * 100) : 0,
                fingerprintCheckins: dashboardResponse.data?.stats?.fingerprint_checkins || 0,
                qrCheckins: dashboardResponse.data?.stats?.qr_checkins || 0
            });

        } catch (err) {
            console.error("AdminDashboard: Failed to fetch main admin data:", err);
            const errorMsg = err.response?.data?.error || err.message || "Failed to fetch main dashboard data";
            setMainDataError(errorMsg);
            setRegisteredUsersList([]);
            setStats({ totalAttendees: 0, checkedIn: 0, checkinRate: 0, fingerprintCheckins: 0, qrCheckins: 0 });
        }
        setLoadingMainData(false);
    };

    const fetchAllEventsForManagement = async () => {
        if (!isAdminLoggedIn) return;
        setLoadingEvents(true);
        setEventManagementError('');
        try {
            const response = await getEvents();
            console.log("AdminDashboard: Fetched events for management:", response.data);
            setEventsList(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("AdminDashboard: Failed to fetch events for management:", err);
            const errorMsg = err.response?.data?.error || err.message || "Failed to fetch events list";
            setEventManagementError(errorMsg);
            setEventsList([]);
        }
        setLoadingEvents(false);
    };

    useEffect(() => {
        if (isAdminLoggedIn) {
            fetchMainAdminData();
            fetchAllEventsForManagement();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdminLoggedIn]);

    useEffect(() => {
        if (isAdminLoggedIn) {
            fetchMainAdminData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventFilter, timeRange]);

    // --- FUNCTION TO FETCH SESSIONS FOR A SPECIFIC EVENT ---
    const handleToggleSessions = async (eventId) => {
        if (expandedEventId === eventId) { // If already expanded, collapse it
            setExpandedEventId(null);
            setEventSessions([]);
            return;
        }

        setExpandedEventId(eventId);
        setLoadingEventSessions(true);
        setEventSessionsError('');
        setEventSessions([]); // Clear previous sessions
        try {
            const response = await getSessionsForEvent(eventId);
            console.log(`Sessions for event ${eventId}:`, response.data);
            setEventSessions(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error(`Failed to fetch sessions for event ${eventId}:`, err);
            setEventSessionsError(err.response?.data?.error || err.message || "Failed to load sessions.");
        }
        setLoadingEventSessions(false);
    };
    // --- END FUNCTION TO FETCH SESSIONS ---

    const handleOpenNewEventDialog = () => setOpenNewEventDialog(true);
    const handleCloseNewEventDialog = () => {
        setOpenNewEventDialog(false);
        setNewEventData({ name: '', start_date: '', end_date: '' });
        setIsSubmittingEvent(false);
        setEventManagementError('');
    };

    const handleNewEventChange = (e) => {
        setNewEventData({ ...newEventData, [e.target.name]: e.target.value });
    };

    const handleNewEventSubmit = async () => {
        setIsSubmittingEvent(true);
        setEventManagementError('');
        if (!newEventData.name || !newEventData.start_date || !newEventData.end_date) {
            setEventManagementError("All fields (Name, Start Date, End Date) are required.");
            setIsSubmittingEvent(false);
            return;
        }
        try {
            const payload = {
                name: newEventData.name,
                start_date: new Date(newEventData.start_date).toISOString(),
                end_date: new Date(newEventData.end_date).toISOString()
            };
            await createEvent(payload);
            handleCloseNewEventDialog();
            fetchAllEventsForManagement();
            if (eventFilter === 'all') {
                fetchMainAdminData();
            } else {
                fetchMainAdminData();
            }
        } catch (err) {
            console.error("AdminDashboard: Failed to create event:", err);
            const errorMsg = err.response?.data?.error || err.message || "Failed to create event";
            setEventManagementError(errorMsg);
        }
        setIsSubmittingEvent(false);
    };

    const handleOpenNewSessionDialog = (eventId) => {
        setSelectedEventIdForSession(eventId);
        setNewSessionData({ name: '', start_time: '', end_time: '' });
        setSessionManagementError('');
        setOpenNewSessionDialog(true);
    };

    const handleCloseNewSessionDialog = () => {
        setOpenNewSessionDialog(false);
        setSelectedEventIdForSession(null);
        setIsSubmittingSession(false);
    };

    const handleNewSessionChange = (e) => {
        setNewSessionData({ ...newSessionData, [e.target.name]: e.target.value });
    };

    const handleNewSessionSubmit = async () => {
        if (!selectedEventIdForSession) {
            setSessionManagementError("No event selected to add session to.");
            return;
        }
        if (!newSessionData.name || !newSessionData.start_time || !newSessionData.end_time) {
            setSessionManagementError("Session Name, Start Date/Time, and End Date/Time are required.");
            setIsSubmittingSession(false);
            return;
        }
        setIsSubmittingSession(true);
        setSessionManagementError('');
        try {
            const payload = {
                name: newSessionData.name,
                start_time: new Date(newSessionData.start_time).toISOString(),
                end_time: new Date(newSessionData.end_time).toISOString()
            };
            await createSessionForEvent(selectedEventIdForSession, payload);
            console.log(`AdminDashboard: Session created for event ${selectedEventIdForSession}`);
            handleCloseNewSessionDialog();
            // If the event whose session was just added is currently expanded, refresh its sessions
            if (expandedEventId === selectedEventIdForSession) {
                handleToggleSessions(selectedEventIdForSession); // This will re-fetch and re-expand
            }
            if (String(eventFilter) === String(selectedEventIdForSession) || eventFilter === 'all') {
                fetchMainAdminData();
            }
        } catch (err) {
            console.error("AdminDashboard: Failed to create session:", err);
            const errorMsg = err.response?.data?.error || err.message || "Failed to create session";
            setSessionManagementError(errorMsg);
        }
        setIsSubmittingSession(false);
    };

    if (!isAdminLoggedIn) {
        return <Typography sx={{ textAlign: 'center', mt: 5, p: 3 }}>Please log in to view the admin dashboard.</Typography>;
    }

    // Updated initial loading condition
    if (loadingMainData || loadingEvents) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Event Dashboard</Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Filters</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="time-range-label">Time Range</InputLabel>
                        <Select labelId="time-range-label" value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
                            <MenuItem value="today">Today</MenuItem>
                            <MenuItem value="week">This Week</MenuItem>
                            <MenuItem value="month">This Month</MenuItem>
                            <MenuItem value="all_time">All Time</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel id="event-filter-label">Filter by Event</InputLabel>
                        <Select labelId="event-filter-label" value={eventFilter} label="Filter by Event" onChange={(e) => setEventFilter(e.target.value)} >
                            <MenuItem value="all">All Events/Registrations</MenuItem>
                            {Array.isArray(eventsList) && eventsList.map(eventItem => (
                                <MenuItem key={eventItem.id} value={eventItem.id}>{eventItem.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="outlined" startIcon={<Sync />} onClick={() => { fetchMainAdminData(); fetchAllEventsForManagement(); }} disabled={loadingMainData || loadingEvents}>
                        {(loadingMainData || loadingEvents) ? <CircularProgress size={20} /> : "Refresh All"}
                    </Button>
                    <Button variant="contained" startIcon={<Download />} sx={{ ml: 'auto' }} disabled>
                        Export Report
                    </Button>
                </Box>
            </Paper>

            {/* Stats Cards */}
            {loadingMainData && !mainDataError && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
            {mainDataError && <Typography color="error" sx={{ textAlign: 'center', my: 2 }}>{mainDataError}</Typography>}
            {!loadingMainData && !mainDataError && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}> <Card> <CardContent> <Typography color="text.secondary">Total Registered</Typography> <Typography variant="h4">{stats.totalAttendees}</Typography> </CardContent> </Card> </Grid>
                    <Grid item xs={12} sm={6} md={3}> <Card> <CardContent> <Typography color="text.secondary">Checked In (Unique)</Typography> <Typography variant="h4">{stats.checkedIn}</Typography> {(stats.totalAttendees > 0 || stats.checkedIn > 0) && <LinearProgress variant="determinate" value={stats.checkinRate} sx={{ mt: 1, height: 8 }} />} {(stats.totalAttendees > 0 || stats.checkedIn > 0) && <Typography variant="caption">{stats.checkinRate}% check-in rate</Typography>} </CardContent> </Card> </Grid>
                    <Grid item xs={12} sm={6} md={3}> <Card> <CardContent> <Typography color="text.secondary">Fingerprint Check-ins</Typography> <Typography variant="h4">{stats.fingerprintCheckins}</Typography> <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}> <Fingerprint sx={{ mr: 1, color: '#1976d2' }} /> </Box> </CardContent> </Card> </Grid>
                    <Grid item xs={12} sm={6} md={3}> <Card> <CardContent> <Typography color="text.secondary">QR Scan Check-ins</Typography> <Typography variant="h4">{stats.qrCheckins}</Typography> <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}> <QrCode sx={{ mr: 1, color: '#4caf50' }} /> </Box> </CardContent> </Card> </Grid>
                </Grid>
            )}

            {/* Table for Registered Users Overview */}
            {!mainDataError && (
                <Paper sx={{ p: 2, mt: 3, mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Registered Users Overview</Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead> <TableRow> <TableCell>Name</TableCell> <TableCell>Phone</TableCell> <TableCell>Email</TableCell> <TableCell>Fallback ID</TableCell> <TableCell>Registered At</TableCell></TableRow> </TableHead>
                            <TableBody>
                                {loadingMainData && registeredUsersList.length === 0 && (
                                    <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={20} /></TableCell></TableRow>
                                )}
                                {!loadingMainData && Array.isArray(registeredUsersList) && registeredUsersList.length > 0 ? (
                                    registeredUsersList.map(user => (
                                        <TableRow key={`user-reg-${user.id}`}>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>{user.phone}</TableCell>
                                            <TableCell>{user.email || 'N/A'}</TableCell>
                                            <TableCell>{user.fallback_id}</TableCell>
                                            <TableCell>{user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    !loadingMainData && <TableRow><TableCell colSpan={5} align="center">No users to display based on current filters or none registered.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Manage Events Section - MODIFIED */}
            <Paper sx={{ p: 2, mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Manage Events</Typography>
                    <Button variant="contained" onClick={handleOpenNewEventDialog}> Add New Event </Button>
                </Box>
                {loadingEvents && eventsList.length === 0 && <Typography sx={{ textAlign: 'center', my: 2 }}><CircularProgress size={20} /> Loading events...</Typography>}
                {eventManagementError && !openNewEventDialog && <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>{eventManagementError}</Typography>}

                {!loadingEvents && !eventManagementError && (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: '5%' }}></TableCell> {/* For expand icon */}
                                    <TableCell>ID</TableCell>
                                    <TableCell>Event Name</TableCell>
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>End Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Array.isArray(eventsList) && eventsList.length > 0 ? (
                                    eventsList.map((eventItem) => (
                                        <React.Fragment key={`event-frag-${eventItem.id}`}>
                                            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                <TableCell>
                                                    <IconButton
                                                        aria-label="expand row"
                                                        size="small"
                                                        onClick={() => handleToggleSessions(eventItem.id)}
                                                    >
                                                        {expandedEventId === eventItem.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell component="th" scope="row">{eventItem.id}</TableCell>
                                                <TableCell>{eventItem.name}</TableCell>
                                                <TableCell>{new Date(eventItem.start_date).toLocaleString()}</TableCell>
                                                <TableCell>{new Date(eventItem.end_date).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Button size="small" sx={{ mr: 0.5, minWidth: 'auto', p: '4px 8px' }} disabled>Edit</Button>
                                                    <Button
                                                        size="small"
                                                        color="secondary"
                                                        onClick={() => handleOpenNewSessionDialog(eventItem.id)}
                                                        startIcon={<AddCircleOutlineIcon fontSize="small" />}
                                                        sx={{ minWidth: 'auto', p: '4px 8px' }}
                                                    >
                                                        Session
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                    <Collapse in={expandedEventId === eventItem.id} timeout="auto" unmountOnExit>
                                                        <Box sx={{ margin: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                                            <Typography variant="h6" gutterBottom component="div">
                                                                Sessions for: {eventItem.name}
                                                            </Typography>
                                                            {loadingEventSessions && expandedEventId === eventItem.id && <CircularProgress size={20} />}
                                                            {eventSessionsError && expandedEventId === eventItem.id && <Typography color="error">{eventSessionsError}</Typography>}
                                                            {!loadingEventSessions && expandedEventId === eventItem.id && Array.isArray(eventSessions) && eventSessions.length > 0 ? (
                                                                <Table size="small" aria-label="sessions">
                                                                    <TableHead>
                                                                        <TableRow>
                                                                            <TableCell>Session ID</TableCell>
                                                                            <TableCell>Session Name</TableCell>
                                                                            <TableCell>Start Time</TableCell>
                                                                            <TableCell>End Time</TableCell>
                                                                        </TableRow>
                                                                    </TableHead>
                                                                    <TableBody>
                                                                        {eventSessions.map((session) => (
                                                                            <TableRow key={`session-${session.id}`}>
                                                                                <TableCell>{session.id}</TableCell>
                                                                                <TableCell>{session.name}</TableCell>
                                                                                <TableCell>{new Date(session.start_time).toLocaleString()}</TableCell>
                                                                                <TableCell>{new Date(session.end_time).toLocaleString()}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            ) : !loadingEventSessions && expandedEventId === eventItem.id && (
                                                                <Typography variant="body2">No sessions found for this event.</Typography>
                                                            )}
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={6} align="center">{loadingEvents ? <CircularProgress size={20} /> : "No events found. Add one!"}</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                {!loadingEvents && !eventManagementError && eventsList.length === 0 && (
                    <Typography sx={{ textAlign: 'center', my: 2 }}>No events created yet. Click "Add New Event" to get started.</Typography>
                )}
            </Paper>

            {/* New Event Dialog */}
            <Dialog open={openNewEventDialog} onClose={handleCloseNewEventDialog} PaperProps={{ component: 'form', onSubmit: (e) => { e.preventDefault(); handleNewEventSubmit(); } }}>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogContent> <DialogContentText sx={{ mb: 1 }}> Please fill in the details for the new event. </DialogContentText> {eventManagementError && openNewEventDialog && <Typography color="error" sx={{ my: 1 }}>{eventManagementError}</Typography>} <TextField autoFocus margin="dense" name="name" label="Event Name" type="text" fullWidth variant="outlined" value={newEventData.name} onChange={handleNewEventChange} required /> <TextField margin="dense" name="start_date" label="Start Date & Time" type="datetime-local" fullWidth variant="outlined" value={newEventData.start_date} onChange={handleNewEventChange} InputLabelProps={{ shrink: true }} required sx={{ mt: 2 }} /> <TextField margin="dense" name="end_date" label="End Date & Time" type="datetime-local" fullWidth variant="outlined" value={newEventData.end_date} onChange={handleNewEventChange} InputLabelProps={{ shrink: true }} required sx={{ mt: 2 }} /> </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}> <Button onClick={handleCloseNewEventDialog} disabled={isSubmittingEvent}>Cancel</Button> <Button type="submit" variant="contained" disabled={isSubmittingEvent}> {isSubmittingEvent ? <CircularProgress size={24} /> : "Create Event"} </Button> </DialogActions>
            </Dialog>

            {/* New Session Dialog */}
            <Dialog open={openNewSessionDialog} onClose={handleCloseNewSessionDialog} PaperProps={{ component: 'form', onSubmit: (e) => { e.preventDefault(); handleNewSessionSubmit(); } }}>
                <DialogTitle>Add New Session to Event</DialogTitle>
                <DialogContent> <DialogContentText sx={{ mb: 1 }}> Event: {eventsList.find(e => e.id === selectedEventIdForSession)?.name || `ID ${selectedEventIdForSession || 'N/A'}`} <br /> Please fill in the details for the new session. </DialogContentText> {sessionManagementError && <Typography color="error" sx={{ my: 1 }}>{sessionManagementError}</Typography>} <TextField autoFocus margin="dense" name="name" label="Session Name" type="text" fullWidth variant="outlined" value={newSessionData.name} onChange={handleNewSessionChange} required sx={{ mt: 1 }} /> <TextField margin="dense" name="start_time" label="Session Start Date & Time" type="datetime-local" fullWidth variant="outlined" value={newSessionData.start_time} onChange={handleNewSessionChange} InputLabelProps={{ shrink: true }} required sx={{ mt: 2 }} /> <TextField margin="dense" name="end_time" label="Session End Date & Time" type="datetime-local" fullWidth variant="outlined" value={newSessionData.end_time} onChange={handleNewSessionChange} InputLabelProps={{ shrink: true }} required sx={{ mt: 2 }} /> </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}> <Button onClick={handleCloseNewSessionDialog} disabled={isSubmittingSession}>Cancel</Button> <Button type="submit" variant="contained" disabled={isSubmittingSession}> {isSubmittingSession ? <CircularProgress size={24} /> : "Create Session"} </Button> </DialogActions>
            </Dialog>
        </Box>
    );
}