# Database Schema — ccms-repair

> **Version:** 1.0.0 | **Last Updated:** 2026-04-20 | **Status:** Draft

---

## Overview

ระบบทำงานร่วมกับฐานข้อมูล **MySQL** (Database name: `ccms_db`) โมเดลข้อมูลในระบบนี้แยกเป็น 2 ตารางหลัก (Tables) ที่มีการเชื่อมความสัมพันธ์กันผ่าน `job_id` (1-to-0..1 Relationship) และมีฐานข้อมูลภายนอกของโปรแกรม Service Pro / SSO ที่อ้างอิงรายชื่อลูกค้าและพนักงานผ่าน API Bridge

---

## Tables ที่ใช้ในโปรเจกต์ (MySQL)

| Table | Write | Read | หมายเหตุ |
|-------|-------|------|---------|
| `jobs` | ✓ | ✓ | จัดเก็บข้อมูลใบแจ้งรับซ่อม (อาการ, รูปภาพ, ประกัน, ข้อมูลลูกค้า) |
| `claims` | ✓ | ✓ | จัดเก็บข้อมูลประวัติการรันเอกสารส่งเคลมศูนย์บริการ (รายชื่อขนส่ง, ใบพัสดุ, เวลาจุดเช็คพอยท์ต่างๆ) |

---

## Data Structure (Schema Design)

### Table: `jobs` (ตารางหลักสำหรับสินค้ารอซ่อม)
- **id** (INT, PK, Auto Increment)
- **job_id** (VARCHAR) — รหัสอ้างอิงงานหลัก เช่น REQ-2404-XXXX
- **status** (VARCHAR) — สถานะปัจจุบันของงาน (Pending, New, Claimed, ClaimFailed, Returned)
- **customer_name** (VARCHAR) — ชื่อลูกค้า หรือ โรงพยาบาล
- **date_received** (DATE) — วันที่รับเครื่อง
- *(รวมถึงฟิลด์ model_name, symptom, extra_notes, images, ฯลฯ)*

### Table: `claims` (ตารางส่วนเสริมสำหรับการเคลมศูนย์ และส่งคืน)
- **id** (INT, PK, Auto Increment)
- **claim_id** (VARCHAR) — รหัสใบอ้างอิงการส่งเคลม เช่น CLM-2404-XXXX
- **job_id** (VARCHAR) — อ้างอิงไปยังรหัส `job_id` บนตารางหลัก (`jobs`) เป็น Foreign Key (Reference point)
- **service_center_name** (VARCHAR) — ชื่อศูนย์ซ่อม
- **date_sent** (DATE) — วันที่พนักงานนำส่งเคลม หรือจัดส่งไปรษณีย์
- **date_received_back** (DATE) — วันที่พัสดุรับกลับมาจากศูนย์เคลม เข้าสู่บริษัท
- **date_returned_customer** (DATE) — วันที่ปิดรอบนำส่งพัสดุคืนถึงมือลูกค้า
- **is_return_failed** (BOOLEAN) — สถานะความผิดพลาดการจัดส่ง หรือพัสดุตีกลับ (Delivery Failed)

---

## Query Patterns (API Logic)

ระบบไม่ได้ทำ SQL JOIN Tables เข้าด้วยกันโดยตรง เพื่อรักษาโครงสร้าง JSON ส่งไปยังหน้าบ้านตามแบบฉบับ API Microservices โดยจะใช้ Frontend ควบรวม Data แทน (Decoupling)

### Fetching Dashboard Arrays
```javascript
// Backend (Express + MySQL2)
const [jobs] = await pool.query('SELECT * FROM jobs ORDER BY updated_at DESC');
const [claims] = await pool.query('SELECT * FROM claims ORDER BY updated_at DESC');

// Frontend Processing Data (React) 
const assembledData = jobs.map(j => {
    const matchedClaim = claims.find(c => c.job_id === j.job_id) || {};
    return { ...j, claimData: matchedClaim };
});
```

---

## Time / SLA Calculations

การคำนวณระยะเวลา (Operation Bottleneck) บนระบบ Dashboard จะอ้างอิง Field ในคอลัมน์เวลาดังนี้:

```text
E2E Total Time   = date_returned_customer - date_received (เวลาเฉลี่ยจากรับงานจนคืนลูกค้า)
Step 1 Time      = date_sent - date_received              (ระยะเวลารอส่งเคลม)
Step 2 Time      = date_received_back - date_sent         (รอบเวลาเคลมอยู่ที่ศูนย์ซ่อม)
Step 3 Time      = date_returned_customer - date_received_back (ระยะเวลาเตรียมของคืนลูกค้า)

SLA Breach Status= (Current Date - date_received) > Configured SLA limit ? "Overdue" : "In-Time"
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-20 | Initial database schema documentation |
