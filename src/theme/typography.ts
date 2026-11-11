export const fonts = {
  display: 'Fraunces_600SemiBold',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

export const type = {
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46 },
  h1: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38 },
  h2: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
  h3: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26 },
  button: { fontFamily: fonts.bold, fontSize: 17 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  meta: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
} as const;

// Espaciado y radios del sistema
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24 };
export const radius = { badge: 8, input: 14, card: 18, pill: 999 };
export const TOUCH = 48;
