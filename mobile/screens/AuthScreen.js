import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions,
  Image,
  Alert,
  Modal
} from 'react-native';
import { TextInput, Button, Text, HelperText, Surface, ActivityIndicator, Portal, Dialog, Paragraph } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, verifyEmail } from '../services/api';

const { width, height } = Dimensions.get('window');

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

export default function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: 'Success!',
    message: 'Your account has been created successfully. Please sign in to continue.',
    action: null
  });
  
  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const validateForm = () => {
    if (!isLogin && !name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setError('Please enter your password');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await loginUser(email, password);
        
        // Save user to storage
        await AsyncStorage.setItem('user', JSON.stringify(data));
        
        // Notify parent component
        if (onLogin) {
          onLogin(data);
        }
      } else {
        data = await registerUser(name, email, password);
        
        if (data.requiresVerification) {
          setSuccessMessage({
            title: 'Registration Successful',
            message: 'Registered successfully! Please check your email first for verification.',
            action: 'verify'
          });
          setSuccessVisible(true);
        } else {
          setSuccessMessage({
            title: 'Success!',
            message: 'Your account has been created successfully. Please sign in to continue.',
            action: 'login'
          });
          setSuccessVisible(true);
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyEmail(email, verificationCode);
      
      // Save user to storage (auto-login after verification)
      await AsyncStorage.setItem('user', JSON.stringify(data));
      
      setSuccessMessage({
        title: 'Success!',
        message: 'Email verified successfully! Logging you in...',
        action: null
      });
      setSuccessVisible(true);
      
      // Delay slightly to show success message before navigating
      setTimeout(() => {
        setSuccessVisible(false);
        if (onLogin) {
          onLogin(data);
        }
      }, 1500);
      
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Decorative Header Background */}
      <View style={styles.headerBackground}>
        <LinearGradient
          colors={[THEME.primaryDark, THEME.primary, THEME.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
        </LinearGradient>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Content */}
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Text style={{ fontSize: 48 }}>🐲</Text>
            </View>
            <Text style={styles.appTitle}>Dragon Vision</Text>
            <Text style={styles.appTagline}>Identify. Analyze. Grade.</Text>
          </View>

          {/* Auth Card */}
          <Surface style={styles.authCard} elevation={4}>
            {isVerifying ? (
              // VERIFICATION VIEW
              <View>
                <View style={styles.authHeader}>
                  <Text style={styles.authTitle}>Verify Email</Text>
                  <Text style={styles.authSubtitle}>
                    Enter the code sent to {email}
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Verification Code"
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      mode="outlined"
                      outlineColor="#E0E0E0"
                      activeOutlineColor={THEME.primary}
                      style={[styles.input, { textAlign: 'center', letterSpacing: 5, fontSize: 24 }]}
                      maxLength={6}
                      keyboardType="default"
                      autoCapitalize="characters"
                      theme={{ roundness: 12 }}
                    />
                  </View>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={20} color={THEME.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={handleVerify}
                    disabled={loading}
                    style={styles.submitButtonContainer}
                  >
                    <LinearGradient
                      colors={[THEME.primary, THEME.primaryLight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButton}
                    >
                      {loading ? (
                        <ActivityIndicator color={THEME.white} size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>Verify Email</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => {
                      setIsVerifying(false);
                      setError('');
                    }}
                    style={[styles.switchButton, { marginTop: 20 }]}
                  >
                    <Text style={styles.switchText}>
                      Entered wrong email? <Text style={styles.switchTextBold}>Go Back</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // LOGIN / REGISTER VIEW
              <View>
                <View style={styles.authHeader}>
                  <Text style={styles.authTitle}>
                    {isLogin ? 'Welcome Back' : 'Get Started'}
                  </Text>
                  <Text style={styles.authSubtitle}>
                    {isLogin ? 'Sign in to continue' : 'Create a new account'}
                  </Text>
                </View>

                <View style={styles.form}>
                  {!isLogin && (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Full Name"
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        outlineColor="#E0E0E0"
                        activeOutlineColor={THEME.primary}
                        style={styles.input}
                        left={<TextInput.Icon icon="account-outline" color={THEME.textLight} />}
                        theme={{ roundness: 12 }}
                      />
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      mode="outlined"
                      outlineColor="#E0E0E0"
                      activeOutlineColor={THEME.primary}
                      style={styles.input}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      left={<TextInput.Icon icon="email-outline" color={THEME.textLight} />}
                      theme={{ roundness: 12 }}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      mode="outlined"
                      outlineColor="#E0E0E0"
                      activeOutlineColor={THEME.primary}
                      secureTextEntry={secureTextEntry}
                      style={styles.input}
                      left={<TextInput.Icon icon="lock-outline" color={THEME.textLight} />}
                      right={
                        <TextInput.Icon 
                          icon={secureTextEntry ? "eye-off" : "eye"} 
                          color={THEME.textLight}
                          onPress={() => setSecureTextEntry(!secureTextEntry)} 
                        />
                      }
                      theme={{ roundness: 12 }}
                    />
                  </View>

                  {!isLogin && (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        mode="outlined"
                        outlineColor="#E0E0E0"
                        activeOutlineColor={THEME.primary}
                        secureTextEntry={secureConfirmTextEntry}
                        style={styles.input}
                        left={<TextInput.Icon icon="lock-check-outline" color={THEME.textLight} />}
                        right={
                          <TextInput.Icon 
                            icon={secureConfirmTextEntry ? "eye-off" : "eye"} 
                            color={THEME.textLight}
                            onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)} 
                          />
                        }
                        theme={{ roundness: 12 }}
                      />
                    </View>
                  )}

                  {error ? (
                    <View style={[
                      styles.errorContainer,
                      error === 'No user found' && styles.warningContainer,
                      error.includes('verify') && styles.infoContainer
                    ]}>
                      <Ionicons 
                        name={
                          error === 'No user found' ? "person-remove-outline" : 
                          error.includes('verify') ? "mail-unread-outline" : "alert-circle"
                        } 
                        size={20} 
                        color={
                          error === 'No user found' ? "#F57C00" : 
                          error.includes('verify') ? "#0288D1" : THEME.error
                        } 
                      />
                      <Text style={[
                        styles.errorText,
                        error === 'No user found' && styles.warningText,
                        error.includes('verify') && styles.infoText
                      ]}>
                        {error === 'No user found' 
                          ? "No account found with this email. Please sign up first." 
                          : error}
                      </Text>
                    </View>
                  ) : null}

                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                    disabled={loading}
                    style={styles.submitButtonContainer}
                  >
                    <LinearGradient
                      colors={[THEME.primary, THEME.primaryLight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButton}
                    >
                      {loading ? (
                        <ActivityIndicator color={THEME.white} size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          {isLogin ? 'Sign In' : 'Create Account'}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.divider} />
                  </View>

                  <TouchableOpacity 
                    onPress={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setConfirmPassword('');
                    }}
                    style={styles.switchButton}
                  >
                    <Text style={styles.switchText}>
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <Text style={styles.switchTextBold}>
                        {isLogin ? "Sign Up" : "Sign In"}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog visible={successVisible} onDismiss={() => setSuccessVisible(false)} style={{ backgroundColor: 'white', borderRadius: 16 }}>
          <View style={{ alignItems: 'center', padding: 20 }}>
            <View style={{ 
              width: 60, 
              height: 60, 
              borderRadius: 30, 
              backgroundColor: '#E8F5E9', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 16
            }}>
              <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#2D3436' }}>{successMessage.title}</Text>
            <Paragraph style={{ textAlign: 'center', color: '#636E72', marginBottom: 20 }}>
              {successMessage.message}
            </Paragraph>
            <Button 
              mode="contained" 
              onPress={() => {
                setSuccessVisible(false);
                if (successMessage.action === 'verify') {
                  setIsVerifying(true);
                }
              }}
              style={{ borderRadius: 24, width: '100%' }}
              buttonColor={THEME.primary}
            >
              Got it
            </Button>
          </View>
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
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
    overflow: 'hidden',
  },
  gradientHeader: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
  },
  patternCircle1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternCircle2: {
    position: 'absolute',
    top: 50,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: height * 0.08,
    marginBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  authCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: THEME.white,
    paddingVertical: 30,
    paddingHorizontal: 24,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    // Elevation for Android
    elevation: 8,
  },
  authHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.textDark,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 15,
    color: THEME.textLight,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: THEME.white,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: THEME.error,
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  warningContainer: {
    backgroundColor: '#FFF3E0', // Light Orange
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  warningText: {
    color: '#E65100', // Dark Orange
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#E1F5FE', // Light Blue
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  infoText: {
    color: '#0277BD', // Dark Blue
    fontWeight: '500',
  },
  submitButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: THEME.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9E9E9E',
    fontSize: 12,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    padding: 8,
  },
  switchText: {
    fontSize: 14,
    color: THEME.textLight,
  },
  switchTextBold: {
    color: THEME.primary,
    fontWeight: 'bold',
  },
});
