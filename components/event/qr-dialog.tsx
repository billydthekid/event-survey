"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CircleCheck, Download } from "lucide-react";
import { useNow } from "@/lib/hooks/useNow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ============ หลักการของ QR (แนะนำ) ============
// - QR เก็บแค่ "ลิงก์ถาวร" ของงาน: <เว็บ>/r/<รหัสงาน> (ลงทะเบียน) และ <เว็บ>/s/<รหัสงาน> (Survey)
// - รหัสงานไม่เปลี่ยน → QR พิมพ์ครั้งเดียวใช้ได้ตลอด แก้ข้อมูล Event ก็ไม่ต้องพิมพ์ใหม่
// - เปิด/ปิดรับ ตัดสินที่หน้า /r /s ตามเวลาจริง (ยังไม่เปิด / เปิดอยู่ / ปิดแล้ว) ไม่ได้ฝังใน QR
// - ไม่ต้องสร้าง/เก็บรูป QR ไว้ที่ไหน: วาดใหม่จากลิงก์ทุกครั้ง (qrcode.react) แล้วให้ดาวน์โหลด PNG / โปสเตอร์ A4

type Window = { opensAt: string; closesAt: string }; // yyyy-MM-ddTHH:mm หรือ ISO · "" = ไม่กำหนด

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventName: string;
  code: string; // เช่น FIG-1017 (QR ใช้ code นี้ จึงไม่เปลี่ยนแม้แก้ข้อมูล Event)
  reg: Window;
  survey: Window;
  /** เปิดหลังกดเผยแพร่ → หัวข้อ "เผยแพร่แล้ว" + ปุ่ม "ไว้ทีหลัง" */
  justPublished?: boolean;
}

// ลิงก์จริงของเว็บนี้ (ตอนพัฒนา = http://localhost:3000) · ตั้ง NEXT_PUBLIC_APP_URL ตอนขึ้นระบบจริง
const origin = () => process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
const noProtocol = (u: string) => u.replace(/^https?:\/\//, "");

type WindowState = { label: string; cls: string };
function windowState(w: Window, now: Date, openLabel: string): WindowState {
  if (w.opensAt && now < new Date(w.opensAt)) return { label: "ยังไม่เปิด", cls: "bg-amber-100 text-amber-800" };
  if (w.closesAt && now > new Date(w.closesAt)) return { label: "ปิดแล้ว", cls: "bg-slate-200 text-slate-700" };
  return { label: openLabel, cls: "bg-emerald-100 text-emerald-800" };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function QrCard({ title, url, state, filename }: {
  title: string; url: string; state: WindowState; filename: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);

  const downloadPng = () => {
    const canvas = wrap.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
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
        {/* วาดที่ 512px แล้วย่อด้วย CSS ให้ PNG ที่ดาวน์โหลดคมชัดพอพิมพ์ */}
        <QRCodeCanvas value={url} size={512} marginSize={1} style={{ width: 144, height: 144 }} />
      </div>
      <p className="truncate rounded-md bg-muted px-3 py-2 text-center text-xs">{noProtocol(url)}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={downloadPng}>ดาวน์โหลด PNG</Button>
        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(url)}>คัดลอกลิงก์</Button>
      </div>
    </div>
  );
}

export function QrDialog({ open, onOpenChange, eventName, code, reg, survey, justPublished }: Props) {
  const grid = useRef<HTMLDivElement>(null);
  const now = useNow();
  const regUrl = `${origin()}/r/${code}`;
  const surveyUrl = `${origin()}/s/${code}`;

  /** โปสเตอร์ A4: เปิดหน้าต่างใหม่ แล้วสั่งพิมพ์ (เลือก "Save as PDF" ได้) */
  const printPoster = () => {
    const [reg, sur] = Array.from(grid.current?.querySelectorAll("canvas") ?? []).map((c) => c.toDataURL("image/png"));
    if (!reg || !sur) return;
    const w = window.open("", "_blank");
    if (!w) return alert("เบราว์เซอร์บล็อกหน้าต่างใหม่ กรุณาอนุญาต pop-up แล้วลองอีกครั้ง");
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
  <div class="sub">สแกน QR ด้วยมือถือเพื่อเข้าร่วม</div>
  <div class="row">
    <div class="card"><img src="${reg}" alt=""><h2>ลงทะเบียน</h2><p>${esc(noProtocol(regUrl))}</p></div>
    <div class="card"><img src="${sur}" alt=""><h2>ตอบ Survey</h2><p>${esc(noProtocol(surveyUrl))}</p></div>
  </div>
  <div class="foot">รหัสงาน ${esc(code)}</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {justPublished && <CircleCheck className="size-5 text-emerald-600" />}
            {justPublished ? "เผยแพร่ Event แล้ว · QR พร้อมใช้" : "QR ลงทะเบียน / Survey"}
          </DialogTitle>
          <DialogDescription>
            {eventName} · พิมพ์ติดหน้างาน หรือส่งลิงก์ให้ผู้เข้าร่วม
            {justPublished && " · ยังไม่ดาวน์โหลดตอนนี้ก็ได้ กลับมาเอาได้ที่ปุ่ม QR ในหน้า Event ของฉัน"}
          </DialogDescription>
        </DialogHeader>

        <div ref={grid} className="grid gap-4 sm:grid-cols-2">
          <QrCard title="QR ลงทะเบียน (ฟอร์ม)" url={regUrl} state={windowState(reg, now, "เปิดรับอยู่")} filename={`qr-register-${code}`} />
          <QrCard title="QR แบบประเมิน (Survey)" url={surveyUrl} state={windowState(survey, now, "เปิดให้ตอบ")} filename={`qr-survey-${code}`} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">QR ไม่เปลี่ยนแม้แก้ไขข้อมูล Event · ใช้ซ้ำได้ตลอดงาน</p>
          <div className="flex gap-2">
            {justPublished && (
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                ไว้ทีหลัง
              </Button>
            )}
            <Button onClick={printPoster}>
              <Download className="size-4" /> ดาวน์โหลดโปสเตอร์ A4 (PDF)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
