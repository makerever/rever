// Axios instance setup for api calling

import axios, { AxiosError, AxiosResponse } from "axios";
import Cookies from "js-cookie";

// Create an Axios instance with base URL and credentials
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

// Axios response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response, // If no error, just return response
  (error: AxiosError) => {
    let data = {};

    // If unauthorized, clear auth token and reload
    if (error.response?.status === 401) {
      clearAuthToken(true);
    }

    // If the error has a response and data, extract it
    if (error.response && error.response.data) {
      data = error.response.data;
    }

    // Return structured error message to be used elsewhere
    return { data, status: error.response?.status };
  },
);

/**
 * Set the Authorization header for axios instance
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

/**
 * Clear the Authorization header and remove auth cookies
 */
export const clearAuthToken = (reload = false) => {
  delete axiosInstance.defaults.headers.common["Authorization"];
  Cookies.remove("token");
  Cookies.remove("role");

  if (reload) {
    window.location.reload();
  }
};

/**
 * Get the auth token from cookies (client-side only)
 */
export const getToken = () => {
  if (typeof window !== "undefined") {
    return Cookies.get("token");
  }
};

// Set the Authorization header if token exists on load
const token = getToken();
if (token) {
  setAuthToken(token);
}

export default axiosInstance;
