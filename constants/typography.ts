import { Brand } from './brand';

export const Typography = {
  display: {
    fontFamily: Brand.fonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: Brand.fonts.heading,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  title: {
    fontFamily: Brand.fonts.heading,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: Brand.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  callout: {
    fontFamily: Brand.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  button: {
    fontFamily: Brand.fonts.heading,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: Brand.fonts.caption,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  micro: {
    fontFamily: Brand.fonts.caption,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
} as const;

export type TypographyToken = keyof typeof Typography;
