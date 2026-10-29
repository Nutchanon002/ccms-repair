const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const multer = require('multer');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

//เชื่อมต่อ Database
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3308,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err.message);
    } else {
        console.log('✅ Connected to Database');
        connection.release();
    }
});

// ==========================================
// Helper Function: สำหรับจด Log ประวัติการทำงาน
// ==========================================
const recordActionLog = async (job_id, action_type, action_detail, performed_by) => {
    try {
        await db.promise().query(
            `INSERT INTO ActionLogs (job_id, action_type, action_detail, performed_by) 
             VALUES (?, ?, ?, ?)`,
            [job_id, action_type, action_detail, performed_by || 'System']
        );
        console.log(`✅ Logged: ${job_id} -> ${action_type}`);
    } catch (error) {
        console.error('❌ Error recording log:', error);
    }
};

// ปลดล็อกการตรวจสอบ SSL เนื่องจาก Service Pro ใช้ HTTPS บนเลข IP
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// API Bridge สำหรับดึงข้อมูลจาก Service Pro เพื่อหลบปัญหา CORS
app.get('/api/sso-login', async (req, res) => {
    const empid = req.query.empid;
    const id = req.query.id;
    let url = '';

    if (empid) {
        const serviceProBaseUrl = (process.env.SERVICE_PRO_API_URL || 'https://service-pro.example.com').replace(/\/$/, '');
        url = `${serviceProBaseUrl}/api/employee/ext/empid/${empid}`;
    } else if (id) {
        const serviceProBaseUrl = (process.env.SERVICE_PRO_API_URL || 'https://service-pro.example.com').replace(/\/$/, '');
        url = `${serviceProBaseUrl}/api/employee/ext/id/${id}`;
    }

    if (!url) {
        return res.status(400).json({ error: 'ไม่พบพารามิเตอร์ empid หรือ id' });
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('SSO Bridge Error:', error);
        res.status(500).json({ error: 'ไม่สามารถเชื่อมต่อ Service Pro API ได้' });
    }
});
app.post('/api/sso-customers', async (req, res) => {
    try {
        const serviceProBaseUrl = (process.env.SERVICE_PRO_API_URL || 'https://service-pro.example.com').replace(/\/$/, '');
        const response = await fetch(`${serviceProBaseUrl}/api/task/customer/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body || {})
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('SSO Customer Bridge Error:', error);
        res.status(500).json({ error: 'ไม่สามารถเชื่อมต่อ Service Pro API (Customer) ได้' });
    }
});
// 1.ดึงงานซ่อมทั้งหมด
app.get('/api/jobs', (req, res) => {
    const sql = `
        SELECT j.*, 
            c.customer_name, c.contact_person, c.phone_number,
            d.model_name, d.serial_number, 
            d.product_type, 
            d.expert_serial_number, d.warranty_start_date, d.warranty_months, d.warranty_end_date,
            d.warranty_details 
        FROM RepairJobs j
        LEFT JOIN Customers c ON j.customer_id = c.customer_id
        LEFT JOIN Devices d ON j.device_id = d.device_id
        ORDER BY j.date_received DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching jobs:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// 2.ดึงงานเคลมทั้งหมด
app.get('/api/claims', (req, res) => {
    const sql = `
        SELECT cr.*, j.job_id, j.images, c.customer_name AS original_customer, d.model_name, d.serial_number
        FROM ClaimRecords cr
        JOIN RepairJobs j ON cr.job_id = j.job_id
        JOIN Customers c ON j.customer_id = c.customer_id
        JOIN Devices d ON j.device_id = d.device_id
        ORDER BY cr.date_sent DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching claims:', err);
            return res.json([]); 
        }
        res.json(results);
    });
});

// เปลี่ยนเป็น upload.array('images', 10) คือรับฟิลด์ชื่อ images สูงสุด 10 ไฟล์
app.post('/api/jobs', upload.array('images', 10), async (req, res) => {
    const conn = await db.promise().getConnection();
    try {
        await conn.beginTransaction();
        const bodyData = JSON.parse(req.body.data);
        const { job_id, customer, device, job } = bodyData;
        
        // 🔴 รับค่า performed_by ที่แนบมากับ FormData
        const performed_by = req.body.performed_by || 'System';
        
        let imageFilenames = '';
        if (req.files && req.files.length > 0) {
            imageFilenames = req.files.map(file => file.filename).join(',');
        } else {
            imageFilenames = job.images || '';
        }

        // -----------------------------------------------------
        // 1. จัดการลูกค้า (Customers)
        // -----------------------------------------------------
        let [customerRows] = await conn.query('SELECT customer_id FROM Customers WHERE customer_name = ?', [customer.name]);
        let customerId;
        if (customerRows.length > 0) {
            customerId = customerRows[0].customer_id;
            await conn.query('UPDATE Customers SET contact_person = ?, phone_number = ? WHERE customer_id = ?', 
                [customer.contact, customer.phone, customerId]);
        } else {
            const [newCustomer] = await conn.query(
                'INSERT INTO Customers (customer_name, contact_person, phone_number) VALUES (?, ?, ?)',
                [customer.name, customer.contact, customer.phone]
            );
            customerId = newCustomer.insertId;
        }

        // -----------------------------------------------------
        // 2. จัดการอุปกรณ์ (Devices)
        // -----------------------------------------------------
        let [deviceRows] = await conn.query('SELECT device_id FROM Devices WHERE serial_number = ?', [device.serial]);
        let deviceId;

        if (deviceRows.length > 0) {
            deviceId = deviceRows[0].device_id;
            await conn.query(
                `UPDATE Devices SET 
                    model_name = ?, 
                    product_type = ?, 
                    expert_serial_number = ?, 
                    warranty_start_date = ?, 
                    warranty_months = ?, 
                    warranty_end_date = ?,
                    warranty_details = ? 
                    WHERE device_id = ?`,
                [
                    device.model, 
                    device.product_type, 
                    device.expert_serial_number, 
                    device.warranty_start_date || null, 
                    device.warranty_months || 0, 
                    device.warranty_end_date || null,
                    device.warranty_details, 
                    deviceId
                ]
            );
        } else {
            const [newDevice] = await conn.query(
                `INSERT INTO Devices 
                (serial_number, model_name, product_type, expert_serial_number, warranty_start_date, warranty_months, warranty_end_date, warranty_details) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    device.serial, 
                    device.model, 
                    device.product_type || 'General', 
                    device.expert_serial_number,
                    device.warranty_start_date || null, 
                    device.warranty_months || 0, 
                    device.warranty_end_date || null,
                    device.warranty_details 
                ]
            );
            deviceId = newDevice.insertId;
        }

        // -----------------------------------------------------
        // 3. สร้าง Job (RepairJobs)
        // -----------------------------------------------------
        const jobStatus = job.status || 'New'; 

        await conn.query(
            `INSERT INTO RepairJobs 
            (job_id, customer_id, device_id, date_received, symptom, accessories, status, 
            pass_fail_status, date_sent_to_tech, extra_notes, images, device_details) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                job_id, customerId, deviceId, 
                job.date_received || new Date(), 
                job.symptom, 
                job.accessories,
                jobStatus, 
                job.pass_fail_status || 'Pending', 
                job.date_sent_to_tech || null,     
                job.extra_notes, 
                imageFilenames, 
                device.type 
            ]
        );

        await conn.commit();

        // 🔴 ใช้ตัวแปร performed_by แทนข้อความคงที่
        if (jobStatus === 'New') {
            await recordActionLog(job_id, 'สร้างงานซ่อมใหม่', `รับเครื่อง ${device.model} อาการ: ${job.symptom}`, performed_by);
        } else if (jobStatus === 'Pending') {
            await recordActionLog(job_id, 'สร้างงาน (รออนุมัติ)', `เพิ่มงานลงตะกร้ารออนุมัติ อาการ: ${job.symptom}`, performed_by);
        }

        res.status(201).json({ message: 'สร้างงานสำเร็จ', jobId: job_id });

    } catch (error) {
        await conn.rollback();
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'Failed to create job: ' + error.message });
    } finally {
        conn.release();
    }
});

// 4. อัปเดตงาน (Update Job)
app.put('/api/jobs/:jobId', async (req, res) => {
    const { jobId } = req.params;
    // 🔴 รับตัวแปร performed_by
    const { status, technician_report, cost, date_done, performed_by } = req.body;

    try {
        if (status === 'New' || status === 'ClaimFailed') {
            await db.promise().query('DELETE FROM ClaimRecords WHERE job_id = ?', [jobId]);
        }

        let sql = `UPDATE RepairJobs SET updated_at = NOW()`;
        const params = [];

        if (status) { sql += `, status = ?`; params.push(status); }
        if (technician_report) { sql += `, repair_details = ?`; params.push(technician_report); }
        if (cost !== undefined) { sql += `, cost_estimate = ?`; params.push(cost); }
        if (date_done) { sql += `, date_repair_done = ?`; params.push(date_done); }

        sql += ` WHERE job_id = ?`;
        params.push(jobId);

        await db.promise().query(sql, params);
        
        // 🔴 ใช้ตัวแปร performed_by แทน 'System'
        if (status === 'ClaimFailed') {
            await recordActionLog(jobId, 'ซ่อม/เคลม ไม่สำเร็จ', 'ระบบลบประวัติการเคลมเดิมทิ้งและเปลี่ยนสถานะกลับมารอส่งใหม่', performed_by);
        } else if (status === 'New') {
            await recordActionLog(jobId, 'อนุมัติงานเข้า', 'อนุมัติงานจากตะกร้าเข้าสู่ระบบหลักเรียบร้อย', performed_by);
        }
        res.json({ message: 'อัปเดตงานสำเร็จ', jobId });

    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Update failed' });
    }
});

// 6. สร้างรายการส่งเคลมใหม่ (Create Claim)
app.post('/api/claims', async (req, res) => {
    const conn = await db.promise().getConnection();
    try {
        await conn.beginTransaction();
        const data = req.body;

        // 🔴 เช็คให้ชัวร์ว่ามี 11 คอลัมน์ และมีเครื่องหมาย ? 11 ตัวพอดีเป๊ะ!
        await conn.query(
            `INSERT INTO ClaimRecords 
            (job_id, sender_name, service_center_name, service_center_address, service_center_phone, date_sent, items_sent, quantity, warranty_status_claim, remark_send, tracking_number) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                data.job_id, 
                data.sender_name,  
                data.service_center_name, 
                data.service_center_address, 
                data.service_center_phone, 
                data.date_sent, 
                data.items_sent, 
                data.quantity || 1, 
                data.warranty_status_claim, 
                data.remark_send,
                data.tracking_number // 🔴 ข้อมูลตัวที่ 11
            ]
        );

        await conn.commit();
        
        // 🔴 บันทึก Log 
        await recordActionLog(
            data.job_id, 
            'ส่งเคลมศูนย์บริการ', 
            `ส่งไปที่: ${data.service_center_name} (ผู้นำไปส่ง: ${data.sender_name})`, 
            data.performed_by 
        );
        res.status(201).json({ message: 'บันทึกส่งเคลมสำเร็จ' });

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'บันทึกไม่สำเร็จ: ' + err.message });
    } finally {
        conn.release();
    }
});

