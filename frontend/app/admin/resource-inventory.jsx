import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  RefreshControl,
  Pressable,
} from "react-native";
import BackNavButton from "../../src/components/BackNavButton";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import FormInput from "../../src/components/FormInput";
import AppButton from "../../src/components/AppButton";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import {
  getResourceCategoriesService,
  getResourceItemsService,
  createResourceItemService,
  updateResourceItemService,
} from "../../src/services/resourceInventoryService";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";

function getStatusType(status) {
  switch (status) {
    case "AVAILABLE":
      return "success";
    case "LOW":
    case "RESERVED":
      return "warning";
    case "CRITICAL":
    case "INACTIVE":
      return "danger";
    default:
      return "info";
  }
}

function SearchableCategoryPicker({
  label,
  searchValue,
  onChangeSearch,
  options,
  onSelect,
  selectedLabel,
  colors,
  typography,
  radius,
}) {
  const filtered = useMemo(() => {
    const q = (searchValue || "").trim().toLowerCase();
    if (!q) return options.slice(0, 12);
    return options
      .filter((item) => item.label.toLowerCase().includes(q))
      .slice(0, 12);
  }, [options, searchValue]);

  return (
    <View style={{ marginBottom: 12 }}>
      <FormInput
        label={label}
        value={searchValue}
        onChangeText={onChangeSearch}
        placeholder="Search category"
      />

      {!!filtered.length && (
        <View
          style={[
            styles.suggestionBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
            },
          ]}
        >
          {filtered.map((item, index) => (
            <Pressable
              key={item.value}
              onPress={() => onSelect(item)}
              style={[
                styles.suggestionItem,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: index === filtered.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text style={[typography.body, { color: colors.text }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {!!selectedLabel && (
        <Text style={[typography.body, { color: colors.textMuted, marginTop: 6 }]}>
          Selected Category: {selectedLabel}
        </Text>
      )}
    </View>
  );
}

export default function ResourceInventoryScreen() {
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    categoryId: "",
    label: "",
    subType: "",
    status: "AVAILABLE",
    currentQuantity: "",
    availableQuantity: "",
    unitOfMeasure: "",
    location: "",
    managedByRole: "",
  });

  const categoryOptions = useMemo(
    () =>
      (categories || []).map((item) => ({
        label: item.name,
        value: item.id,
      })),
    [categories]
  );

  const selectedCategoryLabel = useMemo(() => {
    return (
      categoryOptions.find((item) => item.value === form.categoryId)?.label || ""
    );
  }, [categoryOptions, form.categoryId]);

  const loadData = async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const [categoryData, itemData] = await Promise.all([
        getResourceCategoriesService(),
        getResourceItemsService(),
      ]);

      setCategories(categoryData || []);
      setItems(itemData || []);
    } catch (error) {
      showToast({
        title: "Load Failed",
        message: error.message || "Unable to load resource inventory.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setSelectedItemId(null);
    setCategorySearch("");
    setForm({
      categoryId: "",
      label: "",
      subType: "",
      status: "AVAILABLE",
      currentQuantity: "",
      availableQuantity: "",
      unitOfMeasure: "",
      location: "",
      managedByRole: "",
    });
  };

  const handleEdit = (item) => {
    setSelectedItemId(item.id);
    setCategorySearch(item.category?.name || "");
    setForm({
      categoryId: item.categoryId || "",
      label: item.label || "",
      subType: item.subType || "",
      status: item.status || "AVAILABLE",
      currentQuantity:
        item.currentQuantity === null || item.currentQuantity === undefined
          ? ""
          : String(item.currentQuantity),
      availableQuantity:
        item.availableQuantity === null || item.availableQuantity === undefined
          ? ""
          : String(item.availableQuantity),
      unitOfMeasure: item.unitOfMeasure || "",
      location: item.location || "",
      managedByRole: item.managedByRole || "",
    });
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.label.trim()) {
      showToast({
        title: "Missing Data",
        message: "Category and label are required.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        categoryId: form.categoryId,
        label: form.label.trim(),
        subType: form.subType.trim() || null,
        status: form.status,
        currentQuantity:
          form.currentQuantity === "" ? null : Number(form.currentQuantity),
        availableQuantity:
          form.availableQuantity === "" ? null : Number(form.availableQuantity),
        unitOfMeasure: form.unitOfMeasure.trim() || null,
        location: form.location.trim() || null,
        managedByRole: form.managedByRole.trim() || null,
      };

      if (selectedItemId) {
        await updateResourceItemService(selectedItemId, payload);
        showToast({
          title: "Resource Updated",
          message: "Resource inventory item updated successfully.",
          type: "success",
        });
      } else {
        await createResourceItemService(payload);
        showToast({
          title: "Resource Created",
          message: "Resource inventory item created successfully.",
          type: "success",
        });
      }

      resetForm();
      await loadData(true);
    } catch (error) {
      showToast({
        title: selectedItemId ? "Update Failed" : "Create Failed",
        message: error.message || "Unable to save inventory item.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} />}
    >
      <BackNavButton label="Back to Admin Dashboard" fallbackRoute="/admin" />

      <PageHeader
        eyebrow="System Administration"
        title="Resource Inventory"
        subtitle="Manage blood stock, bed pools, imaging units, and theatre rooms."
        icon="cube-outline"
      />

      <FormSection title={selectedItemId ? "Edit Inventory Item" : "Create Inventory Item"}>
        <SearchableCategoryPicker
          label="Search Category"
          searchValue={categorySearch}
          onChangeSearch={(value) => {
            setCategorySearch(value);

            const exact = categoryOptions.find(
              (item) => item.label.toLowerCase() === value.trim().toLowerCase()
            );

            if (exact) {
              setForm((prev) => ({
                ...prev,
                categoryId: exact.value,
              }));
            }
          }}
          options={categoryOptions}
          onSelect={(item) => {
            setCategorySearch(item.label);
            setForm((prev) => ({
              ...prev,
              categoryId: item.value,
            }));
          }}
          selectedLabel={selectedCategoryLabel}
          colors={colors}
          typography={typography}
          radius={radius}
        />

        <FormInput
          label="Label"
          value={form.label}
          onChangeText={(value) => setForm((prev) => ({ ...prev, label: value }))}
          placeholder="e.g. Blood Stock, Bed Pool, Theatre Room"
        />

        <FormInput
          label="Subtype"
          value={form.subType}
          onChangeText={(value) => setForm((prev) => ({ ...prev, subType: value }))}
          placeholder="e.g. O+, ICU, CT Scanner 1"
        />

        <FormInput
          label="Status"
          value={form.status}
          onChangeText={(value) => setForm((prev) => ({ ...prev, status: value }))}
          placeholder="AVAILABLE, LOW, RESERVED, CRITICAL, INACTIVE"
        />

        <FormInput
          label="Current Quantity"
          value={form.currentQuantity}
          onChangeText={(value) => setForm((prev) => ({ ...prev, currentQuantity: value }))}
          keyboardType="numeric"
          placeholder="e.g. 20"
        />

        <FormInput
          label="Available Quantity"
          value={form.availableQuantity}
          onChangeText={(value) => setForm((prev) => ({ ...prev, availableQuantity: value }))}
          keyboardType="numeric"
          placeholder="e.g. 12"
        />

        <FormInput
          label="Unit of Measure"
          value={form.unitOfMeasure}
          onChangeText={(value) => setForm((prev) => ({ ...prev, unitOfMeasure: value }))}
          placeholder="e.g. pints, beds, room, unit"
        />

        <FormInput
          label="Location"
          value={form.location}
          onChangeText={(value) => setForm((prev) => ({ ...prev, location: value }))}
          placeholder="e.g. Blood Bank Main Fridge"
        />

        <FormInput
          label="Managed By Role"
          value={form.managedByRole}
          onChangeText={(value) => setForm((prev) => ({ ...prev, managedByRole: value }))}
          placeholder="e.g. BLOOD_BANK_STAFF"
        />

        <AppButton
          title={
            isSubmitting
              ? selectedItemId
                ? "Updating..."
                : "Creating..."
              : selectedItemId
              ? "Update Inventory Item"
              : "Create Inventory Item"
          }
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
        />

        {selectedItemId ? (
          <AppButton title="Cancel Edit" onPress={resetForm} variant="secondary" />
        ) : null}
      </FormSection>

      <FormSection title="Inventory Items">
        {isLoading ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>
            Loading inventory...
          </Text>
        ) : items.length ? (
          items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleEdit(item)}
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
                  {item.subType || item.label}
                </Text>
                <StatusBadge label={item.status} type={getStatusType(item.status)} />
              </View>

              <Text style={[typography.body, { color: colors.text }]}>
                Category: {item.category?.name || "Unknown"}
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>
                Label: {item.label}
              </Text>
              {item.subType ? (
                <Text style={[typography.body, { color: colors.text }]}>
                  Subtype: {item.subType}
                </Text>
              ) : null}
              <Text style={[typography.body, { color: colors.text }]}>
                Current Quantity: {item.currentQuantity ?? "N/A"}
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>
                Available Quantity: {item.availableQuantity ?? "N/A"}
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>
                Unit: {item.unitOfMeasure || "N/A"}
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>
                Location: {item.location || "N/A"}
              </Text>
              <Text style={[typography.body, { color: colors.textMuted }]}>
                Managed By: {item.managedByRole || "N/A"}
              </Text>
            </Pressable>
          ))
        ) : (
          <EmptyStateCard
            title="No Inventory Items"
            message="No inventory items are available yet."
            icon="cube-outline"
          />
        )}
      </FormSection>
    </ScrollView>
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
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  suggestionBox: {
    borderWidth: 1,
    marginTop: 4,
    overflow: "hidden",
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});