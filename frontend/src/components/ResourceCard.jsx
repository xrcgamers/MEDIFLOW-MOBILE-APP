import { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "./StatusBadge";
import AppButton from "./AppButton";
import { addResourceActionService } from "../services/resourceService";
import { useAppTheme } from "../context/ThemeContext";

function getResourceType(status) {
  switch (status) {
    case "Available":
    case "Ready":
    case "Adequate":
    case "On Duty":
      return "success";
    case "Low":
    case "Limited":
    case "Busy":
      return "warning";
    case "Unavailable":
    case "Critical":
    case "Off Duty":
      return "danger";
    default:
      return "neutral";
  }
}

function getResourceIcon(category, status) {
  if (category === "beds") return "bed-outline";
  if (category === "theatre") return "medkit-outline";
  if (category === "blood") return "water-outline";
  if (category === "staff") return "people-outline";
  if (status === "Critical") return "alert-circle-outline";
  return "layers-outline";
}

export default function ResourceCard({ item, onActionComplete }) {
  const { colors, radius, spacing, shadow } = useAppTheme();
  const type = getResourceType(item.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestLog = item.actionLogs?.[0] || null;

  const accentStyle =
    type === "success"
      ? { borderLeftColor: colors.successText }
      : type === "warning"
      ? { borderLeftColor: colors.warningText }
      : type === "danger"
      ? { borderLeftColor: colors.dangerText }
      : type === "info"
      ? { borderLeftColor: colors.infoText }
      : { borderLeftColor: colors.neutralText };

  const handleAction = async (actionType) => {
    try {
      setIsSubmitting(true);

      const note =
        actionType === "ESCALATE"
          ? `${item.label} has been escalated for urgent attention.`
          : `${item.label} has been reviewed by staff.`;

      await addResourceActionService(item.id, {
        actionType,
        note,
      });

      Alert.alert(
        "Action Recorded",
        actionType === "ESCALATE"
          ? "Resource has been escalated."
          : "Resource has been marked as reviewed."
      );

      onActionComplete?.();
    } catch (error) {
      Alert.alert(
        "Action Failed",
        error.message || "Unable to update resource action."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
        shadow,
        accentStyle,
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${item.label}, status ${item.status}, value ${item.value}`}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: colors.infoBg,
            },
          ]}
        >
          <Ionicons
            name={getResourceIcon(item.category, item.status)}
            size={20}
            color={colors.primaryDark}
          />
        </View>

        <StatusBadge label={item.status} type={type} />
      </View>

      <Text
        style={[styles.label, { color: colors.textMuted }]}
        maxFontSizeMultiplier={1.6}
      >
        {item.label}
      </Text>
      <Text
        style={[styles.value, { color: colors.text }]}
        maxFontSizeMultiplier={1.5}
      >
        {item.value}
      </Text>

      {latestLog ? (
        <View
          style={[
            styles.logBox,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.sm,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <Text
            style={[styles.logTitle, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.5}
          >
            Latest Action
          </Text>
          <Text
            style={[styles.logMeta, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.5}
          >
            {latestLog.actionType} • {latestLog.actorName || "Staff User"}
          </Text>
          <Text
            style={[styles.logMeta, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.5}
          >
            {new Date(latestLog.createdAt).toLocaleString()}
          </Text>
          {latestLog.note ? (
            <Text
              style={[styles.logNote, { color: colors.text }]}
              maxFontSizeMultiplier={1.6}
            >
              {latestLog.note}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <View style={styles.actionButton}>
          <AppButton
            title={isSubmitting ? "Working..." : "Mark Reviewed"}
            onPress={() => handleAction("MARK_REVIEWED")}
            variant="secondary"
            disabled={isSubmitting}
            accessibilityLabel={`Mark ${item.label} as reviewed`}
          />
        </View>

        <View style={styles.actionButton}>
          <AppButton
            title={isSubmitting ? "Working..." : "Escalate"}
            onPress={() => handleAction("ESCALATE")}
            disabled={isSubmitting}
            accessibilityLabel={`Escalate ${item.label}`}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderLeftWidth: 5,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 10,
  },
  logBox: {
    borderWidth: 1,
  },
  logTitle: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  logMeta: {
    fontSize: 12,
    marginBottom: 2,
  },
  logNote: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  actionsRow: {
    marginTop: 4,
  },
  actionButton: {
    marginBottom: 8,
  },
});