/// 7. อัปเดตสถานะการเคลม 
app.put('/api/claims/:claimId', async (req, res) => {
    const { claimId } = req.params;
    // 🔴 รับตัวแปร performed_by
    const { 
        date_received_back, 
        date_returned_customer,
        return_method,
        customer_address,
        return_sender_name,
        customer_name, 
        return_remark,
        performed_by
    } = req.body;

    try {
        let sql = "UPDATE ClaimRecords SET ";
        const params = [];
        const updates = []; 

        if (date_received_back) {
            updates.push("date_received_back = ?");
            params.push(date_received_back);
        }
        
        if (date_returned_customer) {
            updates.push("date_returned_customer = ?");
            params.push(date_returned_customer);
            updates.push("is_return_failed = FALSE");
            if (return_method !== undefined) {
                updates.push("return_method = ?");
                params.push(return_method);
            }
            if (customer_address !== undefined) {
                updates.push("customer_address = ?");
                params.push(customer_address);
            }
            if (return_sender_name !== undefined) {
                updates.push("return_sender_name = ?");
                params.push(return_sender_name);
            }
            if (customer_name !== undefined) {
                updates.push("customer_name = ?");
                params.push(customer_name);
            }
            if (return_remark !== undefined) {
                updates.push("return_remark = ?");
                params.push(return_remark);
            }
        }

        // เอา Array มาต่อกันด้วยลูกน้ำ
        sql += updates.join(", ") + " WHERE claim_id = ?";
        params.push(claimId);

        await db.promise().query(sql, params);
        const [claimRows] = await db.promise().query('SELECT job_id FROM ClaimRecords WHERE claim_id = ?', [claimId]);
        if (claimRows.length > 0) {
            let type = date_returned_customer ? 'ส่งคืนลูกค้า' : 'รับกลับบริษัท';
            let actionDesc = date_returned_customer ? `ส่งคืนผ่าน ${return_method || '-'}` : 'รับเครื่องกลับจากศูนย์บริการมาอยู่ที่บริษัทแล้ว';
            
            // 🔴 บันทึก Log โดยใช้ performed_by แทนพนักงานเคลม
            await recordActionLog(claimRows[0].job_id, type, actionDesc, performed_by);
        }
        res.json({ message: 'อัปเดตสถานะเคลมสำเร็จ', claimId });

    } catch (error) {
        console.error('Error updating claim:', error);
        res.status(500).json({ error: 'Update failed: ' + error.message });
    }
});

