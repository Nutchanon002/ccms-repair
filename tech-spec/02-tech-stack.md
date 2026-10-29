# Tech Stack — ccms-repair

> **Version:** 1.0.0 | **Last Updated:** 2026-04-20 | **Status:** Draft

---

## Core & Frameworks

| Package/Role | Version | Purpose |
|---------|---------|---------|
| `react` | 18.x | Frontend UI library (Single Page Application) |
| `vite` | 6.x | Frontend build tool & Dev server (ทดแทน Create React App) |
| `node.js` | 20.x+ | Backend runtime environment |
| `express` | 4.x | Backend API framework & Router |

## Frontend UI & UX

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 3.x | CSS framework สำหรับการจัดหน้า Layout (Utility-first) |
| `lucide-react` | 0.x | ไอคอน (Icons) แบบ Vector สไตล์มินิมอล |
| `sweetalert2` | 11.x | หน้าต่างป๊อปอัปแจ้งเตือน (Alerts, Confirms) |
| `recharts` | 2.x | ระบบกราฟชาร์ตข้อมูล (Bar Chart, Pie Chart) สำหรับ Dashboard |

## Data Processing & Utilities (Frontend)

| Package | Version | Purpose |
|---------|---------|---------|
| `xlsx` (SheetJS) | 0.18.x | ระบบ Export ข้อมูลทั้งหมด ออกมาเป็น Excel (Multi-sheet) ซัพพอร์ตภาษาไทย |
| `browser-image-compression` | 2.x | โค้ดฝั่งหน้าบ้าน ที่คอยย่อ/บีบไฟล์รูป ก่อนส่งให้เซิร์ฟเวอร์หลังบ้าน |

## Backend Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `mysql2` | 3.x | Database Driver สำหรับร้องขอคำสั่ง SQL กับฐานข้อมูล MySQL |
| `multer` | 1.x | ไลบรารีสำหรับจัดการอัปโหลดไฟล์ (multipart/form-data) ภาพและวีดีโอ |
| `cors` | 2.x | จัดการ Cross-Origin สำหรับอนุญาตให้หน้าบ้านคุยกับหลังบ้านคนละพอร์ต |
| `dotenv` | 16.x | ซ่อนข้อมูลความลับ หรือการตั้งค่า Config (`.env`) |

## Deploy & Dev Tools

| Package | Purpose |
|---------|---------|
| `pm2` | Process manager สำหรับสั่งรัน API บน Production Server ตลอดเวลา |
| `nodemon` | เครื่องมือ Developer สำหรับ Auto-restart API ตอนที่แก้ไขโค้ด |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-20 | Initial tech stack |
