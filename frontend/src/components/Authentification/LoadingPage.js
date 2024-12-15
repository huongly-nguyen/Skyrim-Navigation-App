// src/LoadingPage.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { keycloak } from '../Authentification/keycloak';
import { getApiUrl } from '../../utils';
import API_ENDPOINTS from '../../apiConfig';

const LoadingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await keycloak.loadUserInfo();
        console.log(userInfo);

        const response = await axios.post(getApiUrl(API_ENDPOINTS.postUser), {
          username: userInfo.preferred_username,
        });

        console.log(response);
        navigate('/main');
      } catch (error) {
        console.error('Error fetching user info:', error);
        // Handle error appropriately
      }
    };

    fetchUserInfo();
  }, [navigate]);

  return (
    <div className="loading-container">
      <h1>Loading...</h1>
    </div>
  );
};

export default LoadingPage;
