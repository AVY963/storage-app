import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from '@mui/material';
import LoginPage from "./pages/Login";
import FileManager from "./FileManager";
import { useAuth } from "./AuthContext";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          flexDirection: 'column',
          height: '100vh'
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Проверка авторизации...
        </Typography>
      </Box>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
}

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/files" element={<PrivateRoute><FileManager /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/files" replace />} />
      </Routes>
    </Router>
  );
}