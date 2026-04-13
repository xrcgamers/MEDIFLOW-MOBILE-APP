import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, Alert } from "react-native";
import FormSection from "../../src/components/FormSection";
import ResourceCard from "../../src/components/ResourceCard";
import StaffNavBar from "../../src/components/StaffNavBar";
import PageHeader from "../../src/components/PageHeader";
import { getResourcesService } from "../../src/services/resourceService";
import { getReadableErrorMessage } from "../../src/utils/errorMessages";
import { COLORS } from "../../src/constants/theme";

export default function ResourcesScreen() {
  const [resources, setResources] = useState({
    beds: [],
    theatre: [],
    blood: [],
    staff: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      try {
        setIsLoading(true);
        const data = await getResourcesService();
        setResources(data);
      } catch (error) {
        Alert.alert(
          "Resources Error",
          getReadableErrorMessage(error, "Failed to load resources.")
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadResources();
  }, []);

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
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
              {resources.beds.length > 0 ? (
                resources.beds.map((item) => (
                  <ResourceCard key={item.id} item={item} />
                ))
              ) : (
                <Text style={styles.emptyText}>No bed data available.</Text>
              )}
            </FormSection>

            <FormSection title="Theatre Readiness">
              {resources.theatre.length > 0 ? (
                resources.theatre.map((item) => (
                  <ResourceCard key={item.id} item={item} />
                ))
              ) : (
                <Text style={styles.emptyText}>No theatre data available.</Text>
              )}
            </FormSection>

            <FormSection title="Blood Status">
              {resources.blood.length > 0 ? (
                resources.blood.map((item) => (
                  <ResourceCard key={item.id} item={item} />
                ))
              ) : (
                <Text style={styles.emptyText}>No blood stock data available.</Text>
              )}
            </FormSection>

            <FormSection title="Staff Coverage">
              {resources.staff.length > 0 ? (
                resources.staff.map((item) => (
                  <ResourceCard key={item.id} item={item} />
                ))
              ) : (
                <Text style={styles.emptyText}>No staff coverage data available.</Text>
              )}
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
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});