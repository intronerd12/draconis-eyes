import React, { useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Platform,
  Image
} from 'react-native';
import { Text, Surface, Avatar, Portal, Dialog, Button, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

// Dragonfruit Theme Colors - Refined Palette
const THEME = {
  primary: '#C71585', // Deep Pink
  primaryDark: '#8B008B', // Dark Magenta
  primaryLight: '#FF69B4', // Hot Pink
  secondary: '#FFC0CB', // Pink
  accent: '#00FA9A', // Medium Spring Green
  white: '#FFFFFF',
  textDark: '#2D3436',
  textLight: '#636E72',
  background: '#F0F2F5',
  surface: '#FFFFFF',
  success: '#00B894',
  seeds: '#000000', // Added missing seeds color
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const TIPS = [
  { id: 1, title: 'Picking Ripe Fruit', icon: 'nutrition', color: '#FF7675' },
  { id: 2, title: 'Storage Tips', icon: 'snow', color: '#74B9FF' },
  { id: 3, title: 'Health Benefits', icon: 'heart', color: '#55EFC4' },
];

import { ScanService } from '../services/ScanService';
import { useFocusEffect } from '@react-navigation/native';
import { getEnvironment } from '../services/EnvironmentService';

export default function HomeScreen({ user, onLogout }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [stats, setStats] = React.useState({ total: 0, best: '-', avg: '0%' });
  const [recentScans, setRecentScans] = React.useState([]);
  const [logoutVisible, setLogoutVisible] = React.useState(false);
  const [environment, setEnvironment] = React.useState(null);
  const [environmentLoading, setEnvironmentLoading] = React.useState(false);
  const [environmentError, setEnvironmentError] = React.useState(null);

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      loadData();

      const refreshEnvironment = async () => {
        setEnvironmentLoading(true);
        setEnvironmentError(null);
        try {
          const data = await getEnvironment({ force: false });
          if (!active) return;
          setEnvironment(data);
        } catch (e) {
          if (!active) return;
          const msg = e && typeof e === 'object' && 'message' in e ? e.message : null;
          setEnvironmentError(typeof msg === 'string' ? msg : 'Unable to load location/weather');
        } finally {
          if (!active) return;
          setEnvironmentLoading(false);
        }
      };

      refreshEnvironment();

      return () => {
        active = false;
      };
    }, [])
  );

  const forceRefreshEnvironment = async () => {
    setEnvironmentLoading(true);
    setEnvironmentError(null);
    try {
      const data = await getEnvironment({ force: true });
      setEnvironment(data);
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? e.message : null;
      setEnvironmentError(typeof msg === 'string' ? msg : 'Unable to load location/weather');
    } finally {
      setEnvironmentLoading(false);
    }
  };

  const loadData = async () => {
    const s = await ScanService.getStats();
    const r = await ScanService.getScans();
    setStats(s);
    setRecentScans(r.slice(0, 5)); // Show top 5
  };
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Initial Entry Animation
  useEffect(() => {
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
  }, []);

  // Pulse animation for the scan button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleLogoutPress = () => {
    setLogoutVisible(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutVisible(false);
    try {
      await AsyncStorage.removeItem('user');
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const ScanButton = () => (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={styles.scanButtonContainer}
        onPress={() => navigation.navigate('Scan')}
        activeOpacity={0.9}
      >
        {/* Glow Effect */}
        <View style={styles.scanGlow} />
        
        <LinearGradient
          colors={[THEME.primary, THEME.primaryDark]}
          style={styles.scanButtonOuter}
        >
          <View style={styles.scanButtonInner}>
            {/* Seed Pattern */}
            <View style={styles.seedPattern}>
              {[...Array(8)].map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.seed, 
                    { 
                      transform: [
                        { rotate: `${i * 45}deg` },
                        { translateY: -38 }
                      ] 
                    }
                  ]} 
                />
              ))}
            </View>
            <Ionicons name="scan" size={42} color={THEME.primary} />
            <Text style={styles.scanText}>SCAN</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Immersive Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[THEME.primaryDark, THEME.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Background Pattern Circles */}
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
        <View style={styles.patternCircle3} />

        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.userInfo} 
            onPress={() => navigation.navigate('User')}
            activeOpacity={0.8}
          >
            <View style={styles.avatarWrapper}>
              <Avatar.Text 
                size={48} 
                label={user?.name ? user.name.substring(0, 2).toUpperCase() : 'DV'} 
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.onlineIndicator} />
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.username}>{user?.name || 'Dragon Tamer'}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleLogoutPress} style={styles.logoutBtn}>
            <BlurView intensity={20} style={styles.blurBtn}>
              <Ionicons name="log-out-outline" size={22} color={THEME.white} />
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>

      <Portal>
        <Dialog visible={logoutVisible} onDismiss={() => setLogoutVisible(false)} style={{ backgroundColor: THEME.white }}>
          <Dialog.Icon icon="alert" color={THEME.primary} />
          <Dialog.Title style={{ textAlign: 'center', color: THEME.primaryDark }}>Logout?</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ textAlign: 'center', color: THEME.textLight }}>
              Are you sure you want to log out of Dragon Vision?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 }}>
            <Button onPress={() => setLogoutVisible(false)} textColor={THEME.textLight}>Cancel</Button>
            <Button onPress={handleLogoutConfirm} mode="contained" buttonColor={THEME.primary}>Logout</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Animated.ScrollView  
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <Surface style={styles.envCard} elevation={3}>
          <LinearGradient
            colors={['#ffffff', '#fdf0f7']}
            style={styles.envGradient}
          >
            <View style={styles.envTopRow}>
              <View style={styles.envRowLeft}>
                <Ionicons name="location-outline" size={16} color={THEME.primaryDark} />
                <Text style={styles.envLocationText} numberOfLines={1}>
                  {environment?.placeLabel || (environmentLoading ? 'Getting your location…' : 'Location unavailable')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={forceRefreshEnvironment}
                style={styles.envRefreshBtn}
                disabled={environmentLoading}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={environmentLoading ? 'time-outline' : 'refresh-outline'}
                  size={18}
                  color={THEME.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.envBottomRow}>
              <Ionicons name="cloud-outline" size={18} color={THEME.primaryDark} />
              <Text style={styles.envWeatherText} numberOfLines={1}>
                {environment?.weather?.temperatureC != null
                  ? `${Math.round(environment.weather.temperatureC)}°C • ${environment.weather.weatherLabel}`
                  : environmentLoading
                    ? 'Loading weather…'
                    : 'Weather unavailable'}
              </Text>
            </View>

            {environmentError ? (
              <Text style={styles.envErrorText} numberOfLines={2}>
                {environmentError === 'Location permission denied'
                  ? 'Enable location permission to show local weather.'
                  : environmentError}
              </Text>
            ) : null}
          </LinearGradient>
        </Surface>

        {/* Floating Stats Cards */}
        <View style={styles.statsRow}>
          <Surface style={styles.statCard} elevation={4}>
            <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={styles.statGradient}
            >
              <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="time" size={22} color="#2196F3" />
              </View>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Scans</Text>
            </LinearGradient>
          </Surface>

          <Surface style={styles.statCard} elevation={4}>
            <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={styles.statGradient}
            >
              <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="trophy" size={22} color="#00B894" />
              </View>
              <Text style={styles.statValue}>{stats.best}</Text>
              <Text style={styles.statLabel}>Best</Text>
            </LinearGradient>
          </Surface>

          <Surface style={styles.statCard} elevation={4}>
            <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={styles.statGradient}
            >
              <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="trending-up" size={22} color="#FF9F43" />
              </View>
              <Text style={styles.statValue}>{stats.avg}</Text>
              <Text style={styles.statLabel}>Avg</Text>
            </LinearGradient>
          </Surface>
        </View>

        {/* Hero Scan Section */}
        <View style={styles.heroSection}>
          <Text style={styles.sectionTitle}>Quality Check</Text>
          <Text style={styles.sectionSubtitle}>Tap to analyze your dragonfruit</Text>
          <View style={styles.scanWrapper}>
            <ScanButton />
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pro Tips</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>View Guide</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
            {TIPS.map((tip, index) => (
              <TouchableOpacity key={tip.id} style={[styles.tipCard, { marginRight: 15 }]}>
                <LinearGradient
                  colors={[tip.color, '#ffffff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tipGradient}
                >
                  <Ionicons name={tip.icon} size={24} color="#FFF" style={styles.tipIcon} />
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentScans.length === 0 ? (
            <Paragraph style={{ textAlign: 'center', marginTop: 20, color: THEME.textLight }}>
              No scans yet. Tap the button above to start!
            </Paragraph>
          ) : (
            recentScans.map((item, index) => (
              <Surface key={item.id || index} style={styles.recentItem} elevation={1}>
                <View style={styles.recentLeft}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.recentImage} />
                  ) : (
                    <View style={styles.recentIconBox}>
                      <Text style={styles.emoji}>🐲</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentName}>
                      {item.fruit_type ? item.fruit_type.split(' ')[0] : 'Dragon Fruit'}
                    </Text>
                    <Text style={styles.recentDate}>
                      {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text numberOfLines={1} style={[styles.recentDate, { color: THEME.textDark, marginTop: 2 }]}>
                      {item.shelf_life_label || item.notes || 'No recommendation'}
                    </Text>
                  </View>
                </View>
                <View style={styles.gradeContainer}>
                  <Text style={[styles.gradeValue, { 
                    color: item.grade === 'A' ? '#4CAF50' : (item.grade === 'B' ? '#FFC107' : '#FF5252') 
                  }]}>
                    {item.grade || '-'}
                  </Text>
                </View>
              </Surface>
            ))
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerContainer: {
    height: 110, // Reduced further
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0, // Minimized padding
    zIndex: 10,
  },
  patternCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  patternCircle3: {
    position: 'absolute',
    top: 40,
    left: '40%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    backgroundColor: THEME.surface,
  },
  avatarLabel: {
    color: THEME.primary,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.success,
    borderWidth: 1.5,
    borderColor: THEME.primary,
  },
  greeting: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 0,
  },
  username: {
    color: THEME.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  logoutBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  blurBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  envCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: THEME.white,
  },
  envGradient: {
    padding: 14,
  },
  envTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  envRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  envLocationText: {
    marginLeft: 8,
    color: THEME.textDark,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  envRefreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(199,21,133,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  envBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  envWeatherText: {
    marginLeft: 8,
    color: THEME.textLight,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  envErrorText: {
    marginTop: 10,
    color: '#D63031',
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10, // Removed negative margin to fix overlap
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: THEME.white,
  },
  statGradient: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.textLight,
    fontWeight: '500',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  scanWrapper: {
    marginTop: 20,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonContainer: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: THEME.primary,
    opacity: 0.2,
    transform: [{ scale: 1.1 }],
  },
  scanButtonOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  scanButtonInner: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: THEME.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  scanText: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.primary,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  seedPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seed: {
    position: 'absolute',
    width: 4,
    height: 6,
    backgroundColor: THEME.seeds,
    borderRadius: 3,
  },
  tipsSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: THEME.textLight,
    marginTop: 5, // Fixed negative margin
    marginBottom: 10,
  },
  seeAllText: {
    color: THEME.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  tipsScroll: {
    paddingLeft: 20,
  },
  tipCard: {
    width: 140,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  tipGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  tipIcon: {
    opacity: 0.9,
  },
  tipTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recentSection: {
    paddingHorizontal: 20,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: THEME.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  recentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  recentImage: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: '#f0f0f0',
  },
  emoji: {
    fontSize: 22,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 12,
    color: THEME.textLight,
    fontWeight: '500',
  },
  gradeContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    flexShrink: 0,
  },
  gradeValue: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
