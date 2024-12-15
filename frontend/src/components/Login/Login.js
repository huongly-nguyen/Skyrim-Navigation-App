// src/Login.js
import React from 'react';
import './Login.css';
import {keycloak} from "../Authentification/keycloak";


const Login = () => {
  const handleLogin = () => {
    keycloak.login({ redirectUri: process.env.REACT_APP_KEYCLOAK_REDIRECT_LOGIN });
  };
  const handleLogout = () => {
    keycloak.logout({ redirectUri: process.env.REACT_APP_KEYCLOAK_REDIRECT_LOGOUT });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Skyrim Navigation App</h1>
        <button id="loginButton" className="login-button" onClick={handleLogin}>
          Login
        </button>
        <button id="logoutButton" className="login-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Login;
