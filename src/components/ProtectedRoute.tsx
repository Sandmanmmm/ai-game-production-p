import React, { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useContext(AuthContext);
  
  console.log('ProtectedRoute - Token:', !!token);
  console.log('ProtectedRoute - User:', user);
  
  if (!token) {
    console.log('ProtectedRoute - No token, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  console.log('ProtectedRoute - Authenticated, rendering children');
  return <>{children}</>;
}
