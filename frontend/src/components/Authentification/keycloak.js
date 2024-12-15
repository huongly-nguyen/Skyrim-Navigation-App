import Keycloak from "keycloak-js";
const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL,
  realm: process.env.REACT_APP_KEYCLOAK_REALM,
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID
});

const initKeycloak = async () => {
  try {
    const authenticated = await keycloak.init({ checkLoginIframe: false });
    if (authenticated) {
      localStorage.setItem('keycloak-token', keycloak.token);
      localStorage.setItem('keycloak-refresh-token', keycloak.refreshToken);
    }
  } catch (err) {
    console.error('Failed to initialize Keycloak:', err);
  }
};

export { keycloak, initKeycloak };