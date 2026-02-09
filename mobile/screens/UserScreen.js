import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text, Avatar, Surface, Button, Title, Paragraph, Dialog, Portal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Consistent Theme Palette
const THEME = {
  primary: '#C71585', // Deep Pink
  primaryDark: '#8B008B', // Dark Magenta
  primaryLight: '#FF69B4', // Hot Pink
  secondary: '#FFC0CB', // Pink
  accent: '#00FA9A', // Medium Spring Green
  white: '#FFFFFF',
  textDark: '#2D3436',
  textLight: '#636E72',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  error: '#FF5252',
};

export default function UserScreen({ navigation, user, onLogout, onUpdateUser }) {
  const insets = useSafeAreaInsets();
  const [logoutVisible, setLogoutVisible] = React.useState(false);

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

  const MENU_SECTIONS = [
    {
      title: 'Account Settings',
      items: [
        { id: 'edit_profile', icon: 'person-outline', title: 'Edit Profile', subtitle: 'Update your personal information', route: 'EditProfile' },
        { id: 'notifications', icon: 'notifications-outline', title: 'Notifications', subtitle: 'Manage your alerts' },
        { id: 'privacy', icon: 'shield-checkmark-outline', title: 'Privacy & Security', subtitle: 'Password, 2FA' },
      ]
    },
    {
      title: 'Support',
      items: [
        { id: 'help', icon: 'help-circle-outline', title: 'Help Center' },
        { id: 'contact', icon: 'mail-outline', title: 'Contact Us' },
      ]
    }
  ];

  const MenuItem = ({ icon, title, subtitle, onPress, color = THEME.textDark }) => (
    <TouchableOpacity onPress={onPress} style={styles.menuItem}>
      <View style={[styles.menuIcon, { backgroundColor: '#F0F2F5' }]}>
        <Ionicons name={icon} size={24} color={THEME.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Profile Section */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[THEME.primaryDark, THEME.primary]}
            style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {user?.avatar ? (
                  <Avatar.Image 
                    size={80} 
                    source={{ uri: user.avatar }} 
                    style={{ backgroundColor: THEME.white }}
                  />
                ) : (
                  <Avatar.Text 
                    size={80} 
                    label={user?.name ? user.name.substring(0, 2).toUpperCase() : 'DV'} 
                    style={{ backgroundColor: THEME.white }}
                    labelStyle={{ color: THEME.primary, fontWeight: 'bold', fontSize: 28 }}
                  />
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="pencil" size={14} color={THEME.white} />
                </View>
              </View>
              <Text style={styles.userName}>{user?.name || 'Dragon Tamer'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'dragon@example.com'}</Text>
            </View>

            {/* Stats Overview */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Scans</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>A</Text>
                <Text style={styles.statLabel}>Avg Grade</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>Pro</Text>
                <Text style={styles.statLabel}>Plan</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Menu Options */}
        <View style={styles.contentContainer}>
          <Surface style={styles.section} elevation={1}>
            <Text style={styles.sectionHeader}>Account Settings</Text>
            <MenuItem 
              icon="person-outline" 
              title="Edit Profile" 
              subtitle="Update your personal information"
              onPress={() => navigation.navigate('EditProfile', { user })}
            />
            <MenuItem 
              icon="notifications-outline" 
              title="Notifications" 
              subtitle="Manage your alerts"
            />
            <MenuItem 
              icon="shield-checkmark-outline" 
              title="Privacy & Security" 
              subtitle="Password, 2FA"
            />
          </Surface>

          <Surface style={styles.section} elevation={1}>
            <Text style={styles.sectionHeader}>Support</Text>
            <MenuItem 
              icon="help-circle-outline" 
              title="Help Center" 
            />
            <MenuItem 
              icon="mail-outline" 
              title="Contact Us" 
            />
          </Surface>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogoutPress}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Logout Dialog */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerContainer: {
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: THEME.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerGradient: {
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: THEME.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    height: '60%',
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.white,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: THEME.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 16,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6F8',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.textDark,
  },
  menuSubtitle: {
    fontSize: 12,
    color: THEME.textLight,
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 10,
    padding: 16,
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  logoutText: {
    color: THEME.error,
    fontWeight: 'bold',
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 30,
    color: THEME.textLight,
    fontSize: 12,
  },
});
