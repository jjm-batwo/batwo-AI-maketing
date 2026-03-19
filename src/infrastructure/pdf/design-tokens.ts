/**
 * PDF Design Tokens
 *
 * Single source of truth for all PDF report styling.
 * Based on the Python reference template (report.html.j2).
 */
import { Font } from '@react-pdf/renderer'

// ========================================
// Font Registration
// ========================================

const shouldUseRemotePdfFont =
  process.env.NODE_ENV !== 'test' && process.env.DISABLE_REMOTE_PDF_FONT !== 'true'

export const PDF_FONT_FAMILY = shouldUseRemotePdfFont ? 'NotoSansKR' : 'Helvetica'
export const PDF_MONO_FONT_FAMILY = shouldUseRemotePdfFont ? 'JetBrainsMono' : 'Courier'

if (shouldUseRemotePdfFont) {
  Font.register({
    family: 'NotoSansKR',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-400-normal.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-700-normal.ttf',
        fontWeight: 'bold',
      },
    ],
  })

  Font.register({
    family: 'JetBrainsMono',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-700-normal.ttf',
        fontWeight: 'bold',
      },
    ],
  })

  Font.registerHyphenationCallback((word) => [word])
}

// ========================================
// Color Palette (from report.html.j2 CSS vars)
// ========================================

export const colors = {
  // Backgrounds
  bgPrimary: '#F6F7FB',
  bgSecondary: '#EDEEF4',
  bgCard: '#FFFFFF',
  bgCardHover: '#F9F9FD',

  // Borders
  border: '#E2E4ED',
  borderActive: '#C8CBDB',

  // Text
  textPrimary: '#1A1D2E',
  textSecondary: '#5A5E76',
  textMuted: '#8B8FA8',

  // Accents
  blue: '#3B6FE0',
  blueDim: 'rgba(59,111,224,0.10)',
  green: '#16A370',
  greenDim: 'rgba(22,163,112,0.09)',
  red: '#E04545',
  redDim: 'rgba(224,69,69,0.08)',
  yellow: '#D49A08',
  yellowDim: 'rgba(212,154,8,0.09)',
  purple: '#7C5CDB',
  purpleDim: 'rgba(124,92,219,0.10)',

  // Semantic — chart line colors (spend=blue, revenue=purple per reference)
  spend: '#3B6FE0',
  revenue: '#7C5CDB',

  // Semantic — status
  positive: '#16A370',
  negative: '#E04545',
  warning: '#D49A08',
  neutral: '#8B8FA8',

  // Dark header
  headerBg: '#0f172a',
  headerText: '#ffffff',
  headerAccent: '#60a5fa',

  // Table header
  tableHeaderBg: '#3B6FE0',
  tableHeaderText: '#ffffff',
  tableRowAlt: '#f8fafc',
  tableBorder: '#f1f5f9',

  // Warning section (amber/orange tones)
  warningSectionBg: '#fef3c7',
  warningSectionTitle: '#92400e',
  warningSectionText: '#78350f',
  goalBarBg: '#fed7aa',
  goalBarFill: '#f59e0b',

  // Info section (blue tones)
  infoSectionBg: '#eff6ff',
  infoSectionText: '#1e40af',
  infoSectionBorder: '#bfdbfe',
  highlightBg: '#dbeafe',

  // Sky section (cyan-blue tones)
  skyBg: '#f0f9ff',
  skyTitle: '#0c4a6e',
  skyText: '#075985',

  // Base accent
  orange: '#ea580c',
  orangeDim: 'rgba(234,88,12,0.08)',
  white: '#ffffff',

  // Legacy Tailwind shims (used sparingly for non-semantic contexts)
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate800: '#1e293b',
} as const

// ========================================
// Semantic Color Maps
// ========================================

/** Priority badge styles */
export const priorityColors = {
  high: { border: colors.red, bg: colors.redDim, text: colors.red },
  medium: { border: colors.yellow, bg: colors.yellowDim, text: colors.yellow },
  low: { border: colors.blue, bg: colors.blueDim, text: colors.blue },
} as const

/** Fatigue level styles */
export const fatigueColors = {
  healthy: { border: colors.green, bg: colors.greenDim, text: colors.green, bar: colors.green },
  warning: { border: colors.yellow, bg: colors.yellowDim, text: colors.yellow, bar: colors.yellow },
  critical: { border: colors.red, bg: colors.redDim, text: colors.red, bar: colors.red },
} as const

/** Insight importance badge styles */
export const importanceColors = {
  critical: { bg: colors.redDim, text: colors.red },
  high: { bg: colors.orangeDim, text: colors.orange },
  medium: { bg: colors.yellowDim, text: colors.yellow },
  low: { bg: colors.blueDim, text: colors.blue },
} as const

/** Analysis card styles */
export const analysisColors = {
  positive: { bg: colors.greenDim, border: colors.green, text: colors.green },
  negative: { bg: colors.redDim, border: colors.red, text: colors.red },
} as const

/** Funnel stage background colors */
export const funnelColors: Record<string, string> = {
  tofu: '#dbeafe',
  mofu: '#fef3c7',
  bofu: '#dcfce7',
  auto: '#f3e8ff',
}

/** Ad format chart colors */
export const formatColors: Record<string, string> = {
  SINGLE_IMAGE: colors.blue,
  SINGLE_VIDEO: colors.purple,
  CAROUSEL: colors.yellow,
  REELS: '#ec4899',
}

/** Grade badge colors */
export const gradeColors = {
  excellent: { bg: colors.greenDim, text: colors.green },
  good: { bg: colors.blueDim, text: colors.blue },
  average: { bg: colors.yellowDim, text: colors.yellow },
  below_average: { bg: colors.orangeDim, text: colors.orange },
  poor: { bg: colors.redDim, text: colors.red },
} as const

/** Confidence level colors */
export const confidenceColors = {
  high: { bg: colors.greenDim, text: colors.green },
  medium: { bg: colors.yellowDim, text: colors.yellow },
  low: { bg: colors.redDim, text: colors.red },
} as const

// ========================================
// Spacing & Radius
// ========================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 40,
} as const

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
} as const

// ========================================
// Typography
// ========================================

export const fontSize = {
  /** Badge / label smallest */
  xxs: 7,
  /** Badge text, table header */
  xs: 8,
  /** Small body, metric labels */
  sm: 9,
  /** Body text */
  base: 10,
  /** Slightly larger body */
  md: 11,
  /** Sub-section titles, campaign values */
  lg: 12,
  /** Section sub-titles */
  xl: 13,
  /** Campaign title, section headings */
  '2xl': 14,
  /** Metric values */
  '3xl': 16,
  /** Section title */
  '4xl': 18,
  /** Template title */
  '5xl': 20,
  /** KPI large value */
  '6xl': 22,
  /** Page title */
  '7xl': 28,
  /** Score display */
  '8xl': 32,
} as const

/** Letter spacing for monospace values (applied via style) */
export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 0.8,
  widest: 1.5,
} as const
