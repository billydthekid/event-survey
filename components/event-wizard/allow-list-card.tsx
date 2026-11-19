"use client";
// ฟ้าใส: ส่วน "ผู้ที่ลงทะเบียนได้" ในขั้นที่ 1: Event เปิด (ทุกคน ไม่จำกัดจำนวน) / Event ปิด (เฉพาะรายชื่อที่ import)
// ฟ้าใส: เปิดสวิตช์ → เลือกตรวจด้วยอีเมลหรือเบอร์มือถือ → import ไฟล์ CSV / Excel → หน้า /r/<code> รับเฉพาะคนในรายชื่อ

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWizardStore } from "@/lib/wizard-store";
import { ALLOW_KIND_LABEL, ALLOW_KIND_LABEL_EN, ALLOW_LIST_READY, allowListProblem, parseRows, readRows, templateCsv, type ParseResult } from "@/lib/allow-list";
import { formatThaiDateTime } from "@/lib/utils/date";
import { fmtDate, useTr, useWizardLang } from "@/lib/wizard-lang";
import type { AllowList, AllowListKind } from "@/types/event";
import { WizardSection } from "./wizard-section";

// ฟ้าใส: นามสกุลไฟล์ที่รับ
const ACCEPT = ".csv,.xlsx,.xls";

