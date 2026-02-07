import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { Text, Surface, Title, Paragraph, Card, Chip, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const THEME = {
  primary: '#C71585',
  primaryDark: '#8B008B',
  primaryLight: '#FF69B4',
  secondary: '#FFC0CB',
  background: '#F0F2F5',
  white: '#FFFFFF',
  textDark: '#2D3436',
  textLight: '#636E72',
};

const GUIDES = {
  picking: {
    id: 'picking',
    title: 'How to Pick Ripe Dragon Fruit',
    subtitle: 'Select the sweetest fruit every time',
    icon: 'nutrition',
    color: '#FF7675',
    image: 'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    content: [
      {
        heading: 'Check the Color',
        body: 'Look for bright, even-colored skin. Pink or yellow dragon fruit should be vibrant. Avoid fruit with too many dark blotches or brown spots, which indicate over-ripeness.'
      },
      {
        heading: 'Examine the "Wings"',
        body: 'The leafy projections on the fruit are called wings. They should be fresh but slightly withered at the tips. If they are brown, dry, and brittle, the fruit is likely over-ripe.'
      },
      {
        heading: 'The Squeeze Test',
        body: 'Press the fruit gently with your thumb. It should give slightly, similar to a ripe mango or avocado. If it is rock hard, it needs more time. If it is mushy, it is over-ripe.'
      }
    ]
  },
  storage: {
    id: 'storage',
    title: 'Storage & Freshness Guide',
    subtitle: 'Keep your dragon fruit fresh longer',
    icon: 'snow',
    color: '#74B9FF',
    image: 'https://images.unsplash.com/photo-1599309221886-2a781b0a7018?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    content: [
      {
        heading: 'On the Counter',
        body: 'If your dragon fruit is not yet fully ripe, leave it on the counter at room temperature. It will ripen in 1-3 days. Once ripe, eat it immediately or move it to the fridge.'
      },
      {
        heading: 'In the Refrigerator',
        body: 'Store ripe dragon fruit in the refrigerator crisper drawer. Place it in a sealed plastic bag or container to prevent it from absorbing other odors. It will stay fresh for up to 2 weeks.'
      },
      {
        heading: 'Freezing for Smoothies',
        body: 'Peel and cut the fruit into cubes. Spread them on a baking sheet to freeze individually, then transfer to a freezer-safe bag. Frozen dragon fruit is perfect for smoothies and lasts up to 3 months.'
      }
    ]
  },
  health: {
    id: 'health',
    title: 'Health Benefits & Nutrition',
    subtitle: 'Why dragon fruit is a superfood',
    icon: 'heart',
    color: '#55EFC4',
    image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    content: [
      {
        heading: 'Rich in Antioxidants',
        body: 'Dragon fruit contains betalains, hydroxycinnamates, and flavonoids. These antioxidants help protect your cells from damage by free radicals and may reduce inflammation.'
      },
      {
        heading: 'High in Fiber',
        body: 'A one-cup serving provides 7 grams of fiber, making it an excellent choice for digestive health and maintaining a healthy weight.'
      },
      {
        heading: 'Immune System Boost',
        body: 'Packed with Vitamin C, dragon fruit helps strengthen your immune system. It also contains iron and magnesium, essential minerals for energy and muscle function.'
      }
    ]
  }
};

export default function GuideScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Robustly handle initialTab param
  const initialTab = route.params?.initialTab || 'picking';
  
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Update active tab if param changes (e.g. navigating from Home with different param)
  useEffect(() => {
    if (initialTab && GUIDES[initialTab]) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    // Reset and play animation on tab change
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab]);

  const activeGuide = GUIDES[activeTab] || GUIDES.picking;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[THEME.primaryDark, THEME.primary]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dragon Guide</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {Object.values(GUIDES).map((guide) => (
            <TouchableOpacity
              key={guide.id}
              onPress={() => setActiveTab(guide.id)}
              style={[
                styles.tab,
                activeTab === guide.id && styles.activeTab,
                { borderColor: activeTab === guide.id ? guide.color : 'transparent' }
              ]}
            >
              <Ionicons 
                name={guide.icon} 
                size={20} 
                color={activeTab === guide.id ? guide.color : THEME.textLight} 
                style={{ marginRight: 8 }}
              />
              <Text style={[
                styles.tabText,
                activeTab === guide.id && { color: guide.color, fontWeight: 'bold' }
              ]}>
                {guide.title.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card style={styles.heroCard}>
            <Card.Cover source={{ uri: activeGuide.image }} style={styles.heroImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.heroGradient}
            >
              <Title style={styles.heroTitle}>{activeGuide.title}</Title>
              <Paragraph style={styles.heroSubtitle}>{activeGuide.subtitle}</Paragraph>
            </LinearGradient>
          </Card>

          <View style={styles.stepsContainer}>
            {activeGuide.content.map((section, index) => (
              <Surface key={index} style={styles.stepCard} elevation={2}>
                <View style={[styles.stepNumber, { backgroundColor: activeGuide.color }]}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Title style={styles.stepTitle}>{section.heading}</Title>
                  <Paragraph style={styles.stepBody}>{section.body}</Paragraph>
                </View>
              </Surface>
            ))}
          </View>
          
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Scan' })}
            style={[styles.actionButton, { backgroundColor: activeGuide.color }]}
            icon="barcode-scan"
          >
            Check Your Fruit Now
          </Button>
          
          <View style={{ height: 40 }} />
        </Animated.View>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  tabScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'white',
    borderWidth: 1,
    elevation: 2,
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: '#FFF',
    borderWidth: 2,
  },
  tabText: {
    color: THEME.textLight,
    fontWeight: '600',
  },
  contentScroll: {
    padding: 20,
    paddingTop: 0,
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
    elevation: 6,
  },
  heroImage: {
    height: 200,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: THEME.textDark,
  },
  stepBody: {
    fontSize: 14,
    color: THEME.textLight,
    lineHeight: 22,
  },
  actionButton: {
    marginTop: 30,
    borderRadius: 30,
    paddingVertical: 6,
    elevation: 4,
  }
});
