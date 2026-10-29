import React, { useState, useEffect } from 'react';
import { X, Save, Building2, MapPin, Phone, Box, Calendar, FileText, Truck, User } from 'lucide-react';
import Swal from 'sweetalert2';

function AddClaimModal({ isOpen, onClose, onSave, selectedJob }) {
    const [isVisible, setIsVisible] = useState(false); 
    const [isAnimating, setIsAnimating] = useState(false); 
    const getTodayDate = () => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
    const [formData, setFormData] = useState({
        job_id: selectedJob ? selectedJob.job_id : '', 
        sender_name: '', 
        service_center_name: '',
        service_center_address: '',
        service_center_phone: '',
        date_sent: getTodayDate(),
        items_sent: selectedJob ? (selectedJob.accessories || '') : '',
        quantity: 1,
        warranty_status_claim: 'Out of Warranty',
        remark_send: '',
        tracking_number: '' 
    });

    // ==========================================
    // ฐานข้อมูลศูนย์ซ่อม (Autofill)
    // ==========================================
    const SERVICE_CENTERS = [
        {
            name: "คุณอนุกิจ คำศรี",
            address: "654 หมู่ 16 ตำบลรอบเมือง อำเภอเมือง จังหวัดร้อยเอ็ด 45000",
            phone: "093-3453148"
        },
        {
            name: "คุณศิริชัย สอาดเอียม (บริษัท เมดิทอป จำกัด)",
            address: "334 ซอยลาดพร้าว 71 (สังคมสงเคราะห์เหนือ 1) ถนนลาดพร้าว แขวงคลองเจ้าคุณสิงห์ เขตวังทองหลาง กรุงเทพฯ 10310",
            phone: "086-600-2973"
        },
        {
            name: "คุณกร ช่างซ่อม Yuwell",
            address: "825/4 ถนน พรานนก แขวงบ้านช่างหล่อ เขตบางกอกน้อย กรุงเทพมหานคร 10700",
            phone: "086-363-9879"
        },
        {
            name: "ช่างบัญชาซ่อม AnD (บริษัท อีฟอร์แอล เอม จำกัด)",
            address: "229 ถ.ราชวิถี แขวงบางยี่ขัน เขตบางพลัด กทม 10700 (ตรงข้าม รร เขมะสิริ ก่อนถึงปั๊มบางจาก ใกล้สะพานลอยคนข้าม)",
            phone: "081-207-1719"
        },
        {
            name: "(ห้องช่าง) หจก.นอร์ทเทิร์นเมดซัพพลาย",
            address: "245/1 ต.แช่ช้าง อ.สันกำแพง จ.เชียงใหม่ 50130",
            phone: "0889476127"
        },
        {
            name: "คุณจอย Terumo (บริษัทเทอรูโม ประเทศไทย จำกัด)",
            address: "88 อาคาร เดอะปาร์ค ห้องเลขที่ 8 ดับเบิ้ลยู 9-16 ชั้น8 ถนนรัชดาภิเษก เเขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
            phone: "02-111-2133 ต่อ 2"
        },
        {
            name: "พี่จอย (เฉลิมเกียรติ เพชรชูศรี)",
            address: "57/408 ซอย 33 หมู่บ้านโมดิวิลล่าปิ่นเกล้า-วงแหวน ตำบลศาลากลาง อำเภอบางกรวย จังหวัดนนทบุรี 11130",
            phone: "081-9830273"
        },
        {
            name: "(ฝ่าย Customer Service) บริษัท เซอร์คอน พาวเวอร์ โซลูชั่น จำกัด",
            address: "98/8 รามอินทรา 117 แขวงมีนบุรี เขตมีนบุรี กรุงเทพ 10510",
            phone: "02-970-7575"
        }
    ];

    useEffect(() => {
        if (isOpen) {
            const openTimer = setTimeout(() => {
                setFormData(prev => ({
                    ...prev,
                    job_id: selectedJob ? selectedJob.job_id : '',
                    items_sent: selectedJob.product_type + (selectedJob.accessories ? ` (${selectedJob.accessories})` : ''),
                    remark_send: selectedJob.symptom || '',
                    date_sent: getTodayDate()
                }));
                
                setIsVisible(true);
                document.body.style.overflow = 'hidden';
                setTimeout(() => setIsAnimating(true), 20);
            }, 0);

            return () => {
                clearTimeout(openTimer);
                document.body.style.overflow = 'unset';
            };
        } else {
            const closeTimer = setTimeout(() => {
                setIsAnimating(false);
                document.body.style.overflow = 'unset';
                setTimeout(() => setIsVisible(false), 300);
            }, 0);
            return () => {
                clearTimeout(closeTimer);
                document.body.style.overflow = 'unset';
            };
        }
    }, [isOpen, selectedJob]);

    // อัปเกรด handleChange ดักจับการกรอก/เลือกชื่อศูนย์ซ่อม
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // ถ้ากำลังกรอก "ชื่อศูนย์ซ่อม" ให้ค้นหาข้อมูลมาเติมให้อัตโนมัติ
        if (name === 'service_center_name') {
            const matchedCenter = SERVICE_CENTERS.find(center => center.name === value);
            if (matchedCenter) {
                setFormData(prev => ({
                    ...prev,
                    service_center_name: value,
                    service_center_address: matchedCenter.address,
                    service_center_phone: matchedCenter.phone
                }));
                return; // คืนค่าเลย ไม่ต้องไปทำคำสั่งด้านล่างต่อ
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // 1. ระบบตรวจสอบข้อมูลบังคับกรอก (Validation) ตามฟอร์ม * สีแดง
        const missingFields = [];
        
        if (!formData.sender_name) missingFields.push('ชื่อพนักงานผู้นำไปส่งเคลม');
        if (!formData.service_center_name) missingFields.push('ชื่อศูนย์รับซ่อม');
        if (!formData.service_center_address) missingFields.push('ที่อยู่ศูนย์');
        if (!formData.service_center_phone) missingFields.push('เบอร์โทรศัพท์');
        if (!formData.date_sent) missingFields.push('วันที่ส่งซ่อม');
        if (!formData.warranty_status_claim) missingFields.push('สถานะประกัน');
        if (!formData.items_sent) missingFields.push('ชื่อสินค้าเเละอุปกรณ์ที่ส่งไป');
        if (!formData.remark_send) missingFields.push('ลักษณะอาการที่ส่งซ่อม');
        if (!formData.tracking_number) missingFields.push('เลขพัสดุ / ขนส่ง');

        // ถ้ามีช่องไหนว่างเปล่า ให้เด้ง SweetAlert2
        if (missingFields.length > 0) {
            Swal.fire({
                title: 'กรอกข้อมูลไม่ครบถ้วน!',
                html: `
                    <div style="text-align: left; margin-top: 10px;">
                        <span style="color: #64748b; font-size: 14px;">กรุณาระบุข้อมูลในช่องที่มีเครื่องหมายดอกจัน (*) ต่อไปนี้:</span>
                        <div style="background: #fffbeb; padding: 12px; border-radius: 8px; color: #d97706; font-size: 14px; margin-top: 10px; border: 1px solid #fef3c7;">
                            • ${missingFields.join('<br/>• ')}
                        </div>
                    </div>
                `,
                icon: 'warning',
                confirmButtonColor: '#f59e0b', // สี Amber ให้เข้ากับธีมส่งเคลม
                confirmButtonText: 'กลับไปแก้ไข',
                customClass: { popup: 'font-sans' }
            });
            return;
        }

        //  2. ถ้ากรอกครบ ค่อยสร้างหน้าสรุปข้อมูล
        let summaryHTML = `
            <div style="text-align: left; font-size: 14px; padding: 15px; background: #fffbeb; border-radius: 8px; margin-top: 10px;">
                <p style="margin-bottom: 8px;"><b>หมายเลขงาน :</b> <span style="color: #d97706; font-family: monospace; font-size: 16px;">${formData.job_id}</span></p>
                <p style="margin-bottom: 8px;"><b>ผู้ส่งเคลม :</b> ${formData.sender_name}</p>
                <p style="margin-bottom: 8px;"><b>ศูนย์บริการ :</b> ${formData.service_center_name}</p>
                <hr style="margin: 10px 0; border-color: #fde68a;"/>
                <p style="margin-bottom: 8px;"><b>อุปกรณ์ที่ส่ง :</b> ${formData.items_sent}</p>
                <p style="margin-bottom: 8px; color: #dc2626;"><b>อาการเสีย :</b> ${formData.remark_send || '-'}</p>
                <p style="margin-bottom: 0;"><b>เลขพัสดุ :</b> <span style="color: #2563eb; font-weight: bold;">${formData.tracking_number || '-'}</span></p>
            </div>
        `;

        // 3. เรียก Swal ทวนข้อมูล
        Swal.fire({
            title: 'ยืนยันการส่งเคลม',
            html: summaryHTML,
            icon: 'warning',
            showCancelButton : true,
            confirmButtonColor: '#f59e0b', 
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ใช่, บันทึกการส่งเคลม',
            cancelButtonText: 'กลับไปแก้ไข',
            customClass: { popup: 'font-sans' },
            scrollbarPadding: false 
        }).then((result) => {
            if (result.isConfirmed) {
                onSave(formData);
            }
        });
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            <div 
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
                onClick={onClose}
            ></div>

            {/* กล่อง Modal เด้งขึ้นแบบ AddJobModal */}
            <div className={`relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 flex flex-col max-h-[85vh] ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
                
                {/* Header สไตล์คล้าย AddJobModal แต่เป็นสี Amber */}
                <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Truck size={20} /></div>
                            บันทึกการส่งเคลม
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 rounded-lg hover:bg-white hover:text-slate-800 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"><X size={24} /></button>
                </div>

                {/* Form (Scrollable) */}
                <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1 flex flex-col">
                    <div className="p-8 space-y-6 flex-1 bg-slate-50/50">
                        
                        {/* Section 1: Job Ref & ผู้ส่ง */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="group">
                                <label className="block text-sm font-semibold text-slate-500 mb-1.5">หมายเลขส่งซ่อม</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 text-gray-300 w-5 h-5" />
                                    <input 
                                        type="text" 
                                        name="job_id"
                                        value={formData.job_id}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none font-mono text-amber-700 font-bold text-sm ${selectedJob ? 'bg-amber-50 cursor-not-allowed border-amber-200' : 'bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500'}`}
                                        required
                                        readOnly={!!selectedJob} 
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-sm font-semibold text-slate-500 mb-1.5">ชื่อพนักงานผู้นำไปส่งเคลม <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-300 w-5 h-5" />
                                    <input 
                                        type="text" 
                                        name="sender_name"
                                        value={formData.sender_name}
                                        onChange={handleChange}
                                        placeholder="ระบุชื่อผู้ส่ง..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            {/* Left Column: ข้อมูลศูนย์ */}
                            <div className="space-y-4 border-r border-gray-50 pr-4">
                                <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 mb-3">
                                    <MapPin size={16} className="text-slate-500" /> ข้อมูลศูนย์บริการ
                                </h3>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500 mb-1.5">ชื่อศูนย์รับซ่อม <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            name="service_center_name" 
                                            list="center-list"
                                            value={formData.service_center_name} 
                                            onChange={handleChange} 
                                            className="input-std pl-9" 
                                            placeholder="พิมพ์เพื่อค้นหา หรือคลิกที่ช่องเพื่อเลือก..." 
                                            required 
                                        />
                                        <datalist id="center-list">
                                            {SERVICE_CENTERS.map((center, index) => (
                                                <option key={index} value={center.name} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500 mb-1.5">ที่อยู่ศูนย์ <span className="text-red-500">*</span></label>
                                    <textarea name="service_center_address" value={formData.service_center_address} onChange={handleChange} rows="2" className="input-std resize-none" placeholder="ที่อยู่..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500 mb-1.5">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input type="text" name="service_center_phone" value={formData.service_center_phone} onChange={handleChange} className="input-std pl-9" placeholder="02-xxx-xxxx" />
                                    </div>
                                    <div className="relative">
                                        <p className="text-sm py-2">มีศูนย์รับซ่อมใหม่โปรดติดต่อทีม service pro <span className="text-red-500">*</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: รายละเอียดการส่ง */}
                            <div className="space-y-4 pl-2">
                                <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-4">
                                    <Box size={16} className="text-slate-500" /> รายละเอียดการส่ง
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-500 mb-1.5">วันที่ส่งซ่อม <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input type="date" name="date_sent" value={formData.date_sent} onChange={handleChange} className="input-std pl-9" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-500 mb-1.5">สถานะประกัน <span className="text-red-500">*</span></label>
                                        <select name="warranty_status_claim" value={formData.warranty_status_claim} onChange={handleChange} className="input-std font-medium">
                                            <option value="Out of Warranty">Out of Warranty</option>
                                            <option value="In Warranty">In Warranty</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500 mb-1.5">ชื่อสินค้าเเละอุปกรณ์ที่ส่งไป <span className="text-red-500">*</span></label>
                                    <input type="text" name="items_sent" value={formData.items_sent} onChange={handleChange} className="input-std" placeholder="เช่น ตัวเครื่อง, Adapter" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500 mb-1.5">ลักษณะอาการที่ส่งซ่อม <span className="text-red-500">*</span></label>
                                    <textarea name="remark_send" value={formData.remark_send} onChange={handleChange} rows="2" className="input-std resize-none bg-amber-50/30 border-amber-100" placeholder="อาการเสียที่แจ้งศูนย์..." />
                                </div>
                                {/* 🔴 ช่องกรอกเลขพัสดุ ถูกย้ายมาวางไว้ในฟอร์มอย่างถูกต้องแล้ว */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-500 mb-1.5">เลขพัสดุ / ขนส่ง <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        name="tracking_number" 
                                        value={formData.tracking_number} 
                                        onChange={handleChange} 
                                        className="input-std"
                                        placeholder="เช่น TH0123456789"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer สไตล์เดียวกับ AddJobModal */}
                    <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-400 font-medium hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-xl border border-transparent hover:border-gray-200 transition-all text-sm">ยกเลิก</button>
                        <button type="submit" className="px-8 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95">
                            <Save size={18} /> บันทึกการส่งเคลม
                        </button>
                    </div>

                </form>
            </div>

            <style>{`
                .input-std { 
                    width: 100%; 
                    padding: 0.625rem 0.75rem; 
                    background-color: white; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 0.75rem; 
                    outline: none; 
                    transition: all 0.2s; 
                    font-size: 0.875rem; 
                }
                .input-std:focus { 
                    border-color: #f59e0b; /* Amber 500 */
                    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1); 
                }
            `}</style>
        </div>
    );
}

export default AddClaimModal;