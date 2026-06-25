/** GXS Delivery color tokens — mirrors the CSS variables in global.css */

export const brand = {
  navy: "#001847",
  navyDeep: "#001232",
  blueActive: "#0150B5",
  orange: "#FF6500",
  greenBrand: "#166C34",
} as const;

export const semantic = {
  success: "#107A4A",
  successLight: "#E8F5EE",
  warning: "#F38214",
  warningLight: "#FEF3E2",
  error: "#D42C3B",
  errorLight: "#FDECEA",
  info: "#0150B5",
  infoLight: "#E5EFFF",
} as const;

export const neutral = {
  textPrimary: "#020F1C",
  textSecondary: "#44617C",
  border: "#E0E5F2",
  surface: "#F4F7FA",
  background: "#F6F9FF",
  white: "#FFFFFF",
} as const;

export const colors = { brand, semantic, neutral } as const;
export type Colors = typeof colors;
