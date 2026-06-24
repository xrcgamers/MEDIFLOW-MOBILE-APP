import { useEffect, useMemo, useState } from "react";
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
  updateStaffUserService,
  deleteStaffUserService,
  resetStaffPasswordService,
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

const ACTIVE_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const emptyForm = {
  staffId: "",
  name: "",
  email: "",
  password: "",
  roleName: "",
};

export default function AdminStaffUsersScreen() {
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editForms, setEditForms] = useState({});
  const [resetPasswords, setResetPasswords] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);

  const loadUsers = async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const data = await getStaffUsersService();
      setUsers(data || []);

      const nextEditForms = {};
      (data || []).forEach((user) => {
        nextEditForms[user.id] = {
          staffId: user.staffId || "",
          name: user.name || "",
          email: user.email || "",
          roleName: user.role?.name || "",
          isActive: String(Boolean(user.isActive)),
        };
      });

      setEditForms(nextEditForms);
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

  const groupedUsers = useMemo(() => {
    return users.reduce((acc, user) => {
      const role = user.role?.name || "UNKNOWN";
      if (!acc[role]) acc[role] = [];
      acc[role].push(user);
      return acc;
    }, {});
  }, [users]);

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
        isActive: true,
      });

      setForm(emptyForm);

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

  const handleUpdate = async (userId) => {
    const current = editForms[userId];

    if (!current) return;

    if (!current.staffId.trim() || !current.name.trim() || !current.email.trim() || !current.roleName) {
      showToast({
        title: "Missing Details",
        message: "Staff ID, name, email, and role are required.",
        type: "warning",
      });
      return;
    }

    try {
      setBusyUserId(userId);

      await updateStaffUserService(userId, {
        staffId: current.staffId.trim(),
        name: current.name.trim(),
        email: current.email.trim(),
        roleName: current.roleName,
        isActive: current.isActive === "true",
      });

      showToast({
        title: "Staff User Updated",
        message: "Staff user details were updated.",
        type: "success",
      });

      await loadUsers(true);
    } catch (error) {
      showToast({
        title: "Update Failed",
        message: error.message || "Unable to update staff user.",
        type: "error",
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      setBusyUserId(user.id);

      await updateStaffUserService(user.id, {
        isActive: !user.isActive,
      });

      showToast({
        title: user.isActive ? "User Deactivated" : "User Activated",
        message: "Staff user status updated.",
        type: "success",
      });

      await loadUsers(true);
    } catch (error) {
      showToast({
        title: "Status Update Failed",
        message: error.message || "Unable to update user status.",
        type: "error",
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = resetPasswords[userId];

    if (!newPassword || !newPassword.trim()) {
      showToast({
        title: "Password Required",
        message: "Enter a new password first.",
        type: "warning",
      });
      return;
    }

    try {
      setBusyUserId(userId);

      await resetStaffPasswordService(userId, newPassword.trim());

      setResetPasswords((prev) => ({
        ...prev,
        [userId]: "",
      }));

      showToast({
        title: "Password Reset",
        message: "Staff password was reset successfully.",
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Password Reset Failed",
        message: error.message || "Unable to reset password.",
        type: "error",
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = async (userId) => {
    try {
      setBusyUserId(userId);

      const result = await deleteStaffUserService(userId);

      showToast({
        title: result?.deleted ? "Staff User Deleted" : "Staff User Deactivated",
        message: result?.deleted
          ? "The staff user was deleted."
          : "The user had related records, so the account was deactivated instead.",
        type: "success",
      });

      await loadUsers(true);
    } catch (error) {
      showToast({
        title: "Delete Failed",
        message: error.message || "Unable to delete staff user.",
        type: "error",
      });
    } finally {
      setBusyUserId(null);
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
          subtitle="Create, update, deactivate, reset, and delete staff accounts."
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
            Object.entries(groupedUsers).map(([roleName, roleUsers]) => (
              <View key={roleName} style={{ marginBottom: 16 }}>
                <Text style={[styles.roleTitle, { color: colors.text }]}>
                  {roleName}
                </Text>

                {roleUsers.map((user) => {
                  const edit = editForms[user.id] || {};

                  return (
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

                      <FormInput
                        label="Staff ID"
                        value={edit.staffId || ""}
                        onChangeText={(value) =>
                          setEditForms((prev) => ({
                            ...prev,
                            [user.id]: { ...prev[user.id], staffId: value },
                          }))
                        }
                      />

                      <FormInput
                        label="Full Name"
                        value={edit.name || ""}
                        onChangeText={(value) =>
                          setEditForms((prev) => ({
                            ...prev,
                            [user.id]: { ...prev[user.id], name: value },
                          }))
                        }
                      />

                      <FormInput
                        label="Email"
                        value={edit.email || ""}
                        onChangeText={(value) =>
                          setEditForms((prev) => ({
                            ...prev,
                            [user.id]: { ...prev[user.id], email: value },
                          }))
                        }
                        autoCapitalize="none"
                      />

                      <FormSelect
                        label="Role"
                        selectedValue={edit.roleName || ""}
                        onValueChange={(value) =>
                          setEditForms((prev) => ({
                            ...prev,
                            [user.id]: { ...prev[user.id], roleName: value },
                          }))
                        }
                        options={ROLE_OPTIONS}
                        placeholder="Select role"
                      />

                      <FormSelect
                        label="Account Status"
                        selectedValue={edit.isActive || "true"}
                        onValueChange={(value) =>
                          setEditForms((prev) => ({
                            ...prev,
                            [user.id]: { ...prev[user.id], isActive: value },
                          }))
                        }
                        options={ACTIVE_OPTIONS}
                        placeholder="Select status"
                      />

                      <AppButton
                        title={busyUserId === user.id ? "Updating..." : "Save Changes"}
                        onPress={() => handleUpdate(user.id)}
                        disabled={busyUserId === user.id}
                      />

                      <AppButton
                        title={user.isActive ? "Deactivate User" : "Activate User"}
                        onPress={() => handleToggleActive(user)}
                        disabled={busyUserId === user.id}
                        variant="secondary"
                      />

                      <FormInput
                        label="New Password"
                        value={resetPasswords[user.id] || ""}
                        onChangeText={(value) =>
                          setResetPasswords((prev) => ({
                            ...prev,
                            [user.id]: value,
                          }))
                        }
                        placeholder="Enter new temporary password"
                        secureTextEntry
                      />

                      <AppButton
                        title={busyUserId === user.id ? "Resetting..." : "Reset Password"}
                        onPress={() => handleResetPassword(user.id)}
                        disabled={busyUserId === user.id}
                        variant="secondary"
                      />

                      <AppButton
                        title={busyUserId === user.id ? "Deleting..." : "Delete / Remove User"}
                        onPress={() => handleDelete(user.id)}
                        disabled={busyUserId === user.id}
                        variant="secondary"
                      />
                    </View>
                  );
                })}
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
  roleTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
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