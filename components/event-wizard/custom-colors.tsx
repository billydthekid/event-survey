"use client";
// "ปรับแต่งเอง" ในขั้น Branding แยกตามหน้า: Kiosk / ฟอร์มลงทะเบียน / Survey
// - Kiosk: สีหลัก · สีตัวอักษร · พื้นหลัง (สี / รูป · รูปย่อตามแนวจอ: แนวตั้ง 1080×1920, แนวนอน 1920×1080)
// - ฟอร์ม / Survey: เปิด "ตั้งสีแยก" → สีหลัก · สีตัวอักษร · พื้นหลัง ของหน้านั้นเอง (ปิด = ใช้แบบเดียวกับ Kiosk)
// แก้สีของ Kiosk = ไม่ใช่ธีมสำเร็จรูปแล้ว (preset ว่าง) · แก้สีฟอร์ม / Survey ไม่กระทบธีมสำเร็จรูป

import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWizardStore } from "@/lib/wizard-store";
import { dataUrlKB, readFileAsDataUrl, resizeToDataUrl } from "@/lib/image-crop";
import { pageThemeFromKiosk, type PageKey } from "@/lib/theme-presets";
import { whiteTextContrast } from "@/lib/utils/color";
import type { EventDraft, PageTheme, UploadedAsset } from "@/types/event";
import { ColorField } from "./color-field";
import { ImageSlot } from "./image-slot";

type Theme = EventDraft["theme"];
export type ColorTarget = "kiosk" | PageKey;

const PRIMARY = ["#2563EB", "#7C3AED", "#0F766E", "#C2410C", "#BE185D", "#1E1B2E"];
const BG = ["#FFFFFF", "#F8FAFC", "#FEF3C7", "#E0F2FE", "#FDF2F8", "#0F172A"];
const TEXT = ["#0F172A", "#334155", "#1E1B2E", "#7C2D12", "#FFFFFF", "#F8FAFC"];

const PAGE_NAME: Record<PageKey, string> = { form: "ฟอร์มลงทะเบียน", survey: "Survey" };

/** ชุดช่องตั้งสี 1 หน้า (ใช้ร่วมกัน Kiosk / ฟอร์ม / Survey) */
interface Values {
  primary: string;
  textColor?: string;
  bgType: "color" | "image";
  bgColor?: string;
  bg: UploadedAsset | null;
}

export function CustomColors({ target }: { target: ColorTarget }) {
  const t = useWizardStore((s) => s.draft.theme);
  const patch = useWizardStore((s) => s.patch);

  if (target === "kiosk") {
    const landscape = t.kiosk === "landscape";
    return (
      <ColorEditor
        values={t}
        bgHint={landscape ? "จอ Kiosk แนวนอน + หน้า Event" : "จอ Kiosk แนวตั้ง + หน้า Event"}
        landscapeBg={landscape}
        // แก้สีเอง → ไม่ใช่ธีมสำเร็จรูปแล้ว
        onChange={(v) => patch("theme", { ...(v as Partial<Theme>), preset: "" })}
      />
    );
  }

  const own = t.pages?.[target];
  const setOwn = (next: PageTheme | undefined) => patch("theme", { pages: { ...t.pages, [target]: next } });

  return (
    <div className="space-y-5">
      <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm">
        <span>
          ตั้งสีหน้า{PAGE_NAME[target]}แยก
          <span className="block text-xs text-muted-foreground">
            {own ? "ใช้สีที่ตั้งด้านล่าง" : "ปิดอยู่ = ใช้สีเดียวกับ Kiosk"}
          </span>
        </span>
        <Switch checked={!!own} onCheckedChange={(on) => setOwn(on ? pageThemeFromKiosk(t) : undefined)} />
      </label>
      {own && (
        <ColorEditor
          values={own}
          bgHint={`หน้า${PAGE_NAME[target]}บนมือถือ`}
          landscapeBg={false}
          onChange={(v) => setOwn({ ...own, ...v })}
        />
      )}
    </div>
  );
}

