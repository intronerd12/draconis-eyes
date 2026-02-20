import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Surface, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getEnvironmentalReport } from '../services/EnvironmentService';

const THEME = {
  primary: '#C71585',
  primaryDark: '#8B008B',
  textDark: '#2D3436',
  textLight: '#636E72',
  background: '#F0F2F5',
  white: '#FFFFFF',
  success: '#00B894',
  warning: '#F39C12',
  danger: '#D63031',
};

const formatDayLabel = (isoDate) => {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' });
};

const evaluateSuitability = (data) => {
  const forecast = data?.forecast;
  const currentTemp = forecast?.current?.temperatureC;
  const days = Array.isArray(forecast?.days) ? forecast?.days : [];
  const windowDays = days.slice(0, 3);

  const minTemps = windowDays.map((d) => d?.minTempC).filter((v) => typeof v === 'number');
  const maxTemps = windowDays.map((d) => d?.maxTempC).filter((v) => typeof v === 'number');
  const precip = windowDays.map((d) => d?.precipitationMm).filter((v) => typeof v === 'number');

  const minMin = minTemps.length ? Math.min(...minTemps) : null;
  const maxMax = maxTemps.length ? Math.max(...maxTemps) : null;
  const precipSum = precip.length ? precip.reduce((a, b) => a + b, 0) : null;

  const flags = {
    tooCold: minMin != null && minMin < 10,
    chilly: minMin != null && minMin >= 10 && minMin < 15,
    tooHot: maxMax != null && maxMax > 35,
    heavyRain: precipSum != null && precipSum >= 50,
  };

  if (flags.tooCold) {
    return {
      status: 'Not suitable',
      color: THEME.danger,
      summary: 'Forecast shows very low night temperatures.',
      tips: ['Protect plants from cold', 'Avoid transplanting this week', 'Use mulching or covers'],
    };
  }

  if (flags.chilly || flags.tooHot || flags.heavyRain) {
    return {
      status: 'Caution',
      color: THEME.warning,
      summary: 'Conditions may stress dragonfruit plants.',
      tips: [
        flags.chilly ? 'Provide windbreaks or covers at night' : 'Maintain stable irrigation',
        flags.tooHot ? 'Provide shade during peak heat' : 'Monitor soil moisture',
        flags.heavyRain ? 'Improve drainage to prevent root issues' : 'Watch for pests and disease',
      ],
    };
  }

  return {
    status: 'Suitable',
    color: THEME.success,
    summary: 'Temperature and rainfall look generally favorable.',
    tips: ['Maintain regular irrigation', 'Check trellis support', 'Monitor for pests'],
  };
};

