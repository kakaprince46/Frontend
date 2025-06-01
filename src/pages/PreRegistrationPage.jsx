import React, { useState, useEffect } from 'react'; // Added React and useEffect
import {
    Box, TextField, Button, Typography, Stepper, Step, StepLabel,
    FormControl, InputLabel, Select, MenuItem, CircularProgress // Added FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import { registerUser, getEvents } from '../services/api'; // Added getEvents

export default function PreRegistrationPage() {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        eventId: '' // This will now be populated by the dropdown
    });
    const [submissionStatus, setSubmissionStatus] = useState('');
    const [fallbackId, setFallbackId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // For loading state on submit

    const [events, setEvents] = useState([]); // To store the list of events
    const [loadingEvents, setLoadingEvents] = useState(true); // Loading state for events dropdown

    const steps = ['Select Event & Personal Information', 'Fingerprint Enrollment (Optional)', 'Confirmation'];

    // Fetch events when the component mounts
    useEffect(() => {
        const fetchEventsForDropdown = async () => {
            setLoadingEvents(true);
            try {
                const response = await getEvents();
                setEvents(response.data || []);
                console.log("Fetched events for dropdown:", response.data);
            } catch (error) {
                console.error("Failed to fetch events for dropdown:", error);
                setSubmissionStatus("Error: Could not load events for selection."); // Show error
                setEvents([]); // Ensure events is an array even on error
            }
            setLoadingEvents(false);
        };
        fetchEventsForDropdown();
    }, []); // Empty dependency array means this runs once on mount

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNextStep = () => { // Renamed from handleNext for clarity
        // Validate current step's data before proceeding if needed
        if (activeStep === 0 && (!formData.name || !formData.phone || !formData.eventId)) {
            setSubmissionStatus("Please select an event and fill in your name and phone number.");
            return;
        }
        setSubmissionStatus(''); // Clear previous messages
        setActiveStep(prev => prev + 1);
    };

    const handleBack = () => setActiveStep(prev => prev - 1);

    const handleRegisterSubmit = async (event) => {
        if (event) event.preventDefault();

        console.log("Attempting to submit registration...");
        console.log("Form data (with eventId):", formData);

        if (!formData.name || !formData.phone || !formData.eventId) {
            console.error("Validation failed: Event, Name, and Phone are required.");
            setSubmissionStatus("Validation failed: Event, Name, and Phone are required.");
            return;
        }

        setIsSubmitting(true);
        setSubmissionStatus("Submitting your registration...");

        try {
            // The payload for registerUser expects event_id not eventId
            const payload = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                event_id: formData.eventId, // Send event_id to backend
                // firebase_uid: ... // If you integrate Firebase auth later
            };
            // If 'fingerprint_data' is collected in a later step, it would be added here or in a separate call
            // payload.fingerprint_data = collectedFingerprintData; 

            const response = await registerUser(payload);
            console.log("Registration successful! API Response:", response.data);
            setSubmissionStatus(`Registration successful! Your User ID: ${response.data.user_id}, Fallback ID: ${response.data.fallback_id}`);
            setFallbackId(response.data.fallback_id);
            setActiveStep(steps.indexOf('Confirmation')); // Go to confirmation
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || "Registration failed due to an unknown error.";
            console.error("Registration API call failed:", errorMessage);
            setSubmissionStatus(`Registration failed: ${errorMessage}`);
        }
        setIsSubmitting(false);
    };

    // Decide which button to show at the end of Step 0
    // If fingerprint is mandatory, "Next" goes to fingerprint step.
    // If fingerprint is optional or not implemented yet, Step 0 button can be "Submit".
    // For now, let's assume Step 0 collects all needed info before fingerprint (which is a placeholder).
    const stepZeroButton = (
        <Button variant="contained" type="submit" sx={{ mt: 2 }} disabled={isSubmitting || loadingEvents}>
            {isSubmitting ? <CircularProgress size={24} /> : "Submit Registration"}
        </Button>
    );
    // If you want a multi-step data collection before final submission:
    // const stepZeroButton = (
    //     <Button variant="contained" onClick={handleNextStep} sx={{ mt: 2 }} disabled={loadingEvents}>
    //         Next (to Fingerprint)
    //     </Button>
    // );


    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
                Event Pre-Registration
            </Typography>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map(label => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {submissionStatus && (
                <Typography
                    color={submissionStatus.startsWith("Registration successful") ? "green" : "error"}
                    sx={{ mb: 2, textAlign: 'center', whiteSpace: 'pre-line' }}
                >
                    {submissionStatus}
                </Typography>
            )}

            {activeStep === 0 && (
                <Box component="form" onSubmit={handleRegisterSubmit} sx={{ display: 'grid', gap: 2.5 }}> {/* Adjusted gap */}
                    <Typography variant="h5" sx={{ mb: 1 }}>Select Event & Enter Personal Information</Typography>
                    <FormControl fullWidth required error={!formData.eventId && submissionStatus.includes("Event")}>
                        <InputLabel id="event-select-label">Event</InputLabel>
                        <Select
                            labelId="event-select-label"
                            id="event-select"
                            name="eventId"
                            value={formData.eventId}
                            label="Event"
                            onChange={handleInputChange}
                            disabled={loadingEvents}
                        >
                            {loadingEvents ? (
                                <MenuItem value=""><em>Loading events...</em></MenuItem>
                            ) : events.length === 0 ? (
                                <MenuItem value=""><em>No events available or failed to load</em></MenuItem>
                            ) : (
                                events.map((event) => (
                                    <MenuItem key={event.id} value={event.id}>
                                        {event.name} ({new Date(event.start_date).toLocaleDateString()})
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Full Name"
                        name="name"
                        required
                        fullWidth
                        value={formData.name}
                        onChange={handleInputChange}
                    />
                    <TextField
                        label="Phone Number"
                        name="phone"
                        required
                        fullWidth
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                    />
                    <TextField
                        label="Email (Optional)"
                        name="email"
                        type="email"
                        fullWidth
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                    {stepZeroButton}
                </Box>
            )}

            {activeStep === 1 && ( // Fingerprint Enrollment Step (Placeholder)
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ mb: 3 }}>Fingerprint Enrollment (Optional)</Typography>
                    <Box sx={{
                        border: '2px dashed #ccc', p: 4, mb: 3, height: 200,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Typography>Fingerprint scanner integration is a future step.</Typography>
                    </Box>
                    <Button variant="outlined" onClick={handleBack} sx={{ mr: 2 }}>
                        Back
                    </Button>
                    {/* This button moves to confirmation. The actual submission happened in Step 0 for this example. */}
                    <Button variant="contained" onClick={handleNextStep}>
                        Proceed to Confirmation
                    </Button>
                </Box>
            )}

            {activeStep === 2 && ( // Confirmation Step
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ mb: 3 }}>
                        {fallbackId ? "Registration Complete!" : "Registration Processed"}
                    </Typography>
                    {fallbackId && (
                        <>
                            <Typography sx={{ mb: 2 }}>
                                Your fallback ID is: <strong>{fallbackId}</strong>
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 4 }}>
                                Please keep this ID for the event as a backup.
                            </Typography>
                        </>
                    )}
                    {!fallbackId && !submissionStatus.startsWith("Registration failed") && (
                        <Typography color="text.secondary" sx={{ mb: 4 }}>
                            Thank you. Your details have been submitted.
                        </Typography>
                    )}
                    <Button variant="contained" component="a" href="/"> {/* Changed to component="a" for simple navigation */}
                        Return to Home
                    </Button>
                </Box>
            )}
        </Box>
    );
}