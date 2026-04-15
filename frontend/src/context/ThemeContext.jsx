import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme, AccessibilityInfo } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_MODE_KEY = "mediflow_theme_mode";
const TEXT_SCALE_KEY = "mediflow_text_scale";
const HIGH_CONTRAST_KEY = "mediflow_high_contrast";
const REDUCE_MOTION_KEY = "mediflow_reduce_motion_override";

const ThemeContext = createContext(null);

const LIGHT_COLORS = {
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceMuted: "#f1f5f9",
  border: "#dbe3ee",
  text: "#0f172a",
  textMuted: "#475569",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",

  successBg: "#dcfce7",
  successText: "#166534",

  warningBg: "#fef3c7",
  warningText: "#92400e",

  dangerBg: "#fee2e2",
  dangerText: "#b91c1c",

  infoBg: "#dbeafe",
  infoText: "#1d4ed8",

  neutralBg: "#e5e7eb",
  neutralText: "#374151",
};

const DARK_COLORS = {
  background: "#020617",
  surface: "#0f172a",
  surfaceMuted: "#111827",
  border: "#334155",
  text: "#f8fafc",
  textMuted: "#cbd5e1",
  primary: "#60a5fa",
  primaryDark: "#93c5fd",

  successBg: "#052e16",
  successText: "#86efac",

  warningBg: "#451a03",
  warningText: "#fcd34d",

  dangerBg: "#450a0a",
  dangerText: "#fca5a5",

  infoBg: "#172554",
  infoText: "#93c5fd",

  neutralBg: "#1f2937",
  neutralText: "#e5e7eb",
};

function applyHighContrast(colors) {
  return {
    ...colors,
    border: colors.text,
    textMuted: colors.text,
    primary: colors.primaryDark,
    neutralText: colors.text,
  };
}

function getTextScaleMultiplier(mode) {
  if (mode === "large") return 1.12;
  if (mode === "extra_large") return 1.24;
  return 1;
}

function scaleTypography(baseTypography, multiplier) {
  const scaleStyle = (style) => ({
    ...style,
    fontSize: Math.round(style.fontSize * multiplier),
    lineHeight: style.lineHeight
      ? Math.round(style.lineHeight * multiplier)
      : undefined,
  });

  return {
    title: scaleStyle(baseTypography.title),
    subtitle: scaleStyle(baseTypography.subtitle),
    body: scaleStyle(baseTypography.body),
    label: scaleStyle(baseTypography.label),
  };
}

const BASE_THEME = {
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    title: {
      fontSize: 30,
      fontWeight: "800",
      lineHeight: 38,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: "500",
      lineHeight: 24,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
    },
    label: {
      fontSize: 14,
      fontWeight: "700",
    },
  },
  shadowLight: {
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  shadowDark: {
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
};

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();

  const [themeMode, setThemeMode] = useState("system");
  const [textScaleMode, setTextScaleMode] = useState("normal");
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);
  const [systemReduceMotionEnabled, setSystemReduceMotionEnabled] = useState(false);
  const [reduceMotionOverride, setReduceMotionOverride] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const [
        storedThemeMode,
        storedTextScale,
        storedHighContrast,
        storedReduceMotion,
      ] = await Promise.all([
        AsyncStorage.getItem(THEME_MODE_KEY),
        AsyncStorage.getItem(TEXT_SCALE_KEY),
        AsyncStorage.getItem(HIGH_CONTRAST_KEY),
        AsyncStorage.getItem(REDUCE_MOTION_KEY),
      ]);

      if (storedThemeMode) setThemeMode(storedThemeMode);
      if (storedTextScale) setTextScaleMode(storedTextScale);
      if (storedHighContrast) setHighContrastEnabled(storedHighContrast === "true");
      if (storedReduceMotion) setReduceMotionOverride(storedReduceMotion === "true");
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const checkReduceMotion = async () => {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        setSystemReduceMotionEnabled(enabled);
      } catch {
        setSystemReduceMotionEnabled(false);
      }
    };

    checkReduceMotion();

    const subscription = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      setSystemReduceMotionEnabled
    );

    return () => {
      subscription?.remove?.();
    };
  }, []);

  const setMode = async (mode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem(THEME_MODE_KEY, mode);
  };

  const setTextScale = async (mode) => {
    setTextScaleMode(mode);
    await AsyncStorage.setItem(TEXT_SCALE_KEY, mode);
  };

  const setHighContrast = async (enabled) => {
    setHighContrastEnabled(enabled);
    await AsyncStorage.setItem(HIGH_CONTRAST_KEY, String(enabled));
  };

  const setReduceMotion = async (enabled) => {
    setReduceMotionOverride(enabled);
    await AsyncStorage.setItem(REDUCE_MOTION_KEY, String(enabled));
  };

  const resolvedMode =
    themeMode === "system" ? systemScheme || "light" : themeMode;

  const baseColors = resolvedMode === "dark" ? DARK_COLORS : LIGHT_COLORS;
  const colors = highContrastEnabled ? applyHighContrast(baseColors) : baseColors;

  const textScaleMultiplier = getTextScaleMultiplier(textScaleMode);
  const typography = scaleTypography(BASE_THEME.typography, textScaleMultiplier);

  const reduceMotionEnabled =
    reduceMotionOverride || systemReduceMotionEnabled;

  const value = useMemo(
    () => ({
      themeMode,
      resolvedMode,
      setMode,
      colors,
      radius: BASE_THEME.radius,
      spacing: BASE_THEME.spacing,
      typography,
      textScaleMode,
      setTextScale,
      textScaleMultiplier,
      highContrastEnabled,
      setHighContrast,
      reduceMotionEnabled,
      reduceMotionOverride,
      setReduceMotion,
      systemReduceMotionEnabled,
      shadow:
        resolvedMode === "dark"
          ? BASE_THEME.shadowDark
          : BASE_THEME.shadowLight,
      isDark: resolvedMode === "dark",
    }),
    [
      themeMode,
      resolvedMode,
      colors,
      typography,
      textScaleMode,
      highContrastEnabled,
      reduceMotionEnabled,
      reduceMotionOverride,
      systemReduceMotionEnabled,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }

  return context;
}