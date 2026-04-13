import { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "./StatusBadge";
import AppButton from "./AppButton";
import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";
import { addResourceActionService } from "../services/resourceService";

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

function getCardAccentStyle(type) {
  switch (type) {
    case "success":
      return styles.successAccent;
    case "warning":
      return styles.warningAccent;
    case "danger":
      return styles.dangerAccent;
    case "info":
      return styles.infoAccent;
    default:
      return styles.neutralAccent;
  }
}

export default function ResourceCard({ item, onActionComplete }) {
  const type = getResourceType(item.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestLog = item.actionLogs?.[0] || null;

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
    <View style={[styles.card, getCardAccentStyle(type)]}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={getResourceIcon(item.category, item.status)}
            size={20}
            color={COLORS.primaryDark}
          />
        </View>

        <StatusBadge label={item.status} type={type} />
      </View>

      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.value}>{item.value}</Text>

      {latestLog ? (
        <View style={styles.logBox}>
          <Text style={styles.logTitle}>Latest Action</Text>
          <Text style={styles.logMeta}>
            {latestLog.actionType} • {latestLog.actorName || "Staff User"}
          </Text>
          <Text style={styles.logMeta}>
            {new Date(latestLog.createdAt).toLocaleString()}
          </Text>
          {latestLog.note ? (
            <Text style={styles.logNote}>{latestLog.note}</Text>
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
          />
        </View>

        <View style={styles.actionButton}>
          <AppButton
            title={isSubmitting ? "Working..." : "Escalate"}
            onPress={() => handleAction("ESCALATE")}
            disabled={isSubmitting}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.card,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 10,
  },
  logBox: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  logTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  logMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  logNote: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 6,
    lineHeight: 18,
  },
  actionsRow: {
    marginTop: 4,
  },
  actionButton: {
    marginBottom: 8,
  },
  successAccent: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.successText,
  },
  warningAccent: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.warningText,
  },
  dangerAccent: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.dangerText,
  },
  infoAccent: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.infoText,
  },
  neutralAccent: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.neutralText,
  },
});