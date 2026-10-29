# Deployment — ccms-repair

> **Version:** 1.0.0 | **Last Updated:** 2026-04-20 | **Status:** Draft

---

## Local Development (ฝั่ง Backend)

```bash
cd ccms-repair/repair-api

# 1. ติดตั้ง Packages ให้เรียบร้อย
npm install

# 2. ตั้งค่า Environment Database
# สร้างและเปิดไฟล์ `.env` แก้ไขค่าให้ตรงกับ MySQL Server ในเครื่องของคุณ (พอร์ต 3306)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=cmms_repair_db
PORT=5005

# 3. สั่งรัน Backend Server
npm run dev      # หากมี Nodemon
# หรือใช้คำสั่ง node index.js 
# → Backend จะทำงานและเชื่อม API ทันทีที่ http://localhost:5005
```

---

## Local Development (ฝั่ง Frontend)

```bash
cd ccms-repair/cmms-frontend

# 1. ติดตั้ง Packages
npm install

# 2. ตั้งค่า Environment API
# เปิดไฟล์ .env และแก้ไขเป็น IP ของ Backend ให้ถูกต้อง
VITE_API_URL=http://localhost:5005

# 3. รัน Development Server
npm run dev      
# → Frontend จะทำงานและแสดงผลที่ http://localhost:5173 
```

---

## Production (การนำขึ้นเซิร์ฟเวอร์จริง)

ทุกครั้งที่มีการเปลี่ยน IP หรือ Domain ของเซิร์ฟเวอร์หลังบ้าน แอดมินต้องทำการแก้ `.env` ที่โฟลเดอร์หน้าบ้าน แล้วสั่ง Build ใหม่เสมอ

**1. ฝั่ง Frontend:**
```bash
cd cmms-frontend
# แก้ไข VITE_API_URL ในไฟล์ .env เป็น IP จริงก่อน!
npm run build
# จากนั้นระบบจะสร้างโฟลเดอร์ dist/
# นำเนื้อหาในแฟ้ม `dist/` ไปใช้วางบนเว็บกระบอกสูบ (IIS, nginx, apache)
```

**2. ฝั่ง Backend:**
```bash
cd repair-api
npm install pm2 -g
pm2 start index.js --name "ccms-backend"
pm2 save
# PM2 จะช่วยให้โปรแกรมไม่ดับแม้เราจะปิดหน้าจอ Terminal ทิ้งไป!
```

---

## npm Scripts Summary

### Frontend (`cmms-frontend`)
| Script | Description |
|--------|-------------|
| `npm run dev` | รันเทสเซิร์ฟเวอร์ด้วย Vite |
| `npm run build` | สร้าง Production Bundle แบ็คแพ็กเอาสิ่งที่ไม่จำเป็นออกเพียวๆ 100% |

### Backend (`repair-api`)
| Script | Description |
|--------|-------------|
| `npm run dev` | สั่งรันด้วย Nodemon ทำให้ไฟล์เซฟและรีเซตออโต้เมื่อแอดมินเขียนโค้ดเพิ่ม |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-20 | Initial deployment guide |
