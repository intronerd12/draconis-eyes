import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { getUserNamespace, sanitizeForKey } from './storageScope';

const ENV_CACHE_KEY_BASE = 'env_cache_v1';
const ENV_REPORT_CACHE_KEY_BASE = 'env_report_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;

const getEnvCacheKey = (user) => {
  const ns = sanitizeForKey(getUserNamespace(user));
  return ns ? `${ENV_CACHE_KEY_BASE}:${ns}` : `${ENV_CACHE_KEY_BASE}:anon`;
};

const getEnvReportCacheKey = (user) => {
  const ns = sanitizeForKey(getUserNamespace(user));
  return ns ? `${ENV_REPORT_CACHE_KEY_BASE}:${ns}` : `${ENV_REPORT_CACHE_KEY_BASE}:anon`;
};

const fetchJson = async (url, { signal, headers } = {}) => {
  const res = await fetch(url, { signal, headers });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return await res.json();
};

const formatPlaceLabel = (result) => {
  if (!result || typeof result !== 'object') return null;
  // Use admin1 (province) or fallback to admin2/admin3 if available
  const region = result.admin1 || result.admin2 || result.admin3;
  const parts = [result.name, region, result.country].filter(Boolean);
  if (!parts.length) return null;
  return parts.join(', ');
};

const formatPlaceDetails = (result) => {
  if (!result || typeof result !== 'object') return null;

  // Try to find the most "province-like" field
  // admin1 is usually the State/Province/Region (e.g., Metro Manila, California)
  // Fallback to admin2 or admin3 if admin1 is missing
  const province = result.admin1 || result.admin2 || result.admin3 || result.city || null;

  return {
    label: formatPlaceLabel(result),
    province: typeof province === 'string' ? province : null,
    country: typeof result.country === 'string' ? result.country : null,
    name: typeof result.name === 'string' ? result.name : null,
  };
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
    accuracy: Location.Accuracy.High,
    maximumAge: 0,
    timeout: 15000,
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };
};

const getPlaceDetailsFromCoords = async ({ latitude, longitude }, { signal } = {}) => {
  try {
    const native = await Location.reverseGeocodeAsync({ latitude, longitude });
    const first = Array.isArray(native) ? native[0] : null;
    if (first && typeof first === 'object') {
      const name =
        typeof first.city === 'string'
          ? first.city
          : typeof first.district === 'string'
            ? first.district
            : typeof first.subregion === 'string'
              ? first.subregion
              : typeof first.region === 'string'
                ? first.region
                : null;
      const province =
        typeof first.region === 'string'
          ? first.region
          : typeof first.subregion === 'string'
            ? first.subregion
            : null;
      const country = typeof first.country === 'string' ? first.country : null;
      const label = [name, province, country].filter(Boolean).join(', ') || null;
      if (label) {
        return {
          label,
          province,
          country,
          name,
        };
      }
    }
  } catch {}

  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${encodeURIComponent(
    latitude
  )}&longitude=${encodeURIComponent(longitude)}&language=en`;
  const data = await fetchJson(url, { signal });
  const result = Array.isArray(data?.results) ? data.results[0] : null;
  return formatPlaceDetails(result);
};

const getPlaceFromCoords = async ({ latitude, longitude }, { signal } = {}) => {
  const details = await getPlaceDetailsFromCoords({ latitude, longitude }, { signal });
  return details?.label ?? null;
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

const getForecastFromCoords = async ({ latitude, longitude }, { signal } = {}) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
    latitude
  )}&longitude=${encodeURIComponent(
    longitude
  )}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&forecast_days=7&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;

  const data = await fetchJson(url, { signal });
  const current = data?.current;
  const daily = data?.daily;

  if (!current || typeof current !== 'object') {
    throw new Error('Weather unavailable');
  }

  const days = [];
  const time = Array.isArray(daily?.time) ? daily.time : [];
  const tMax = Array.isArray(daily?.temperature_2m_max) ? daily.temperature_2m_max : [];
  const tMin = Array.isArray(daily?.temperature_2m_min) ? daily.temperature_2m_min : [];
  const precip = Array.isArray(daily?.precipitation_sum) ? daily.precipitation_sum : [];
  const wCode = Array.isArray(daily?.weather_code) ? daily.weather_code : [];

  const len = Math.min(time.length, tMax.length, tMin.length, precip.length, wCode.length);
  for (let i = 0; i < len; i++) {
    days.push({
      date: typeof time[i] === 'string' ? time[i] : null,
      maxTempC: typeof tMax[i] === 'number' ? tMax[i] : null,
      minTempC: typeof tMin[i] === 'number' ? tMin[i] : null,
      precipitationMm: typeof precip[i] === 'number' ? precip[i] : null,
      weatherCode: typeof wCode[i] === 'number' ? wCode[i] : null,
      weatherLabel: weatherCodeToLabel(wCode[i]),
    });
  }

  return {
    current: {
      temperatureC: typeof current.temperature_2m === 'number' ? current.temperature_2m : null,
      weatherCode: typeof current.weather_code === 'number' ? current.weather_code : null,
      weatherLabel: weatherCodeToLabel(current.weather_code),
      windKmh: typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : null,
      observedAt: typeof current.time === 'string' ? current.time : null,
    },
    days,
  };
};

const readCache = async ({ user } = {}) => {
  const raw = await AsyncStorage.getItem(getEnvCacheKey(user));
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

export const getCachedEnvironment = async ({ user } = {}) => {
  return await readCache({ user });
};

const readReportCache = async ({ user } = {}) => {
  const raw = await AsyncStorage.getItem(getEnvReportCacheKey(user));
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

const writeCache = async (payload, { user } = {}) => {
  try {
    await AsyncStorage.setItem(getEnvCacheKey(user), JSON.stringify(payload));
  } catch {
    return;
  }
};

const writeReportCache = async (payload, { user } = {}) => {
  try {
    await AsyncStorage.setItem(getEnvReportCacheKey(user), JSON.stringify(payload));
  } catch {
    return;
  }
};

export const clearEnvironmentCaches = async ({ user } = {}) => {
  try {
    await AsyncStorage.multiRemove([
      getEnvCacheKey(user),
      getEnvReportCacheKey(user),
      ENV_CACHE_KEY_BASE,
      ENV_REPORT_CACHE_KEY_BASE,
    ]);
  } catch {
    return;
  }
};

export const getEnvironment = async ({ force = false, signal, user } = {}) => {
  if (!force) {
    const cached = await readCache({ user });
    if (cached) return cached;
  }

  const coords = await getCoords();
  const [place, weather] = await Promise.all([
    getPlaceDetailsFromCoords(coords, { signal }).catch(() => null),
    getWeatherFromCoords(coords, { signal }),
  ]);

  const payload = {
    coords,
    place,
    placeLabel: place?.label || null,
    weather,
    fetchedAt: Date.now(),
  };

  await writeCache(payload, { user });
  return payload;
};

export const getEnvironmentalReport = async ({ force = false, signal, user } = {}) => {
  if (!force) {
    const cached = await readReportCache({ user });
    if (cached) return cached;
  }

  const coords = await getCoords();
  const [place, forecast] = await Promise.all([
    getPlaceDetailsFromCoords(coords, { signal }).catch(() => null),
    getForecastFromCoords(coords, { signal }),
  ]);

  const payload = {
    coords,
    place,
    forecast,
    fetchedAt: Date.now(),
  };

  await writeReportCache(payload, { user });
  return payload;
};
