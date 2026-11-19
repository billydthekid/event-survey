"use client";
// ฟ้าใส: "ปรับแต่งเอง" ในขั้น Branding แยกตามหน้า: Kiosk / ฟอร์มลงทะเบียน / Survey
// ฟ้าใส: - Kiosk: สีหลัก · สีตัวอักษร · พื้นหลัง (สี / รูป · รูปย่อตามแนวจอ: แนวตั้ง 1080×1920, แนวนอน 1920×1080)
// ฟ้าใส: - ฟอร์ม / Survey: เปิด "ตั้งสีแยก" → สีหลัก · สีตัวอักษร · พื้นหลัง ของหน้านั้นเอง (ปิด = ใช้แบบเดียวกับ Kiosk)
// ฟ้าใส: แก้สีของ Kiosk = ไม่ใช่ธีมสำเร็จรูปแล้ว (preset ว่าง) · แก้สีฟอร์ม / Survey ไม่กระทบธีมสำเร็จรูป

import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWizardStore } from "@/lib/wizard-store";
import { dataUrlKB, readFileAsDataUrl, resizeToDataUrl } from "@/lib/image-crop";
import { pageThemeFromKiosk, type PageKey } from "@/lib/theme-presets";
import { whiteTextContrast } from "@/lib/utils/color";
import type { EventDraft, PageTheme, UploadedAsset } from "@/types/event";
import { ColorField } from "./color-field";
import { ImageSlot } from "./image-slot";
import { useTr } from "@/lib/wizard-lang";

// ฟ้าใส: ชนิดของธีม
type Theme = EventDraft["theme"];
// ฟ้าใส: หน้าที่ตั้งสีได้: Kiosk / ฟอร์ม / Survey
export type ColorTarget = "kiosk" | PageKey;

// ฟ้าใส: ถาดสีหลักสำเร็จรูป
const PRIMARY = ["#2563EB", "#7C3AED", "#0F766E", "#C2410C", "#BE185D", "#1E1B2E"];
// ฟ้าใส: ถาดสีพื้นหลังสำเร็จรูป
const BG = ["#FFFFFF", "#F8FAFC", "#FEF3C7", "#E0F2FE", "#FDF2F8", "#0F172A"];
// ฟ้าใส: ถาดสีตัวอักษรสำเร็จรูป
const TEXT = ["#0F172A", "#334155", "#1E1B2E", "#7C2D12", "#FFFFFF", "#F8FAFC"];

// ฟ้าใส: ชื่อหน้า (ไทย)
const PAGE_NAME: Record<PageKey, string> = { form: "ฟอร์มลงทะเบียน", survey: "Survey" };
// ฟ้าใส: ชื่อหน้า (อังกฤษ)
const PAGE_NAME_EN: Record<PageKey, string> = { form: "registration form", survey: "survey" };

/** ฟ้าใส: ชุดช่องตั้งสี 1 หน้า (ใช้ร่วมกัน Kiosk / ฟอร์ม / Survey) */
interface Values {
  primary: string;
  textColor?: string;
  bgType: "color" | "image";
  bgColor?: string;
  bg: UploadedAsset | null;
  bgBlur?: number;
}

const MAX_BLUR = 20; // ฟ้าใส: เบลอรูปพื้นหลังได้สูงสุด 20 px

