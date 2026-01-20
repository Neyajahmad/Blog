import axios from "axios";


const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    let url = process.env.REACT_APP_API_URL.trim();
  
    if (!url.endsWith('/api')) {
      url = url.replace(/\/$/, '') + '/api';
    }
    return url;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://blog-backend-6jlq.onrender.com/api';
  }
  return '/api';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});
