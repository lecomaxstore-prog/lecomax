import { Platform } from 'react-native';

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, section: 32 };
export const radius = { sm: 10, control: 14, card: 22, pill: 999 };
export const type = { caption: 12, small: 14, body: 16, title: 20, heading: 28 };
export const icons = { small: 18, control: 22, feature: 26 };
export const motion = { quick: 180 };
export const fonts = {
  arabic: Platform.select({
    web: 'AcademyNotoArabic, "Segoe UI", Tahoma, Arial, sans-serif',
    default: 'AcademyNotoArabic',
  }),
  arabicBold: Platform.select({
    web: 'AcademyNotoArabicSemibold, "Segoe UI", Tahoma, Arial, sans-serif',
    default: 'AcademyNotoArabicSemibold',
  }),
  body: Platform.select({
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ios: 'System',
    default: 'sans-serif',
  }),
  code: Platform.select({ ios: 'Menlo', default: 'monospace' }),
};
export const shadow = {
  shadowColor: '#102A25',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.035,
  shadowRadius: 14,
  elevation: 1,
};
export const light = {
  bg: '#F8F8F3',
  card: '#FFFFFF',
  text: '#173A32',
  muted: '#60736A',
  line: '#E4EAE3',
  accent: '#12745C',
  soft: '#E8F3EA',
  gold: '#B57824',
  danger: '#B53742',
  code: '#142823',
  codeText: '#E9F3DB',
  codeMuted: '#BED4C8',
  codeLine: '#345047',
  primary: '#103B32',
  onPrimary: '#FFFFFF',
  hero: '#103B32',
  heroAccent: '#16856A',
  heroGold: '#D5AE62',
  heroLine: '#FFFFFF18',
  heroText: '#D5E8DA',
  neutral: '#EEF0E8',
  violet: '#66539A',
  violetSoft: '#F1EEF8',
  amber: '#946523',
  amberSoft: '#FAF3E7',
};
export const dark: typeof light = {
  bg: '#0C1B17',
  card: '#142A23',
  text: '#EAF3EE',
  muted: '#A8BDB2',
  line: '#30483E',
  accent: '#9ADBBF',
  soft: '#234336',
  gold: '#E7BF7D',
  danger: '#FFADB3',
  code: '#0C1915',
  codeText: '#E9F3DB',
  codeMuted: '#BED4C8',
  codeLine: '#345047',
  primary: '#1F6F5C',
  onPrimary: '#FFFFFF',
  hero: '#123F35',
  heroAccent: '#246A54',
  heroGold: '#E7BF7D',
  heroLine: '#FFFFFF18',
  heroText: '#D5E8DE',
  neutral: '#20362E',
  violet: '#C1B4EA',
  violetSoft: '#302B40',
  amber: '#E7BF7D',
  amberSoft: '#3B3325',
};
