import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function OAuthCallback() {
  const { handleOAuthCallback } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('OAuth Callback - URL:', window.location.href);
    
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');

    console.log('OAuth Callback - Token:', token);
    console.log('OAuth Callback - User param:', userParam);

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log('OAuth Callback - Parsed user:', user);
        
        // Update auth context
        handleOAuthCallback(token, user);
        
        console.log('OAuth Callback - Auth state updated, redirecting to dashboard');
        
        // Use React Router navigate instead of window.location.href
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100); // Small delay to ensure localStorage is written
        
      } catch (error) {
        console.error('Error parsing OAuth callback:', error);
        navigate('/login?error=oauth_callback_failed', { replace: true });
      }
    } else {
      // Handle OAuth errors
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      console.error('OAuth error:', error, errorDescription);
      navigate(`/login?error=${error || 'oauth_failed'}`, { replace: true });
    }
  }, [handleOAuthCallback, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing your login...</p>
      </div>
    </div>
  );
}
