import * as ImagePicker from "expo-image-picker";

export async function captureReportPhotoService() {
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

  if (permissionResult.status !== "granted") {
    throw new Error("Camera permission was denied.");
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.7,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets?.[0];

  if (!asset) {
    throw new Error("No image was captured.");
  }

  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType || "image/jpeg",
    fileName: asset.fileName || `report-photo-${Date.now()}.jpg`,
    fileSize: asset.fileSize || null,
  };
}