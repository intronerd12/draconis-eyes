import { ScanService } from './ScanService';
import { getEnvironment, getEnvironmentalReport } from './EnvironmentService';
import { API_URL } from './api';

const normalize = (s) => String(s || '').trim();
const normLower = (s) => normalize(s).toLowerCase();

const formatTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatTemp = (v) => (typeof v === 'number' ? `${Math.round(v)}°C` : '—');
const formatWind = (v) => (typeof v === 'number' ? `${Math.round(v)} km/h` : '—');

const scanTips = () => {
  return [
    'Scan tips for better results:',
    '• Use bright, even light (avoid harsh shadows).',
    '• Fill the frame: keep the fruit centered and close.',
    '• Wipe lens + fruit surface to reduce blur and glare.',
    '• Keep your hand steady; tap to focus before capturing.',
    '• Avoid busy backgrounds; use a plain surface if possible.',
  ].join('\n');
};

const accountHelp = (user) => {
  const name = user?.name ? String(user.name) : 'there';
  const email = user?.email ? String(user.email) : null;

  return [
    `Account help, ${name}:`,
    email ? `• Signed in as: ${email}` : '• Signed in status: available in User tab.',
    '• Update profile: User → Edit Profile.',
    '• Logout: User → Logout.',
    '• If login fails: check email/password, then try again on a stable connection.',
  ].join('\n');
};

const defaultHelp = () => {
  return [
    'I can help with:',
    '• Scan tips and photo quality',
    '• Your scan stats (stored on this device)',
    '• Weather + location insights (uses your GPS)',
    '• User/account guidance',
    '',
    'Try: “scan tips”, “my scan stats”, “weather now”, or “7-day forecast”.',
  ].join('\n');
};

export const ChatbotService = {
  reply: async ({ message, user } = {}) => {
    const raw = normalize(message);
    const text = normLower(raw);

    if (/(^|\b)(open|go to|show)(\b|\s).*weather/.test(text)) {
      return { text: 'Opening Weather…', action: { type: 'navigate', screen: 'Weather' } };
    }
    if (/(^|\b)(open|go to|show)(\b|\s).*(map|mapping|environment dashboard)/.test(text)) {
      return { text: 'Opening Mapping & Environmental Data…', action: { type: 'navigate', screen: 'MappingEnvironment' } };
    }
    if (/(^|\b)(open|go to|show)(\b|\s).*scan/.test(text)) {
      return { text: 'Opening Scan…', action: { type: 'navigate', screen: 'Scan' } };
    }
    if (/(^|\b)(open|go to|show)(\b|\s).*(guide|tips)/.test(text)) {
      return { text: 'Opening Guide…', action: { type: 'navigate', screen: 'Guide' } };
    }
    if (/(^|\b)(edit|update)(\b|\s).*(profile|account)/.test(text)) {
      return { text: 'Opening Edit Profile…', action: { type: 'navigate', screen: 'EditProfile' } };
    }

    if (text.includes('scan tip') || text.includes('tips') || text.includes('photo') || text.includes('blurry') || text.includes('glare')) {
      return { text: scanTips() };
    }

    if (text.includes('stats') || text.includes('history') || text.includes('recent') || text.includes('my scans')) {
      const stats = await ScanService.getStats({ user });
      const scans = await ScanService.getScans({ user });
      const recent = scans.slice(0, 3);

      const lines = [
        'Your scan stats (this device):',
        `• Total scans: ${stats.total}`, 
        `• Best grade: ${stats.best}`,
        `• Average score: ${stats.avg}`,
      ];

      if (recent.length) {
        lines.push('', 'Recent scans:');
        recent.forEach((s, i) => {
          const when = s.timestamp ? `${new Date(s.timestamp).toLocaleDateString()} ${formatTime(s.timestamp)}` : '';
          const grade = s.grade || '-';
          const note = s.shelf_life_label || s.notes || '';
          lines.push(`• ${i + 1}) Grade ${grade}${when ? ` • ${when}` : ''}${note ? ` • ${note}` : ''}`);
        });
      } else {
        lines.push('', 'No scans found yet. Try the Scan tab to start.');
      }

      return { text: lines.join('\n') };
    }

    if (
      text.includes('weather') ||
      text.includes('temperature') ||
      text.includes('forecast') ||
      text.includes('wind') ||
      text.includes('location') ||
      text.includes('where am i') ||
      text.includes('map')
    ) {
      const wantsForecast = text.includes('forecast') || text.includes('7') || text.includes('7-day') || text.includes('7 day');
      try {
        if (wantsForecast) {
          const rep = await getEnvironmentalReport({ force: true, user });
          const place = rep.place?.label || 'your location';
          const cur = rep.forecast?.current;
          const days = Array.isArray(rep.forecast?.days) ? rep.forecast.days.slice(0, 5) : [];

          const lines = [
            `Forecast for ${place}:`,
            `• Now: ${formatTemp(cur?.temperatureC)} • ${cur?.weatherLabel || '—'} • Wind ${formatWind(cur?.windKmh)}`,
          ];

          if (days.length) {
            lines.push('', 'Next days:');
            days.forEach((d) => {
              const date = d.date ? new Date(d.date).toLocaleDateString() : '—';
              lines.push(
                `• ${date}: ${d.weatherLabel || '—'} • ${formatTemp(d.minTempC)}–${formatTemp(d.maxTempC)} • Rain ${typeof d.precipitationMm === 'number' ? `${Math.round(d.precipitationMm)} mm` : '—'}`
              );
            });
          }

          return { text: lines.join('\n') };
        }

        const env = await getEnvironment({ force: true, user });
        const place = env.place?.label || 'your location';
        const w = env.weather;
        const coords = env.coords;

        return {
          text: [
            `Weather now for ${place}:`,
            `• Temperature: ${formatTemp(w?.temperatureC)}`,
            `• Conditions: ${w?.weatherLabel || '—'}`,
            `• Wind: ${formatWind(w?.windKmh)}`,
            coords?.latitude && coords?.longitude
              ? `• Coordinates: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
              : null,
            '',
            'Tip: Ask “7-day forecast” for a longer outlook.',
          ].filter(Boolean).join('\n'),
        };
      } catch (e) {
        return {
          text: [
            'I couldn’t fetch location/weather right now.',
            '• Please allow Location permission and try again.',
            `• Details: ${e?.message || 'Unknown error'}`,
          ].join('\n'),
        };
      }
    }

    if (
      text.includes('account') ||
      text.includes('login') ||
      text.includes('log in') ||
      text.includes('logout') ||
      text.includes('log out') ||
      text.includes('profile') ||
      text.includes('password')
    ) {
      return { text: accountHelp(user) };
    }

    if (/^(hi|hello|hey|yo)\b/.test(text)) {
      return {
        text: 'Hi — ask me for scan tips, weather, scan stats, or account help.',
      };
    }

    try {
      const response = await fetch(`${API_URL}/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: raw,
          user: user
            ? {
                name: user.name,
                email: user.email,
              }
            : undefined,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data.text !== 'string') {
        return { text: defaultHelp() };
      }

      return { text: data.text };
    } catch (e) {
      return { text: defaultHelp() };
    }
  },
};
