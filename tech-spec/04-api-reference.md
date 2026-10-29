# API Reference — ccms-repair

> **Version:** 1.0.0 | **Last Updated:** 2026-04-20 | **Status:** Draft

---

## Base URL

```text
Local Network: http://localhost:5005/api
Production: VITE_API_URL (ตามที่ขีดค่าผูกไว้ใน Environment Variable หน้าบ้าน)
```

---

## GET /api/jobs

ดึงข้อมูลใบแจ้งซ่อมทั้งหมดในระบบเพื่อนำมาแสดงผลหน้าตาราง (Master Table) และนำไปคำนวณแดชบอร์ด

**Response 200**
```json
[
  {
    "id": 1,
    "job_id": "REQ-2026-0001",
    "status": "Pending",
    "customer_name": "โรงพยาบาลภูมิพล",
    "product_type": "Monitor Patient",
    "model_name": "M-PRO 4",
    "serial_number": "SN-A1B2C3",
    "date_received": "2026-04-20T08:00:00.000Z",
    "symptom": "เครื่องเปิดไม่ติด ภาพกระพริบ",
    "images": "[\"upload_1.jpg\"]",
    "created_at": "2026-04-20T08:00:00.000Z"
  }
]
```

---

## POST /api/jobs

สร้างใบแจ้งซ่อมเข้าระบบใหม่ รองรับการรับข้อมูลตัวอักษรควบคู่กับการเปิดอัปโหลดไฟล์ภาพและวิดีโอ ส่งแบบ `multipart/form-data` ประมวลผลผ่าน Middleware `multer`

**Request FormData**
- `customer_name`: string
- `model_name`: string
- `symptom`: string
- `...` (ข้อมูลประกัน และ ข้อมูลเครื่อง)
- `files`: Array of Files (ชนิดภาพและวิดีโอ)

**Response 201**
```json
{
  "message": "เพิ่มงานซ่อมสำเร็จและอัปโหลดไฟล์แล้ว",
  "jobId": "REQ-2026-0002"
}
```

---

## PUT /api/jobs/:id

อัปเดตสถานะข้อมูลใบงาน เช่น โฟลว์การตรวจสอบเพื่อกด **"รับเครื่องเข้าระบบ"** (อนุมัติ) โดยเปลี่ยนจาก Pending -> New

**Path Parameter:** `id` — ID ของ Database 

**Response 200**
```json
{
  "message": "อัปเดตสถานะเรียบร้อย"
}
```

---

## DELETE /api/jobs/:id

ลบใบแจ้งซ่อมออกแบบเบ็ดเสร็จ (Hard Delete) พร้อมเข้าไปลบข้อมูลบนตาราง `claims` ข้อมูลเคลมตัวเกาะทั้งหมดโดยไม่ต้องทิ้งเป็นตารางหลงเหลือ (Trigger Logic)

**Response 200**
```json
{
  "message": "ลบงานซ่อมและใบเคลมที่เกี่ยวข้องเรียบร้อยแล้ว"
}
```

---

## GET /api/claims

ดึงประวัติการรันเอกสารส่งศูนย์เคลม และการติดตามสถานะพัสดุรับ/ส่งคืน

**Response 200**
```json
[
  {
    "id": 1,
    "claim_id": "CLM-2026-0001",
    "job_id": "REQ-2026-0001",
    "service_center_name": "ศูนย์ซ่อมใหญ่ พระราม 9",
    "date_sent": "2026-04-21T09:30:00.000Z",
    "date_received_back": null,
    "date_returned_customer": null
  }
]
```

---

## POST /api/claims

พนักงานผูกประวัติเอาซ่อมส่งเคลมศูนย์บริการใหม่ (สเต็ปแรกในวงจรเคลม) โดยกรอกรายละเอียดศูนย์, พนักงานผู้เช็ค และวันที่ส่ง

**Request Body**
```json
{
  "job_id": "REQ-2026-0001",
  "service_center_name": "ศูนย์ซ่อมใหญ่ พระราม 9",
  "sender_name": "สมชาย ใจดี",
  "date_sent": "2026-04-21",
  "remark_send": "อาการบอร์ดช็อต จอลาย"
}
```

---

## POST /api/sso-customers (API Bridge)

เชื่อมต่อไปยัง Service Pro ฝั่งต้นทางเพื่อดึงรายชื่อลูกค้า/โรงพยาบาลและลดปัญหา CORS กรณีโดนบล็อกการแสดงผล (Production)

**Backend Process**
```text
ส่งไปหา -> POST https://service-pro.example.com/sso-api/task/customer/get
รับของกลับเพื่อส่งกลับหน้าบ้าน 200 OK -> Forward Body Proxy
```

---

## PUT /api/claims/revert-return/:id

ระบบพิเศษย้อนการทำงานกรณีที่มีการติ๊กส่งคืนลูกค้าแล้วเกิดการ "ส่งตีกลับ" โดยกดย้อนสถานะกลับมาเตรียมรอส่งรอบใหม่ในบริษัท 

**Response 200**
```json
{
  "message": "ย้อนสถานะกลับมารอส่งคืนลูกค้าใหม่แล้ว"
}
```

---

## GET /api/logs

สืบประวัติการกระทำหรือเหตุการณ์สำคัญ (System Audit Log) 

**Response 200**
```json
[
  {
    "id": 1,
    "action": "CREATE_JOB",
    "details": "สมชาย รับชิ้นงาน REQ-2026-0001 เข้าระบบ",
    "timestamp": "2026-04-20T08:05:00.000Z"
  }
]
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-20 | Initial API reference documentation |
