export function getReadableErrorMessage(error, fallbackMessage) {
  return error?.message || fallbackMessage;
}