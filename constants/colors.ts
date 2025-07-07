import { ColorValue } from 'react-native';

// Enhanced nature-inspired color palette with sophisticated gradients
const colors = {
  primary: "#2ECC71", // Emerald green
  primaryLight: "#58D68D", // Lighter emerald
  primaryDark: "#27AE60", // Darker emerald
  secondary: "#3498DB", // Bright blue
  secondaryLight: "#5DADE2", // Lighter blue
  accent: "#F39C12", // Orange
  accentLight: "#F8C471", // Lighter orange
  success: "#2ECC71",
  warning: "#F39C12",
  danger: "#E74C3C",
  info: "#3498DB",
  
  // Gradient colors with proper typing
  gradients: {
    primary: ["#2ECC71", "#27AE60"] as readonly [ColorValue, ColorValue],
    secondary: ["#3498DB", "#2980B9"] as readonly [ColorValue, ColorValue],
    accent: ["#F39C12", "#E67E22"] as readonly [ColorValue, ColorValue],
    success: ["#2ECC71", "#58D68D"] as readonly [ColorValue, ColorValue],
    danger: ["#E74C3C", "#C0392B"] as readonly [ColorValue, ColorValue],
    sunset: ["#FF6B6B", "#FFE66D"] as readonly [ColorValue, ColorValue],
    ocean: ["#4ECDC4", "#44A08D"] as readonly [ColorValue, ColorValue],
    purple: ["#A8E6CF", "#7FCDCD"] as readonly [ColorValue, ColorValue],
    warm: ["#FFD93D", "#FF6B6B"] as readonly [ColorValue, ColorValue],
  },
  
  // Light theme
  light: {
    text: "#2C3E50",
    textSecondary: "#7F8C8D",
    textTertiary: "#BDC3C7",
    background: "#F8F9FA",
    backgroundSecondary: "#FFFFFF",
    card: "#FFFFFF",
    tab: "#F0F2F5",
    cardSecondary: "#F8F9FA",
    border: "#E8EAED",
    borderLight: "#F1F3F4",
    tint: "#2ECC71",
    tabIconDefault: "#95A5A6",
    tabIconSelected: "#2ECC71",
    surface: "#F5F6FA",
    surfaceSecondary: "#ECEFF1",
    overlay: "rgba(44, 62, 80, 0.1)",
    shadow: "rgba(0, 0, 0, 0.08)",
    shadowDark: "rgba(0, 0, 0, 0.15)",
  },
  
  // Dark theme
  dark: {
    text: "#FFFFFF",
    textSecondary: "#BDC3C7",
    textTertiary: "#7F8C8D",
    background: "#1A1A1A",
    backgroundSecondary: "#2C2C2C",
    card: "#2C2C2C",
    tab: "#333333",
    cardSecondary: "#3A3A3A",
    border: "#404040",
    borderLight: "#4A4A4A",
    tint: "#58D68D",
    tabIconDefault: "#7F8C8D",
    tabIconSelected: "#58D68D",
    surface: "#333333",
    surfaceSecondary: "#404040",
    overlay: "rgba(255, 255, 255, 0.1)",
    shadow: "rgba(0, 0, 0, 0.3)",
    shadowDark: "rgba(0, 0, 0, 0.5)",
  }
};

export default colors;