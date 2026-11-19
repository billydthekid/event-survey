// ฟ้าใส: ข้อความแจ้งเตือนใต้ช่องกรอกของ Wizard (ไม่มีข้อความ = ไม่แสดงอะไร)
export function FieldError({ text }: { text?: string }) {
  // ฟ้าใส: ไม่มี error → ไม่แสดงอะไร
  if (!text) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {text}
    </p>
  );
}
