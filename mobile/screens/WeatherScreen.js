import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, Animated, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface, Card, Title, Paragraph, Button, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { API_URL } from '../services/api';

const { width } = Dimensions.get('window');

const THEME = {
  primary: '#C71585',
  primaryDark: '#8B008B',
  accent: '#00FA9A',
  warning: '#FFC107',
  danger: '#FF5252',
  info: '#2196F3',
  white: '#FFFFFF',
  textDark: '#2D3436',
  textLight: '#636E72',
  background: '#F0F2F5',
};

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    getLocationAndWeather();
  }, []);

  const getLocationAndWeather = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Get Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      let province = 'Metro Manila'; // Default

      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        
        // Reverse Geocode to get Province/City
        let address = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        });

        if (address && address.length > 0) {
            province = address[0].region || address[0].city || 'Metro Manila';
        }
      } else {
        Alert.alert('Permission Denied', 'Location permission is required for accurate local weather. Defaulting to Metro Manila.');
      }

      // 2. Fetch Weather Data
      await fetchWeatherData(province);

    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMsg('Failed to load weather data. Please try again.');
      // Fallback fetch
      await fetchWeatherData('Metro Manila');
    } finally {
      setLoading(false);
      setRefreshing(false);
      animateIn();
    }
  };

  const fetchWeatherData = async (province) => {
    try {
      // Clean province name (remove "Province" suffix if present)
      const cleanProvince = province.replace(' Province', '');
      const response = await fetch(`${API_URL}/api/weather?province=${encodeURIComponent(cleanProvince)}`);
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('API Fetch Error:', error);
      throw error;
    }
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onRefresh = () => {
    setRefreshing(true);
    getLocationAndWeather();
  };

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'Sunny': return 'sunny';
      case 'Partly Cloudy': return 'partly-sunny';
      case 'Cloudy': return 'cloudy';
      case 'Light Rain': return 'rainy';
      case 'Heavy Rain': return 'thunderstorm';
      case 'Thunderstorm': return 'thunderstorm';
      default: return 'partly-sunny';
    }
  };

  const getWeatherColor = (condition) => {
    switch (condition) {
      case 'Sunny': return '#FFB300';
      case 'Partly Cloudy': return '#FF9800';
      case 'Cloudy': return '#90A4AE';
      case 'Light Rain': return '#4FC3F7';
      case 'Heavy Rain': return '#5C6BC0';
      case 'Thunderstorm': return '#3949AB';
      default: return THEME.info;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={{ marginTop: 10, color: THEME.textLight }}>Checking environmental conditions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[THEME.primaryDark, THEME.primary]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Environment Monitor</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.primary]} />}
      >
        {weatherData && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            
            {/* Location Badge */}
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={16} color={THEME.textLight} />
              <Text style={styles.locationText}>{weatherData.province}</Text>
            </View>

            {/* Main Weather Card */}
            <Card style={styles.weatherCard}>
              <LinearGradient
                colors={[getWeatherColor(weatherData.condition), '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.weatherGradient}
              >
                <View style={styles.weatherMain}>
                  <View>
                    <Text style={styles.temperature}>{weatherData.temperature}°C</Text>
                    <Text style={styles.condition}>{weatherData.condition}</Text>
                  </View>
                  <Ionicons name={getWeatherIcon(weatherData.condition)} size={80} color="#FFF" style={styles.weatherIconMain} />
                </View>
                
                <View style={styles.weatherStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="water" size={20} color={THEME.info} />
                    <Text style={styles.statLabel}>Humidity</Text>
                    <Text style={styles.statValue}>{weatherData.humidity}%</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="weather-windy" size={20} color={THEME.textLight} />
                    <Text style={styles.statLabel}>Wind</Text>
                    <Text style={styles.statValue}>{weatherData.windSpeed} km/h</Text>
                  </View>
                </View>
              </LinearGradient>
            </Card>

            {/* Growth Recommendation */}
            <Surface style={styles.recommendationCard} elevation={2}>
              <View style={[styles.statusStrip, { backgroundColor: weatherData.recommendation.color }]} />
              <View style={styles.recommendationContent}>
                <View style={styles.recHeader}>
                  <MaterialCommunityIcons name="sprout" size={24} color={weatherData.recommendation.color} />
                  <Title style={[styles.recTitle, { color: weatherData.recommendation.color }]}>
                    {weatherData.recommendation.status} for Growth
                  </Title>
                </View>
                <Paragraph style={styles.recMessage}>
                  {weatherData.recommendation.message}
                </Paragraph>
                <View style={styles.detailsList}>
                  {weatherData.recommendation.details.map((detail, index) => (
                    <View key={index} style={styles.detailItem}>
                      <Ionicons name="checkmark-circle" size={16} color={weatherData.recommendation.color} />
                      <Text style={styles.detailText}>{detail}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Surface>

            {/* 3-Day Forecast */}
            <Text style={styles.sectionTitle}>3-Day Forecast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
              {weatherData.forecast.map((day, index) => (
                <Surface key={index} style={styles.forecastCard} elevation={1}>
                  <Text style={styles.forecastDay}>{day.day}</Text>
                  <Ionicons name={getWeatherIcon(day.condition)} size={32} color={getWeatherColor(day.condition)} style={{ marginVertical: 8 }} />
                  <Text style={styles.forecastTemp}>{day.temp}°C</Text>
                  <Text style={styles.forecastCondition}>{day.condition}</Text>
                </Surface>
              ))}
            </ScrollView>

          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 1,
  },
  locationText: {
    marginLeft: 6,
    color: THEME.textDark,
    fontWeight: '600',
    fontSize: 14,
  },
  weatherCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
  },
  weatherGradient: {
    padding: 20,
  },
  weatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  condition: {
    fontSize: 18,
    color: 'white',
    opacity: 0.9,
    fontWeight: '500',
  },
  weatherIconMain: {
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  weatherStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 15,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.textLight,
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 25,
    flexDirection: 'row',
  },
  statusStrip: {
    width: 6,
    height: '100%',
  },
  recommendationContent: {
    flex: 1,
    padding: 16,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recMessage: {
    color: THEME.textDark,
    marginBottom: 12,
    lineHeight: 20,
  },
  detailsList: {
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    color: THEME.textLight,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 12,
    marginLeft: 4,
  },
  forecastScroll: {
    marginBottom: 20,
    marginHorizontal: -20, // To allow scrolling edge-to-edge
    paddingHorizontal: 20,
  },
  forecastCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    width: 100,
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textLight,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  forecastCondition: {
    fontSize: 11,
    color: THEME.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
});
