"use client";
// การ์ด "ผู้ที่ลงทะเบียนได้" ในขั้นที่ 1: Event เปิด (ทุกคน ไม่จำกัดจำนวน) / Event ปิด (เฉพาะรายชื่อที่ import)
// เปิดสวิตช์ → เลือกตรวจด้วยอีเมลหรือเบอร์มือถือ → import ไฟล์ CSV / Excel → หน้า /r/<code> รับเฉพาะคนในรายชื่อ

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWizardStore } from "@/lib/wizard-store";
import { ALLOW_KIND_LABEL, allowListProblem, parseRows, readRows, templateCsv, type ParseResult } from "@/lib/allow-list";
import { formatThaiDateTime } from "@/lib/utils/date";
import type { AllowList, AllowListKind } from "@/types/event";

const ACCEPT = ".csv,.xlsx,.xls";

export function AllowListCard() {
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const fileRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<(ParseResult & { fileName: string }) | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const list: AllowList = draft.allowList ?? { closed: false, kind: "email", values: [], fileName: "", importedAt: "" };
  const label = ALLOW_KIND_LABEL[list.kind];
  const problem = allowListProblem(draft);
  const set = (v: Partial<AllowList>) => patch("allowList", { ...list, ...v });

  // เปลี่ยนชนิด → รายชื่อเดิมใช้ไม่ได้ ต้อง import ใหม่
  const changeKind = (kind: AllowListKind) => {
    if (kind === list.kind) return;
    set({ kind, values: [], fileName: "", importedAt: "" });
    setReport(null);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setReport(null);
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setError("รองรับเฉพาะไฟล์ .csv, .xlsx หรือ .xls");
      return;
    }
    setBusy(true);
    try {
      const result = parseRows(list.kind, await readRows(file));
      setReport({ ...result, fileName: file.name });
      if (result.values.length === 0) {
        setError(`ไม่พบ${label}ที่ถูกต้องในไฟล์`);
        return;
      }
      set({ values: result.values, fileName: file.name, importedAt: new Date().toISOString() });
    } catch {
      setError("อ่านไฟล์ไม่ได้ ตรวจว่าไฟล์ไม่เสียหายและเป็น CSV / Excel");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = ""; // เลือกไฟล์เดิมซ้ำได้
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([templateCsv(list.kind)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `allow-list-${list.kind}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">ผู้ที่ลงทะเบียนได้</CardTitle>
            <CardDescription>
              {list.closed
                ? `Event ปิด · รับเฉพาะคนที่มี${label}อยู่ในไฟล์ที่ import`
                : "Event เปิด · ใครสแกน QR ก็ลงทะเบียนได้ ไม่จำกัดจำนวน"}
            </CardDescription>
          </div>
          <ToggleGroup
            value={[list.closed ? "closed" : "open"]}
            onValueChange={(v) => v[0] && set({ closed: v[0] === "closed" })}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="open">เปิด (ทุกคน)</ToggleGroupItem>
            <ToggleGroupItem value="closed">ปิด (เฉพาะรายชื่อ)</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>

      {list.closed && (
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label>ตรวจสิทธิ์ด้วย</Label>
            <ToggleGroup value={[list.kind]} onValueChange={(v) => v[0] && changeKind(v[0] as AllowListKind)} variant="outline" size="sm">
              <ToggleGroupItem value="email">อีเมล</ToggleGroupItem>
              <ToggleGroupItem value="phone">เบอร์มือถือ</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4">
            <FileSpreadsheet className="size-8 text-muted-foreground" />
            <div className="min-w-0 flex-1 text-sm">
              {list.values.length > 0 ? (
                <>
                  <p className="font-semibold">{list.fileName} · {list.values.length} รายชื่อ</p>
                  <p className="text-xs text-muted-foreground">import เมื่อ {formatThaiDateTime(list.importedAt)}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">ยังไม่มีรายชื่อ</p>
                  <p className="text-xs text-muted-foreground">
                    ไฟล์ .csv / .xlsx · มีคอลัมน์หัวตาราง &quot;{list.kind}&quot; หรือใส่{label}ไว้คอลัมน์แรก
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="size-4" /> ไฟล์ตัวอย่าง
            </Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> {busy ? "กำลังอ่าน…" : list.values.length > 0 ? "Import ใหม่" : "Import ไฟล์"}
            </Button>
            {list.values.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="ล้างรายชื่อ"
                className="text-red-600"
                onClick={() => {
                  set({ values: [], fileName: "", importedAt: "" });
                  setReport(null);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>

          {report && !error && (
            <p className="text-sm text-muted-foreground">
              ใช้คอลัมน์ &quot;{report.column}&quot; · นำเข้า {report.values.length} รายชื่อ
              {report.duplicates > 0 && ` · ตัดซ้ำ ${report.duplicates}`}
              {report.invalid.length > 0 && ` · ข้าม ${report.invalid.length} แถวที่รูปแบบผิด (${report.invalid.slice(0, 3).join(", ")}${report.invalid.length > 3 ? ", …" : ""})`}
            </p>
          )}
          {(error || problem) && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error || problem}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
