import axios from "axios";

// Use environment variable if set, otherwise detect environment
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    let url = process.env.REACT_APP_API_URL.trim();
    // Ensure the URL ends with /api if it doesn't already
    if (!url.endsWith('/api')) {
      // Remove trailing slash if present, then add /api
      url = url.replace(/\/$/, '') + '/api';
    }
    return url;
  }
  // In production (Netlify), use the Render backend URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://blog-backend-6jlq.onrender.com/api';
  }
  // In development, use proxy (configured in package.json)
  return '/api';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});
