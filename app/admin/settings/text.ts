// app/admin/settings/text.ts
// ข้อความ 2 ภาษาของหน้า Settings (ขั้นถัดไปจะเพิ่มข้อความของการ์ดโปรไฟล์/รหัสผ่านที่นี่)
export const TEXT = {
  th: {
    breadcrumb: "บัญชีของฉัน / Settings",
    title: "Settings",
    subtitle: "ตั้งค่าโปรไฟล์และความปลอดภัยของบัญชีคุณ · การตั้งค่าระบบทำได้โดย Super Admin",
    language: {
      title: "ภาษาที่แสดง",
      hint: "มีผลกับหน้าจอของคุณเท่านั้น",
      langLabel: "ภาษา",
    },
  },
  en: {
    breadcrumb: "My account / Settings",
    title: "Settings",
    subtitle: "Manage your profile and account security · System settings are managed by Super Admin",
    language: {
      title: "Display language",
      hint: "Applies to your screens only",
      langLabel: "Language",
    },
  },
};
export type SettingsText = (typeof TEXT)["th"];

// ชื่อภาษาในตัวเลือก: เขียนด้วยภาษาของมันเองเสมอ (คนอ่านอีกภาษาก็หาเจอ)
export const LANG_OPTIONS = [
  { value: "th", label: "ภาษาไทย" },
  { value: "en", label: "English" },
] as const;
