import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const ENV_CACHE_KEY = 'env_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;

const fetchJson = async (url, { signal, headers } = {}) => {
  const res = await fetch(url, { signal, headers });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return await res.json();
};

const formatPlaceLabel = (result) => {
  if (!result || typeof result !== 'object') return null;
  const parts = [result.name, result.admin1, result.country].filter(Boolean);
  if (!parts.length) return null;
  return parts.join(', ');
};

const weatherCodeToLabel = (code) => {
  const c = Number(code);
  if (!Number.isFinite(c)) return 'Unknown';
  if (c === 0) return 'Clear';
  if (c === 1) return 'Mostly clear';
  if (c === 2) return 'Partly cloudy';
  if (c === 3) return 'Overcast';
  if (c === 45 || c === 48) return 'Fog';
  if (c === 51 || c === 53 || c === 55) return 'Drizzle';
  if (c === 56 || c === 57) return 'Freezing drizzle';
  if (c === 61 || c === 63 || c === 65) return 'Rain';
  if (c === 66 || c === 67) return 'Freezing rain';
  if (c === 71 || c === 73 || c === 75) return 'Snow';
  if (c === 77) return 'Snow grains';
  if (c === 80 || c === 81 || c === 82) return 'Rain showers';
  if (c === 85 || c === 86) return 'Snow showers';
  if (c === 95) return 'Thunderstorm';
  if (c === 96 || c === 99) return 'Thunderstorm hail';
  return 'Unknown';
};

const getCoords = async () => {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Location permission denied');
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };
};

const getPlaceFromCoords = async ({ latitude, longitude }, { signal } = {}) => {
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${encodeURIComponent(
    latitude
  )}&longitude=${encodeURIComponent(longitude)}&language=en`;
  const data = await fetchJson(url, { signal });
  const result = Array.isArray(data?.results) ? data.results[0] : null;
  return formatPlaceLabel(result);
};

const getWeatherFromCoords = async ({ latitude, longitude }, { signal } = {}) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
    latitude
  )}&longitude=${encodeURIComponent(
    longitude
  )}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;

  const data = await fetchJson(url, { signal });
  const current = data?.current;
  if (!current || typeof current !== 'object') {
    throw new Error('Weather unavailable');
  }

  return {
    temperatureC: typeof current.temperature_2m === 'number' ? current.temperature_2m : null,
    weatherCode: typeof current.weather_code === 'number' ? current.weather_code : null,
    weatherLabel: weatherCodeToLabel(current.weather_code),
    windKmh: typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : null,
    observedAt: typeof current.time === 'string' ? current.time : null,
  };
};

const readCache = async () => {
  const raw = await AsyncStorage.getItem(ENV_CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.fetchedAt !== 'number') return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = async (payload) => {
  try {
    await AsyncStorage.setItem(ENV_CACHE_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
};

export const getEnvironment = async ({ force = false, signal } = {}) => {
  if (!force) {
    const cached = await readCache();
    if (cached) return cached;
  }

  const coords = await getCoords();
  const [placeLabel, weather] = await Promise.all([
    getPlaceFromCoords(coords, { signal }).catch(() => null),
    getWeatherFromCoords(coords, { signal }),
  ]);

  const payload = {
    coords,
    placeLabel,
    weather,
    fetchedAt: Date.now(),
  };

  await writeCache(payload);
  return payload;
};
