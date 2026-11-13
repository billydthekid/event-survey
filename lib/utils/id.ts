/** สร้าง id ใหม่ (อยู่นอก component เพื่อไม่ให้ lint "impure function during render" ฟ้อง) */
export const newId = (prefix = "id") => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
