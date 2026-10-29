import { useState, useEffect } from 'react';
import { X, Save, FileText, Calendar, Hash, AlertCircle, Tag, PenTool, Image as ImageIcon, Upload,ShieldCheck, Package, PlayCircle, Film} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import Swal from 'sweetalert2';

function AddJobModal({ isOpen, onClose, onSave, jobs = [] }) {
    const [isVisible, setIsVisible] = useState(false); 
    const [isAnimating, setIsAnimating] = useState(false); 
    const [previewMedias, setPreviewMedias] = useState([]); 
    const [selectedFiles, setSelectedFiles] = useState([]); 
    const [isCompressing, setIsCompressing] = useState(false); 
    const getTodayDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0'); 
        return `${year}-${month}-${day}`;
    };

    const [formData, setFormData] = useState({
        job_id: '',
        customer_name: '',      
        contact_person: '',     
        phone: '',
        product_type: '',       
        model: '',              
        serial: '',             
        expert_serial_number: '', 
        device_details: '',     
        warranty_start_date: '', 
        warranty_period: '',    
        warranty_end_date: '',
        warranty_details: '',   
        symptom: '',            
        accessories: '',        
        extra_notes: '',        
        images: '',
        pass_fail_status: 'Pending', 
        date_sent_to_tech: '',
        date_received: getTodayDate() 
    });

    const generateJobId = () => {
        const currentYearBE = new Date().getFullYear() + 543; 
        const yearPrefix = String(currentYearBE).slice(-2); 

        const jobsThisYear = jobs.filter(j => j.job_id && j.job_id.startsWith(`RE${yearPrefix}`));
        let maxRunning = 0;

        jobsThisYear.forEach(j => {
            const match = j.job_id.match(/RE\d{2}(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxRunning) maxRunning = num;
            }
        });

        const nextRunning = maxRunning + 1;
        const paddedRunning = String(nextRunning).padStart(5, '0');
        return `RE${yearPrefix}${paddedRunning}`;
    };

    useEffect(() => {
        if (isOpen) {
            const autoJobId = generateJobId();
            const openTimer = setTimeout(() => {
                setFormData(prev => ({ 
                    ...prev, 
                    job_id: autoJobId, 
                    customer_name: '', contact_person: '', phone: '',
                    product_type: '', model: '', serial: '', expert_serial_number: '', 
                    device_details: '', warranty_start_date: '', warranty_period: '', warranty_end_date: '',
                    warranty_details: '', 
                    symptom: '', accessories: '', extra_notes: '', images: '',
                    pass_fail_status: 'Pending',
                    date_sent_to_tech: '',
                    date_received: getTodayDate() 
                }));
                setPreviewMedias([]);
                setSelectedFiles([]); 
                setIsVisible(true);
                setTimeout(() => setIsAnimating(true), 20);
            }, 0);

            return () => clearTimeout(openTimer);
        } else {
            const closeTimer = setTimeout(() => {
                setIsAnimating(false);
                setTimeout(() => setIsVisible(false), 300);
            }, 0);
            return () => clearTimeout(closeTimer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); 

    const removeMedia = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        setPreviewMedias(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
            ...prev,
            images: newFiles.map(f => f.name).join(',')
        }));
    };

    const handleFileChange = async (e) => {
        // 🔴 แก้จาก files เป็น newFiles ให้ชื่อตรงกันครับ
        const newFiles = Array.from(e.target.files); 
        if (!newFiles.length) return;
        
        const currentTotal = selectedFiles.length + newFiles.length;
        if (currentTotal > 10) {
            Swal.fire({
                title: 'ไฟล์เกินจำนวน',
                text: `คุณเลือกไฟล์เกินขีดจำกัด (สามารถอัปโหลดได้สูงสุด 10 ไฟล์)`,
                icon: 'warning',
                confirmButtonColor: '#3085d6',
                customClass: { popup: 'font-sans' }
            });
            e.target.value = ''; // เคลียร์ค่า input
            return; // หยุดทำงาน ไม่ให้เพิ่มรูป
        }

        setIsCompressing(true);
        const processedFiles = [];
        const previewUrls = [];

        for (let file of newFiles) {
            const isVideo = file.type.startsWith('video/');

            if (isVideo) {
                if (file.size > 50 * 1024 * 1024) {
                    alert(`ไฟล์วิดีโอ ${file.name} ใหญ่เกินไป (ข้ามไฟล์นี้)`);
                    continue; 
                }
                processedFiles.push(file);
                previewUrls.push(URL.createObjectURL(file));
            } else {
                try {
                    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                    const compressedBlob = await imageCompression(file, options);
                    const compressedFile = new File([compressedBlob], file.name, {
                        type: file.type, lastModified: Date.now(),
                    });
                    processedFiles.push(compressedFile);
                    previewUrls.push(URL.createObjectURL(compressedFile));
                } catch (error) {
                    console.error("Error compressing image:", error);
                    processedFiles.push(file);
                    previewUrls.push(URL.createObjectURL(file));
                }
            }
        }

        setSelectedFiles(prev => [...prev, ...processedFiles]);
        setPreviewMedias(prev => [...prev, ...previewUrls]);
        setFormData(prev => ({ 
            ...prev, 
            images: [...selectedFiles, ...processedFiles].map(f => f.name).join(',') 
        }));
        
        setIsCompressing(false); 

        // 🔴 เพิ่มการแจ้งเตือนสำเร็จตอนท้ายสุด
        Swal.fire({
            title: 'เพิ่มไฟล์สำเร็จ!',
            text: `จำนวนไฟล์ปัจจุบัน: ${currentTotal} / 10 ไฟล์`,
            icon: 'success',
            timer: 1500, // ให้ปิดเองอัตโนมัติใน 1.5 วินาที
            showConfirmButton: false,
            customClass: { popup: 'font-sans' }
        });
        
        e.target.value = ''; // เคลียร์ค่า input เผื่อต้องเลือกไฟล์ชื่อเดิมซ้ำ
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'pass_fail_status' && value !== 'Pass') {
            setFormData({ ...formData, [name]: value, date_sent_to_tech: '' });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleWarrantyCalc = (e) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };
        if (name === 'warranty_start_date' || name === 'warranty_period') {
            const start = new Date(newFormData.warranty_start_date);
            const months = parseInt(newFormData.warranty_period);
            if (!isNaN(start.getTime()) && !isNaN(months)) {
                const end = new Date(start);
                end.setMonth(end.getMonth() + months);
                newFormData.warranty_end_date = end.toISOString().split('T')[0];
            }
        }
        setFormData(newFormData);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        //  1. ระบบตรวจสอบข้อมูลบังคับกรอก (Validation)
        const missingFields = [];
        
        if (!formData.customer_name) missingFields.push('โรงพยาบาล / ดีลเลอร์');
        if (!formData.contact_person) missingFields.push('ผู้ที่นำเครื่องมาส่งซ่อม');
        if (!formData.product_type) missingFields.push('รายการ / ชื่อสินค้า');
        if (!formData.model) missingFields.push('รุ่น (Model)');
        if (!formData.device_details) missingFields.push('รายละเอียดเครื่อง');
        if (!formData.serial) missingFields.push('Serial Number (ตัวเครื่อง)');
        if (!formData.warranty_start_date) missingFields.push('วันที่เริ่มรับประกัน');
        if (!formData.warranty_end_date) missingFields.push('วันสิ้นสุดการรับประกัน');
        if (!formData.symptom) missingFields.push('ลักษณะอาการที่ส่งซ่อม');
        if (selectedFiles.length === 0) missingFields.push('รูปภาพ/วิดีโอ (อย่างน้อย 1 ไฟล์)');

        // ถ้ามีช่องไหนว่างเปล่า ให้เด้ง SweetAlert2 สีแดงแจ้งเตือน
        if (missingFields.length > 0) {
            Swal.fire({
                title: 'กรอกข้อมูลไม่ครบถ้วน!',
                html: `
                    <div style="text-align: left; margin-top: 10px;">
                        <span style="color: #64748b; font-size: 14px;">กรุณาระบุข้อมูลในช่องที่มีเครื่องหมายดอกจัน (*) ต่อไปนี้:</span>
                        <div style="background: #fef2f2; padding: 12px; border-radius: 8px; color: #dc2626; font-size: 14px; margin-top: 10px; border: 1px solid #fee2e2;">
                            • ${missingFields.join('<br/>• ')}
                        </div>
                    </div>
                `,
                icon: 'warning',
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'กลับไปแก้ไข',
                customClass: { popup: 'font-sans' }
            });
            return; 
        }

        // 2. ถ้ากรอกครบทุกช่องแล้ว ค่อยเด้งหน้าต่างยืนยันตามปกติ
        let summaryHTML = `
            <div style="text-align: left; font-size: 14px; padding: 15px; background: #f8fafc; border-radius: 8px; margin-top: 10px;">
                <p style="margin-bottom: 8px;"><b>หมายเลขงาน:</b> <span style="color: #4f46e5; font-family: monospace; font-size: 16px;">${formData.job_id}</span></p>
                <p style="margin-bottom: 8px;"><b>ลูกค้า:</b> ${formData.customer_name} ${formData.contact_person ? `(${formData.contact_person})` : ''}</p>
                <p style="margin-bottom: 8px;"><b>สินค้า/รุ่น:</b> ${formData.product_type || '-'} / ${formData.model || '-'}</p>
                <p style="margin-bottom: 8px;"><b>S/N:</b> ${formData.serial || '-'}</p>
                <hr style="margin: 10px 0; border-color: #e2e8f0;"/>
                <p style="margin-bottom: 0; color: #dc2626;"><b>อาการเสีย:</b> ${formData.symptom || '-'}</p>
            </div>
        `;

        Swal.fire({
            title: 'ตรวจสอบข้อมูลก่อนบันทึก',
            html: summaryHTML,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2563eb', 
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ใช่, บันทึกรับงานเลย!',
            cancelButtonText: 'กลับไปแก้ไข',
            customClass: { popup: 'font-sans' } 
        }).then((result) => {
            if (result.isConfirmed) {
                const payloadData = {
                    job_id: formData.job_id,
                    customer: { name: formData.customer_name, contact: formData.contact_person, phone: formData.phone },
                    device: {
                        product_type: formData.product_type, model: formData.model, serial: formData.serial,
                        type: formData.device_details, expert_serial_number: formData.expert_serial_number,
                        warranty_start_date: formData.warranty_start_date, warranty_months: formData.warranty_period,
                        warranty_end_date: formData.warranty_end_date, warranty_details: formData.warranty_details 
                    },
                    job: {
                        symptom: formData.symptom, accessories: formData.accessories, extra_notes: formData.extra_notes,
                        images: formData.images, pass_fail_status: formData.pass_fail_status,
                        date_sent_to_tech: formData.date_sent_to_tech,
                        date_received: formData.date_received + 'T' + new Date().toTimeString().split(' ')[0], 
                        status: 'Pending' 
                    }
                };

                const formDataToSend = new FormData();
                formDataToSend.append('data', JSON.stringify(payloadData)); 
                selectedFiles.forEach(file => { formDataToSend.append('images', file); });
                onSave(formDataToSend); 
            }
        });
    };

    //  1. สร้าง State เก็บรายชื่อลูกค้า
    const [customerList, setCustomerList] = useState([]);

    //  2. ดึงข้อมูลลูกค้าจาก ServicePro API ตอนเปิด Modal
    useEffect(() => {
        if (isOpen) {
            const fetchCustomers = async () => {
                try {
                    const API_URL = import.meta.env.VITE_API_URL;
                    const response = await fetch(`${API_URL}/api/sso-customers`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}) // ส่ง Body ว่างตามสเปค
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setCustomerList(data);
                    }
                } catch (error) {
                    console.error('Error fetching customers:', error);
                }
            };
            fetchCustomers();
        }
    }, [isOpen]);

    if (!isVisible) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
            <div className={`relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 flex flex-col max-h-[95vh] ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
                
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><FileText size={18} /></div>
                            เปิดใบรายการงานซ่อมใหม่
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 rounded-full hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-xl border border-transparent hover:border-gray-200 transition-all"><X size={22} /></button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
                    <div className="flex flex-col lg:flex-row flex-1">
                        
                        {/* LEFT COLUMN: ข้อมูลลูกค้า */}
                        <div className="lg:w-4/12 bg-slate-50 p-5 space-y-4 border-r border-gray-100 flex flex-col">
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-1">หมายเลขส่งซ่อม (Job ID)</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-3.5 text-blue-400 w-4 h-4" />
                                    <input required name="job_id" value={formData.job_id} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-blue-50/50 border border-blue-200 rounded-lg outline-none font-mono text-blue-700 font-bold text-sm shadow-inner" />
                                </div>
                            </div>
                            <div>
                        <label className="block text-sm font-semibold text-slate-500 mb-1.5">โรงพยาบาล / ดีลเลอร์ <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            name="customer_name"  
                            list="addjob-customer-list"
                            value={formData.customer_name} 
                            onChange={handleChange} 
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="ระบุชื่อลูกค้า..."
                            required
                        />
                        {/* ส่วน datalist คงไว้เหมือนเดิมครับ */}
                        <datalist id="addjob-customer-list">
                            {customerList.map((cus) => (
                                <option key={cus._id} value={cus.hospital} />
                            ))}
                        </datalist>
                    </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-1">ผู้ที่นำเครื่องมาส่งซ่อม <span className="text-red-500">*</span></label>
                                <input name="contact_person" placeholder="ชื่อผู้ติดต่อ" value={formData.contact_person} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>

                            <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm mt-auto">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 text-slate-500 rounded-md"><Calendar size={16} /></div>
                                    <div className="w-full">
                                        <p className="text-sm text-slate-400 uppercase font-bold mb-0.5">วันที่รับเครื่อง</p>
                                        <input type="date" name="date_received" value={formData.date_received} onChange={handleChange} className="w-full text-sm font-semibold text-slate-700 bg-transparent outline-none border-b border-gray-200 focus:border-blue-500 pb-1" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: ข้อมูลอุปกรณ์ + ประกัน */}
                        <div className="lg:w-8/12 p-5 space-y-4 bg-white flex flex-col justify-between">
                            
                            {/* Section 1: ข้อมูลเครื่อง */}
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-500 mb-1">รายการ / ชื่อสินค้า <span className="text-red-500">*</span></label>
                                        <input name="product_type" placeholder="เช่น เครื่องวัดความดัน" value={formData.product_type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-500 mb-1">รุ่น (Model) <span className="text-red-500">*</span></label>
                                        <input required name="model" placeholder="ระบุรุ่น..." value={formData.model} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-500 mb-1">รายละเอียดเครื่อง <span className="text-red-500">*</span></label>
                                        <input name="device_details" placeholder="สี, ขนาด, ปีผลิต" value={formData.device_details} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-1 flex items-center gap-1"><Tag size={12}/> Serial Number (ตัวเครื่อง) <span className="text-red-500">*</span></label>
                                        <input required name="serial" placeholder="S/N" value={formData.serial} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-1 flex items-center gap-1"><Tag size={12}/> Serial Number / EXPERT</label>
                                        <input name="expert_serial_number" placeholder="Expert S/N" value={formData.expert_serial_number} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />
                            
                            {/* Section 2: ข้อมูลประกัน */}
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1"><ShieldCheck size={12}/> วันที่เริ่มรับประกัน <span className="text-red-500">*</span></label>
                                        <input type="date" name="warranty_start_date" value={formData.warranty_start_date} onChange={handleWarrantyCalc} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1"><ShieldCheck size={12}/> วันสิ้นสุดการรับประกัน <span className="text-red-500">*</span></label>
                                        <input type="date" name="warranty_end_date" value={formData.warranty_end_date} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-red-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-500 mb-1">รายละเอียดประกันพิ่มเติม</label>
                                        <input name="warranty_details" placeholder="เช่น นอกประกัน, อยู่ในประกัน" value={formData.warranty_details} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 4: อาการเสีย & รูปภาพ/วิดีโอ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                                
                                {/* ฝั่งซ้าย: อาการเสีย */}
                                <div className="flex flex-col h-full">
                                    <label className="block text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1">
                                        <AlertCircle size={14}/> ลักษณะอาการที่ส่งซ่อม <span className="text-red-500">*</span>
                                    </label>
                                    <textarea required name="symptom" value={formData.symptom} onChange={handleChange} className=" w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none flex-1 min-h-25"></textarea>
                                </div>

                                {/* ฝั่งขวา: อุปกรณ์ + หมายเหตุ + อัปโหลดรูปภาพ */}
                                <div className="flex flex-col justify-between space-y-3">
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1"><Package size={12}/> อุปกรณ์ที่รับมา</label>
                                            <input name="accessories" placeholder="สายไฟ..." value={formData.accessories} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1"><PenTool size={12}/> หมายเหตุ</label>
                                            <input name="extra_notes" placeholder="..." value={formData.extra_notes} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                    </div>

                                    {/* 🔴 โซนอัปโหลดรูปภาพที่ปรับขนาดให้ใหญ่ขึ้น */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                            <Film size={14}/> รูปภาพ/วิดีโอ <span className="text-red-500">*</span> <span className="text-xs font-normal text-slate-400">(สูงสุด 10 ไฟล์)</span>
                                        </label>
                                        
                                        {/* ปรับความสูงจาก h-14 เป็น h-28 และปรับไอคอนให้ใหญ่ขึ้น */}
                                        <div className={`group border-2 border-dashed ${isCompressing ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:bg-gray-50 hover:border-blue-400'} rounded-xl h-28 flex flex-col items-center justify-center transition-all relative cursor-pointer overflow-hidden mb-3`}>  
                                            <input type="file" accept="image/*, video/*" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isCompressing} />
                                            {isCompressing ? (
                                                <div className="text-blue-500 flex flex-col items-center gap-2">
                                                    <Upload size={24} className="animate-bounce" />
                                                    <span className="text-xs font-bold">กำลังจัดการไฟล์...</span>
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 flex flex-col items-center gap-1.5 transition-colors group-hover:text-blue-500">
                                                    <Upload size={24} />
                                                    <span className="text-xs font-medium text-slate-500">คลิกเลือกไฟล์ หรือลากมาวางที่นี่</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* กล่องโชว์รูป (ปรับให้รูปใหญ่ขึ้นเป็น h-16) */}
                                        {previewMedias.length > 0 && (
                                            <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-40 p-1 custom-scrollbar">
                                                {previewMedias.map((url, index) => {
                                                    const file = selectedFiles[index];
                                                    const isVideo = file && file.type.startsWith('video/');
                                                    return (
                                                        <div key={index} className="relative aspect-square w-full rounded-xl border border-gray-200 overflow-hidden group shadow-sm bg-white">
                                                            {isVideo ? (
                                                                <div className="w-full h-full bg-slate-900 flex items-center justify-center"><PlayCircle size={18} className="text-white opacity-80" /></div>
                                                            ) : (
                                                                <img src={url} alt={`preview-${index}`} className="w-full h-full object-cover" />
                                                            )}
                                                            <button type="button" onClick={(e) => { e.preventDefault(); removeMedia(index); }} className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm"><X size={12} /></button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-slate-400 font-medium hover:bg-white hover:text-slate-800 rounded-lg border border-transparent hover:border-gray-200 transition-all text-sm">ยกเลิก</button>
                        <button type="submit" disabled={isCompressing} className={`px-6 py-2 text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-2 text-sm ${isCompressing ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 active:scale-95'}`}>
                            <Save size={16} /> {isCompressing ? 'กำลังประมวลผล...' : 'บันทึกเข้าตะกร้างาน'}
                        </button>
                    </div>
                </form>
            </div>

            {/* CSS Helper */}
            <style>{`
                .input-std { width: 100%; padding: 0.4rem 0.6rem; background-color: white; border: 1px solid #e2e8f0; border-radius: 0.4rem; outline: none; transition: all 0.2s; font-size: 0.8rem; }
                .input-std:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
            `}</style>
        </div>
    );
}

export default AddJobModal;