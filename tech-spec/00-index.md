# ccms-repair — Index

> **Version:** 1.0.0 | **Last Updated:** 2026-04-20 | **Status:** Draft

---

## Overview

**ccms-repair (Service & Repair Management System)** คือระบบเว็บแอปพลิเคชันสำหรับเจ้าหน้าที่และผู้บริหาร เพื่อใช้ในการบริหารจัดการงานแจ้งซ่อม, การส่งเคลมศูนย์บริการ, และการส่งคืนสินค้าให้ลูกค้า ใช้งานผ่าน **desktop browser** เป็นหลัก ตัวระบบมาพร้อมกับ Dashboard สรุปข้อมูลเชิงลึก การจับเวลาทำงานรายขั้นตอน (SLA) และระบบ Export รายงานอัจฉริยะ

---

## Features

- ระบบจัดการตารางงานซ่อมตั้งแต่รับเครื่อง, สั่งเคลม, รับกลับ จนถึงส่งคืนลูกค้า
- แดชบอร์ดสรุปภาพรวมสำหรับผู้บริหาร (Executive View) และแอดมิน (Admin View)
- แจ้งเตือนและติดแท็กงานที่ใช้เวลาซ่อมค้างนานกว่ากำหนด (SLA Breaches)
- ระบบออกรายงานอัจฉริยะ (Export to Excel) สรุปทั้งข้อมูลดิบและสถิติภาพรวม 5 หน้า
- ค้นหางานซ่อมได้อย่างรวดเร็วผ่านรหัสงาน (Job ID), ชื่อลูกค้า, Serial Number หรือ อาการเสีย
- ระบบเชื่อมต่อ API Bridge โหลดข้อมูลพนักงาน (SSO) และชื่อลูกค้า (Service Pro) ได้อัตโนมัติ

---

## Document Index

| File | Description |
|------|-------------|
| [01-architecture.md](01-architecture.md) | โครงสร้างระบบ, pages, API routes |
| [02-tech-stack.md](02-tech-stack.md) | เทคโนโลยีและ dependencies ที่ใช้งาน |
| [03-database-schema.md](03-database-schema.md) | โครงสร้างข้อมูลตาราง (Jobs, Claims) |
| [04-api-reference.md](04-api-reference.md) | API endpoints ทั้งหมดของระบบหลังบ้าน |
| [05-deployment.md](05-deployment.md) | วิธี setup และ deploy ขึ้น Production (npm run build / pm2) |
| [06-data-dictionary.md](06-data-dictionary.md) | คำอธิบาย field และสถานะต่างๆ ของงาน (Status Flow) |
| [07-uxui-design.md](07-uxui-design.md) | Design system, โมดอล (Modal) และการวาง Layout ตาราง |
| [08-user-manual.md](08-user-manual.md) | คู่มือการใช้งานสำหรับพนักงานรับเรื่อง และ แอดมิน |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-20 | Initial documentation |
