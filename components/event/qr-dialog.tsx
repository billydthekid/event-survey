"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventName: string;
  code: string; // เช่น FIG-1017 (QR ใช้ code นี้ จึงไม่เปลี่ยนแม้แก้ข้อมูล Event)
  regOpen: boolean;
  surveyOpen: boolean;
}

const BASE = "eventsurvey.app"; // TODO: ย้ายไป env เช่น NEXT_PUBLIC_APP_URL

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function QrCard({ title, url, active, activeLabel, filename }: {
  title: string; url: string; active: boolean; activeLabel: string; filename: string;
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
        <Badge className={active ? "bg-emerald-100 text-emerald-800" : ""} variant={active ? "default" : "secondary"}>
          {active ? activeLabel : "ยังไม่เปิด"}
        </Badge>
      </div>
      <div ref={wrap} className="flex justify-center rounded-lg bg-white p-3">
        {/* วาดที่ 512px แล้วย่อด้วย CSS ให้ PNG ที่ดาวน์โหลดคมชัดพอพิมพ์ */}
        <QRCodeCanvas value={`https://${url}`} size={512} marginSize={1} style={{ width: 144, height: 144 }} />
      </div>
      <p className="rounded-md bg-muted px-3 py-2 text-center text-xs">{url}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={downloadPng}>ดาวน์โหลด PNG</Button>
        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`https://${url}`)}>คัดลอกลิงก์</Button>
      </div>
    </div>
  );
}

export function QrDialog({ open, onOpenChange, eventName, code, regOpen, surveyOpen }: Props) {
  const grid = useRef<HTMLDivElement>(null);
  const regUrl = `${BASE}/r/${code}`;
  const surveyUrl = `${BASE}/s/${code}`;

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
    <div class="card"><img src="${reg}" alt=""><h2>ลงทะเบียน</h2><p>${esc(regUrl)}</p></div>
    <div class="card"><img src="${sur}" alt=""><h2>ตอบ Survey</h2><p>${esc(surveyUrl)}</p></div>
  </div>
  <div class="foot">รหัสงาน ${esc(code)}</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>QR ลงทะเบียน / Survey</DialogTitle>
          <DialogDescription>{eventName} · พิมพ์ติดหน้างาน หรือส่งลิงก์ให้ผู้เข้าร่วม</DialogDescription>
        </DialogHeader>

        <div ref={grid} className="grid gap-4 sm:grid-cols-2">
          <QrCard title="QR ลงทะเบียน" url={regUrl} active={regOpen} activeLabel="เปิดรับอยู่" filename={`qr-register-${code}`} />
          <QrCard title="QR Survey" url={surveyUrl} active={surveyOpen} activeLabel="เปิดให้ตอบ" filename={`qr-survey-${code}`} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">QR ไม่เปลี่ยนแม้แก้ไขข้อมูล Event · ใช้ซ้ำได้ตลอดงาน</p>
          <Button onClick={printPoster}>
            <Download className="size-4" /> ดาวน์โหลดโปสเตอร์ A4 (PDF)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
