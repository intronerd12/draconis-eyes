
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert, Image, ScrollView } from 'react-native';
import { Text, ActivityIndicator, Button as PaperButton, Card, Title, Paragraph, Chip, Divider, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScanService } from '../services/ScanService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function ScanScreen({ user }) {
  const navigation = useNavigation();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

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
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ textAlign: 'center', color: 'white', marginBottom: 20 }}>
          We need your permission to show the camera
        </Text>
        <PaperButton onPress={requestPermission} mode="contained">Grant Permission</PaperButton>
        <PaperButton
          onPress={() => handlePickFromGallery()}
          mode="outlined"
          textColor="#FFF"
          style={{ marginTop: 12, borderColor: 'rgba(255,255,255,0.6)' }}
        >
          Upload From Gallery
        </PaperButton>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ marginTop: 20 }}>
          <Text style={{ color: 'white' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function analyzeAndSave(imageUri) {
    if (scanning) return;

    setScanning(true);
    try {
      // Analyze Image
      const result = await ScanService.analyzeImage(imageUri);

      // Save to History (scoped by user)
      const savedScan = await ScanService.addScan(
        {
          ...result,
          imageUri, // Save local URI for display; ScanService moves it to permanent storage
        },
        { user }
      );

      setScanResult({ ...result, imageUri: savedScan?.imageUri || imageUri });
    } catch (error) {
      console.error(error);
      Alert.alert('Scan Error', 'Could not analyze image. Please try again.');
    } finally {
      setScanning(false);
    }
  }

  async function handleScan() {
    if (scanning) return;
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      await analyzeAndSave(photo.uri);
    } catch (error) {
      console.error(error);
      Alert.alert('Camera Error', 'Could not capture image. Please try again.');
    }
  }

  async function handlePickFromGallery() {
    if (scanning) return;

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Please allow photo library access to upload an image.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 0.7,
        exif: false,
      });

      if (pickerResult.canceled) return;
      const asset = pickerResult.assets?.[0];
      const uri = asset?.uri;
      if (!uri) {
        Alert.alert('Upload Error', 'No image was selected.');
        return;
      }

      await analyzeAndSave(uri);
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Error', 'Could not open gallery. Please try again.');
    }
  }

  const handleReset = () => {
    setScanResult(null);
    setScanning(false);
  };

  const handleSendForTraining = async () => {
    if (!scanResult?.imageUri) return;
    if (scanning) return;

    Alert.alert(
      'Help Improve AI',
      'Send this image to improve future scan accuracy? This will upload the image to the server for training.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'default',
          onPress: async () => {
            setScanning(true);
            try {
              await ScanService.uploadTrainingSample(scanResult.imageUri, { source: 'mobile_opt_in' });
              Alert.alert('Thank you', 'Uploaded successfully. This will help improve the model.');
            } catch (e) {
              Alert.alert('Upload Failed', e?.message || 'Could not upload this image.');
            } finally {
              setScanning(false);
            }
          },
        },
      ]
    );
  };

  const formatPesoPerKg = (amount) => {
    const value = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isFinite(value)) return '₱0.00/kg';
    return `₱${value.toFixed(2)}/kg`;
  };

  // --- RESULT VIEW ---
  if (scanResult) {
    const segPreviewUri =
      scanResult.segmentation_preview_base64
        ? `data:image/jpeg;base64,${scanResult.segmentation_preview_base64}`
        : null;

    const recommendations = Array.isArray(scanResult.recommendations) ? scanResult.recommendations : [];
    const q = scanResult.image_quality;
    const qualityTips = [];
    if (q && typeof q === 'object') {
      if (typeof q.blur === 'number' && q.blur < 25) qualityTips.push('Image looks blurry. Hold steady and tap to focus.');
      if (typeof q.brightness === 'number' && q.brightness < 0.08) qualityTips.push('Image is too dark. Use brighter light.');
      if (typeof q.brightness === 'number' && q.brightness > 0.98) qualityTips.push('Image is too bright. Avoid glare and direct flash.');
    }

    return (
      <View style={styles.resultContainer}>
        <LinearGradient
          colors={['#C71585', '#000000']}
          style={styles.resultHeader}
        >
          <TouchableOpacity onPress={handleReset} style={styles.closeBtn}>
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.resultTitle}>Analysis Complete</Text>
          <View style={{ width: 30 }} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.resultContent}>
          {scanResult.is_valid_fruit === false && (
            <Surface style={styles.warningCard} elevation={4}>
              <View style={styles.warningContent}>
                <Ionicons name="alert-circle" size={32} color="#FFF" />
                <Text style={styles.warningText}>
                  {scanResult.warning_message || "Warning: The picture is not a dragon fruit."}
                </Text>
              </View>
            </Surface>
          )}

          <Image source={{ uri: scanResult.imageUri }} style={styles.resultImage} />
          {segPreviewUri && (
            <Card style={styles.resultCard}>
              <Card.Title title="Segmentation Preview" />
              <Card.Content>
                <Image source={{ uri: segPreviewUri }} style={styles.segmentationImage} />
                <View style={styles.segMetaRow}>
                  <Chip icon="crop" style={styles.chip}>
                    Area {Math.round((scanResult.fruit_area_ratio || 0) * 100)}%
                  </Chip>
                  <Chip icon="ruler" style={styles.chip}>
                    {scanResult.size_category}
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          )}
          
          <Card style={styles.resultCard}>
            <Card.Content>
              <View style={styles.gradeContainer}>
                <View>
                  <Title style={styles.gradeLabel}>Grade</Title>
                  <Text
                    style={[
                      styles.gradeValue,
                      {
                        color:
                          scanResult.grade === 'A'
                            ? '#4CAF50'
                            : scanResult.grade === 'B'
                              ? '#FFC107'
                              : scanResult.grade === 'C'
                                ? '#FF5252'
                                : '#B0BEC5',
                      },
                    ]}
                  >
                    {scanResult.grade}
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Est. Price</Text>
                  <Text style={styles.priceValue}>{formatPesoPerKg(scanResult.estimated_price_per_kg)}</Text>
                </View>
              </View>

              <Divider style={{ marginVertical: 10 }} />
              
              <Title style={{ fontSize: 18, marginBottom: 5 }}>{scanResult.fruit_type}</Title>
              <Paragraph style={{ color: '#666' }}>{scanResult.notes}</Paragraph>

              <View style={styles.tagsContainer}>
                <Chip icon="clock" style={styles.chip}>{scanResult.shelf_life_label}</Chip>
                <Chip icon="shape" style={styles.chip}>{scanResult.size_category}</Chip>
                {scanResult.market_value_label && (
                  <Chip icon="tag" style={styles.chip}>{scanResult.market_value_label}</Chip>
                )}
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.resultCard}>
            <Card.Title title="Detailed Analysis" />
            <Card.Content>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Approx. Weight:</Text>
                <Text style={styles.detailValue}>{scanResult.weight_grams_est} g</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sorting Lane:</Text>
                <Text style={styles.detailValue}>{scanResult.sorting_lane || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ripeness Score:</Text>
                <Text style={styles.detailValue}>{scanResult.ripeness_score}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quality Score:</Text>
                <Text style={styles.detailValue}>{scanResult.quality_score}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Wings Condition:</Text>
                <Text style={styles.detailValue}>{scanResult.wings_condition}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shape Quality:</Text>
                <Text style={styles.detailValue}>{scanResult.shape_quality}</Text>
              </View>
              {scanResult.color_analysis && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Color:</Text>
                  <Text style={styles.detailValue}>
                    R {scanResult.color_analysis.r} / G {scanResult.color_analysis.g} / B {scanResult.color_analysis.b}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Disease Status:</Text>
                <Text style={[styles.detailValue, { color: scanResult.defect_level === 'high' ? 'red' : 'black' }]}>
                  {scanResult.disease_status}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {(qualityTips.length > 0 || (q && typeof q === 'object')) && (
            <Card style={styles.resultCard}>
              <Card.Title title="Image Quality" />
              <Card.Content>
                {qualityTips.length > 0 ? (
                  qualityTips.map((t, idx) => (
                    <View key={`qt-${idx}`} style={styles.tipRow}>
                      <Ionicons name="information-circle-outline" size={18} color="#C71585" />
                      <Text style={styles.tipText}>{t}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.tipText}>Image quality looks good.</Text>
                )}
                <Divider style={{ marginVertical: 10 }} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Brightness:</Text>
                  <Text style={styles.detailValue}>
                    {typeof q?.brightness === 'number' ? q.brightness.toFixed(2) : '—'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Blur:</Text>
                  <Text style={styles.detailValue}>
                    {typeof q?.blur === 'number' ? Math.round(q.blur) : '—'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contrast:</Text>
                  <Text style={styles.detailValue}>
                    {typeof q?.contrast === 'number' ? q.contrast.toFixed(2) : '—'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Saturation:</Text>
                  <Text style={styles.detailValue}>
                    {typeof q?.saturation === 'number' ? q.saturation.toFixed(2) : '—'}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

          {recommendations.length > 0 && (
            <Card style={styles.resultCard}>
              <Card.Title title="Recommendations & Preventive Measures" />
              <Card.Content>
                {recommendations.map((t, idx) => (
                  <View key={`rec-${idx}`} style={styles.tipRow}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#2E7D32" />
                    <Text style={styles.tipText}>{t}</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          <PaperButton
            mode="outlined"
            onPress={handleSendForTraining}
            disabled={scanning}
            style={styles.helpImproveBtn}
            textColor="#C71585"
          >
            Help Improve Results (Send Image)
          </PaperButton>

          <PaperButton 
            mode="contained" 
            onPress={handleReset} 
            style={styles.scanAgainBtn}
            buttonColor="#C71585"
          >
            Scan Another
          </PaperButton>
        </ScrollView>
      </View>
    );
  }

  // --- CAMERA VIEW ---
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />

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

        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={handlePickFromGallery}
            disabled={scanning}
            style={styles.sideActionBtn}
            accessibilityRole="button"
            accessibilityLabel="Upload from gallery"
          >
            <Ionicons name="images-outline" size={26} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleScan} disabled={scanning} accessibilityRole="button" accessibilityLabel="Capture photo">
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

          <View style={styles.sideActionBtn} />
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
    marginTop: 20,
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
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    marginBottom: 20,
  },
  sideActionBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnCore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  },
  // Result Styles
  resultContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  resultHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  resultTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resultContent: {
    padding: 20,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 20,
  },
  segmentationImage: {
    width: '100%',
    height: 210,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F0F0F0',
  },
  segMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  warningCard: {
    backgroundColor: '#FF5252',
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  warningContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  resultCard: {
    marginBottom: 15,
    borderRadius: 15,
    elevation: 4,
  },
  gradeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: 16,
    color: '#888',
  },
  gradeValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 14,
    color: '#888',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  chip: {
    backgroundColor: '#E3F2FD',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 5,
  },
  detailLabel: {
    color: '#666',
    fontSize: 14,
  },
  detailValue: {
    fontWeight: '600',
    fontSize: 14,
    maxWidth: '60%',
    textAlign: 'right',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  tipText: {
    flex: 1,
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
  scanAgainBtn: {
    marginTop: 10,
    marginBottom: 30,
    paddingVertical: 8,
    borderRadius: 25,
  },
  helpImproveBtn: {
    marginTop: 14,
    borderColor: 'rgba(199, 21, 133, 0.45)',
    borderWidth: 1,
    borderRadius: 16,
  },
});
