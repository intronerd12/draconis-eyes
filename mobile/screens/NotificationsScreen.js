import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, Switch, Divider, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const THEME = {
  primary: '#C71585',
  primaryDark: '#8B008B',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textDark: '#2D3436',
  textLight: '#636E72',
};

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  const [preferences, setPreferences] = useState({
    pushEnabled: true,
    emailEnabled: true,
    scanUpdates: true,
    marketing: false,
    tips: true,
    securityAlerts: true,
  });

  const toggleSwitch = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingItem = ({ icon, title, subtitle, value, onToggle }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color={THEME.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        color={THEME.primary}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionHeader}>General</Text>
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Receive push alerts on your device"
            value={preferences.pushEnabled}
            onToggle={() => toggleSwitch('pushEnabled')}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="mail"
            title="Email Alerts"
            subtitle="Receive updates via email"
            value={preferences.emailEnabled}
            onToggle={() => toggleSwitch('emailEnabled')}
          />
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionHeader}>Activity</Text>
          <SettingItem
            icon="scan-circle"
            title="Scan Updates"
            subtitle="When your scan analysis is ready"
            value={preferences.scanUpdates}
            onToggle={() => toggleSwitch('scanUpdates')}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="shield-checkmark"
            title="Security Alerts"
            subtitle="Login attempts and password changes"
            value={preferences.securityAlerts}
            onToggle={() => toggleSwitch('securityAlerts')}
          />
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionHeader}>Updates & Tips</Text>
          <SettingItem
            icon="bulb"
            title="Tips & Tutorials"
            subtitle="Helpful guides for better scanning"
            value={preferences.tips}
            onToggle={() => toggleSwitch('tips')}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="pricetag"
            title="Marketing"
            subtitle="New features and promotional offers"
            value={preferences.marketing}
            onToggle={() => toggleSwitch('marketing')}
          />
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: THEME.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textLight,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.textDark,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: THEME.textLight,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#F0F2F5',
  },
});
