import type { UserRole } from "@/lib/rbac";

export const MASKED_SOURCE_CODE = "888";

export function hasHyphenSourceCode(code: string | null | undefined): boolean {
  return Boolean(code?.includes("-"));
}

export function canViewInternalSourceCode(
  role: UserRole | string | null | undefined,
): boolean {
  return role === "admin" || role === "collaborator";
}

export function getDisplaySourceCode(
  code: string | null | undefined,
  role?: UserRole | string | null,
): string {
  const sourceCode = (code || "").trim();
  if (!sourceCode) return "";
  if (canViewInternalSourceCode(role)) return sourceCode;
  if (hasHyphenSourceCode(sourceCode)) return MASKED_SOURCE_CODE;
  return sourceCode;
}
