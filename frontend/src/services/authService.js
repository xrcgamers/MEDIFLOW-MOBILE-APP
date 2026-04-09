export async function loginStaffService({ identifier, password }) {
  const cleanedIdentifier = identifier.trim();
  const cleanedPassword = password.trim();

  if (!cleanedIdentifier || !cleanedPassword) {
    throw new Error("Identifier and password are required.");
  }

  return Promise.resolve({
    user: {
      id: "staff-001",
      name: "Triage Nurse",
      role: "Staff",
      identifier: cleanedIdentifier,
    },
    token: "mock-jwt-token",
  });
}