import axios, { AxiosError } from 'axios';
import { ApiContract } from './types/api';

// Create a configured axios instance
export const api = axios.create({
  baseURL: '/', // Reverted to '/' to avoid 'api/api/...' double prefix
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add logic here like attaching auth tokens if they weren't in cookies
    // For this app, Next.js handles the JWT cookies automatically for API routes
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Any status code that lies within the range of 2xx causes this function to trigger
    // Since our backend returns standard { success, data, message }, we return that entire contract
    return response.data;
  },
  (error: AxiosError<ApiContract>) => {
    // Any status codes that fall outside the range of 2xx cause this function to trigger
    const data = error.response?.data;
    
    // Extract the standardized error message and details from our API contract
    const message = data?.error || error.message || 'An unexpected error occurred';
    
    const enhancedError: any = new Error(message);
    
    // Attach details (like Zod validation errors) if they exist
    if (data?.details) {
      enhancedError.details = data.details;
    }
    
    return Promise.reject(enhancedError);
  }
);
