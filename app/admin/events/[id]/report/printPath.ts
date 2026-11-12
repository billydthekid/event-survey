// app/admin/events/[id]/report/printPath.ts
// ตัวเช็กว่า URL ปัจจุบันเป็น "หน้าพิมพ์รายงาน" หรือไม่
// ใช้ 2 ที่: app/admin/layout.tsx (ซ่อน Sidebar/Topbar) และ ReportShell (ซ่อนหัว/แท็บ)
// → เงื่อนไขอยู่จุดเดียว แก้ทีเดียวได้ทั้งคู่

// ต้องตรงทั้งเส้นพอดี: /admin/events/<id 1 ช่วง>/report/print
// ^ ... $ = ต้นถึงท้าย, [^/]+ = id ที่ไม่มี "/" ข้างใน
// ตัวอย่าง:
//   "/admin/events/e-workshop/report/print"       → true
//   "/admin/events/e-workshop/report/survey"      → false
//   "/admin/events/e-workshop/report/print/extra" → false (ไม่ลงท้ายพอดี)
//   "/admin/events/a/b/report/print"              → false (id มี "/" ไม่ได้)
const REPORT_PRINT_PATH = /^\/admin\/events\/[^/]+\/report\/print$/;

export function isReportPrintPath(pathname: string | null): boolean {
  return pathname !== null && REPORT_PRINT_PATH.test(pathname);
}