function ColorEditor({
  values: v,
  onChange,
  bgHint,
  landscapeBg,
}: {
  values: Values;
  onChange: (v: Partial<Values>) => void;
  bgHint: string;
  landscapeBg: boolean; // รูปพื้นหลังแนวนอน (Kiosk แนวนอน) หรือแนวตั้ง
}) {
  const orientation = landscapeBg ? "landscape" : "portrait";
  const bgOrientation = v.bg?.orientation ?? "portrait"; // รูปเก่าไม่มีค่านี้ = แนวตั้ง
  return (
    <>
      <Section title="สีหลัก" hint="ปุ่ม ป้าย กรอบ QR">
        <ColorField value={v.primary} presets={PRIMARY} onChange={(c) => onChange({ primary: c })} label="สีหลัก" />
        {whiteTextContrast(v.primary) < 4.5 && <p className="text-xs text-amber-700">ตัวหนังสือสีขาวบนสีนี้อ่านยาก ลองสีเข้มขึ้น</p>}
      </Section>

      <Section title="สีตัวอักษร" hint="ชื่องาน รายละเอียด คำถาม">
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            value={[v.textColor ? "custom" : "auto"]}
            onValueChange={(x) => x[0] && onChange({ textColor: x[0] === "auto" ? "" : v.textColor || "#0F172A" })}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="auto">อัตโนมัติ</ToggleGroupItem>
            <ToggleGroupItem value="custom">เลือกเอง</ToggleGroupItem>
          </ToggleGroup>
          {!v.textColor && <span className="text-xs text-muted-foreground">เข้ม / ขาว ตามพื้นหลัง</span>}
        </div>
        {v.textColor && <ColorField value={v.textColor} presets={TEXT} onChange={(c) => onChange({ textColor: c })} label="สีตัวอักษร" />}
      </Section>

      <Section title="พื้นหลัง" hint={bgHint}>
        <ToggleGroup
          value={[v.bgType]}
          onValueChange={(x) => x[0] && onChange({ bgType: x[0] as Values["bgType"] })}
          variant="outline"
          size="sm"
          className="justify-start"
        >
          <ToggleGroupItem value="color">สี</ToggleGroupItem>
          <ToggleGroupItem value="image">รูปภาพ</ToggleGroupItem>
        </ToggleGroup>
        {v.bgType === "color" ? (
          <ColorField value={v.bgColor || "#FFFFFF"} presets={BG} onChange={(c) => onChange({ bgColor: c })} label="สีพื้นหลัง" />
        ) : (
          <>
            <ImageSlot
              asset={v.bg}
              hint={landscapeBg ? "แนวนอน · ย่อเหลือ 1920×1080 px" : "แนวตั้ง · ย่อเหลือ 1080×1920 px"}
              onPick={async (file) => {
                // รูปพื้นหลังใช้ JPEG (ไฟล์เล็ก) · ย่อให้อยู่ในกรอบตามแนวจอ
                const [w, h] = landscapeBg ? [1920, 1080] : [1080, 1920];
                const url = await resizeToDataUrl(await readFileAsDataUrl(file), w, h, "image/jpeg");
                onChange({ bg: { name: file.name, sizeKB: dataUrlKB(url), dataUrl: url, orientation } });
              }}
              onRemove={() => onChange({ bg: null })}
              className={landscapeBg ? "aspect-video w-40" : "aspect-[9/16] w-24"}
            />
            {v.bg?.dataUrl && bgOrientation !== orientation && (
              <p className="text-xs text-amber-700">
                รูปนี้ทำไว้สำหรับจอ{bgOrientation === "portrait" ? "แนวตั้ง" : "แนวนอน"} · อัปโหลดรูป{landscapeBg ? "แนวนอน" : "แนวตั้ง"}ใหม่ให้พอดีจอ
              </p>
            )}
          </>
        )}
      </Section>
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-b pb-5 last:border-0 last:pb-0">
      <p className="text-sm font-semibold">
        {title} <span className="ml-1 text-xs font-normal text-muted-foreground">· {hint}</span>
      </p>
      {children}
    </section>
  );
}

