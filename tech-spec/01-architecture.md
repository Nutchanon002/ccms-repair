# Architecture — ccms-repair

> **Version:** 1.0.0 | **Last Updated:** 2026-04-20 | **Status:** Draft

---

## Overview

ระบบทำงานแบบ Client-Server Architecture แบ่งเป็น 2 ส่วนหลักคือ **Frontend** (React + Vite) สำหรับฝั่งหน้าบ้าน และ **Backend API** (Node.js + Express) สำหรับรับส่งข้อมูลกับฐานข้อมูล MySQL ของระบบ (`ccms_db`) รวมถึงทำหน้าที่เป็น **API Bridge** เพื่อเชื่อมต่อกับ API ภายนอก (Service Pro / SSO) อย่างปลอดภัย

---

## Folder Structure

```text
ccms-repair/
├── cmms-frontend/              → ระบบหน้าบ้าน (React/Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/             → รูปภาพและโลโก้
│   │   ├── components/         → UI Components 
│   │   │   ├── AddClaimModal.jsx      → โมดอลส่งเคลมศูนย์
│   │   │   ├── AddJobModal.jsx        → โมดอลรับงานใหม่
│   │   │   ├── ApprovalModal.jsx      → โมดอลตะกร้าอนุมัติ
│   │   │   ├── DashboardAnalytics.jsx → แดชบอร์ดสรุปสถิติ (Admin/Exec View)
│   │   │   ├── DashboardStats.jsx     → แถบตัวเลขสถานะเหนือตาราง
│   │   │   ├── EditClaimModal.jsx     → แก้ไขใบส่งเคลม
│   │   │   ├── EditJobModal.jsx       → แก้ไขงานซ่อม
│   │   │   ├── JobTable.jsx           → หน้าตารางงานซ่อมหลัก
│   │   │   ├── LoginModal.jsx         → ระบบเข้าสู่ระบบ/SSO
│   │   │   ├── PrintJobModal.jsx      → ออกรายงานใบรับเคลม
│   │   │   ├── SystemLogsModal.jsx    → หน้าต่างแสดง Log ประวัติ
│   │   │   └── UpdateClaimModal.jsx   → ฟอร์มรับกลับ/ส่งคืนลูกค้า
│   │   ├── App.jsx             → Component หลัก (Router/State)
│   │   └── main.jsx            → จุดรันโปรแกรมหน้าบ้าน
│   ├── .env                    → ตัวแปร VITE_API_URL 
│   └── vite.config.js          → ตั้งค่า Proxy / Build
│
├── repair-api/                 → ระบบหลังบ้าน (Node.js)
│   ├── uploads/                → โฟลเดอร์จัดเก็บภาพ/วิดีโอ (Multer)
│   ├── .env                    → เก็บข้อมูลเชื่อมต่อ Database MySQL
│   └── index.js                → API Server (Express) + MySQL DB Schema
│
└── Tech-spec/                  → เอกสาร Technical Specification
```

---

## Data Flow & External Integration (API Bridge)

เนื่องจากการดึงข้อมูลข้ามเซิร์ฟเวอร์โดนบล็อกด้วย CORS และเพื่อซ่อน URL จริงของ API SSO ระบบหลังบ้านจึงเป็นตัวกลาง (Bridge):

```text
Frontend (React) 
  │
  ├─ 1. Call API `/api/sso-login` หรือ `/api/sso-customers` (ผ่าน Axios/Fetch ไปที่ Node)
  │
  ├─ 2. Backend (Node.js) รับ Request 
  │    → ต่อสายยิงไปหา Server จริงที่ `https://service-pro.example.com` (Service Pro)
  │
  └─ 3. Backend ส่ง Response กลับให้ Frontend Render บนหน้าจอ
```

---

## Primary Views (SPA structure)

| View Component | Description |
|----------------|-------------|
| `<App />` | Container หลัก ควบคุมสิทธิ์การเข้าถึง และการสลับหน้า |
| `<JobTable />` | หน้าตารางติดตามงานซ่อมทั้งหมด กรองสถานะ ค้นหา พร้อมเมนูตัวเลือก |
| `<DashboardAnalytics />`| แดชบอร์ดกราฟข้อมูลและระบบ Export to Excel (5 หน้า) |
| `Modals Components`| ป๊อปอัปควบคุม Flow ทั้ง รับงานเข้า -> อนุมัติ -> ส่งซ่อม -> คืนลูกค้า |

---

## API Routes (Backend `index.js`)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/sso-login` | SSO Bridge: ดึงข้อมูลพนักงาน (empid, id) |
| POST   | `/api/sso-customers` | Customer Bridge: ดึงรายชื่อลูกค้า/โรงพยาบาลอัตโนมัติ |
| GET    | `/api/jobs` | โหลดข้อมูลงานซ่อมและใบเคลมมารวมกัน ส่งให้หน้าบ้าน |
| POST   | `/api/jobs` | บันทึกงานรับซ่อมใหม่เข้าระบบ (สถานะ `Pending`) + อัปโหลดรูป |
| PUT    | `/api/jobs/:id` | อัปเดตงานซ่อม เช่น อนุมัติรับงานเป็น `New`, ย้อนกลับ `ClaimFailed` |
| DELETE | `/api/jobs/:id` | ลบงานซ่อมและประวัติการเคลม (Hard Delete) |
| GET    | `/api/claims` | อ่านประวัติใบส่งเคลมศูนย์ |
| POST   | `/api/claims` | สร้างประวัติการส่งเคลมศูนย์ซ่อม (เชื่อมต่อกับ `job_id`) |
| PUT    | `/api/claims/:id` | อัปเดตการเคลม ได้แก่ "รับกลับอยู่ในบริษัท" และ "ส่งคืนลูกค้า" |
| PUT    | `/api/claims/revert-return/:id` | ย้อนสถานะของจากตีกลับ (ReturnFailed) มารอส่งซ้ำ |
| GET    | `/api/logs` | ดึงประวัติการทำงาน (Audit Logs) ทั้งระบบ |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-20 | Initial architecture documentation |
