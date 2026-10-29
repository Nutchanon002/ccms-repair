import { useState, useEffect } from 'react';
import { X, Printer, FileText, User, Tag, List } from 'lucide-react';

function PrintJobModal({ isOpen, onClose, job }) {
    // 1. State สำหรับ Animation
    const [isAnimating, setIsAnimating] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // 2. State สำหรับข้อมูลในฟอร์ม (Lazy Init)
    const [formData, setFormData] = useState(() => {
        if (!job) return {};
        return {
            job_id: job.job_id,
            date: new Date(job.date_received).toLocaleDateString('th-TH'),
            customer_name: job.customer_name,
            address: job.address || '-',
            contact: `${job.contact_person} (${job.phone_number})`,
            model: job.model_name,
            serial: job.serial_number,
            asset_id: '',
            symptom: job.symptom,
            technician: '',
            action_taken: '',
            accessories: job.accessories || '-',
            is_receive: job.status !== 'Done',
            job_type: 'repair',
            is_warranty: new Date(job.warranty_end_date) > new Date()
        };
    });

    // 3. ✅ แก้ไข Effect: ย้าย setIsVisible เข้าไปใน setTimeout เพื่อแก้ ESLint Warning
    useEffect(() => {
        if (isOpen && job) {
            // รอ 10ms ให้ Browser เตรียมตัวก่อน แล้วค่อยสั่งแสดง + เล่น Animation
            const timer = setTimeout(() => {
                setIsVisible(true);   // แสดงผล (Latch state)
                setIsAnimating(true); // เริ่ม Fade In
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [isOpen, job]);

    // 4. ฟังก์ชันปิดแบบสมูท (Fade Out)
    const handleClose = () => {
        setIsAnimating(false); // เริ่ม Animation ขาออก (Fade Out)
        
        // รอ 300ms ให้ Animation จบ แล้วค่อยปิดจริง
        setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, 300);
    };

    // ถ้าไม่มีข้อมูล หรือไม่ได้สั่งเปิด (และ Animation จบแล้ว) ให้ไม่แสดงผล
    if (!job || (!isOpen && !isVisible)) return null;

    const handlePrint = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL;
            const response = await fetch(`${API_URL}/api/print-job`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
                handleClose(); // ปิดแบบสมูทหลังพิมพ์เสร็จ
            } else {
                alert('เกิดข้อผิดพลาดในการสร้าง PDF');
            }
        } catch (error) {
            console.error(error);
            alert('เชื่อมต่อ Server ไม่ได้');
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            ></div>
            
            {/* Modal Content */}
            <div 
                className={`relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
            >
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Printer size={20} /> เตรียมพิมพ์ใบรับ/ส่งสินค้า
                    </h2>
                    <button onClick={handleClose} className="hover:bg-slate-700 p-1 rounded-full transition"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* ... (เนื้อหาฟอร์มเหมือนเดิมทุกอย่างครับ) ... */}
                    
                    {/* ส่วนหัว */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="is_receive" checked={formData.is_receive} onChange={() => setFormData({...formData, is_receive: true})} className="w-5 h-5 text-blue-600"/>
                                <span className="font-bold text-slate-700">รับสินค้า</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="is_receive" checked={!formData.is_receive} onChange={() => setFormData({...formData, is_receive: false})} className="w-5 h-5 text-green-600"/>
                                <span className="font-bold text-slate-700">ส่งสินค้า</span>
                            </label>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <User size={12}/> ชื่อช่าง (Technician)
                            </label>
                            <input name="technician" value={formData.technician} onChange={handleChange} className="w-full p-2 border rounded-lg bg-yellow-50" placeholder="ระบุชื่อช่าง..." />
                        </div>
                    </div>

                    {/* ข้อมูลทั่วไป */}
                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">เลขที่ใบงาน (Ref.)</label>
                            <input name="job_id" value={formData.job_id} onChange={handleChange} className="w-full p-2 border rounded-lg font-mono bg-gray-100" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">วันที่</label>
                            <input name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                             <label className="text-xs font-bold text-slate-500 uppercase">ข้อมูลลูกค้า</label>
                             <input name="customer_name" value={formData.customer_name} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="ชื่อลูกค้า" />
                             <input name="contact" value={formData.contact} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="ผู้ติดต่อ" />
                             <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded-lg resize-none" placeholder="ที่อยู่"></textarea>
                        </div>
                        <div className="space-y-3">
                             <label className="text-xs font-bold text-slate-500 uppercase">ประเภทงาน & สถานะ</label>
                             <div className="flex gap-4 mb-2">
                                <label className="flex items-center gap-2"><input type="radio" name="job_type" value="repair" checked={formData.job_type === 'repair'} onChange={handleChange} /> ซ่อมเครื่อง</label>
                                <label className="flex items-center gap-2"><input type="radio" name="job_type" value="other" checked={formData.job_type === 'other'} onChange={handleChange} /> อื่นๆ</label>
                             </div>
                             <div className="flex items-center gap-2">
                                <input type="checkbox" name="is_warranty" checked={formData.is_warranty} onChange={handleChange} className="w-4 h-4" />
                                <span className="text-sm">อยู่ในประกัน (Warranty)</span>
                             </div>
                        </div>
                    </div>

                    {/* รายละเอียดเครื่อง และ อาการ */}
                    <div className="pt-4 border-t">
                        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Tag size={16}/> รายละเอียดอุปกรณ์</h3>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <input name="model" value={formData.model} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="รุ่น (Model)" />
                            <input name="serial" value={formData.serial} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="Serial No." />
                            <input name="asset_id" value={formData.asset_id} onChange={handleChange} className="w-full p-2 border rounded-lg bg-yellow-50" placeholder="รหัสครุภัณฑ์" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">อาการเสีย</label>
                                <textarea name="symptom" rows="4" value={formData.symptom} onChange={handleChange} className="w-full p-2 border rounded-lg resize-none"></textarea>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><List size={12}/> รายการดำเนินการ (Action Taken)</label>
                                <textarea name="action_taken" rows="4" value={formData.action_taken} onChange={handleChange} className="w-full p-2 border rounded-lg resize-none bg-yellow-50" placeholder="1. เปลี่ยนอะไหล่...&#10;2. ทำความสะอาด..."></textarea>
                            </div>
                        </div>
                    </div>

                    {/* อุปกรณ์ประกอบ */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">อุปกรณ์ประกอบ (Accessories)</label>
                        <input name="accessories" value={formData.accessories} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={handleClose} className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg transition">ยกเลิก</button>
                    <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 flex items-center gap-2">
                        <FileText size={18} /> ยืนยันพิมพ์เอกสาร
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PrintJobModal;