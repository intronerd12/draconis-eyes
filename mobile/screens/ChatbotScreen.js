import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { Text, Surface, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatbotService } from '../services/ChatbotService';
import { getUserNamespace, sanitizeForKey } from '../services/storageScope';

const THEME = {
  primary: '#C71585',
  primaryDark: '#8B008B',
  background: '#F0F2F5',
  surface: '#FFFFFF',
  textDark: '#2D3436',
  textLight: '#636E72',
  userBubble: '#1f2937',
  botBubble: '#ffffff',
};

const STORAGE_KEY_BASE = 'chat_history_v1';

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const TypingIndicator = () => {
  const d1 = useRef(new Animated.Value(0.2)).current;
  const d2 = useRef(new Animated.Value(0.2)).current;
  const d3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const mk = (v, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(v, { toValue: 0.2, duration: 350, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        ])
      );

    const a1 = mk(d1, 0);
    const a2 = mk(d2, 120);
    const a3 = mk(d3, 240);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [d1, d2, d3]);

  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      <Animated.View style={[styles.dot, { opacity: d1 }]} />
      <Animated.View style={[styles.dot, { opacity: d2 }]} />
      <Animated.View style={[styles.dot, { opacity: d3 }]} />
    </View>
  );
};

export default function ChatbotScreen({ navigation, user }) {
  const insets = useSafeAreaInsets();

  const storageKey = useMemo(() => {
    const ns = sanitizeForKey(getUserNamespace(user));
    return ns ? `${STORAGE_KEY_BASE}:${ns}` : `${STORAGE_KEY_BASE}:anon`;
  }, [user?.id, user?._id, user?.userId, user?.uid, user?.email, user?.username]);

  const quickPrompts = useMemo(
    () => [
      { label: 'Scan tips', text: 'Scan tips' },
      { label: 'My scan stats', text: 'My scan stats' },
      { label: 'Weather now', text: 'Weather now' },
      { label: '7-day forecast', text: '7-day forecast' },
      { label: 'Account help', text: 'Account help' },
    ],
    []
  );

  const listRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) {
            setMessages(parsed);
            return;
          }
        }
      } catch {}

      setMessages([
        {
          id: 'm0',
          role: 'assistant',
          text:
            'Hi — I’m your Dragon Vision assistant. Ask me for scan tips, weather/location insights, scan stats, or account help.',
          at: Date.now(),
        },
      ]);
    })();
  }, [storageKey]);

  useEffect(() => {
    (async () => {
      try {
        const trimmed = messages.slice(-60);
        await AsyncStorage.setItem(storageKey, JSON.stringify(trimmed));
      } catch {}
    })();
  }, [messages, storageKey]);

  const scrollToBottom = () => {
    try {
      listRef.current?.scrollToEnd?.({ animated: true });
    } catch {}
  };

  useEffect(() => {
    const t = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(t);
  }, [messages, sending]);

  const send = async (text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed || sending) return;

    setInput('');
    setMessages((prev) => [...prev, { id: makeId(), role: 'user', text: trimmed, at: Date.now() }]);
    setSending(true);

    try {
      await new Promise((r) => setTimeout(r, 350));
      const res = await ChatbotService.reply({ message: trimmed, user });
      setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', text: res.text, at: Date.now() }]);

      if (res?.action?.type === 'navigate' && res.action.screen) {
        const parentNav = navigation?.getParent?.();
        if (parentNav?.navigate) parentNav.navigate(res.action.screen, res.action.params);
        else navigation?.navigate?.(res.action.screen, res.action.params);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          text: `Sorry — I ran into an issue. ${e?.message || ''}`.trim(),
          at: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.row, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
        {!isUser ? (
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={14} color={THEME.primaryDark} />
          </View>
        ) : null}
        <Surface
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleBot,
            isUser ? { marginLeft: 60 } : { marginRight: 60 },
          ]}
          elevation={isUser ? 1 : 2}
        >
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
            {item.text}
          </Text>
        </Surface>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={[THEME.primaryDark, THEME.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Chat Assistant</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerSubtitle}>Online • Scan, weather, account help</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={async () => {
              setMessages((prev) => (prev?.length ? [prev[0]] : prev));
              try {
                await AsyncStorage.removeItem(storageKey);
              } catch {}
            }}
            style={styles.clearBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.promptsWrap}>
          <FlatList
            horizontal
            data={quickPrompts}
            keyExtractor={(p) => p.label}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}
            renderItem={({ item: p }) => (
              <Chip
                mode="flat"
                onPress={() => send(p.text)}
                style={styles.promptChip}
                textStyle={styles.promptChipText}
              >
                {p.label}
              </Chip>
            )}
          />
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={
          sending ? (
            <View style={[styles.row, { justifyContent: 'flex-start' }]}> 
              <View style={styles.avatar}>
                <Ionicons name="sparkles" size={14} color={THEME.primaryDark} />
              </View>
              <Surface style={[styles.bubble, styles.bubbleBot]} elevation={2}>
                <TypingIndicator />
              </Surface>
            </View>
          ) : (
            <View style={{ height: 6 }} />
          )
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 14 : 0}
      >
        <View style={[styles.inputWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputInner}>
            <Ionicons name="search" size={18} color={THEME.textLight} />
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about scan tips, weather, stats, or your account…"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              multiline
            />
          </View>
          <TouchableOpacity
            onPress={() => send(input)}
            disabled={sending || !String(input).trim().length}
            activeOpacity={0.85}
            style={[styles.sendBtn, (sending || !String(input).trim().length) ? styles.sendBtnDisabled : null]}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerWrap: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    paddingBottom: 12,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  promptsWrap: {
    paddingBottom: 10,
  },
  promptChip: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  promptChipText: {
    color: THEME.primaryDark,
    fontWeight: '800',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '84%',
    borderWidth: 1,
  },
  bubbleBot: {
    backgroundColor: THEME.botBubble,
    borderColor: 'rgba(0,0,0,0.06)',
    borderTopLeftRadius: 8,
  },
  bubbleUser: {
    backgroundColor: THEME.userBubble,
    borderColor: 'rgba(255,255,255,0.10)',
    borderTopRightRadius: 8,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextBot: {
    color: THEME.textDark,
    fontWeight: '600',
  },
  bubbleTextUser: {
    color: '#fff',
    fontWeight: '700',
  },
  inputWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: THEME.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  input: {
    flex: 1,
    minHeight: 20,
    maxHeight: 90,
    fontSize: 14,
    color: THEME.textDark,
    padding: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: THEME.textLight,
  },
});
