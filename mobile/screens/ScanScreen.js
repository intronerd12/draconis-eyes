import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert, Button } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScanService } from '../services/ScanService';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const navigation = useNavigation();
  const [scanning, setScanning] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [permission, requestPermission] = useCameraPermissions();

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 300,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    if (permission && permission.granted) {
      startScanAnimation();
    }
  }, [permission]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ textAlign: 'center', color: 'white', marginBottom: 20 }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ marginTop: 20 }}>
          <Text style={{ color: 'white' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = async () => {
    setScanning(true);
    
    // Simulate processing time
    setTimeout(async () => {
      try {
        // Randomly generate a result
        const grades = ['A', 'B', 'C', 'D'];
        const randomGrade = grades[Math.floor(Math.random() * grades.length)];
        
        await ScanService.addScan({
          grade: randomGrade,
          details: 'Simulated Scan Result',
          timestamp: new Date().toISOString()
        });

        Alert.alert(
          "Scan Complete",
          `Dragonfruit Quality: ${randomGrade}`,
          [
            { text: "OK", onPress: () => navigation.navigate('Home') }
          ]
        );
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Could not save scan");
      } finally {
        setScanning(false);
      }
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.cameraPreview} facing="back" />

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.closeBtn}>
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan Dragonfruit</Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          
          <Animated.View 
            style={[
              styles.scanLine, 
              { transform: [{ translateY: scanLineAnim }] }
            ]} 
          />
        </View>

        <Text style={styles.instruction}>Align dragonfruit within frame</Text>

        <View style={styles.controls}>
          <TouchableOpacity onPress={handleScan} disabled={scanning}>
            <View style={styles.captureBtnOuter}>
              <View style={styles.captureBtnInner}>
                {scanning ? (
                  <ActivityIndicator color="#C71585" />
                ) : (
                  <View style={styles.captureBtnCore} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPreview: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  simulationText: {
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeBtn: {
    padding: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scanArea: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#C71585',
    borderWidth: 4,
  },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  scanLine: {
    height: 2,
    backgroundColor: '#00FA9A',
    width: '100%',
    shadowColor: '#00FA9A',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  instruction: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  controls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  captureBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
});