/// ลบงานซ่อม (กวาดล้างข้อมูลที่เกี่ยวข้อง ยกเว้น Log ประวัติ)
app.delete('/api/jobs/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const { performed_by } = req.body; 

    try {
        // 1. ลบข้อมูลการส่งเคลมที่ผูกกับงานนี้ทิ้งก่อน (ถ้ามี)
        await db.promise().query('DELETE FROM ClaimRecords WHERE job_id = ?', [jobId]);

        // 2. ลบข้อมูลงานหลักทิ้ง
        const [result] = await db.promise().query('DELETE FROM RepairJobs WHERE job_id = ?', [jobId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลที่ต้องการลบ' });
        }

        // 3. บันทึก Log การลบข้อมูล
        await recordActionLog(jobId, 'ลบข้อมูลงาน', 'ลบงานซ่อมและประวัติการเคลมนี้ออกจากระบบ', performed_by);

        res.json({ message: 'ลบข้อมูลทั้งหมดเรียบร้อยแล้ว' });

    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'ไม่สามารถลบข้อมูลได้' });
    }
});

// ==========================================
// แก้ไขรายละเอียดงานรับซ่อม (Edit Job - Full Update)
// ==========================================
app.put('/api/jobs/edit/:jobId', async (req, res) => {
    const { jobId } = req.params;
    
    // รับค่าข้อมูลทั้งหมดที่ส่งมาจากหน้า EditJobModal
    // 🔴 เพิ่ม performed_by
    const { 
        customer_name, contact_person, phone, 
        product_type, model, serial, expert_serial_number, device_details,
        warranty_start_date, warranty_months, warranty_end_date, warranty_details,
        symptom, accessories, extra_notes,
        performed_by
    } = req.body;
    
    const conn = await db.promise().getConnection();

    try {
        await conn.beginTransaction();

        // 1. ย้าย device_details มาอัปเดตในตาราง RepairJobs ตรงนี้ครับ
        await conn.query(
            `UPDATE RepairJobs SET symptom = ?, accessories = ?, extra_notes = ?, device_details = ?, updated_at = NOW() WHERE job_id = ?`,
            [symptom, accessories, extra_notes, device_details, jobId]
        );

        // 2. ค้นหา customer_id และ device_id ที่เชื่อมโยงกับงานนี้
        const [jobRows] = await conn.query('SELECT customer_id, device_id FROM RepairJobs WHERE job_id = ?', [jobId]);
        
        if (jobRows.length > 0) {
            const { customer_id, device_id } = jobRows[0];

            // 3. อัปเดตข้อมูลลูกค้า (Customers)
            await conn.query(
                `UPDATE Customers SET customer_name = ?, contact_person = ?, phone_number = ? WHERE customer_id = ?`,
                [customer_name, contact_person, phone, customer_id]
            );

            // 4. อัปเดตข้อมูลอุปกรณ์ (Devices)
            await conn.query(
                `UPDATE Devices SET 
                    product_type = ?, 
                    model_name = ?, 
                    serial_number = ?, 
                    expert_serial_number = ?, 
                    warranty_start_date = ?, 
                    warranty_months = ?, 
                    warranty_end_date = ?, 
                    warranty_details = ?
                WHERE device_id = ?`,
                [
                    product_type, 
                    model, 
                    serial, 
                    expert_serial_number, 
                    warranty_start_date || null, 
                    warranty_months || 0, 
                    warranty_end_date || null, 
                    warranty_details,
                    device_id
                ]
            );
        }

        await conn.commit();
        
        // 🔴 บันทึก Log โดยใช้ performed_by แทน 'System'
        await recordActionLog(jobId, 'แก้ไขข้อมูลงานซ่อม', 'ทำการอัปเดตรายละเอียดงาน/ข้อมูลลูกค้า/หรืออุปกรณ์', performed_by);
        res.json({ message: 'แก้ไขข้อมูลสำเร็จ' });

    } catch (error) {
        await conn.rollback();
        console.error('Error editing job:', error);
        res.status(500).json({ error: 'แก้ไขข้อมูลไม่สำเร็จ: ' + error.message });
    } finally {
        conn.release();
    }
});

