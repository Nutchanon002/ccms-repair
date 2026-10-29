# CCMS Repair Management System

ระบบบริหารจัดการงานแจ้งซ่อมและงานส่งเคลมอุปกรณ์ (CCMS Repair)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
ccms-repair/
├── cmms-frontend/     # ระบบส่วนหน้าบ้าน (React + Vite + Tailwind CSS)
├── repair-api/        # ระบบ API หลังบ้าน (Node.js + Express + MySQL)
└── tech-spec/         # เอกสารสเปกระบบ และคู่มือการติดตั้งใช้งาน
```

---

## 🚀 เริ่มต้นใช้งาน (Getting Started)

### 1. ระบบหลังบ้าน (Backend API)

1. เข้าโฟลเดอร์ `repair-api`
   ```bash
   cd repair-api
   ```
2. ติดตั้ง Dependencies
   ```bash
   npm install
   ```
3. คัดลอกและตั้งค่า Environment Variables
   ```bash
   cp .env.example .env
   ```
   กำหนดค่าการเชื่อมต่อฐานข้อมูล MySQL และ Service URL ใน `.env`:
   - `DB_HOST`: Host ของ MySQL (เช่น `127.0.0.1`)
   - `DB_PORT`: Port ของ MySQL (เช่น `3306`)
   - `DB_USERNAME`: ชื่อผู้ใช้ฐานข้อมูล
   - `DB_PASSWORD`: รหัสผ่านฐานข้อมูล
   - `DB_NAME`: ชื่อฐานข้อมูล (เช่น `cmms_repair_db`)
   - `PORT`: พอร์ตสำหรับรัน API (Default: `5005`)
   - `SERVICE_PRO_API_URL`: URL สำหรับเชื่อมต่อระบบ Service Pro

4. รันระบบ API
   ```bash
   npm run dev
   # หรือ node index.js
   ```

---

### 2. ระบบหน้าบ้าน (Frontend)

1. เข้าโฟลเดอร์ `cmms-frontend`
   ```bash
   cd cmms-frontend
   ```
2. ติดตั้ง Dependencies
   ```bash
   npm install
   ```
3. คัดลอกและตั้งค่า Environment Variables
   ```bash
   cp .env.example .env
   ```
   ตั้งค่า `VITE_API_URL` ให้ชี้ไปที่ Backend API เช่น `http://localhost:5005`

4. รันระบบ Frontend สำหรับ Development
   ```bash
   npm run dev
   ```

5. หรือ Build สำหรับ Production
   ```bash
   npm run build
   ```

---

## 🔒 นโยบายความปลอดภัยของข้อมูล (Security Notice)

- ไฟล์ `.env` และรหัสผ่านฐานข้อมูล/คีย์ระบบจะไม่ถูกบันทึกขึ้น Git Repository
- ให้ใช้ไฟล์ `.env.example` เป็นแม่แบบในการกำหนดค่าสภาพแวดล้อมแต่ละเครื่องเสมอ
