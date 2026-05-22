export const SECRETARY_ROLE = "secretary";

export function isSecretaryRole(role: string | null | undefined) {
  return role === SECRETARY_ROLE;
}

export function canAccessMedicalData(role: string | null | undefined) {
  return !isSecretaryRole(role);
}
