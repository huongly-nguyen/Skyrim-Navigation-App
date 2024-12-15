import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {keycloak} from "./keycloak";
import { getApiUrl } from '../../utils';
import API_ENDPOINTS from '../../apiConfig';
const validateToken = async (token) => {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.validateToken), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
      }
    });

    const data = await response.json();
    console.log(data);
    return data.isValid;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

const PrivateRoute = ({ element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = keycloak.token;
      if (token) {
      console.log("I get token");
        const valid = await validateToken(token);
        setIsAuthenticated(valid);
      } else {
        setIsAuthenticated(false);
      }
    };
    checkToken();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Show a loading indicator while checking the token
  }
console.log(isAuthenticated);
  return isAuthenticated ? element : <Navigate to="/login" />;
};

export default PrivateRoute;
