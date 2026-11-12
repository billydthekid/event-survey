// app/admin/settings/text.ts
// ข้อความ 2 ภาษาของหน้า Settings (ขั้นถัดไปจะเพิ่มข้อความของการ์ดโปรไฟล์/รหัสผ่านที่นี่)
export const TEXT = {
  th: {
    breadcrumb: "บัญชีของฉัน / Settings",
    title: "Settings",
    subtitle: "ตั้งค่าโปรไฟล์และความปลอดภัยของบัญชีคุณ · การตั้งค่าระบบทำได้โดย Super Admin",
    profile: {
      title: "โปรไฟล์ของฉัน",
      hint: "ข้อมูลบัญชีที่ Super Admin สร้างให้",
      role: "Event Admin",
      nameLabel: "ชื่อ-นามสกุล",
      namePlaceholder: "กรอกชื่อ-นามสกุล",
      nameEmpty: "กรุณากรอกชื่อ-นามสกุล",
      usernameLabel: "Username",
      orgLabel: "หน่วยงาน",
      lockedHint: "Username, หน่วยงาน, Role และ Event ที่ดูแล เปลี่ยนได้โดย Super Admin เท่านั้น",
    },
    actions: {
      cancel: "ยกเลิก",
      save: "บันทึกการตั้งค่า",
      saved: "บันทึกการตั้งค่าแล้ว",
    },
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
    profile: {
      title: "My profile",
      hint: "Account details created by Super Admin",
      role: "Event Admin",
      nameLabel: "Full name",
      namePlaceholder: "Enter your full name",
      nameEmpty: "Please enter your full name",
      usernameLabel: "Username",
      orgLabel: "Organization",
      lockedHint: "Username, organization, role and assigned events can only be changed by Super Admin",
    },
    actions: {
      cancel: "Cancel",
      save: "Save settings",
      saved: "Settings saved",
    },
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
