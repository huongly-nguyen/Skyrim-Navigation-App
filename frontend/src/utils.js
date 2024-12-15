export const getApiUrl = (key) => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  const endpoint = key
  return `${baseUrl}${endpoint}`;
};