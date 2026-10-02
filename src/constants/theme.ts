/**
 * Application color palette derived from the brand icon (iconTzerachia.png).
 * Replaces legacy teal with serene celeste and sky tones.
 */
export const Colors = {
  // Primary brand celeste extracted from iconTzerachia (#477CA7)
  primary: '#477CA7',
  primaryDark: '#37658F',
  primaryLight: '#E6F4FE',
  primaryMuted: '#9AB7CB',

  // Borders and subtle dividers
  border: '#D3E2EE',
  borderLight: '#E4EDF5',

  // Neutrals and typography
  textPrimary: '#1E364B',
  textSecondary: '#5A6E7C',
  textMuted: '#8E9EAA',
  background: '#F4F8FB',
  card: '#FFFFFF',

  // Status and accents
  success: '#477CA7',
  danger: '#FF6B6B',
  warning: '#F5A623',
  gold: '#8A7B66',
} as const;

export default Colors;
