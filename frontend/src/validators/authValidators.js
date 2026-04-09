export function validateLoginForm({ identifier, password }) {
  const errors = {};

  if (!identifier.trim()) {
    errors.identifier = "Staff ID or email is required.";
  }

  if (!password.trim()) {
    errors.password = "Password is required.";
  }

  return errors;
}