// ==========================================
// แก้ไขรายละเอียดการส่งเคลม (Edit Claim)
// ==========================================
app.put('/api/claims/edit/:claimId', async (req, res) => {
    const { claimId } = req.params;
    // 🔴 รับตัวแปร performed_by
    const { service_center_address, remark_send, return_method, return_sender_name, customer_address, performed_by, tracking_number } = req.body;
    
    try {
        await db.promise().query(
            `UPDATE ClaimRecords 
            SET service_center_address = ?, remark_send = ?, return_method = ?, return_sender_name = ?, customer_address = ?
            WHERE claim_id = ?`,
            [service_center_address, remark_send, return_method, return_sender_name, customer_address, tracking_number, claimId]
        );
        const [claimRows] = await db.promise().query('SELECT job_id FROM ClaimRecords WHERE claim_id = ?', [claimId]);
        if (claimRows.length > 0) {
            // บันทึก Log โดยใช้ performed_by แทน 'System'
            await recordActionLog(claimRows[0].job_id, 'แก้ไขข้อมูลการเคลม', 'อัปเดตรายละเอียดใบส่งเคลมศูนย์', performed_by);   
        }
        res.json({ message: 'แก้ไขข้อมูลเคลมสำเร็จ' });
    } catch (error) {
        console.error('Error editing claim:', error);
        res.status(500).json({ error: 'แก้ไขข้อมูลไม่สำเร็จ' });
    }
});

