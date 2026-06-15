import * as ImagePicker from "expo-image-picker";

export async function takeIncidentPhotoService() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Camera permission was denied.");
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
    cameraType: ImagePicker.CameraType.back,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return result.assets[0];
}