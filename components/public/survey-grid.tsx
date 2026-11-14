"use client";
// ตารางคำตอบของหน้า /s — Multiple Choice Grid (เลือกได้ 1 ช่องต่อแถว) และ Checkbox Grid (เลือกได้หลายช่องต่อแถว)
// รูปแบบคำตอบที่เก็บ (ดู lib/survey-types.ts):
//   mcgrid → string[] เรียงตามแถว · cbgrid → string[] ของ "แถว::คอลัมน์"
import { Check } from "lucide-react";
import { gridCell } from "@/lib/survey-types";
import type { Palette } from "./public-ui";

const ERROR = "#EF4444";

export function SurveyGrid({
  pal,
  rows,
  columns,
  multiple,
  value,
  onChange,
  error,
  label,
}: {
  pal: Palette;
  rows: { value: string; label: string }[];
  columns: { value: string; label: string }[];
  multiple: boolean;
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
  label: string;
}) {
  const isOn = (r: number, c: string) =>
    multiple ? value.includes(gridCell(rows[r].value, c)) : value[r] === c;

  const toggle = (r: number, c: string) => {
    if (multiple) {
      const cell = gridCell(rows[r].value, c);
      onChange(value.includes(cell) ? value.filter((x) => x !== cell) : [...value, cell]);
    } else {
      const next = rows.map((_, i) => value[i] ?? "");
      next[r] = c;
      onChange(next);
    }
  };

  return (
    <div
      role="group"
      aria-label={label}
      className="overflow-x-auto rounded-xl border"
      style={{ borderColor: error ? ERROR : pal.line }}
    >
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2" />
            {columns.map((c) => (
              <th key={c.value} className="px-2 py-2 text-center text-xs font-medium" style={{ color: pal.muted }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r.value} className="border-t" style={{ borderColor: pal.line }}>
              <th scope="row" className="px-3 py-2 text-left font-medium">
                {r.label}
              </th>
              {columns.map((c) => {
                const on = isOn(ri, c.value);
                return (
                  <td key={c.value} className="px-2 py-2 text-center">
                    <button
                      type="button"
                      role={multiple ? "checkbox" : "radio"}
                      aria-checked={on}
                      aria-label={`${r.label}: ${c.label}`}
                      onClick={() => toggle(ri, c.value)}
                      className={`mx-auto flex size-6 items-center justify-center border-2 ${multiple ? "rounded-md" : "rounded-full"}`}
                      style={{ borderColor: on ? pal.primary : pal.line, background: on ? pal.primary : "transparent" }}
                    >
                      {on && (multiple ? <Check className="size-4 text-white" /> : <span className="size-2 rounded-full bg-white" />)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
