// AuthUserContext.js
import React, { createContext, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const AuthUserContext = createContext(null);

export const AuthUserProvider = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  return (
    <AuthUserContext.Provider value={{ user, isAuthenticated, isLoading }}>
      {children}
    </AuthUserContext.Provider>
  );
};

export const useAuthUser = () => useContext(AuthUserContext);
