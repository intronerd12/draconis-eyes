import { Platform } from 'react-native';

// NOTE: For physical devices, replace 'localhost' with your machine's LAN IP address (e.g., '192.168.1.5')
// You can find your LAN IP by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) in your terminal.
const renderUrl = 'https://draconis-eyes.onrender.com';
const ngrokUrl = 'https://3568-2405-8d40-4066-ad72-b0bc-9619-6d19-14b5.ngrok-free.app';
const envNgrokUrl =
  typeof process !== 'undefined' && process?.env?.EXPO_PUBLIC_NGROK_URL
    ? process.env.EXPO_PUBLIC_NGROK_URL
    : '';

const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const getLocalFallbackUrl = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  return 'http://localhost:5000';
};

const buildBaseCandidates = () => {
  const urls = [
    normalizeBaseUrl(renderUrl),
    normalizeBaseUrl(envNgrokUrl),
    normalizeBaseUrl(ngrokUrl),
    normalizeBaseUrl(getLocalFallbackUrl()),
  ].filter(Boolean);

  return [...new Set(urls)];
};

let baseCandidates = buildBaseCandidates();
let activeBaseUrl = baseCandidates[0] || '';

const getBaseOrder = () => {
  const currentCandidates = buildBaseCandidates();
  if (currentCandidates.join('|') !== baseCandidates.join('|')) {
    baseCandidates = currentCandidates;
    if (!baseCandidates.includes(activeBaseUrl)) {
      activeBaseUrl = baseCandidates[0] || '';
    }
  }

  return [...baseCandidates];
};

const shouldRetryResponse = (status) => status >= 500;

const buildApiUrlInternal = (baseUrl, path) => {
  if (!path) return baseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  const safePath = String(path).startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${safePath}`;
};

export const buildApiUrl = (path = '') => buildApiUrlInternal(activeBaseUrl, path);
export const getActiveApiUrl = () => activeBaseUrl;
export const API_URL = activeBaseUrl;

export const apiFetch = async (path, options = {}) => {
  const urls = getBaseOrder();
  if (!urls.length) {
    throw new Error('No API URL configured');
  }

  let lastError = null;

  for (let i = 0; i < urls.length; i += 1) {
    const baseUrl = urls[i];
    const isLast = i === urls.length - 1;

    try {
      const response = await fetch(buildApiUrlInternal(baseUrl, path), options);

      if (response.ok || !shouldRetryResponse(response.status) || isLast) {
        if (activeBaseUrl !== baseUrl) {
          console.log('[api] switched active base URL to:', baseUrl);
        }
        activeBaseUrl = baseUrl;
        return response;
      }

      console.warn(`[api] ${baseUrl} returned ${response.status}, trying fallback...`);
      lastError = new Error(`API request failed with status ${response.status}`);
    } catch (error) {
      lastError = error;
      console.warn(`[api] ${baseUrl} request failed, trying fallback...`, error?.message || error);
      if (isLast) {
        throw error;
      }
    }
  }

  throw lastError || new Error('API request failed');
};

console.log('API URL primary:', normalizeBaseUrl(renderUrl));
console.log('API URL fallback:', normalizeBaseUrl(envNgrokUrl) || normalizeBaseUrl(ngrokUrl) || '(not set)');

export const loginUser = async (email, password) => {
  try {
    const response = await apiFetch('/api/auth/login', {
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
    const response = await apiFetch('/api/auth/register', {
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
    const response = await apiFetch('/api/auth/verify-email', {
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
    const response = await apiFetch(`/api/users/${userId}`, {
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

    const response = await apiFetch(`/api/users/${userId}/avatar`, {
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
