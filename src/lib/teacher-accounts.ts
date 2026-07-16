const BOOTSTRAP_TEACHER_EMAILS = ["adminportalconnect@gmail.com"];

export function isBootstrapTeacherEmail(email?: string | null): boolean {
  if (!email) return false;
  return BOOTSTRAP_TEACHER_EMAILS.includes(email.trim().toLowerCase());
}
