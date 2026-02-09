import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, ActivityIndicator } from 'react-native-paper';
import { View, Text, StyleSheet } from 'react-native';
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
            iconName = focused ? 'funnel' : 'funnel-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'User') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#C71585',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home">
        {props => <HomeScreen {...props} user={user} onLogout={handleLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Scan">
        {props => <ScanScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Sorting">
        {props => <SortingGradingScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Chat">
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
