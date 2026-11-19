"use client";
// ส่วน "ผู้ที่ลงทะเบียนได้" ในขั้นที่ 1: Event เปิด (ทุกคน ไม่จำกัดจำนวน) / Event ปิด (เฉพาะรายชื่อที่ import)
// เปิดสวิตช์ → เลือกตรวจด้วยอีเมลหรือเบอร์มือถือ → import ไฟล์ CSV / Excel → หน้า /r/<code> รับเฉพาะคนในรายชื่อ

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWizardStore } from "@/lib/wizard-store";
import { ALLOW_KIND_LABEL, ALLOW_KIND_LABEL_EN, allowListProblem, parseRows, readRows, templateCsv, type ParseResult } from "@/lib/allow-list";
import { formatThaiDateTime } from "@/lib/utils/date";
import { fmtDate, useTr, useWizardLang } from "@/lib/wizard-lang";
import type { AllowList, AllowListKind } from "@/types/event";
import { WizardSection } from "./wizard-section";

const ACCEPT = ".csv,.xlsx,.xls";

export function AllowListCard() {
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const fileRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<(ParseResult & { fileName: string }) | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const list: AllowList = draft.allowList ?? { closed: false, kind: "email", values: [], fileName: "", importedAt: "" };
  const lang = useWizardLang();
  const tr = useTr();
  const label = (lang === "en" ? ALLOW_KIND_LABEL_EN : ALLOW_KIND_LABEL)[list.kind];
  const problem = allowListProblem(draft, lang);
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
      setError(tr("รองรับเฉพาะไฟล์ .csv, .xlsx หรือ .xls", "Only .csv, .xlsx or .xls files are supported"));
      return;
    }
    setBusy(true);
    try {
      const result = parseRows(list.kind, await readRows(file));
      setReport({ ...result, fileName: file.name });
      if (result.values.length === 0) {
        setError(tr(`ไม่พบ${label}ที่ถูกต้องในไฟล์`, `No valid ${label} found in the file`));
        return;
      }
      set({ values: result.values, fileName: file.name, importedAt: new Date().toISOString() });
    } catch {
      setError(tr("อ่านไฟล์ไม่ได้ ตรวจว่าไฟล์ไม่เสียหายและเป็น CSV / Excel", "Couldn't read the file. Check it's a valid CSV / Excel file"));
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
    <WizardSection
      title={tr("ผู้ที่ลงทะเบียนได้", "Who can register")}
      description={
        list.closed
          ? tr(`Event ปิด · รับเฉพาะคนที่มี${label}อยู่ในไฟล์ที่ import`, `Closed event · only people whose ${label} is in the imported file`)
          : tr("Event เปิด · ใครสแกน QR ก็ลงทะเบียนได้ ไม่จำกัดจำนวน", "Open event · anyone who scans the QR can register, no limit")
      }
      action={
        <ToggleGroup
          value={[list.closed ? "closed" : "open"]}
          onValueChange={(v) => v[0] && set({ closed: v[0] === "closed" })}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="open">{tr("เปิด (ทุกคน)", "Open (everyone)")}</ToggleGroupItem>
          <ToggleGroupItem value="closed">{tr("ปิด (เฉพาะรายชื่อ)", "Closed (list only)")}</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      {list.closed && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label>{tr("ตรวจสิทธิ์ด้วย", "Check by")}</Label>
            <ToggleGroup value={[list.kind]} onValueChange={(v) => v[0] && changeKind(v[0] as AllowListKind)} variant="outline" size="sm">
              <ToggleGroupItem value="email">{tr("อีเมล", "Email")}</ToggleGroupItem>
              <ToggleGroupItem value="phone">{tr("เบอร์มือถือ", "Mobile number")}</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4">
            <FileSpreadsheet className="size-8 text-muted-foreground" />
            <div className="min-w-0 flex-1 text-sm">
              {list.values.length > 0 ? (
                <>
                  <p className="font-semibold">{list.fileName} · {list.values.length} {tr("รายชื่อ", "names")}</p>
                  <p className="text-xs text-muted-foreground">
                    {lang === "en" ? `Imported ${fmtDate(list.importedAt, lang)}` : `import เมื่อ ${formatThaiDateTime(list.importedAt)}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">{tr("ยังไม่มีรายชื่อ", "No list yet")}</p>
                  <p className="text-xs text-muted-foreground">
                    {tr(`ไฟล์ .csv / .xlsx · มีคอลัมน์หัวตาราง "${list.kind}" หรือใส่${label}ไว้คอลัมน์แรก`, `.csv / .xlsx file · a "${list.kind}" header column, or ${label} in the first column`)}
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
              <Download className="size-4" /> {tr("ไฟล์ตัวอย่าง", "Sample file")}
            </Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> {busy ? tr("กำลังอ่าน…", "Reading…") : list.values.length > 0 ? tr("Import ใหม่", "Re-import") : tr("Import ไฟล์", "Import file")}
            </Button>
            {list.values.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={tr("ล้างรายชื่อ", "Clear list")}
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
              {tr(`ใช้คอลัมน์ "${report.column}" · นำเข้า ${report.values.length} รายชื่อ`, `Column "${report.column}" · imported ${report.values.length} names`)}
              {report.duplicates > 0 && tr(` · ตัดซ้ำ ${report.duplicates}`, ` · ${report.duplicates} duplicates removed`)}
              {report.invalid.length > 0 &&
                tr(` · ข้าม ${report.invalid.length} แถวที่รูปแบบผิด`, ` · skipped ${report.invalid.length} invalid rows`) +
                  ` (${report.invalid.slice(0, 3).join(", ")}${report.invalid.length > 3 ? ", …" : ""})`}
            </p>
          )}
          {(error || problem) && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error || problem}
            </p>
          )}
        </div>
      )}
    </WizardSection>
  );
}
