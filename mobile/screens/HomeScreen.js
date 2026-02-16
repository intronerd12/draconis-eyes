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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { ScanService } from '../services/ScanService';

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
  { id: 1, key: 'picking', title: 'Picking Ripe Fruit', icon: 'nutrition', color: '#FF7675' },
  { id: 2, key: 'storage', title: 'Storage Tips', icon: 'snow', color: '#74B9FF' },
  { id: 3, key: 'health', title: 'Health Benefits', icon: 'heart', color: '#55EFC4' },
];

export default function HomeScreen({ user, onLogout }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [stats, setStats] = React.useState({ total: 0, best: '-', avg: '0%' });
  const [recentScans, setRecentScans] = React.useState([]);
  const [logoutVisible, setLogoutVisible] = React.useState(false);

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const s = await ScanService.getStats({ user });
    const r = await ScanService.getScans({ user });
    setStats(s);
    setRecentScans(r.slice(0, 5)); // Show top 5
  };

  const goToSorting = React.useCallback(() => {
    navigation.navigate('Sorting');
  }, [navigation]);
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
              {user?.avatar ? (
                <Avatar.Image 
                  size={48} 
                  source={{ uri: user.avatar }} 
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text 
                  size={48} 
                  label={user?.name ? user.name.substring(0, 2).toUpperCase() : 'DV'} 
                  style={styles.avatar}
                  labelStyle={styles.avatarLabel}
                />
              )}
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

        {/* Mapping & Environmental Data */}
        <View style={styles.mapEnvSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mapping & Environmental Data</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MappingEnvironment')}
              activeOpacity={0.8}
              style={styles.headerPillBtn}
            >
              <Ionicons name="open-outline" size={16} color={THEME.primary} />
              <Text style={styles.seeAllText}>Open</Text>
            </TouchableOpacity>
          </View>

          <Surface style={styles.mapEnvCard} elevation={3}>
            <LinearGradient
              colors={['#FFFFFF', '#F7F2F8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mapEnvGradient}
            >
              <View style={styles.mapEnvTopRow}>
                <View style={styles.mapEnvIcon}>
                  <Ionicons name="earth-outline" size={22} color={THEME.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mapEnvHeadline}>Location insights for your farm</Text>
                  <Text style={styles.mapEnvSubtext} numberOfLines={2}>
                    Forecast, suitability, and mapping tools in one dashboard.
                  </Text>
                </View>
              </View>

              <View style={styles.mapEnvActionsRow}>
                <TouchableOpacity
                  style={[styles.mapEnvAction, { backgroundColor: '#E3F2FD' }]}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('MappingEnvironment', { openMap: true })}
                >
                  <Ionicons name="map-outline" size={18} color="#1565C0" />
                  <Text style={styles.mapEnvActionText}>Mapping</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mapEnvAction, { backgroundColor: '#E8F5E9' }]}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Weather')}
                >
                  <Ionicons name="partly-sunny-outline" size={18} color="#2E7D32" />
                  <Text style={styles.mapEnvActionText}>Environment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mapEnvAction, { backgroundColor: '#F3E5F5' }]}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('MappingEnvironment')}
                >
                  <Ionicons name="analytics-outline" size={18} color={THEME.primaryDark} />
                  <Text style={styles.mapEnvActionText}>Dashboard</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Surface>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pro Tips</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Guide')}
              activeOpacity={0.8}
              style={styles.headerPillBtn}
            >
              <Ionicons name="book-outline" size={16} color={THEME.primary} />
              <Text style={styles.seeAllText}>View Guide</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
            {TIPS.map((tip, index) => (
              <TouchableOpacity 
                key={tip.id} 
                style={[styles.tipCard, { marginRight: 15 }]}
                onPress={() => navigation.navigate('Guide', { initialTab: tip.key })}
              >
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
          <View style={styles.sectionHeaderTight}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity
              onPress={goToSorting}
              activeOpacity={0.8}
              style={styles.headerPillBtn}
              accessibilityRole="button"
              accessibilityLabel="View sorting and grading"
            >
              <Ionicons name="funnel-outline" size={16} color={THEME.primary} />
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentScans.length === 0 ? (
            <Paragraph style={{ textAlign: 'center', marginTop: 20, color: THEME.textLight }}>
              No scans yet. Tap the button above to start!
            </Paragraph>
          ) : (
            recentScans.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                onPress={goToSorting}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Open sorting and grading"
              >
                <Surface style={styles.recentItem} elevation={1}>
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

                  <View style={styles.recentRight}>
                    <View style={styles.gradeContainer}>
                      <Text
                        style={[
                          styles.gradeValue,
                          {
                            color:
                              item.grade === 'A'
                                ? '#4CAF50'
                                : item.grade === 'B'
                                  ? '#FFC107'
                                  : '#FF5252',
                          },
                        ]}
                      >
                        {item.grade || '-'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.35)" />
                  </View>
                </Surface>
              </TouchableOpacity>
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
    backgroundColor: '#F6F7FB',
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
  weatherBtn: {
    marginTop: 15,
    backgroundColor: '#F3E5F5',
    borderRadius: 20,
    elevation: 2,
  },
  mapEnvSection: {
    marginBottom: 25,
  },
  mapEnvCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: THEME.white,
  },
  mapEnvGradient: {
    padding: 18,
  },
  mapEnvTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  mapEnvIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mapEnvHeadline: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.textDark,
    marginBottom: 2,
  },
  mapEnvSubtext: {
    fontSize: 12.5,
    fontWeight: '500',
    color: THEME.textLight,
    lineHeight: 18,
  },
  mapEnvActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  mapEnvAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    gap: 8,
  },
  mapEnvActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.textDark,
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
  sectionHeaderTight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    fontWeight: '800',
    fontSize: 13,
  },
  headerPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(199, 21, 133, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(199, 21, 133, 0.14)',
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
  recentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
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
