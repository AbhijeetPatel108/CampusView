import axios from "axios";

const envUrl = import.meta.env.VITE_API_URL;
const isProduction = import.meta.env.PROD;

let apiUrl;

if (envUrl && envUrl !== "undefined" && envUrl.trim() !== "") {
  if (isProduction && envUrl.includes("localhost")) {
    apiUrl = "https://clubviews-backend.onrender.com";
  } else {
    apiUrl = envUrl.trim();
  }
} else {
  apiUrl = "https://clubviews-backend.onrender.com";
}

apiUrl = apiUrl.replace(/\/+$/, "");

// Enable withCredentials globally for cross-origin requests (Vercel -> Render)
axios.defaults.withCredentials = true;

// Automatically attach Authorization Bearer token from localStorage to all outgoing requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const API_URL = apiUrl;
export default API_URL;

