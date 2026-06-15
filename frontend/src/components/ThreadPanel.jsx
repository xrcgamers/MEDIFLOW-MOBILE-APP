import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import FormSection from "./FormSection";
import FormInput from "./FormInput";
import AppButton from "./AppButton";
import EmptyStateCard from "./EmptyStateCard";
import { useAppTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { postThreadMessageUiService } from "../services/communicationService";

export default function ThreadPanel({
  title,
  loadThread,
  loadKey,
}) {
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [thread, setThread] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const refreshThread = async () => {
    try {
      setIsLoading(true);
      const data = await loadThread();
      setThread(data);
    } catch (error) {
      showToast({
        title: "Thread Load Failed",
        message: error.message || "Unable to load communication thread.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshThread();
  }, [loadKey]);

  const handleSend = async () => {
    if (!thread?.id) return;

    if (!message.trim()) {
      showToast({
        title: "Empty Message",
        message: "Enter a message first.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSending(true);
      await postThreadMessageUiService(thread.id, {
        body: message.trim(),
      });
      setMessage("");
      await refreshThread();
    } catch (error) {
      showToast({
        title: "Send Failed",
        message: error.message || "Unable to send message.",
        type: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <FormSection title={title}>
      {isLoading ? (
        <Text style={[typography.body, { color: colors.textMuted }]}>Loading thread...</Text>
      ) : thread?.messages?.length ? (
        <ScrollView
          style={[
            styles.threadBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
            },
          ]}
          contentContainerStyle={{ padding: spacing.md }}
        >
          {thread.messages.map((item) => (
            <View
              key={item.id}
              style={[
                styles.messageCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  padding: spacing.sm,
                },
                shadow,
              ]}
            >
              <Text style={[styles.messageMeta, { color: colors.textMuted }]}>
                {item.isSystemGenerated
                  ? "SYSTEM"
                  : item.senderUser?.name || item.senderRole || "Unknown"}
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>{item.body}</Text>
              <Text style={[styles.messageMeta, { color: colors.textMuted }]}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <EmptyStateCard
          title="No Messages Yet"
          message="This thread has no messages yet."
          icon="chatbubbles-outline"
        />
      )}

      <FormInput
        label="New Message"
        value={message}
        onChangeText={setMessage}
        placeholder="Type a coordination message..."
        multiline
      />

      <AppButton
        title={isSending ? "Sending..." : "Send Message"}
        onPress={handleSend}
        disabled={isSending}
      />
    </FormSection>
  );
}

const styles = StyleSheet.create({
  threadBox: {
    borderWidth: 1,
    maxHeight: 320,
    marginBottom: 12,
  },
  messageCard: {
    borderWidth: 1,
    marginBottom: 10,
  },
  messageMeta: {
    fontSize: 12,
    marginBottom: 4,
  },
});