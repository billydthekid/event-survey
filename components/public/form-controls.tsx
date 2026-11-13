// components/public/form-controls.tsx
// ช่องกรอกของหน้าผู้เข้าร่วม (ลงทะเบียน + แบบประเมิน) — สไตล์ตาม Figma A5/A2/B1
// ทุกช่องรับ pal (สีตาม Theme) และ error (ข้อความผิดพลาด → กรอบแดง + ข้อความใต้ช่อง)
"use client";
import { Check, ChevronDown, CircleAlert, Star } from "lucide-react";
import type { Palette } from "./public-ui";

const ERROR = "#EF4444";

// กรอบช่องกรอก: ปกติไม่มีเส้น / มี error เป็นเส้นแดง
function boxStyle(pal: Palette, error?: string): React.CSSProperties {
  return {
    background: error && pal.mode !== "dark" ? "#FEF2F2" : pal.input,
    color: pal.inputText,
    borderColor: error ? ERROR : "transparent",
    // สีวงแหวนตอนโฟกัส = สีหลักของงาน
    ["--tw-ring-color" as string]: pal.primary,
  };
}
const BOX = "w-full rounded-xl border px-4 text-sm outline-none transition focus-visible:ring-2 placeholder:opacity-60";

// ============ หัวข้อช่อง ============
export function FieldLabel({
  htmlFor,
  number,
  label,
  required,
  note,
  pal,
}: {
  htmlFor?: string;
  number?: number; // เลขข้อ (แบบประเมิน)
  label: string;
  required: boolean;
  note?: string; // เช่น "ไม่บังคับ" / "เลือกได้หลายข้อ"
  pal: Palette;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold break-words">
      {number !== undefined && (
        <span className="mr-1.5" style={{ color: pal.primary }}>
          {number}
        </span>
      )}
      {label}
      {required && <span style={{ color: ERROR }}> *</span>}
      {note && (
        <span className="ml-1.5 text-xs font-normal" style={{ color: pal.muted }}>
          {note}
        </span>
      )}
    </label>
  );
}

export function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: ERROR }}>
      <CircleAlert className="size-3.5 shrink-0" /> {error}
    </p>
  );
}

// ============ ช่องข้อความ ============
export function TextInput({
  pal,
  error,
  suffix,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { pal: Palette; error?: string; suffix?: string }) {
  return (
    <div className="relative">
      <input
        {...props}
        aria-invalid={!!error}
        className={`${BOX} h-11 ${suffix ? "pr-12" : ""}`}
        style={boxStyle(pal, error)}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm" style={{ color: pal.muted }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

export function TextArea({
  pal,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { pal: Palette; error?: string }) {
  return <textarea {...props} aria-invalid={!!error} rows={4} className={`${BOX} resize-none py-3`} style={boxStyle(pal, error)} />;
}

// ============ Dropdown (select ของเบราว์เซอร์ — บนมือถือได้ตัวเลือกแบบเนทีฟ ใช้ง่ายสุด) ============
export function SelectInput({
  pal,
  error,
  placeholder,
  options,
  value,
  onChange,
  id,
  describedBy,
}: {
  pal: Palette;
  error?: string;
  placeholder: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  id: string;
  describedBy?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`${BOX} h-11 appearance-none pr-10`}
        style={{ ...boxStyle(pal, error), color: value ? pal.inputText : pal.muted }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ color: "#0F172A" }}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2" style={{ color: pal.muted }} />
    </div>
  );
}

// ============ ปุ่มเลือกเรียงแถว (เพศ / ไซซ์เสื้อ) — ตาม Figma A5 ============
export function Segmented({
  pal,
  error,
  options,
  value,
  onChange,
  label,
}: {
  pal: Palette;
  error?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className="h-11 truncate rounded-xl border px-2 text-sm font-medium transition"
            style={
              on
                ? { background: pal.soft, borderColor: pal.primary, color: pal.mode === "dark" ? "#FFFFFF" : pal.primary }
                : { background: pal.input, borderColor: error ? ERROR : "transparent", color: pal.inputText }
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ============ รายการตัวเลือก (วงกลม = เลือกได้ 1 / สี่เหลี่ยม = เลือกได้หลายข้อ) — ตาม Figma B1 ============
export function ChoiceList({
  pal,
  error,
  options,
  multiple,
  value,
  onChange,
  label,
}: {
  pal: Palette;
  error?: string;
  options: { value: string; label: string }[];
  multiple: boolean;
  value: string | string[];
  onChange: (v: string | string[]) => void;
  label: string;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = (v: string) => {
    if (!multiple) return onChange(v);
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };
  return (
    <div role={multiple ? "group" : "radiogroup"} aria-label={label} className="space-y-2">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => toggle(o.value)}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition"
            style={
              on
                ? { background: pal.soft, borderColor: pal.primary, color: pal.text }
                : { background: pal.input, borderColor: error ? ERROR : "transparent", color: pal.inputText }
            }
          >
            <span
              className={`flex size-[18px] shrink-0 items-center justify-center border-2 ${multiple ? "rounded-[5px]" : "rounded-full"}`}
              style={{ borderColor: on ? pal.primary : pal.muted, background: on && multiple ? pal.primary : "transparent" }}
            >
              {on && (multiple ? <Check className="size-3 text-white" strokeWidth={3} /> : <span className="size-2 rounded-full" style={{ background: pal.primary }} />)}
            </span>
            <span className={`min-w-0 break-words ${on ? "font-semibold" : ""}`}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============ ให้คะแนน 1–5 หรือ 1–10 แบบตัวเลข หรือ ดาว (ตั้งใน Survey Builder) — ตาม Figma B1 ============
export function RatingScale({
  pal,
  error,
  value,
  onChange,
  minLabel,
  maxLabel,
  label,
  max = 5,
  variant = "number",
}: {
  pal: Palette;
  error?: string;
  value: number | undefined;
  onChange: (v: number) => void;
  minLabel: string;
  maxLabel: string;
  label: string;
  max?: 5 | 10;
  variant?: "number" | "star";
}) {
  const nums = Array.from({ length: max }, (_, i) => i + 1);

  if (variant === "star") {
    return (
      <div>
        <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
          {nums.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={String(n)}
              onClick={() => onChange(n)}
              className="rounded-lg p-1"
            >
              <Star
                className={max === 10 ? "size-7" : "size-9"}
                style={{ color: error ? ERROR : pal.primary }}
                fill={value !== undefined && n <= value ? pal.primary : "none"}
              />
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-xs" style={{ color: pal.muted }}>
          <span>{minLabel}</span>
          <span>{value ? `${value} / ${max}` : maxLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-2">
        {nums.map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={String(n)}
              onClick={() => onChange(n)}
              className="h-12 rounded-xl border text-base font-semibold transition"
              style={
                on
                  ? { background: pal.primary, borderColor: pal.primary, color: "#FFFFFF" }
                  : { background: pal.input, borderColor: error ? ERROR : "transparent", color: pal.inputText }
              }
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-xs" style={{ color: pal.muted }}>
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

// ============ กล่องแจ้งเตือนด้านบนฟอร์ม (กรอกไม่ครบ N ช่อง) — ตาม Figma A2 ============
export function FormAlert({ text }: { text: string }) {
  return (
    <div role="alert" className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium" style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }}>
      <CircleAlert className="size-4 shrink-0" /> {text}
    </div>
  );
}
