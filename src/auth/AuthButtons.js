// Example login/logout button using Auth0
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export const AuthButtons = () => {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();

  return (
    <div>
      {!isAuthenticated ? (
        <button className="auth-login-btn" onClick={() => loginWithRedirect()}>Log In</button>
      ) : (
        <div className="auth-user-info">
          <div className="auth-user-avatar" tabIndex={0} title="Show email">
            {user?.email ? user.email[0].toUpperCase() : (user?.name ? user.name[0].toUpperCase() : '?')}
          </div>
          <div className="auth-user-tooltip">{user?.email || user?.name}</div>
          <button className="auth-logout-btn" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Log Out</button>
        </div>
      )}
    </div>
  );
};