// ฟ้าใส: ส่วนตั้งสีของหน้าที่เลือก
export function CustomColors({ target }: { target: ColorTarget }) {
  // ฟ้าใส: ธีมของ Event
  const t = useWizardStore((s) => s.draft.theme);
  // ฟ้าใส: ฟังก์ชันบันทึก
  const patch = useWizardStore((s) => s.patch);
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();

  // ฟ้าใส: หน้า Kiosk → แก้ธีมหลักตรง ๆ
  if (target === "kiosk") {
    // ฟ้าใส: จอแนวนอนไหม (ใช้ตัดสินขนาดรูปพื้นหลัง)
    const landscape = t.kiosk === "landscape";
    return (
      <ColorEditor
        values={t}
        bgHint={landscape ? tr("จอ Kiosk แนวนอน + หน้า Event", "Landscape Kiosk + event page") : tr("จอ Kiosk แนวตั้ง + หน้า Event", "Portrait Kiosk + event page")}
        landscapeBg={landscape}
        // ฟ้าใส: แก้สีเอง → ไม่ใช่ธีมสำเร็จรูปแล้ว
        onChange={(v) => patch("theme", { ...(v as Partial<Theme>), preset: "" })}
      />
    );
  }

  // ฟ้าใส: สีที่ตั้งแยกของหน้านี้ (ไม่มี = ใช้ของ Kiosk)
  const own = t.pages?.[target];
  // ฟ้าใส: บันทึกสีของหน้านี้ (undefined = กลับไปใช้สี Kiosk)
  const setOwn = (next: PageTheme | undefined) => patch("theme", { pages: { ...t.pages, [target]: next } });

  return (
    <div className="space-y-5">
      <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm">
        <span>
          {tr(`ตั้งสีหน้า${PAGE_NAME[target]}แยก`, `Own colors for the ${PAGE_NAME_EN[target]} page`)}
          <span className="block text-xs text-muted-foreground">
            {own ? tr("ใช้สีที่ตั้งด้านล่าง", "Uses the colors set below") : tr("ปิดอยู่ = ใช้สีเดียวกับ Kiosk", "Off = uses the Kiosk colors")}
          </span>
        </span>
        <Switch checked={!!own} onCheckedChange={(on) => setOwn(on ? pageThemeFromKiosk(t) : undefined)} />
      </label>
      {own && (
        <ColorEditor
          values={own}
          bgHint={tr(`หน้า${PAGE_NAME[target]}บนมือถือ`, `The ${PAGE_NAME_EN[target]} page on mobile`)}
          landscapeBg={false}
          onChange={(v) => setOwn({ ...own, ...v })}
        />
      )}
    </div>
  );
}

