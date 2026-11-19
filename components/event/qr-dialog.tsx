"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CircleCheck, Download } from "lucide-react";
import { useNow } from "@/lib/hooks/useNow";
import { useTr, type Tr } from "@/lib/wizard-lang";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ฟ้าใส: ============ หลักการของ QR (แนะนำ) ============
// ฟ้าใส: - QR เก็บแค่ "ลิงก์ถาวร" ของงาน: <เว็บ>/r/<รหัสงาน> (ลงทะเบียน) และ <เว็บ>/s/<รหัสงาน> (Survey)
// ฟ้าใส: - รหัสงานไม่เปลี่ยน → QR พิมพ์ครั้งเดียวใช้ได้ตลอด แก้ข้อมูล Event ก็ไม่ต้องพิมพ์ใหม่
// ฟ้าใส: - เปิด/ปิดรับ ตัดสินที่หน้า /r /s ตามเวลาจริง (ยังไม่เปิด / เปิดอยู่ / ปิดแล้ว) ไม่ได้ฝังใน QR
// ฟ้าใส: - ไม่ต้องสร้าง/เก็บรูป QR ไว้ที่ไหน: วาดใหม่จากลิงก์ทุกครั้ง (qrcode.react) แล้วให้ดาวน์โหลด PNG / โปสเตอร์ A4

type Window = { opensAt: string; closesAt: string }; // ฟ้าใส: yyyy-MM-ddTHH:mm หรือ ISO · "" = ไม่กำหนด

// ฟ้าใส: ค่าที่ส่งเข้ามาให้ popup QR
interface Props {
  open: boolean;
  // ฟ้าใส: เปิด / ปิด popup
  onOpenChange: (v: boolean) => void;
  eventName: string;
  code: string; // ฟ้าใส: เช่น FIG-1017 (QR ใช้ code นี้ จึงไม่เปลี่ยนแม้แก้ข้อมูล Event)
  /** ฟ้าใส: null = Event นี้ไม่มีฟอร์มลงทะเบียน / Survey (ไม่บังคับสร้าง) → ไม่แสดง QR นั้น */
  reg: Window | null;
  survey: Window | null;
  /** ฟ้าใส: เปิดหลังกดเผยแพร่ → หัวข้อ "เผยแพร่แล้ว" + ปุ่ม "ไว้ทีหลัง" */
  justPublished?: boolean;
}

// ฟ้าใส: ลิงก์จริงของเว็บนี้ (ตอนพัฒนา = http://localhost:3000) · ตั้ง NEXT_PUBLIC_APP_URL ตอนขึ้นระบบจริง
const origin = () => process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
// ฟ้าใส: ตัด https:// ออกจากลิงก์ (ไว้พิมพ์บนโปสเตอร์ให้สั้นลง)
const noProtocol = (u: string) => u.replace(/^https?:\/\//, "");

// ฟ้าใส: ป้ายสถานะของ QR (ข้อความ + สี)
type WindowState = { label: string; cls: string };
function windowState(w: Window, now: Date, openLabel: string, tr: Tr): WindowState {  // ฟ้าใส: ตรวจเวลาตอนนี้เทียบกับ opensAt / closesAt → แสดง Badge
  // ฟ้าใส: ยังไม่ถึงเวลาเปิด → ยังไม่เปิด
  if (w.opensAt && now < new Date(w.opensAt)) return { label: tr("ยังไม่เปิด", "Not open yet"), cls: "bg-amber-100 text-amber-800" };
  // ฟ้าใส: เลยเวลาปิดแล้ว → ปิดแล้ว
  if (w.closesAt && now > new Date(w.closesAt)) return { label: tr("ปิดแล้ว", "Closed"), cls: "bg-slate-200 text-slate-700" };
  return { label: openLabel, cls: "bg-emerald-100 text-emerald-800" };
}

// ฟ้าใส: กันอักขระพิเศษใน HTML ของโปสเตอร์
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// ฟ้าใส: การ์ด QR 1 อัน: รูป QR + ลิงก์ + ปุ่มดาวน์โหลด / คัดลอก
function QrCard({ title, url, state, filename }: {
  title: string; url: string; state: WindowState; filename: string;
}) {
  // ฟ้าใส: กล่องที่มี canvas ของ QR
  const wrap = useRef<HTMLDivElement>(null);
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();

  // ฟ้าใส: ดาวน์โหลดรูป QR เป็น PNG
  const downloadPng = () => {
    // ฟ้าใส: canvas ที่วาด QR ไว้
    const canvas = wrap.current?.querySelector("canvas");
    // ฟ้าใส: ยังไม่มี canvas → ไม่ทำอะไร
    if (!canvas) return;
    // ฟ้าใส: ลิงก์ดาวน์โหลดชั่วคราว
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png"); // ฟ้าใส: ดาวน์โหลด PNG
    a.download = `${filename}.png`;
    a.click();
  };

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <Badge className={state.cls}>{state.label}</Badge>
      </div>
      <div ref={wrap} className="flex justify-center rounded-lg bg-white p-3">
        {/* ฟ้าใส: วาดที่ 512px แล้วย่อด้วย CSS ให้ PNG ที่ดาวน์โหลดคมชัดพอพิมพ์ */}
        <QRCodeCanvas value={url} size={512} marginSize={1} style={{ width: 144, height: 144 }} />
      </div>
      <p className="truncate rounded-md bg-muted px-3 py-2 text-center text-xs">{noProtocol(url)}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={downloadPng}>{tr("ดาวน์โหลด PNG", "Download PNG")}</Button>
        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(url)}>{tr("คัดลอกลิงก์", "Copy link")}</Button>
      </div>
    </div>
  );
}

