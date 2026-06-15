const API_ORIGIN = "http://localhost:5000";

export function resolveMediaUrl(filePath) {
  if (!filePath) return null;

  if (filePath.startsWith("http")) {
    return filePath;
  }

  return `${API_ORIGIN}${filePath}`;
}