// ฟ้าใส: ชุดช่องตั้งสี: สีหลัก สีตัวอักษร พื้นหลัง
function ColorEditor({
  values: v,
  onChange,
  bgHint,
  landscapeBg,
}: {
  values: Values;
  // ฟ้าใส: แก้ค่าแล้ว
  onChange: (v: Partial<Values>) => void;
  bgHint: string;
  landscapeBg: boolean; // ฟ้าใส: รูปพื้นหลังแนวนอน (Kiosk แนวนอน) หรือแนวตั้ง
}) {
  // ฟ้าใส: แนวของรูปพื้นหลังที่ต้องใช้ตอนนี้
  const orientation = landscapeBg ? "landscape" : "portrait";
  const bgOrientation = v.bg?.orientation ?? "portrait"; // ฟ้าใส: รูปเก่าไม่มีค่านี้ = แนวตั้ง
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  return (
    <>
      {/* ฟ้าใส: สีหลัก */}
      <Section title={tr("สีหลัก", "Primary color")} hint={tr("ปุ่ม ป้าย กรอบ QR", "Buttons, badges, QR frame")}>
        {/* ฟ้าใส: ช่องเลือกสีหลัก */}
        <ColorField value={v.primary} presets={PRIMARY} onChange={(c) => onChange({ primary: c })} label={tr("สีหลัก", "Primary color")} />
        {whiteTextContrast(v.primary) < 4.5 && (
          <p className="text-xs text-amber-700">{tr("ตัวหนังสือสีขาวบนสีนี้อ่านยาก ลองสีเข้มขึ้น", "White text is hard to read on this color, try a darker one")}</p>
        )}
      </Section>

      {/* ฟ้าใส: สีตัวอักษร */}
      <Section title={tr("สีตัวอักษร", "Text color")} hint={tr("ชื่องาน รายละเอียด คำถาม", "Event name, details, questions")}>
        <div className="flex flex-wrap items-center gap-3">
          {/* ฟ้าใส: อัตโนมัติ / เลือกเอง */}
          <ToggleGroup
            value={[v.textColor ? "custom" : "auto"]}
            onValueChange={(x) => x[0] && onChange({ textColor: x[0] === "auto" ? "" : v.textColor || "#0F172A" })}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="auto">{tr("อัตโนมัติ", "Auto")}</ToggleGroupItem>
            <ToggleGroupItem value="custom">{tr("เลือกเอง", "Custom")}</ToggleGroupItem>
          </ToggleGroup>
          {!v.textColor && <span className="text-xs text-muted-foreground">{tr("เข้ม / ขาว ตามพื้นหลัง", "Dark / white to match the background")}</span>}
        </div>
        {v.textColor && <ColorField value={v.textColor} presets={TEXT} onChange={(c) => onChange({ textColor: c })} label={tr("สีตัวอักษร", "Text color")} />}
      </Section>

      {/* ฟ้าใส: พื้นหลัง */}
      <Section title={tr("พื้นหลัง", "Background")} hint={bgHint}>
        {/* ฟ้าใส: สี / รูปภาพ */}
        <ToggleGroup
          value={[v.bgType]}
          onValueChange={(x) => x[0] && onChange({ bgType: x[0] as Values["bgType"] })}
          variant="outline"
          size="sm"
          className="justify-start"
        >
          <ToggleGroupItem value="color">{tr("สี", "Color")}</ToggleGroupItem>
          <ToggleGroupItem value="image">{tr("รูปภาพ", "Image")}</ToggleGroupItem>
        </ToggleGroup>
        {v.bgType === "color" ? (
          // ฟ้าใส: พื้นหลังแบบสี
          <ColorField value={v.bgColor || "#FFFFFF"} presets={BG} onChange={(c) => onChange({ bgColor: c })} label={tr("สีพื้นหลัง", "Background color")} />
        ) : (
          <>
            {/* ฟ้าใส: พื้นหลังแบบรูป */}
            <ImageSlot
              asset={v.bg}
              hint={landscapeBg ? tr("แนวนอน · ย่อเหลือ 1920×1080 px", "Landscape · resized to 1920×1080 px") : tr("แนวตั้ง · ย่อเหลือ 1080×1920 px", "Portrait · resized to 1080×1920 px")}
              onPick={async (file) => {
                // ฟ้าใส: รูปพื้นหลังใช้ JPEG (ไฟล์เล็ก) · ย่อให้อยู่ในกรอบตามแนวจอ
                const [w, h] = landscapeBg ? [1920, 1080] : [1080, 1920];
                // ฟ้าใส: อ่านไฟล์แล้วย่อให้อยู่ในกรอบ
                const url = await resizeToDataUrl(await readFileAsDataUrl(file), w, h, "image/jpeg");
                onChange({ bg: { name: file.name, sizeKB: dataUrlKB(url), dataUrl: url, orientation } });
              }}
              onRemove={() => onChange({ bg: null })}
              className={landscapeBg ? "aspect-video w-40" : "aspect-[9/16] w-24"}
            />
            {/* ฟ้าใส: เบลอรูปพื้นหลัง (ตัวหนังสือไม่เบลอ) · มีรูปแล้วถึงจะปรับได้ */}
            {v.bg?.dataUrl && (
              <div className="flex max-w-md items-center gap-3 text-sm">
                <span className="shrink-0 text-muted-foreground">{tr("เบลอพื้นหลัง", "Blur background")}</span>
                <input
                  type="range"
                  min={0}
                  max={MAX_BLUR}
                  step={1}
                  value={v.bgBlur ?? 0}
                  onChange={(e) => onChange({ bgBlur: Number(e.target.value) })}
                  aria-label={tr("เบลอพื้นหลัง", "Blur background")}
                  className="flex-1 accent-foreground"
                />
                <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">
                  {(v.bgBlur ?? 0) === 0 ? tr("ไม่เบลอ", "Off") : `${v.bgBlur} px`}
                </span>
              </div>
            )}
            {v.bg?.dataUrl && bgOrientation !== orientation && (
              <p className="text-xs text-amber-700">
                {tr(
                  `รูปนี้ทำไว้สำหรับจอ${bgOrientation === "portrait" ? "แนวตั้ง" : "แนวนอน"} · อัปโหลดรูป${landscapeBg ? "แนวนอน" : "แนวตั้ง"}ใหม่ให้พอดีจอ`,
                  `This image was made for a ${bgOrientation} screen · upload a ${landscapeBg ? "landscape" : "portrait"} image to fit`
                )}
              </p>
            )}
          </>
        )}
      </Section>
    </>
  );
}

// ฟ้าใส: หัวข้อย่อยในส่วนตั้งสี
function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    // ฟ้าใส: กล่องของหัวข้อย่อย
    <section className="space-y-2 border-b pb-5 last:border-0 last:pb-0">
      <p className="text-sm font-semibold">
        {title} <span className="ml-1 text-xs font-normal text-muted-foreground">· {hint}</span>
      </p>
      {children}
    </section>
  );
}

