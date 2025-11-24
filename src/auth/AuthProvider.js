// Auth0Provider setup for React
import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthUserProvider } from './AuthUserContext';

const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
console.log('Auth0 domain:', domain);
console.log('Auth0 clientId:', clientId);

export const AuthProvider = ({ children }) => {
  if (!domain || !clientId) {
    return (
      <div style={{ color: 'red', padding: '2rem', fontWeight: 'bold', background: '#fff0f0' }}>
        ERROR: Auth0 domain or clientId is undefined.<br />
        domain: {String(domain)}<br />
        clientId: {String(clientId)}<br />
        <br />
        Please check your .env file and restart your development server.
      </div>
    );
  }
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      <AuthUserProvider>
        {children}
      </AuthUserProvider>
    </Auth0Provider>
  );
};