export default function MappingEnvironmentScreen({ navigation, route, user }) {
  const insets = useSafeAreaInsets();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const didAutoOpenMap = useRef(false);

  const loadReport = async ({ force } = { force: false }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEnvironmentalReport({ force, user });
      setReport(data);
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? e.message : null;
      setError(typeof msg === 'string' ? msg : 'Unable to load environmental data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport({ force: true });
  }, []);

  const openInMaps = async () => {
    const lat = report?.coords?.latitude;
    const lon = report?.coords?.longitude;
    if (typeof lat !== 'number' || typeof lon !== 'number') return;

    const label = encodeURIComponent(report?.place?.label || 'Current Location');
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?ll=${lat},${lon}&q=${label}`
        : Platform.OS === 'android'
          ? `geo:${lat},${lon}?q=${lat},${lon}(${label})`
          : `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

    try {
      await Linking.openURL(url);
    } catch {
      return;
    }
  };

  const suitability = useMemo(() => evaluateSuitability(report), [report]);

  useEffect(() => {
    const wantsMap = route?.params?.openMap === true;
    if (!wantsMap) return;
    if (didAutoOpenMap.current) return;

    const lat = report?.coords?.latitude;
    const lon = report?.coords?.longitude;
    if (typeof lat !== 'number' || typeof lon !== 'number') return;

    didAutoOpenMap.current = true;
    openInMaps();
  }, [route?.params?.openMap, report]);

  const locationName = report?.place?.name || report?.place?.label?.split(',')[0] || 'Unknown Location';
  const province = report?.place?.province || '-';
  const country = report?.place?.country || '';
  const fullLocation = [province, country].filter(Boolean).join(', ');
  
  const current = report?.forecast?.current;
  const days = Array.isArray(report?.forecast?.days) ? report.forecast.days : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => {
                if (navigation?.canGoBack?.()) navigation.goBack();
              }}
              style={styles.backButton}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={THEME.textDark} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.screenTitle}>Mapping & Environmental Data</Text>
              <Text style={styles.screenSubtitle}>Real-time location insights</Text>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </View>

        {/* Location Card */}
        <Surface style={styles.locationCard} elevation={4}>
          <LinearGradient
            colors={[THEME.primaryDark, THEME.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.locationGradient}
          >
            <View style={styles.locationHeader}>
              <View>
                <Text style={styles.locationLabel}>CURRENT LOCATION</Text>
                <Text style={styles.locationName}>{locationName}</Text>
                <Text style={styles.locationRegion}>{fullLocation}</Text>
              </View>
              <View style={styles.coordsContainer}>
                 <Text style={styles.coordText}>
                   {report?.coords?.latitude?.toFixed(4) || '--'}° N
                 </Text>
                 <Text style={styles.coordText}>
                   {report?.coords?.longitude?.toFixed(4) || '--'}° E
                 </Text>
              </View>
            </View>

            <View style={styles.locationActions}>
              <TouchableOpacity 
                onPress={openInMaps} 
                style={styles.mapButton}
                activeOpacity={0.8}
              >
                <Ionicons name="map" size={20} color={THEME.primaryDark} />
                <Text style={styles.mapButtonText}>View on Map</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => loadReport({ force: true })}
                style={styles.refreshButton}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={THEME.white} />
                ) : (
                  <Ionicons name="refresh" size={20} color={THEME.white} />
                )}
              </TouchableOpacity>
            </View>
            
            {report?.fetchedAt && (
              <Text style={styles.lastUpdated}>
                Updated: {new Date(report.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </LinearGradient>
        </Surface>

        <Surface style={styles.sectionCard} elevation={2}>
          <View style={styles.sectionHeader}>
            <Ionicons name="partly-sunny-outline" size={18} color={THEME.primaryDark} />
            <Text style={styles.sectionTitle}>Current Conditions</Text>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpi}>
              <Text style={styles.kpiValue}>
                {typeof current?.temperatureC === 'number' ? `${Math.round(current.temperatureC)}°C` : '-'}
              </Text>
              <Text style={styles.kpiLabel}>Temperature</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiValue}>
                {typeof current?.windKmh === 'number' ? `${Math.round(current.windKmh)} km/h` : '-'}
              </Text>
              <Text style={styles.kpiLabel}>Wind</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiValue}>{current?.weatherLabel || '-'}</Text>
              <Text style={styles.kpiLabel}>Weather</Text>
            </View>
          </View>

          {error ? (
            <Text style={styles.errorText} numberOfLines={3}>
              {error === 'Location permission denied'
                ? 'Enable location permission to load mapping and weather forecasts.'
                : error}
            </Text>
          ) : null}
        </Surface>

        <Surface style={styles.sectionCard} elevation={2}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color={THEME.primaryDark} />
            <Text style={styles.sectionTitle}>7‑Day Forecast</Text>
          </View>

          {days.length ? (
            <View style={styles.forecastHeaderRow}>
              <Text style={[styles.forecastHeaderText, styles.forecastDay]}>Date</Text>
              <Text style={[styles.forecastHeaderText, styles.forecastTemp]}>Temp (C)</Text>
              <Text style={[styles.forecastHeaderText, styles.forecastPrecip]}>Rain (mm)</Text>
              <Text style={[styles.forecastHeaderText, styles.forecastLabel]}>Condition</Text>
            </View>
          ) : null}
          {days.length ? (
            days.map((d, idx) => (
              <View key={`${d.date || idx}`} style={[styles.forecastRow, idx === 0 ? { marginTop: 4 } : null]}>
                <Text style={styles.forecastDay}>{formatDayLabel(d.date)}</Text>
                <Text style={styles.forecastTemp}>
                  {typeof d.minTempC === 'number' ? Math.round(d.minTempC) : '-'}°
                  {' / '}
                  {typeof d.maxTempC === 'number' ? Math.round(d.maxTempC) : '-'}°
                </Text>
                <Text style={styles.forecastPrecip}>
                  {typeof d.precipitationMm === 'number' ? `${Math.round(d.precipitationMm)} mm` : '-'}
                </Text>
                <Text style={styles.forecastLabel} numberOfLines={1}>
                  {d.weatherLabel || '-'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText} numberOfLines={2}>
              {loading ? 'Loading forecast…' : 'Tap the locate button to load your local forecast.'}
            </Text>
          )}
        </Surface>

        <Surface style={styles.sectionCard} elevation={2}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf-outline" size={18} color={THEME.primaryDark} />
            <Text style={styles.sectionTitle}>Growth Recommendation</Text>
          </View>

          <View style={styles.recoHeaderRow}>
            <View style={[styles.recoBadge, { backgroundColor: suitability.color }]}>
              <Text style={styles.recoBadgeText}>{suitability.status}</Text>
            </View>
            <Text style={styles.recoSummary} numberOfLines={2}>
              {suitability.summary}
            </Text>
          </View>

          <View style={styles.recoTips}>
            {suitability.tips.map((t, idx) => (
              <View key={`${idx}-${t}`} style={styles.tipRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={THEME.primary} />
                <Text style={styles.tipText} numberOfLines={2}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: THEME.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.textDark,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 16,
    color: THEME.textLight,
  },
  locationCard: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    backgroundColor: THEME.primary,
  },
  locationGradient: {
    padding: 24,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.white,
    marginBottom: 4,
    maxWidth: 200,
  },
  locationRegion: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  coordsContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  coordText: {
    color: THEME.white,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
  },
  mapButtonText: {
    color: THEME.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastUpdated: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: THEME.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.textDark,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpi: {
    alignItems: 'center',
    flex: 1,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.primaryDark,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 13,
    color: THEME.textLight,
    fontWeight: '500',
  },
  suitabilityCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  suitabilityContent: {
    padding: 20,
    borderLeftWidth: 6,
  },
  suitabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suitabilityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.textDark,
  },
  suitabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  suitabilityBadgeText: {
    color: THEME.white,
    fontWeight: '700',
    fontSize: 12,
  },
  suitabilitySummary: {
    fontSize: 15,
    color: THEME.textDark,
    marginBottom: 16,
    lineHeight: 22,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textLight,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  tipText: {
    fontSize: 14,
    color: THEME.textDark,
    flex: 1,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: THEME.danger,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 16,
  },
  // Added missing styles referenced in render
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  forecastHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF2',
  },
  forecastHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B98A5',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  forecastDay: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textDark,
  },
  forecastTemp: {
    width: 80,
    fontSize: 14,
    color: THEME.textLight,
  },
  forecastPrecip: {
    width: 60,
    fontSize: 13,
    color: '#0984E3',
    fontWeight: '500',
  },
  forecastLabel: {
    flex: 1,
    fontSize: 13,
    color: THEME.textLight,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    color: THEME.textLight,
    padding: 20,
  },
  recoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  recoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recoBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  recoSummary: {
    flex: 1,
    fontSize: 14,
    color: THEME.textDark,
    lineHeight: 20,
  },
  recoTips: {
    gap: 8,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
});
