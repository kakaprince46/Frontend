import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut as firebaseSignOut } from '../services/firebaseService'; // Or your firebase.js path

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true); // To know when auth state is resolved

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoadingAuth(false);
            if (user) {
                console.log("AuthContext: User signed in:", user.uid, user.email);
                // You might want to get an ID token here if your backend needs it
                // user.getIdToken().then(token => { /* store token if needed */ });
            } else {
                console.log("AuthContext: User signed out.");
            }
        });

        return unsubscribe; // Cleanup subscription on unmount
    }, []);

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            // setCurrentUser(null); // onAuthStateChanged will handle this
        } catch (error) {
            console.error("Failed to log out:", error);
            // Handle logout error if needed
        }
    };

    const value = {
        currentUser,
        loadingAuth,
        // Add login, signup functions here if you want them part of the context
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loadingAuth && children}
            {/* Or show a global loader: loadingAuth ? <GlobalLoader /> : children */}
        </AuthContext.Provider>
    );
}