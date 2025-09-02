import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function AuthDebug() {
  const { user, token } = useContext(AuthContext);

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', color: 'black' }}>
      <h1>Authentication Debug</h1>
      <div>
        <strong>Token:</strong> {token ? 'Present' : 'Not found'}
      </div>
      <div>
        <strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not found'}
      </div>
      <div>
        <strong>LocalStorage Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Not found'}
      </div>
      <div>
        <strong>LocalStorage User:</strong> {localStorage.getItem('user') || 'Not found'}
      </div>
    </div>
  );
}
