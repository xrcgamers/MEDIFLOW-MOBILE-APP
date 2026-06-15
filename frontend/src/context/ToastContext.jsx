import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useAppTheme } from "./ThemeContext";

const ToastContext = createContext(null);

function ToastOverlay({ toast }) {
  const { colors, radius, shadow } = useAppTheme();

  if (!toast) return null;

  const theme =
    toast.type === "success"
      ? { bg: colors.successBg, text: colors.successText }
      : toast.type === "error"
      ? { bg: colors.dangerBg, text: colors.dangerText }
      : toast.type === "warning"
      ? { bg: colors.warningBg, text: colors.warningText }
      : { bg: colors.infoBg, text: colors.infoText };

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View
        style={[
          styles.toast,
          {
            backgroundColor: theme.bg,
            borderColor: theme.text,
            borderRadius: radius.lg,
          },
          shadow,
        ]}
      >
        <Text
          style={[styles.title, { color: theme.text }]}
          maxFontSizeMultiplier={1.6}
        >
          {toast.title}
        </Text>
        {toast.message ? (
          <Text
            style={[styles.message, { color: theme.text }]}
            maxFontSizeMultiplier={1.7}
          >
            {toast.message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(({ title, message = "", type = "info", duration = 2500 }) => {
    setToast({ title, message, type });

    setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [showToast, hideToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastOverlay toast={toast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
  },
});