// 8. ดึงประวัติการทำงาน (Action Logs) ของงานนั้นๆ
app.get('/api/logs/:jobId', (req, res) => {
    const { jobId } = req.params;
    const sql = `
        SELECT * FROM ActionLogs 
        WHERE job_id = ? 
        ORDER BY created_at DESC
    `;
    db.query(sql, [jobId], (err, results) => {
        if (err) {
            console.error('Error fetching logs:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});
// 9. ดึงประวัติการทำงานทั้งหมดในระบบ (Global Logs)
app.get('/api/logs', (req, res) => {
    const sql = `
        SELECT * FROM ActionLogs 
        ORDER BY created_at DESC 
        LIMIT 1000 -- ดึงมาแค่ 1000 รายการล่าสุดเพื่อไม่ให้เว็บอืด
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching global logs:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});


// 10. ยกเลิกการส่งคืนลูกค้า (ตีกลับมาบริษัท)
app.put('/api/claims/revert-return/:claimId', async (req, res) => {
    const { claimId } = req.params;
    const { performed_by } = req.body;
    
    try {
        await db.promise().query(
            `UPDATE ClaimRecords 
            SET date_returned_customer = NULL, 
                return_method = NULL, 
                return_sender_name = NULL, 
                customer_address = NULL, 
                customer_name = NULL, 
                return_remark = NULL,
                is_return_failed = TRUE   
            WHERE claim_id = ?`,
            [claimId]
        );

        const [claimRows] = await db.promise().query('SELECT job_id FROM ClaimRecords WHERE claim_id = ?', [claimId]);
        if (claimRows.length > 0) {
            await recordActionLog(claimRows[0].job_id, 'ส่งคืนลูกค้าไม่สำเร็จ', 'ตีของกลับบริษัท รอทำการส่งคืนใหม่อีกครั้ง', performed_by);
        }

        res.json({ message: 'ย้อนสถานะกลับมาเป็นรอส่งคืนสำเร็จ' });
    } catch (error) {
        console.error('Error reverting return:', error);
        res.status(500).json({ error: 'Revert failed: ' + error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});