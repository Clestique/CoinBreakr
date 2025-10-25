/**
 * Centralized API configuration for Expo Go
 * 
 * IMPORTANT: Update HOST_IP with your computer's IP address
 * 
 * To find your IP address:
 * - Windows: Open CMD and run `ipconfig` - look for "IPv4 Address"
 * - Mac/Linux: Open Terminal and run `ifconfig` - look for "inet" under your network interface
 * 
 * Example: If your IP is 192.168.1.105, change HOST_IP to '192.168.1.105'
 */
export const API_CONFIG = {
    HOST_IP: '34.45.197.215', 
    PORT: 3000,
    API_VERSION: 'v1',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
};

export const getApiUrl = (): string => {
    const { HOST_IP, PORT, API_VERSION } = API_CONFIG;
    return `http://${HOST_IP}:${PORT}/${API_VERSION}`;
};

export default API_CONFIG;