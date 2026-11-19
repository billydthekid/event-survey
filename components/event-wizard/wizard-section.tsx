// ส่วนหนึ่งของหน้า Wizard (แทนการ์ดเดิม): หัวข้อ + คำอธิบาย + ปุ่มด้านขวา แล้วช่องกรอกเรียงลงมา
// ทุกขั้นคืน <WizardSection> หลายอันต่อกัน → wizard-shell ขีดเส้นคั่นให้ (divide-y) อยู่ในแผ่นเดียว
import { cn } from "@/lib/utils";

export function WizardSection({
  title,
  description,
  action,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-4 py-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
