import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Stepper, Step, StepLabel, CircularProgress, Paper } from '@mui/material';
import { registerUser } from '../services/api';

export default function PreRegistrationPage() {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
    });
    const [submissionStatus, setSubmissionStatus] = useState('');
    const [fallbackId, setFallbackId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const steps = ['Personal Information', 'Fingerprint Enrollment (Optional)', 'Confirmation'];

    const handleNextStep = () => setActiveStep(prev => prev + 1);
    const handleBack = () => setActiveStep(prev => prev - 1);
    
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegisterSubmit = async (event) => {
        if (event) event.preventDefault();
        
        if (!formData.name || !formData.phone) {
            setSubmissionStatus("Validation failed: Name and Phone are required.");
            return;
        }

        setIsSubmitting(true);
        setSubmissionStatus("Submitting your registration...");

        try {
            // The payload no longer includes eventId
            const payload = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
            };
            const response = await registerUser(payload);
            setSubmissionStatus(response.data.message || 'Registration Successful!');
            setFallbackId(response.data.fallback_id);
            setActiveStep(steps.indexOf('Confirmation')); 
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || "Registration failed due to an unknown error.";
            console.error("Registration API call failed:", errorMessage);
            setSubmissionStatus(`Registration failed: ${errorMessage}`);
        }
        setIsSubmitting(false);
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Paper sx={{p: {xs: 2, md: 4}}}>
                <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
                    System Pre-Registration
                </Typography>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map(label => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
                </Stepper>
                
                {submissionStatus && (
                    <Typography color={submissionStatus.startsWith("Registration successful") ? "green" : "error"} sx={{ mb: 2, textAlign: 'center' }}>
                        {submissionStatus}
                    </Typography>
                )}

                {activeStep === 0 && (
                    <Box component="form" onSubmit={handleRegisterSubmit} sx={{ display: 'grid', gap: 2.5 }}>
                        <Typography variant="h5" sx={{mb:1}}>Enter Personal Information</Typography>
                        <TextField name="name" label="Full Name" required fullWidth value={formData.name} onChange={handleInputChange} />
                        <TextField name="phone" label="Phone Number" required fullWidth type="tel" value={formData.phone} onChange={handleInputChange} />
                        <TextField name="email" label="Email (Optional)" type="email" fullWidth value={formData.email} onChange={handleInputChange} />
                        <Button variant="contained" type="submit" sx={{ mt: 2 }} disabled={isSubmitting}>
                            {isSubmitting ? <CircularProgress size={24} /> : "Submit Registration"}
                        </Button>
                    </Box>
                )}

                {activeStep === 1 && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ mb: 3 }}>Fingerprint Enrollment (Optional)</Typography>
                        <Box sx={{ border: '2px dashed #ccc', p: 4, mb: 3, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography>Fingerprint scanner integration is a future step.</Typography>
                        </Box>
                        <Button variant="outlined" onClick={handleBack} sx={{ mr: 2 }}> Back </Button>
                        <Button variant="contained" onClick={handleNextStep}> Skip & Proceed to Confirmation </Button>
                    </Box>
                )}

                {activeStep === 2 && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ mb: 3 }}>
                            {fallbackId ? "Registration Complete!" : "Registration Processed"}
                        </Typography>
                        {fallbackId && (
                            <>
                                <Typography sx={{ mb: 2 }}> Your fallback ID is: <strong>{fallbackId}</strong> </Typography>
                                <Typography color="text.secondary" sx={{ mb: 4 }}> Please keep this ID for the event as a backup. </Typography>
                            </>
                        )}
                        <Button variant="contained" component="a" href="/">
                            Return to Home
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}