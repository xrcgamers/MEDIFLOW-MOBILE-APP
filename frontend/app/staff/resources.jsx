import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, RefreshControl } from "react-native";
import FormSection from "../../src/components/FormSection";
import ResourceCard from "../../src/components/ResourceCard";
import StaffNavBar from "../../src/components/StaffNavBar";
import PageHeader from "../../src/components/PageHeader";
import { getResourcesService } from "../../src/services/resourceService";
import { COLORS } from "../../src/constants/theme";

export default function ResourcesScreen() {
  const [resources, setResources] = useState({
    beds: [],
    theatre: [],
    blood: [],
    staff: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadResources = async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data = await getResourcesService();
      setResources(data);
    } catch (error) {
      console.error("Failed to load resources:", error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadResources(true)}
          />
        }
      >
        <PageHeader
          eyebrow="Operational Readiness"
          title="Resources Board"
          subtitle="View current operational resource indicators."
          icon="layers-outline"
        />

        {isLoading ? (
          <Text style={styles.loadingText}>Loading resources...</Text>
        ) : (
          <>
            <FormSection title="Bed Availability">
              {resources.beds.map((item) => (
                <ResourceCard key={item.id} item={item} />
              ))}
            </FormSection>

            <FormSection title="Theatre Readiness">
              {resources.theatre.map((item) => (
                <ResourceCard key={item.id} item={item} />
              ))}
            </FormSection>

            <FormSection title="Blood Status">
              {resources.blood.map((item) => (
                <ResourceCard key={item.id} item={item} />
              ))}
            </FormSection>

            <FormSection title="Staff Coverage">
              {resources.staff.map((item) => (
                <ResourceCard key={item.id} item={item} />
              ))}
            </FormSection>
          </>
        )}
      </ScrollView>

      <StaffNavBar activeRoute="/staff/resources" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 120,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
});