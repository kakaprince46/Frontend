import React from 'react'; // Added React import
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Shared/Layout';
import HomePage from './pages/HomePage';
import PreRegistrationPage from './pages/PreRegistrationPage';
import KioskCheckInPage from './pages/KioskCheckInPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage'; // <-- IMPORTED LoginPage
import ProtectedRoute from './components/Auth/ProtectedRoute'; // <-- IMPORTED ProtectedRoute

function App() {
    return (
        <Routes>
            {/* Wrap all routes with Layout */}
            <Route path="/" element={<Layout />}>
                {/* Homepage as index route */}
                <Route index element={<HomePage />} />

                {/* Other routes */}
                <Route path="preregister" element={<PreRegistrationPage />} />
                {/* For public pre-registration, no ProtectedRoute needed here unless you change requirements */}

                <Route
                    path="kiosk"
                    element={
                        <ProtectedRoute>
                            <KioskCheckInPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="admin"
                    element={
                        <ProtectedRoute>
                            <AdminDashboardPage />
                        </ProtectedRoute>
                    }
                />

                {/* You can keep both naming conventions or choose one */}
                {/* Keep alias if needed, or remove if /preregister is the standard */}
                <Route path="register" element={<PreRegistrationPage />} />
            </Route>

            {/* LoginPage will use a minimal layout or no layout, so define it outside the main Layout Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Add a 404 Page Not Found route if you like */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
    );
}

export default App;