/**
 * Application color palette derived from the brand icon (iconTzerachia.png).
 * Replaces legacy teal with serene celeste and sky tones.
 */
export const Colors = {
  // Primary brand teal / verde acqua (#00A3A1)
  primary: '#00A3A1',
  primaryDark: '#007A78',
  primaryLight: '#E6F4F4',
  primaryMuted: '#A8C3C8',

  // Borders and subtle dividers
  border: '#D0E3E3',
  borderLight: '#E0EAE9',

  // Neutrals and typography
  textPrimary: '#1A2F2F',
  textSecondary: '#5A6B6B',
  textMuted: '#8A9A9A',
  background: '#F6F9F9',
  card: '#FFFFFF',

  // Status and accents
  success: '#00A3A1',
  danger: '#FF6B6B',
  warning: '#F5A623',
  gold: '#8A7B66',
} as const;

export default Colors;
