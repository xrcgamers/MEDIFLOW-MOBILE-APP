import * as Location from "expo-location";

export async function getCurrentLocationService() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission was denied.");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = location.coords;

  const locationText = await buildReadableLocationText(latitude, longitude);

  return {
    latitude,
    longitude,
    locationText,
  };
}

async function buildReadableLocationText(latitude, longitude) {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (!results || results.length === 0) {
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }

    const firstResult = results[0];

    const parts = [
      firstResult.name,
      firstResult.street,
      firstResult.district,
      firstResult.city,
      firstResult.region,
      firstResult.country,
    ].filter(Boolean);

    if (parts.length === 0) {
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }

    return parts.join(", ");
  } catch (error) {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}