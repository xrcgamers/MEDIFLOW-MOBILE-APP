import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, View, RefreshControl } from "react-native";
import BackNavButton from "../../src/components/BackNavButton";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import FormInput from "../../src/components/FormInput";
import FormSelect from "../../src/components/FormSelect";
import AppButton from "../../src/components/AppButton";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import RoleGuard from "../../src/components/RoleGuard";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import {
  getStaffUsersService,
  createStaffUserService,
} from "../../src/services/adminStaffUserService";

const ROLE_OPTIONS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Emergency Nurse", value: "EMERGENCY_NURSE" },
  { label: "Triage Nurse", value: "TRIAGE_NURSE" },
  { label: "Blood Bank Staff", value: "BLOOD_BANK_STAFF" },
  { label: "Imaging Staff", value: "IMAGING_STAFF" },
  { label: "Theatre Staff", value: "THEATRE_STAFF" },
  { label: "Bed Manager", value: "BED_MANAGER" },
];

export default function AdminStaffUsersScreen() {
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    staffId: "",
    name: "",
    email: "",
    password: "",
    roleName: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);
      const data = await getStaffUsersService();
      setUsers(data || []);
    } catch (error) {
      showToast({
        title: "Load Failed",
        message: error.message || "Unable to load staff users.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async () => {
    if (
      !form.staffId.trim() ||
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.roleName
    ) {
      showToast({
        title: "Missing Details",
        message: "Fill all staff user fields.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await createStaffUserService({
        staffId: form.staffId.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        roleName: form.roleName,
      });

      setForm({
        staffId: "",
        name: "",
        email: "",
        password: "",
        roleName: "",
      });

      showToast({
        title: "Staff User Created",
        message: "The new staff account was created successfully.",
        type: "success",
      });

      await loadUsers(true);
    } catch (error) {
      showToast({
        title: "Create Failed",
        message: error.message || "Unable to create staff user.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadUsers(true)} />
        }
      >
        <BackNavButton label="Back to Admin Dashboard" fallbackRoute="/admin" />

        <PageHeader
          eyebrow="Administration"
          title="Staff User Management"
          subtitle="Create staff accounts and assign system roles."
          icon="people-outline"
        />

        <FormSection title="Create Staff User">
          <FormInput
            label="Staff ID"
            value={form.staffId}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, staffId: value }))
            }
            placeholder="e.g. TRIAGE001"
          />

          <FormInput
            label="Full Name"
            value={form.name}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, name: value }))
            }
            placeholder="Staff full name"
          />

          <FormInput
            label="Email"
            value={form.email}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, email: value }))
            }
            placeholder="staff@example.com"
            autoCapitalize="none"
          />

          <FormInput
            label="Password"
            value={form.password}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, password: value }))
            }
            placeholder="Temporary password"
            secureTextEntry
          />

          <FormSelect
            label="Role"
            selectedValue={form.roleName}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, roleName: value }))
            }
            options={ROLE_OPTIONS}
            placeholder="Select role"
          />

          <AppButton
            title={isSubmitting ? "Creating..." : "Create Staff User"}
            onPress={handleCreate}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </FormSection>

        <FormSection title="Existing Staff Users">
          {isLoading ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Loading users...
            </Text>
          ) : users.length ? (
            users.map((user) => (
              <View
                key={user.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                  },
                  shadow,
                ]}
              >
                <View style={styles.headerRow}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {user.name}
                  </Text>
                  <StatusBadge
                    label={user.isActive ? "ACTIVE" : "INACTIVE"}
                    type={user.isActive ? "success" : "danger"}
                  />
                </View>

                <Text style={[typography.body, { color: colors.text }]}>
                  Staff ID: {user.staffId}
                </Text>
                <Text style={[typography.body, { color: colors.text }]}>
                  Email: {user.email}
                </Text>
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  Role: {user.role?.name || "Unknown"}
                </Text>
              </View>
            ))
          ) : (
            <EmptyStateCard
              title="No Staff Users"
              message="No staff users are available yet."
              icon="people-outline"
            />
          )}
        </FormSection>
      </ScrollView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
});