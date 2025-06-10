import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, Select, MenuItem, Grid,
    Card, CardContent, CircularProgress, TextField, FormControl, InputLabel,
    Collapse, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Sync, Download } from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import {
    getUsers,
    getDashboardData,
    createEvent,
    getEvents,
    createSessionForEvent,
    getSessionsForEvent
} from '../services/api';

const StatCard = ({ title, value, loading }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Typography color="text.secondary" gutterBottom>{title}</Typography>
            <Typography variant="h4">
                {loading ? <CircularProgress size={30} /> : value}
            </Typography>
        </CardContent>
    </Card>
);

export default function AdminPage() {
    // --- STATE DEFINITIONS ---
    const [eventFilter, setEventFilter] = useState('all');
    const [stats, setStats] = useState({ totalRegistered: 0, checkedIn: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState('');
    const [checkInsList, setCheckInsList] = useState([]);
    const [loadingCheckIns, setLoadingCheckIns] = useState(true);
    const [checkInsError, setCheckInsError] = useState('');
    const [usersList, setUsersList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [usersError, setUsersError] = useState('');
    const [eventsList, setEventsList] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [eventManagementError, setEventManagementError] = useState('');
    const [openNewEventDialog, setOpenNewEventDialog] = useState(false);
    const [newEventData, setNewEventData] = useState({ name: '', start_date: '', end_date: '' });
    const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
    const [openNewSessionDialog, setOpenNewSessionDialog] = useState(false);
    const [selectedEventIdForSession, setSelectedEventIdForSession] = useState(null);
    const [newSessionData, setNewSessionData] = useState({ name: '', start_time: '', end_time: '' });
    const [isSubmittingSession, setIsSubmittingSession] = useState(false);
    const [sessionManagementError, setSessionManagementError] = useState('');
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [eventSessions, setEventSessions] = useState({});
    const [loadingEventSessions, setLoadingEventSessions] = useState(false);
    const isAdminLoggedIn = true;

    // --- DATA FETCHING FUNCTIONS ---
    const fetchData = useCallback(async () => {
        setLoadingStats(true);
        setLoadingCheckIns(true);
        setLoadingUsers(true);
        setLoadingEvents(true);
        try {
            const currentEventFilterForAPI = (eventFilter === 'all') ? null : parseInt(eventFilter);
            const [dashboardResponse, usersResponse, eventsResponse] = await Promise.all([
                getDashboardData({ event_id: currentEventFilterForAPI }),
                getUsers(),
                getEvents()
            ]);
            setStats({
                totalRegistered: usersResponse.data?.length ?? 0,
                checkedIn: dashboardResponse.data?.stats?.unique_attendees ?? 0,
            });
            setCheckInsList(Array.isArray(dashboardResponse.data?.recent_attendees) ? dashboardResponse.data.recent_attendees : []);
            setUsersList(Array.isArray(usersResponse.data) ? usersResponse.data : []);
            setEventsList(Array.isArray(eventsResponse.data) ? eventsResponse.data : []);
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            const errorMsg = err.response?.data?.error || err.message || "Failed to load dashboard data.";
            setStatsError(errorMsg);
            setCheckInsError(errorMsg);
            setUsersError(errorMsg);
            setEventManagementError(errorMsg);
        } finally {
            setLoadingStats(false);
            setLoadingCheckIns(false);
            setLoadingUsers(false);
            setLoadingEvents(false);
        }
    }, [eventFilter]);

    useEffect(() => {
        if (isAdminLoggedIn) {
            fetchData();
        }
    }, [isAdminLoggedIn, fetchData]);

    // --- DIALOG AND EVENT HANDLERS ---
    
    const handleToggleSessions = useCallback(async (eventId) => {
        const isCurrentlyExpanded = expandedEventId === eventId;
        setExpandedEventId(isCurrentlyExpanded ? null : eventId);

        if (!isCurrentlyExpanded) {
            setLoadingEventSessions(true);
            try {
                const response = await getSessionsForEvent(eventId);
                setEventSessions(prev => ({ ...prev, [eventId]: Array.isArray(response.data) ? response.data : [] }));
            } catch (err) {
                console.error(`Failed to fetch sessions for event ${eventId}:`, err);
                setEventSessions(prev => ({ ...prev, [eventId]: [] }));
            } finally {
                setLoadingEventSessions(false);
            }
        }
    }, [expandedEventId]);
    
    const handleOpenNewEventDialog = () => { setEventManagementError(''); setOpenNewEventDialog(true); };
    const handleCloseNewEventDialog = () => { setOpenNewEventDialog(false); setNewEventData({ name: '', start_date: '', end_date: '' }); setIsSubmittingEvent(false); };
    const handleNewEventChange = (e) => setNewEventData({ ...newEventData, [e.target.name]: e.target.value });
    const handleNewEventSubmit = async (event) => {
        event.preventDefault();
        setIsSubmittingEvent(true);
        setEventManagementError('');
        try {
            const payload = {
                name: newEventData.name,
                start_date: new Date(newEventData.start_date).toISOString(),
                end_date: new Date(newEventData.end_date).toISOString()
            };
            await createEvent(payload);
            handleCloseNewEventDialog();
            fetchData();
        } catch (err) {
            setEventManagementError(err.response?.data?.error || "Failed to create event");
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
    const handleNewSessionChange = (e) => setNewSessionData({ ...newSessionData, [e.target.name]: e.target.value });
    const handleNewSessionSubmit = async (event) => {
        event.preventDefault();
        if (!selectedEventIdForSession) { setSessionManagementError("Error: No event selected."); return; }
        setIsSubmittingSession(true);
        setSessionManagementError('');
        try {
            const payload = {
                name: newSessionData.name,
                start_time: new Date(newSessionData.start_time).toISOString(),
                end_time: new Date(newSessionData.end_time).toISOString()
            };
            await createSessionForEvent(selectedEventIdForSession, payload);
            handleCloseNewSessionDialog();
            handleToggleSessions(selectedEventIdForSession);
        } catch (err) {
            setSessionManagementError(err.response?.data?.error || "Failed to create session");
        }
        setIsSubmittingSession(false);
    };
    
    const handleExportCheckIns = () => {
        const doc = new jsPDF();
        doc.text("Check-ins Report", 14, 16);
        doc.autoTable({
            head: [['Name', 'Phone', 'Session', 'Event', 'Check-in Time', 'Method']],
            body: checkInsList.map(item => [
                item.user_name,
                item.user_phone,
                item.session_name,
                item.event_name,
                new Date(item.checkin_time).toLocaleString(),
                item.method
            ]),
            startY: 22,
        });
        doc.save('check-ins-report.pdf');
    };

    if (!isAdminLoggedIn) {
        return <Typography sx={{textAlign: 'center', mt: 5, p:3}}>Please log in to view the admin dashboard.</Typography>;
    }
    
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Event Dashboard</Typography>
            <Paper sx={{p:2, mb:3}}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{minWidth: 220}}>
                        <InputLabel>Filter by Event</InputLabel>
                        <Select value={eventFilter} label="Filter by Event" onChange={(e) => setEventFilter(e.target.value)}>
                            <MenuItem value="all">All Events</MenuItem>
                            {Array.isArray(eventsList) && eventsList.map(eventItem => (<MenuItem key={eventItem.id} value={eventItem.id}>{eventItem.name}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <Button variant="outlined" startIcon={<Sync />} onClick={fetchData} disabled={loadingStats || loadingUsers || loadingEvents}>
                        {(loadingStats || loadingUsers || loadingEvents) ? <CircularProgress size={20}/> : "Refresh All"}
                    </Button>
                    <Button variant="contained" startIcon={<Download />} sx={{ ml: 'auto' }} onClick={handleExportCheckIns} disabled={checkInsList.length === 0}>
                        Export Check-ins
                    </Button>
                </Box>
            </Paper>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}><StatCard title="Total Registered Users" value={stats.totalRegistered} loading={loadingStats} /></Grid>
                <Grid item xs={12} sm={6}><StatCard title="Checked In (Unique)" value={stats.checkedIn} loading={loadingStats} /></Grid>
            </Grid>
            {statsError && <Typography color="error">{statsError}</Typography>}
            
            <Paper sx={{ p: 2, mt: 3, mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Recent Check-ins</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Phone</TableCell><TableCell>Session</TableCell><TableCell>Event</TableCell><TableCell>Check-in Time</TableCell><TableCell>Method</TableCell></TableRow></TableHead>
                        <TableBody>
                            {loadingCheckIns ? (
                                <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
                            ) : checkInsError ? (
                                <TableRow><TableCell colSpan={6} align="center"><Typography color="error">{checkInsError}</Typography></TableCell></TableRow>
                            ) : Array.isArray(checkInsList) && checkInsList.length > 0 ? (
                                checkInsList.map((checkin, index) => (
                                    <TableRow key={`checkin-${index}`}><TableCell>{checkin.user_name}</TableCell><TableCell>{checkin.user_phone}</TableCell><TableCell>{checkin.session_name}</TableCell><TableCell>{checkin.event_name}</TableCell><TableCell>{new Date(checkin.checkin_time).toLocaleString()}</TableCell><TableCell>{checkin.method}</TableCell></TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} align="center">No check-ins have been recorded yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper sx={{ p: 2, mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Manage Events & Sessions</Typography>
                    <Button variant="contained" onClick={handleOpenNewEventDialog}>Add New Event</Button>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead><TableRow><TableCell sx={{width:'1%'}}></TableCell><TableCell>ID</TableCell><TableCell>Event Name</TableCell><TableCell>Start Date</TableCell><TableCell>End Date</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                        <TableBody>
                            {loadingEvents ? (
                                <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
                            ) : eventManagementError ? (
                                <TableRow><TableCell colSpan={6} align="center"><Typography color="error">{eventManagementError}</Typography></TableCell></TableRow>
                            ) : Array.isArray(eventsList) && eventsList.length > 0 ? (
                                eventsList.map((eventItem) => (
                                    <React.Fragment key={`event-frag-${eventItem.id}`}>
                                        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                                            <TableCell><IconButton size="small" onClick={() => handleToggleSessions(eventItem.id)}>{expandedEventId === eventItem.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton></TableCell>
                                            <TableCell>{eventItem.id}</TableCell>
                                            <TableCell>{eventItem.name}</TableCell>
                                            <TableCell>{new Date(eventItem.start_date).toLocaleString()}</TableCell>
                                            <TableCell>{new Date(eventItem.end_date).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Button size="small" sx={{mr:0.5}} disabled>Edit</Button>
                                                <Button size="small" color="secondary" onClick={() => handleOpenNewSessionDialog(eventItem.id)} startIcon={<AddCircleOutlineIcon fontSize="small" />}>Session</Button>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                <Collapse in={expandedEventId === eventItem.id} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 1, p: 2, bgcolor: '#fafafa', borderRadius: 1 }}>
                                                        <Typography variant="h6" gutterBottom>Sessions</Typography>
                                                        {loadingEventSessions && <CircularProgress size={20} />}
                                                        {eventSessions[eventItem.id] && eventSessions[eventItem.id].length > 0 ? (
                                                            <Table size="small"><TableHead><TableRow><TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell></TableRow></TableHead><TableBody>{eventSessions[eventItem.id].map((session) => (<TableRow key={session.id}><TableCell>{session.id}</TableCell><TableCell>{session.name}</TableCell><TableCell>{new Date(session.start_time).toLocaleString()}</TableCell><TableCell>{new Date(session.end_time).toLocaleString()}</TableCell></TableRow>))}</TableBody></Table>
                                                        ) : !loadingEventSessions && (
                                                            <Typography variant="body2">No sessions found. Click "Add Session" to create one.</Typography>
                                                        )}
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} align="center">No events found. Add one!</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            
            <Dialog open={openNewEventDialog} onClose={handleCloseNewEventDialog} PaperProps={{ component: 'form', onSubmit: handleNewEventSubmit }}>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogContent><DialogContentText sx={{ mb: 1 }}>Please fill in the details.</DialogContentText>{eventManagementError && <Typography color="error">{eventManagementError}</Typography>}<TextField autoFocus margin="dense" name="name" label="Event Name" type="text" fullWidth variant="outlined" value={newEventData.name} onChange={handleNewEventChange} required /><TextField margin="dense" name="start_date" label="Start Date & Time" type="datetime-local" fullWidth variant="outlined" value={newEventData.start_date} onChange={handleNewEventChange} InputLabelProps={{ shrink: true }} required sx={{ mt: 2 }} /><TextField margin="dense" name="end_date" label="End Date & Time" type="datetime-local" fullWidth variant="outlined" value={newEventData.end_date} onChange={handleNewEventChange} InputLabelProps={{ shrink: true }} required sx={{ mt: 2 }}/></DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}><Button onClick={handleCloseNewEventDialog} disabled={isSubmittingEvent}>Cancel</Button><Button type="submit" variant="contained" disabled={isSubmittingEvent}>{isSubmittingEvent ? <CircularProgress size={24} /> : "Create Event"}</Button></DialogActions>
            </Dialog>

            <Dialog open={openNewSessionDialog} onClose={handleCloseNewSessionDialog} PaperProps={{ component: 'form', onSubmit: handleNewSessionSubmit }}>
                <DialogTitle>Add New Session</DialogTitle>
                <DialogContent><DialogContentText sx={{ mb: 1 }}>Event: {eventsList.find(e => e.id === selectedEventIdForSession)?.name || ''}</DialogContentText>{sessionManagementError && <Typography color="error">{sessionManagementError}</Typography>}<TextField autoFocus margin="dense" name="name" label="Session Name" type="text" fullWidth variant="outlined" value={newSessionData.name} onChange={handleNewSessionChange} required sx={{ mt: 1 }}/><TextField margin="dense" name="start_time" label="Session Start Time" type="datetime-local" fullWidth variant="outlined" value={newSessionData.start_time} onChange={handleNewSessionChange} InputLabelProps={{ shrink: true }} required sx={{ mt: 2 }}/><TextField margin="dense" name="end_time" label="Session End Time" type="datetime-local" fullWidth variant="outlined" value={newSessionData.end_time} onChange={handleNewSessionChange} InputLabelProps={{ shrink: true }} required sx={{ mt: 2 }}/></DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}><Button onClick={handleCloseNewSessionDialog} disabled={isSubmittingSession}>Cancel</Button><Button type="submit" variant="contained" disabled={isSubmittingSession}>{isSubmittingSession ? <CircularProgress size={24} /> : "Create Session"}</Button></DialogActions>
            </Dialog>
        </Box>
    );
}