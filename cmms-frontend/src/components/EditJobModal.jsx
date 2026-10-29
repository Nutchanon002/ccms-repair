import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Wrench, User, Monitor, ShieldCheck, Tag } from 'lucide-react';
import Swal from 'sweetalert2';

function EditJobModal({ isOpen, onClose, jobData, onSuccess }) {
    const [formData, setFormData] = useState({
        customer_name: '', contact_person: '', phone: '',
        product_type: '', model: '', serial: '', expert_serial_number: '', device_details: '',
        warranty_start_date: '', warranty_months: '', warranty_end_date: '', warranty_details: '',
        symptom: '', accessories: '', extra_notes: ''
    });

    const [isAnimating, setIsAnimating] = useState(false);

    // ฟังก์ชันแปลงรูปแบบวันที่ให้เข้ากับช่อง input type="date"
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    // ดึงข้อมูลเก่ามาใส่ในช่องกรอก
    useEffect(() => {
        if (isOpen && jobData) {
            const timer = setTimeout(() => {
                setFormData({
                    customer_name: jobData.customer_name || '',
                    contact_person: jobData.contact_person || '',
                    phone: jobData.phone_number || '', // เบอร์โทร
                    
                    product_type: jobData.product_type || '',
                    model: jobData.model_name || '',
                    serial: jobData.serial_number || '',
                    expert_serial_number: jobData.expert_serial_number || '',
                    device_details: jobData.device_details || '',

                    warranty_start_date: formatDateForInput(jobData.warranty_start_date),
                    warranty_months: jobData.warranty_months || '',
                    warranty_end_date: formatDateForInput(jobData.warranty_end_date),
                    warranty_details: jobData.warranty_details || '',

                    symptom: jobData.symptom || '',
                    accessories: jobData.accessories || '',
                    extra_notes: jobData.extra_notes || ''
                });
                setIsAnimating(true);
                document.body.style.overflow = 'hidden';
            }, 0);
            return () => clearTimeout(timer);
        } else {
            const closeTimer = setTimeout(() => setIsAnimating(false), 0);
            setTimeout(() => { document.body.style.overflow = 'unset'; }, 300);
            return () => clearTimeout(closeTimer);
        }
    }, [isOpen, jobData]);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(onClose, 300);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // คำนวณวันหมดประกันอัตโนมัติถ้ามีการแก้ข้อมูล
    const handleWarrantyCalc = (e) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };
        if (name === 'warranty_start_date' || name === 'warranty_months') {
            const start = new Date(newFormData.warranty_start_date);
            const months = parseInt(newFormData.warranty_months);
            if (!isNaN(start.getTime()) && !isNaN(months)) {
                const end = new Date(start);
                end.setMonth(end.getMonth() + months);
                newFormData.warranty_end_date = end.toISOString().split('T')[0];
            }
        }
        setFormData(newFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        Swal.fire({
            title: 'ยืนยันการแก้ไขข้อมูล?',
            text: "คุณตรวจสอบข้อมูลครบถ้วนแล้วใช่หรือไม่?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ใช่, บันทึกเลย!',
            cancelButtonText: 'ยกเลิก',
            scrollbarPadding: false,
            customClass: { popup: 'font-sans' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const localUser = JSON.parse(localStorage.getItem('cmms_user'));
                    const dataToSend = {
                        ...formData,
                        performed_by: localUser?.fullName || 'พนักงาน (ไม่ระบุตัวตน)'
                    };

                    const API_URL = import.meta.env.VITE_API_URL;
                    const response = await fetch(`${API_URL}/api/jobs/edit/${jobData.job_id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSend) 
                    });

                    if (response.ok) {
                        onClose(); 
                        
                        Swal.fire({
                            title: 'สำเร็จ!',
                            text: 'แก้ไขข้อมูลเรียบร้อยแล้ว',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        });
                        
                        onSuccess(); // รีเฟรชตาราง
                    } else {
                        const errData = await response.json();
                        Swal.fire('ผิดพลาด', errData.error || 'อัปเดตไม่สำเร็จ', 'error');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error');
                }
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose}></div>

            <div className={`relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 flex flex-col max-h-[90vh] ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
                
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Edit size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">แก้ไขข้อมูลรับงานซ่อม</h2>
                            <p className="text-slate-500 text-sm">JOB ID : <span className="font-bold text-blue-600">{jobData?.job_id}</span></p>
                        </div>
                    </div>
                    <button type="button" onClick={handleClose} className="p-2 text-slate-400 rounded-lg hover:bg-white hover:text-slate-800 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="overflow-y-auto p-6 bg-slate-50 flex-1 custom-scrollbar">
                    <form id="editJobForm" onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* ข้อมูลลูกค้า */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2 border-b border-gray-100 pb-2">
                                <User size={16} /> ข้อมูลลูกค้า
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">โรงพยาบาล/ดีลเลอร์</label>
                                    <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ผู้ส่งเครื่องมาซ่อม</label>
                                    <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* ข้อมูลอุปกรณ์ */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2 border-b border-gray-100 pb-2">
                                <Monitor size={16} /> รายละเอียดเครื่อง
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">รายการ / ชื่อสินค้า</label>
                                    <input type="text" name="product_type" value={formData.product_type} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">รุ่น (Model)</label>
                                    <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">รายละเอียดเครื่อง (สี,ปีผลิต)</label>
                                    <input type="text" name="device_details" value={formData.device_details} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-indigo-700 mb-1.5 flex items-center gap-1"><Tag size={12}/> Serial Number (ตัวเครื่อง)</label>
                                    <input type="text" name="serial" value={formData.serial} onChange={handleChange} className="w-full px-4 py-2.5 border border-indigo-200 bg-indigo-50/30 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono font-bold text-indigo-800" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-indigo-700 mb-1.5 flex items-center gap-1"><Tag size={12}/> Serial Number / EXPERT</label>
                                    <input type="text" name="expert_serial_number" value={formData.expert_serial_number} onChange={handleChange} className="w-full px-4 py-2.5 border border-indigo-200 bg-indigo-50/30 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono font-bold text-indigo-800" />
                                </div>
                            </div>
                        </div>

                        {/* ข้อมูลประกัน */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2 border-b border-gray-100 pb-2">
                                <ShieldCheck size={16} /> ข้อมูลการรับประกัน
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่เริ่มรับประกัน</label>
                                    <input type="date" name="warranty_start_date" value={formData.warranty_start_date} onChange={handleWarrantyCalc} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">วันสิ้นสุดการรับประกัน</label>
                                    <input type="date" name="warranty_end_date" value={formData.warranty_end_date} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 text-red-600 font-bold" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">รายละเอียด/เงื่อนไขเพิ่มเติม</label>
                                <input type="text" name="warranty_details" value={formData.warranty_details} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-emerald-50/50 text-emerald-700" placeholder="เช่น นอกประกัน, อยู่ในประกัน" />
                            </div>
                        </div>

                        {/* ข้อมูลอาการเสีย */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2 border-b border-gray-100 pb-2">
                                <Wrench size={16} /> ลักษณะอาการเสียเเละการรับของ
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">ลักษณะอาการที่ส่งซ่อม</label>
                                <textarea name="symptom" rows="3" value={formData.symptom} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" required></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">อุปกรณ์ที่รับมาด้วย</label>
                                <input type="text" name="accessories" value={formData.accessories} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="เช่น สายไฟ, Adapter" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">หมายเหตุเพิ่มเติม</label>
                                <input type="text" name="extra_notes" value={formData.extra_notes} onChange={handleChange} className="w-full px-4 py-2.5 border border-yellow-200 bg-yellow-50 text-yellow-800 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-sm" />
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <button type="button" onClick={handleClose} className="px-6 py-2.5 text-slate-400 font-medium hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-xl border border-transparent hover:border-gray-200 transition-all text-sm">
                        ยกเลิก
                    </button>
                    <button type="submit" form="editJobForm" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all flex items-center gap-2 active:scale-95">
                        <Save size={18} /> บันทึกการแก้ไข
                    </button>
                </div>

            </div>
        </div>
    );
}

export default EditJobModal;