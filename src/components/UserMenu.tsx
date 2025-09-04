import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function UserMenu() {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-medium">
        {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.name || 'User'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {user.email}
        </p>
      </div>
      <button
        onClick={handleLogout}
        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition"
      >
        Logout
      </button>
    </div>
  );
}
