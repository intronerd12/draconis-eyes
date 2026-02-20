import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, ActivityIndicator } from 'react-native-paper';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import SortingGradingScreen from './screens/SortingGradingScreen';
import UserScreen from './screens/UserScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import GuideScreen from './screens/GuideScreen';
import WeatherScreen from './screens/WeatherScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import MappingEnvironmentScreen from './screens/MappingEnvironmentScreen';

import { clearEnvironmentCaches } from './services/EnvironmentService';
import { getUserNamespace, sanitizeForKey } from './services/storageScope';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const NAV_THEME = {
  active: '#214739',
  inactive: '#8EA19A',
  barBg: '#FFFFFF',
  centerBtn: '#C71585',
  centerBtnShadow: 'rgba(137, 15, 95, 0.35)',
};

function CenterScanButton({ onPress, accessibilityState }) {
  const focused = Boolean(accessibilityState?.selected);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Scan"
      activeOpacity={0.92}
      onPress={onPress}
      style={styles.scanBtnWrap}
    >
      <View style={[styles.scanBtn, focused && styles.scanBtnFocused]}>
        <Ionicons name={focused ? 'scan' : 'scan-outline'} size={30} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

function MainTabs({ user, handleLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Scan') {
            iconName = focused ? 'scan' : 'scan-outline';
          } else if (route.name === 'Sorting') {
            iconName = focused ? 'filter' : 'filter-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'User') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: NAV_THEME.active,
        tabBarInactiveTintColor: NAV_THEME.inactive,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home">
        {props => <HomeScreen {...props} user={user} onLogout={handleLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Sorting">
        {props => <SortingGradingScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Scan"
        options={{
          tabBarButton: (props) => <CenterScanButton {...props} />,
          tabBarIcon: () => null,
        }}
      >
        {props => <ScanScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Chatbot">
        {props => <ChatbotScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="User">
        {props => <UserScreen {...props} user={user} onLogout={handleLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userKey = sanitizeForKey(getUserNamespace(user)) || 'anon';

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    const prevUser = user;
    setUser(null);
    await AsyncStorage.removeItem('user');
    await clearEnvironmentCaches({ user: prevUser });
  };

  const handleUpdateUser = async (updatedUser) => {
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        {user ? (
          <Stack.Navigator key={`user:${userKey}`} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs">
              {props => <MainTabs {...props} user={user} handleLogout={handleLogout} key={`tabs:${userKey}`} />}
            </Stack.Screen>
            <Stack.Screen name="Guide" component={GuideScreen} />
            <Stack.Screen name="Weather" component={WeatherScreen} />
            <Stack.Screen name="MappingEnvironment">
              {props => <MappingEnvironmentScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="EditProfile">
              {props => <EditProfileScreen {...props} onUpdateUser={handleUpdateUser} />}
            </Stack.Screen>
          </Stack.Navigator>
        ) : (
          <AuthScreen onLogin={handleLogin} />
        )}
        <StatusBar style="auto" />
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 14,
    height: 72,
    borderTopWidth: 0,
    borderRadius: 38,
    overflow: 'visible',
    backgroundColor: NAV_THEME.barBg,
    paddingHorizontal: 10,
    paddingTop: 6,
    elevation: 16,
    shadowColor: '#172B24',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  tabBarItem: {
    paddingTop: 6,
  },
  scanBtnWrap: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: NAV_THEME.centerBtn,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: NAV_THEME.centerBtnShadow,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 4,
    borderColor: '#F3FFF2',
  },
  scanBtnFocused: {
    backgroundColor: '#A60F6D',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
