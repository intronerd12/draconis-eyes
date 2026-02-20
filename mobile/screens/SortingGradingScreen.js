import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Title, Divider, Portal, Dialog, Button, Paragraph } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScanService } from '../services/ScanService';

const gradeRank = { A: 3, B: 2, C: 1, 'N/A': 0 };

export default function SortingGradingScreen({ user }) {
  const [scans, setScans] = useState([]);
  const [gradeFilter, setGradeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const refresh = useCallback(async () => {
    const list = await ScanService.getScans({ user });
    setScans(Array.isArray(list) ? list : []);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filtered = useMemo(() => {
    if (gradeFilter === 'All') return scans;
    return scans.filter((s) => (s.grade || 'N/A') === gradeFilter);
  }, [scans, gradeFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortBy === 'price_desc') {
      copy.sort((a, b) => (Number(b.estimated_price_per_kg) || 0) - (Number(a.estimated_price_per_kg) || 0));
      return copy;
    }
    if (sortBy === 'grade_desc') {
      copy.sort((a, b) => (gradeRank[b.grade || 'N/A'] || 0) - (gradeRank[a.grade || 'N/A'] || 0));
      return copy;
    }
    copy.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return copy;
  }, [filtered, sortBy]);

  const formatPesoPerKg = (amount) => {
    const value = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isFinite(value)) return '₱0.00/kg';
    return `₱${value.toFixed(2)}/kg`;
  };

  const openDelete = (scan) => {
    setDeleteTarget(scan || null);
    setDeleteVisible(true);
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteVisible(false);
    setDeleteTarget(null);
    if (!target?.id) return;
    try {
      await ScanService.deleteScan(target.id, { user });
      await refresh();
    } catch {
      await refresh();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Sorting & Grading</Title>
        <Text style={styles.headerSubtitle}>Filter by grade and sort by value</Text>
      </View>

      <Portal>
        <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)} style={{ backgroundColor: 'white' }}>
          <Dialog.Title style={{ color: '#111' }}>Delete this scan?</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: '#555' }}>
              This removes the scan from your history, deletes its saved image on this device,
              and removes the synced record from admin data.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
            <Button onPress={() => setDeleteVisible(false)} textColor="#666">Cancel</Button>
            <Button onPress={confirmDelete} textColor="#C71585">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.controlsCard}>
          <Card.Content>
            <Text style={styles.sectionLabel}>Grade Filter</Text>
            <View style={styles.chipsRow}>
              {['All', 'A', 'B', 'C', 'N/A'].map((g) => (
                <Chip
                  key={g}
                  selected={gradeFilter === g}
                  onPress={() => setGradeFilter(g)}
                  style={[styles.chip, gradeFilter === g && styles.chipSelected]}
                  textStyle={gradeFilter === g ? styles.chipSelectedText : styles.chipText}
                >
                  {g}
                </Chip>
              ))}
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.sectionLabel}>Sort</Text>
            <View style={styles.chipsRow}>
              <Chip
                selected={sortBy === 'newest'}
                onPress={() => setSortBy('newest')}
                style={[styles.chip, sortBy === 'newest' && styles.chipSelected]}
                textStyle={sortBy === 'newest' ? styles.chipSelectedText : styles.chipText}
              >
                Newest
              </Chip>
              <Chip
                selected={sortBy === 'grade_desc'}
                onPress={() => setSortBy('grade_desc')}
                style={[styles.chip, sortBy === 'grade_desc' && styles.chipSelected]}
                textStyle={sortBy === 'grade_desc' ? styles.chipSelectedText : styles.chipText}
              >
                Best Grade
              </Chip>
              <Chip
                selected={sortBy === 'price_desc'}
                onPress={() => setSortBy('price_desc')}
                style={[styles.chip, sortBy === 'price_desc' && styles.chipSelected]}
                textStyle={sortBy === 'price_desc' ? styles.chipSelectedText : styles.chipText}
              >
                Highest Price
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {sorted.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyTitle}>No scans found</Text>
              <Text style={styles.emptySubtitle}>Scan a dragon fruit to see grading results here.</Text>
            </Card.Content>
          </Card>
        ) : (
          sorted.map((s) => (
            <Card key={s.id} style={styles.itemCard}>
              <Card.Content style={styles.itemContent}>
                <Image source={{ uri: s.imageUri }} style={styles.thumb} />
                <View style={styles.itemMain}>
                  <View style={styles.itemTopRow}>
                    <View style={styles.gradeBadge}>
                      <Text style={styles.gradeBadgeText}>{s.grade || 'N/A'}</Text>
                    </View>
                    <View style={styles.itemRightTop}>
                      <Text style={styles.priceText}>{formatPesoPerKg(s.estimated_price_per_kg)}</Text>
                      <TouchableOpacity
                        onPress={() => openDelete(s)}
                        style={styles.trashBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Delete scan"
                      >
                        <Ionicons name="trash-outline" size={18} color="#C71585" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.itemMeta}>
                    {s.size_category || '—'} • {s.market_value_label || '—'} • {s.weight_grams_est ? `${s.weight_grams_est}g` : '—'}
                  </Text>
                  <Text style={styles.itemTime}>
                    {s.timestamp ? new Date(s.timestamp).toLocaleString() : ''}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  header: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(199, 21, 133, 0.12)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
  },
  headerSubtitle: {
    marginTop: 2,
    color: '#666',
    fontSize: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 26,
  },
  controlsCard: {
    borderRadius: 16,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#444',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(199, 21, 133, 0.06)',
    borderColor: 'rgba(199, 21, 133, 0.16)',
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: '#C71585',
    borderColor: '#C71585',
  },
  chipText: {
    color: '#C71585',
    fontWeight: '800',
  },
  chipSelectedText: {
    color: 'white',
    fontWeight: '800',
  },
  divider: {
    marginVertical: 14,
  },
  itemCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  itemContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#EEE',
  },
  itemMain: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemRightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gradeBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(199, 21, 133, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeText: {
    fontWeight: '900',
    color: '#C71585',
    fontSize: 16,
  },
  priceText: {
    fontWeight: '900',
    color: '#111',
  },
  trashBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(199, 21, 133, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(199, 21, 133, 0.14)',
  },
  itemMeta: {
    marginTop: 6,
    color: '#555',
    fontSize: 12,
  },
  itemTime: {
    marginTop: 2,
    color: '#888',
    fontSize: 11,
  },
  emptyCard: {
    borderRadius: 16,
  },
  emptyTitle: {
    fontWeight: '900',
    color: '#222',
  },
  emptySubtitle: {
    marginTop: 6,
    color: '#666',
  },
});
