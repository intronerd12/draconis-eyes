const express = require('express');
const router = express.Router();
const axios = require('axios');

// Province Coordinates for Open-Meteo API
const PROVINCE_COORDS = {
  'Metro Manila': { lat: 14.5995, lon: 120.9842 },
  'Cebu': { lat: 10.3157, lon: 123.8854 },
  'Davao': { lat: 7.1907, lon: 125.4553 },
  'Ilocos Norte': { lat: 18.1960, lon: 120.5927 },
  'Cavite': { lat: 14.2889, lon: 120.9167 },
  'Laguna': { lat: 14.2721, lon: 121.3653 },
  'Batangas': { lat: 13.7565, lon: 121.0583 },
  'Rizal': { lat: 14.5869, lon: 121.1789 },
  'Quezon': { lat: 13.9314, lon: 121.6172 },
  'Pampanga': { lat: 15.0437, lon: 120.6925 }
};

// WMO Weather Code Mapping
const getWeatherCondition = (code) => {
  if (code === 0) return 'Sunny';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code >= 45 && code <= 48) return 'Cloudy';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Light Rain';
  if (code >= 71 && code <= 77) return 'Rain'; // Snow unlikely in PH, mapped to Rain
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
};

const fetchWeatherData = async (province) => {
  const coords = PROVINCE_COORDS[province] || PROVINCE_COORDS['Metro Manila'];
  
  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: coords.lat,
        longitude: coords.lon,
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'Asia/Singapore', // PH Time
        forecast_days: 4
      }
    });

    const data = response.data;
    const current = data.current;
    
    // Process Forecast
    const forecast = [];
    if (data.daily && data.daily.time) {
        for (let i = 1; i < 4; i++) { // Next 3 days
            if (data.daily.time[i]) {
                forecast.push({
                    day: new Date(data.daily.time[i]).toLocaleDateString('en-US', { weekday: 'short' }),
                    temp: Math.round((data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2),
                    condition: getWeatherCondition(data.daily.weather_code[i])
                });
            }
        }
    }

    return {
      province,
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      condition: getWeatherCondition(current.weather_code),
      windSpeed: current.wind_speed_10m,
      forecast
    };
  } catch (error) {
    console.error('Weather API Error:', error.message);
    throw new Error('Failed to fetch weather data');
  }
};

const getGrowthRecommendation = (weather) => {
  const { temperature, humidity, condition } = weather;
  let status = 'Suitable';
  let color = 'green';
  let message = 'Conditions are excellent for dragon fruit growth.';
  let details = [];

  // Temperature Analysis (Dragon Fruit Ideal: 20-30°C)
  if (temperature < 20) {
    status = 'Caution';
    color = 'orange';
    details.push('Temperature is below optimal range (20-30°C). Growth may slow down.');
  } else if (temperature > 35) {
    status = 'Warning';
    color = 'red';
    details.push('High temperature detected. Ensure adequate hydration for plants.');
  } else {
    details.push('Temperature is within the ideal range.');
  }

  // Humidity Analysis (Ideal: 60-80%)
  if (humidity < 50) {
      details.push('Humidity is low. Consider misting if prolonged.');
  }

  // Condition Analysis
  if (condition === 'Thunderstorm' || condition.includes('Rain')) {
    if (status === 'Suitable') {
      status = 'Caution';
      color = 'orange';
    }
    details.push('Rain may affect pollination if flowering. Ensure good drainage.');
  } else if (condition === 'Sunny') {
    details.push('Good sunlight exposure for photosynthesis.');
  }

  return {
    status,
    color,
    message,
    details
  };
};

// GET /api/weather?province=Name
router.get('/', async (req, res) => {
  try {
    const province = req.query.province || 'Metro Manila';
    const weather = await fetchWeatherData(province);
    const recommendation = getGrowthRecommendation(weather);

    res.json({
      ...weather,
      recommendation
    });
  } catch (error) {
    console.error('Route Error:', error);
    res.status(500).json({ message: 'Error fetching weather data' });
  }
});

// GET /api/weather/provinces
router.get('/provinces', (req, res) => {
  res.json(Object.keys(PROVINCE_COORDS));
});

module.exports = router;
