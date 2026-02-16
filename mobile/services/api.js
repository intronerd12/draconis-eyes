import { Platform } from 'react-native';

// NOTE: For physical devices, replace 'localhost' with your machine's LAN IP address (e.g., '192.168.1.5')
// You can find your LAN IP by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) in your terminal.
const getBaseUrl = () => {
  const ngrokUrl = 'https://af5a-2405-8d40-4078-fa2d-9552-a4e5-b5aa-3900.ngrok-free.app';

  if (ngrokUrl) {
    return ngrokUrl;
  }

  if (Platform.OS === 'android') {
    return 'http://10.120.191.207:5000';
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

export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Update failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const uploadUserAvatar = async (userId, imageUri) => {
  try {
    const formData = new FormData();
    // Extract filename and type from URI
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('avatar', {
      uri: imageUri,
      name: filename,
      type,
    });

    const response = await fetch(`${API_URL}/api/users/${userId}/avatar`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        // 'Content-Type': 'multipart/form-data', // Do not set this manually
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Avatar upload failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};