// ฟ้าใส: ส่วน ผู้ที่ลงทะเบียนได้ (Public / Private)
export function AllowListCard() {
  // ฟ้าใส: Event ที่กำลังแก้
  const draft = useWizardStore((s) => s.draft);
  // ฟ้าใส: ฟังก์ชันบันทึก
  const patch = useWizardStore((s) => s.patch);
  // ฟ้าใส: ช่องเลือกไฟล์ที่ซ่อนไว้
  const fileRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<(ParseResult & { fileName: string }) | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // ฟ้าใส: ยังไม่เปิดใช้ Event ปิด: กด "ปิด" แค่ "แอบดู" (ไม่บันทึก closed ลงข้อมูล → หน้า /r ยังรับทุกคน)
  const [peekClosed, setPeekClosed] = useState(false);

  // ฟ้าใส: การตั้งค่ารายชื่อ (ยังไม่เคยตั้ง = Public ตรวจด้วยอีเมล)
  const list: AllowList = draft.allowList ?? { closed: false, kind: "email", values: [], fileName: "", importedAt: "" };
  // ฟ้าใส: ภาษาที่เลือก
  const lang = useWizardLang();
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  // ฟ้าใส: ชื่อชนิดรายชื่อตามภาษา
  const label = (lang === "en" ? ALLOW_KIND_LABEL_EN : ALLOW_KIND_LABEL)[list.kind];
  // ฟ้าใส: ปัญหาที่ต้องแก้ก่อนไปต่อ
  const problem = allowListProblem(draft, lang);
  // ฟ้าใส: บันทึกการตั้งค่ารายชื่อ
  const set = (v: Partial<AllowList>) => patch("allowList", { ...list, ...v });

  // ฟ้าใส: เปลี่ยนชนิด → รายชื่อเดิมใช้ไม่ได้ ต้อง import ใหม่
  const changeKind = (kind: AllowListKind) => {
    // ฟ้าใส: เลือกชนิดเดิม → ไม่ต้องทำอะไร
    if (kind === list.kind) return;
    set({ kind, values: [], fileName: "", importedAt: "" });
    setReport(null);
  };

  // ฟ้าใส: อ่านไฟล์รายชื่อที่เลือก
  const handleFile = async (file: File | undefined) => {
    // ฟ้าใส: ไม่ได้เลือกไฟล์ → ไม่ทำอะไร
    if (!file) return;
    setError("");
    setReport(null);
    // ฟ้าใส: นามสกุลไม่ใช่ CSV / Excel → แจ้ง error
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setError(tr("รองรับเฉพาะไฟล์ .csv, .xlsx หรือ .xls", "Only .csv, .xlsx or .xls files are supported"));
      return;
    }
    setBusy(true);
    try {
      // ฟ้าใส: อ่านไฟล์แล้วแปลงเป็นรายชื่อ
      const result = parseRows(list.kind, await readRows(file));
      setReport({ ...result, fileName: file.name });
      // ฟ้าใส: ไม่มีรายชื่อที่ใช้ได้เลย → แจ้ง error
      if (result.values.length === 0) {
        setError(tr(`ไม่พบ${label}ที่ถูกต้องในไฟล์`, `No valid ${label} found in the file`));
        return;
      }
      set({ values: result.values, fileName: file.name, importedAt: new Date().toISOString() });
    } catch {
      setError(tr("อ่านไฟล์ไม่ได้ ตรวจว่าไฟล์ไม่เสียหายและเป็น CSV / Excel", "Couldn't read the file. Check it's a valid CSV / Excel file"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = ""; // ฟ้าใส: เลือกไฟล์เดิมซ้ำได้
    }
  };

  // ฟ้าใส: ดาวน์โหลดไฟล์ตัวอย่าง
  const downloadTemplate = () => {
    // ฟ้าใส: สร้างไฟล์ CSV ชั่วคราวในเบราว์เซอร์
    const url = URL.createObjectURL(new Blob([templateCsv(list.kind)], { type: "text/csv;charset=utf-8" }));
    // ฟ้าใส: ลิงก์ดาวน์โหลดชั่วคราว
    const a = document.createElement("a");
    a.href = url;
    a.download = `allow-list-${list.kind}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ฟ้าใส: ยังไม่เปิดใช้ (ALLOW_LIST_READY = false): ปุ่ม เปิด / ปิด กดได้ตามปกติ
  // ฟ้าใส: กด "ปิด" → ส่วนตั้งค่า Event ปิดแสดงแบบเบลอ กดไม่ได้ + ป้ายแจ้ง (ไม่บันทึกอะไร) · กด "เปิด" → กลับเป็น Event เปิด
  if (!ALLOW_LIST_READY) {
    return (
      // ฟ้าใส: ส่วนนี้ตอนยังไม่เปิดใช้ Private
      <WizardSection
        title={tr("ผู้ที่ลงทะเบียนได้", "Who can register")}
        description={
          peekClosed
            ? tr("Private · รับเฉพาะคนที่อยู่ในรายชื่อที่ import", "Private · only people in the imported list")
            : tr("Public · ใครสแกน QR ก็ลงทะเบียนได้ ไม่จำกัดจำนวน", "Public · anyone who scans the QR can register, no limit")
        }
        action={
          // ฟ้าใส: ปุ่ม Public / Private
          <ToggleGroup
            value={[peekClosed ? "closed" : "open"]}
            onValueChange={(v) => {
              // ฟ้าใส: กดปุ่มเดิมซ้ำ → ไม่ทำอะไร
              if (!v[0]) return;
              setPeekClosed(v[0] === "closed");
              if (list.closed) set({ closed: false }); // ฟ้าใส: ข้อมูลเก่าที่เคยตั้งเป็น Event ปิด → กลับเป็น Event เปิด
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="open">Public</ToggleGroupItem>
            <ToggleGroupItem value="closed">Private</ToggleGroupItem>
          </ToggleGroup>
        }
      >
        {peekClosed && (
          <div className="relative">
            <div aria-hidden className="pointer-events-none space-y-4 select-none blur-[3px]">
              <AllowListPreview tr={tr} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <p className="rounded-xl border bg-background/95 px-5 py-3 text-center text-sm font-semibold shadow-sm">
                {tr("วัยรุ่นกำลังสร้างมองข้ามไปเทอมนี้ก่อนนะจ๊ะ", "Still under construction · skip this for this term 😉")}
              </p>
            </div>
          </div>
        )}
      </WizardSection>
    );
  }

  return (
    // ฟ้าใส: ส่วนนี้ตอนเปิดใช้ Private แล้ว
    <WizardSection
      title={tr("ผู้ที่ลงทะเบียนได้", "Who can register")}
      description={
        list.closed
          ? tr(`Private · รับเฉพาะคนที่มี${label}อยู่ในไฟล์ที่ import`, `Private · only people whose ${label} is in the imported file`)
          : tr("Public · ใครสแกน QR ก็ลงทะเบียนได้ ไม่จำกัดจำนวน", "Public · anyone who scans the QR can register, no limit")
      }
      action={
        // ฟ้าใส: ปุ่ม Public / Private
        <ToggleGroup
          value={[list.closed ? "closed" : "open"]}
          onValueChange={(v) => v[0] && set({ closed: v[0] === "closed" })}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="open">Public</ToggleGroupItem>
          <ToggleGroupItem value="closed">Private</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      {list.closed && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label>{tr("ตรวจสิทธิ์ด้วย", "Check by")}</Label>
            {/* ฟ้าใส: ตรวจด้วยอีเมล / เบอร์มือถือ */}
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

// ฟ้าใส: หน้าตาของส่วนตั้งค่า "Event ปิด" แบบอ่านอย่างเดียว (ใช้ตอนยังไม่เปิดใช้ · อยู่ใต้ชั้นเบลอ ไม่มีปุ่มที่ทำงานจริง)
function AllowListPreview({ tr }: { tr: (th: string, en: string) => string }) {
  // ฟ้าใส: หน้าตาปุ่มจำลอง
  const pill = "rounded-md border px-2.5 py-1 text-sm";
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">{tr("ตรวจสิทธิ์ด้วย", "Check by")}</span>
        <span className={`${pill} bg-foreground text-background`}>{tr("อีเมล", "Email")}</span>
        <span className={pill}>{tr("เบอร์มือถือ", "Mobile number")}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4">
        <FileSpreadsheet className="size-8 text-muted-foreground" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">{tr("ยังไม่มีรายชื่อ", "No list yet")}</p>
          <p className="text-xs text-muted-foreground">{tr(".csv / .xlsx · คอลัมน์ \"email\"", ".csv / .xlsx · \"email\" column")}</p>
        </div>
        <span className={pill}>
          <Download className="mr-1 inline size-4" /> {tr("ไฟล์ตัวอย่าง", "Sample file")}
        </span>
        <span className={`${pill} bg-foreground text-background`}>
          <Upload className="mr-1 inline size-4" /> {tr("Import ไฟล์", "Import file")}
        </span>
      </div>
    </>
  );
}
