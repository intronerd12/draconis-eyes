import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, Button, Surface, Avatar, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateUser, uploadUserAvatar } from '../services/api';

const THEME = {
  primary: '#C71585',
  primaryDark: '#8B008B',
  white: '#FFFFFF',
  background: '#F0F2F5',
  textDark: '#2D3436',
  textLight: '#636E72',
  error: '#FF5252',
};

export default function EditProfileScreen({ route, navigation, onUpdateUser }) {
  const { user } = route.params;
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || null); // Expecting URI or null
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant camera roll permissions to change your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      let currentAvatarUrl = user.avatar;

      // 1. Upload avatar if changed (local URI)
      if (avatar && avatar !== user.avatar && (!user.avatar || avatar !== user.avatar)) {
         // If it's a local file (starts with file:// or content:// or doesn't start with http)
         if (!avatar.startsWith('http')) {
             const uploadResult = await uploadUserAvatar(user._id, avatar);
             currentAvatarUrl = uploadResult.avatar;
         }
      }

      // 2. Update other details
      const updateData = {
        name,
        email,
        avatar: currentAvatarUrl
      };
      
      const finalUser = await updateUser(user._id, updateData);

      await onUpdateUser(finalUser);
      navigation.goBack();
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[THEME.primaryDark, THEME.primary]}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} /> 
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <Avatar.Text 
                size={120} 
                label={name ? name.substring(0, 2).toUpperCase() : 'DV'} 
                style={{ backgroundColor: THEME.primary }}
                labelStyle={{ color: THEME.white, fontSize: 40 }}
              />
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={20} color={THEME.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </View>

        <Surface style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              mode="outlined"
              outlineColor="#E0E0E0"
              activeOutlineColor={THEME.primary}
              style={styles.input}
              left={<TextInput.Icon icon="account-outline" color={THEME.textLight} />}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              outlineColor="#E0E0E0"
              activeOutlineColor={THEME.primary}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email-outline" color={THEME.textLight} />}
            />
          </View>
        </Surface>

          <Button 
            mode="contained" 
            onPress={handleSave} 
            style={styles.saveButton}
            contentStyle={{ height: 50 }}
            loading={loading}
            disabled={loading}
            buttonColor={THEME.primary}
            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
          >
            Save Changes
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: THEME.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.white,
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: THEME.white,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: THEME.primaryDark,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: THEME.white,
  },
  changePhotoText: {
    marginTop: 12,
    color: THEME.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  formSection: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: THEME.white,
    elevation: 2,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAFAFA',
  },
  saveButton: {
    borderRadius: 12,
    elevation: 4,
  },
});
