import { Platform } from 'react-native';

// NOTE: For physical devices, replace 'localhost' with your machine's LAN IP address (e.g., '192.168.1.5')
// You can find your LAN IP by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) in your terminal.
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    // 10.0.2.2 is the special alias to your host loopback interface (127.0.0.1) on the development machine
    // If using a physical device, change this to your LAN IP (e.g., 'http://192.168.1.5:5000')
    return 'http://172.27.187.207:5000';
  } else if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:5000';
  } else {
    return 'http://localhost:5000';
  }
};

export const API_URL = getBaseUrl();

console.log('API URL configured as:', API_URL);

export const loginUser = async (email, password) => {
  try {
    console.log(`Attempting login to: ${API_URL}/api/auth/login`);
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (name, email, password) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const verifyEmail = async (email, code) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Verification failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};
