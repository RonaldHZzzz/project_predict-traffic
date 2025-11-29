import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const createApiInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor
    instance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            // Add auth token if available
            const token = process.env.NEXT_PUBLIC_API_TOKEN;
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            console.log(`Making ${config.method?.toUpperCase()} request to:`, config.url);
            return config;
        },
        (error) => {
            console.error('Request error:', error);
            return Promise.reject(error);
        }
    );

    // Response interceptor
    instance.interceptors.response.use(
        (response: AxiosResponse) => {
            console.log('Response received:', response.status);
            return response;
        },
        (error) => {
            console.error('Response error:', error.response?.status, error.message);
            
            // Handle specific error cases
            if (error.response?.status === 401) {
                // Handle unauthorized access
                console.error('Unauthorized access - redirect to login');
            }
            
            return Promise.reject(error);
        }
    );

    return instance;
};

// Export the configured API instance
export const useCustomApi = () => {
    return createApiInstance();
};

export default useCustomApi;