// ฟ้าใส: popup QR (หลังเผยแพร่ และปุ่ม QR ในหน้า Event ของฉัน)
export function QrDialog({ open, onOpenChange, eventName, code, reg, survey, justPublished }: Props) {
  // ฟ้าใส: กล่องที่มี canvas ของ QR ทุกอัน (ใช้ทำโปสเตอร์)
  const grid = useRef<HTMLDivElement>(null);
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  // ฟ้าใส: เวลาปัจจุบัน (ใช้คำนวณสถานะเปิด / ปิด)
  const now = useNow();
  // ฟ้าใส: ลิงก์หน้าลงทะเบียน
  const regUrl = `${origin()}/r/${code}`;
  // ฟ้าใส: ลิงก์หน้าแบบประเมิน
  const surveyUrl = `${origin()}/s/${code}`;
  // ฟ้าใส: ไม่มีทั้งฟอร์มและ Survey
  const none = !reg && !survey;

  /** ฟ้าใส: โปสเตอร์ A4: เปิดหน้าต่างใหม่ แล้วสั่งพิมพ์ (เลือก "Save as PDF" ได้) */
  const printPoster = () => {
    // ฟ้าใส: รูป QR ตามลำดับการ์ดที่แสดงอยู่ (มีแค่อันที่ Event นี้มีจริง)
    const imgs = Array.from(grid.current?.querySelectorAll("canvas") ?? []).map((c) => c.toDataURL("image/png"));
    // ฟ้าใส: การ์ดบนโปสเตอร์ (เฉพาะ QR ที่มี)
    const cards = [
      reg && { title: tr("ลงทะเบียน", "Register"), url: regUrl },
      survey && { title: tr("ตอบ Survey", "Survey"), url: surveyUrl },
    ].filter((x): x is { title: string; url: string } => !!x);
    // ฟ้าใส: ยังไม่พร้อม → ไม่ทำโปสเตอร์
    if (cards.length === 0 || imgs.length !== cards.length) return;
    // ฟ้าใส: เปิดหน้าต่างใหม่สำหรับพิมพ์
    const w = window.open("", "_blank");
    // ฟ้าใส: เบราว์เซอร์บล็อก pop-up → แจ้งผู้ใช้
    if (!w) return alert(tr("เบราว์เซอร์บล็อกหน้าต่างใหม่ กรุณาอนุญาต pop-up แล้วลองอีกครั้ง", "Your browser blocked the new window. Allow pop-ups and try again."));
    w.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>Poster ${esc(code)}</title>
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box}
body{margin:0;font-family:"Noto Sans Thai","Sarabun",system-ui,sans-serif;color:#1b1a2e}
.page{width:210mm;height:297mm;padding:20mm 16mm;display:flex;flex-direction:column;align-items:center;text-align:center}
h1{font-size:30pt;margin:0 0 4mm}
.sub{font-size:14pt;color:#555;margin-bottom:14mm}
.row{display:flex;gap:14mm;justify-content:center;width:100%}
.card{flex:1;border:1.5pt solid #ddd;border-radius:6mm;padding:8mm}
.card img{width:100%;height:auto}
.card h2{font-size:18pt;margin:6mm 0 2mm}
.card p{font-size:11pt;color:#666;margin:0;word-break:break-all}
.foot{margin-top:auto;font-size:10pt;color:#888}
</style></head><body>
<div class="page">
  <h1>${esc(eventName)}</h1>
  <div class="sub">${tr("สแกน QR ด้วยมือถือเพื่อเข้าร่วม", "Scan the QR with your phone to join")}</div>
  <div class="row">
    ${cards.map((c, i) => `<div class="card"><img src="${imgs[i]}" alt=""><h2>${c.title}</h2><p>${esc(noProtocol(c.url))}</p></div>`).join("")}
  </div>
  <div class="foot">${tr("รหัสงาน", "Event code")} ${esc(code)}</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`);
    w.document.close();
  };

  return (
    // ฟ้าใส: popup
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {justPublished && <CircleCheck className="size-5 text-emerald-600" />}
            {justPublished
              ? none
                ? tr("เผยแพร่ Event แล้ว", "Event published")
                : tr("เผยแพร่ Event แล้ว · QR พร้อมใช้", "Event published · QR codes ready")
              : tr("QR ลงทะเบียน / Survey", "Registration / survey QR")}
          </DialogTitle>
          <DialogDescription>
            {eventName}
            {!none && tr(" · พิมพ์ติดหน้างาน หรือส่งลิงก์ให้ผู้เข้าร่วม", " · print it at the venue or send the link to attendees")}
            {justPublished && !none && tr(" · ยังไม่ดาวน์โหลดตอนนี้ก็ได้ กลับมาเอาได้ที่ปุ่ม QR ในหน้า Event ของฉัน", " · you can download later from the QR button on My events")}
          </DialogDescription>
        </DialogHeader>

        {/* ฟ้าใส: แสดงเฉพาะ QR ที่ Event นี้มี (ฟอร์ม / Survey ไม่บังคับสร้าง) */}
        {none ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {tr("Event นี้ไม่มีฟอร์มลงทะเบียนและ Survey จึงไม่มี QR · จอ Kiosk แสดงแค่รายละเอียดงาน", "This event has no registration form or survey, so there are no QR codes · the Kiosk shows event details only")}
          </p>
        ) : (
          <div ref={grid} className={reg && survey ? "grid gap-4 sm:grid-cols-2" : "mx-auto grid w-full max-w-sm gap-4"}>
            {reg && <QrCard title={tr("QR ลงทะเบียน (ฟอร์ม)", "Registration QR (form)")} url={regUrl} state={windowState(reg, now, tr("เปิดรับอยู่", "Open"), tr)} filename={`qr-register-${code}`} />}
            {survey && <QrCard title={tr("QR แบบประเมิน (Survey)", "Survey QR")} url={surveyUrl} state={windowState(survey, now, tr("เปิดให้ตอบ", "Open"), tr)} filename={`qr-survey-${code}`} />}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{none ? "" : tr("QR ไม่เปลี่ยนแม้แก้ไขข้อมูล Event · ใช้ซ้ำได้ตลอดงาน", "The QR never changes, even if you edit the event · reuse it for the whole event")}</p>
          <div className="flex gap-2">
            {justPublished && (
              <Button variant={none ? "default" : "secondary"} onClick={() => onOpenChange(false)}>
                {none ? tr("ตกลง", "OK") : tr("ไว้ทีหลัง", "Later")}
              </Button>
            )}
            {!none && (
              <Button onClick={printPoster}>
                <Download className="size-4" /> {tr("ดาวน์โหลดโปสเตอร์ A4 (PDF)", "Download A4 poster (PDF)")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
