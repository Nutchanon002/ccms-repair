import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Truck, Package } from 'lucide-react';
import Swal from 'sweetalert2';

function EditClaimModal({ isOpen, onClose, claimData, onSuccess }) {
    const [formData, setFormData] = useState({
        service_center_address: '',
        remark_send: '',
        return_method: '',
        return_sender_name: '',
        customer_address: ''
    });

    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen && claimData) {
            const timer = setTimeout(() => {
                setFormData({
                    service_center_address: claimData.service_center_address || '',
                    remark_send: claimData.remark_send || '',
                    return_method: claimData.return_method || '',
                    return_sender_name: claimData.return_sender_name || '',
                    customer_address: claimData.customer_address || ''
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
    }, [isOpen, claimData]);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(onClose, 300);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

const handleSubmit = async (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'ยืนยันการแก้ไขข้อมูล?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ใช่, บันทึกเลย',
            cancelButtonText: 'ยกเลิก',
            scrollbarPadding: false 
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const localUser = JSON.parse(localStorage.getItem('cmms_user'));
                    const dataToSend = {
                        ...formData,
                        performed_by: localUser?.fullName || 'พนักงาน (ไม่ระบุตัวตน)'
                    };

                    const API_URL = import.meta.env.VITE_API_URL;
                    const response = await fetch(`${API_URL}/api/claims/edit/${claimData.claim_id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSend) 
                    });
                    
                    if (response.ok) {
                        // 1. โชว์แจ้งเตือนสำเร็จแบบตั้งเวลาปิดเอง
                        Swal.fire({
                            title: 'สำเร็จ!',
                            text: 'แก้ไขข้อมูลเคลมเรียบร้อย',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false,
                            scrollbarPadding: false 
                        });
                        handleClose();
                        setTimeout(() => {
                            onSuccess();
                        }, 300);
                        
                    } else {
                        Swal.fire({ title: 'ผิดพลาด', text: 'อัปเดตไม่สำเร็จ', icon: 'error', scrollbarPadding: false });
                    }
                } catch (error) {
                    console.error(error);
                    Swal.fire({ title: 'ผิดพลาด', text: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', icon: 'error', scrollbarPadding: false });
                }
            }
        });
    };

    // เช็คว่ามีข้อมูลรับกลับ/คืนลูกค้าหรือยัง เพื่อโชว์ฟอร์มที่อยู่ลูกค้า
    const hasReturnData = claimData.date_returned_customer !== null && claimData.date_returned_customer !== undefined;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose}></div>
            <div className={`relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 flex flex-col max-h-[90vh] ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
                
                <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Edit size={20} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">แก้ไขข้อมูลการส่งเคลม</h2>
                            <p className="text-slate-500 text-sm">JOB ID: <span className="font-bold text-blue-600">{claimData?.job_id}</span></p>
                        </div>
                    </div>
                    <button type="button" onClick={handleClose} className="p-2 text-slate-400 rounded-lg hover:bg-white hover:text-slate-800 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"><X size={24} /></button>
                </div>

                <div className="overflow-y-auto p-6 bg-slate-50 flex-1 custom-scrollbar">
                    <form id="editClaimForm" onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2 border-b border-gray-100 pb-2"><Truck size={16} /> ข้อมูลศูนย์รับซ่อม</h3>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">ที่อยู่ศูนย์รับซ่อม</label>
                                <textarea name="service_center_address" rows="2" value={formData.service_center_address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">ลักษณะอาการที่แจ้งศูนย์ / หมายเหตุ</label>
                                <input type="text" name="remark_send" value={formData.remark_send} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>

                        {hasReturnData && (
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-purple-700 flex items-center gap-2 border-b border-gray-100 pb-2"><Package size={16} /> ข้อมูลการจัดส่งคืนลูกค้า</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">วิธีการส่งคืน</label>
                                        <input type="text" name="return_method" value={formData.return_method} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อผู้นำไปส่ง</label>
                                        <input type="text" name="return_sender_name" value={formData.return_sender_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">ที่อยู่จัดส่งลูกค้า</label>
                                    <textarea name="customer_address" rows="2" value={formData.customer_address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <button type="button" onClick={handleClose} className="px-6 py-2.5 text-slate-400 font-medium hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-xl border border-transparent hover:border-gray-200 transition-all text-sm">ยกเลิก</button>
                    <button type="submit" form="editClaimForm" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all flex items-center gap-2 active:scale-95"><Save size={18} /> บันทึกการแก้ไข</button>
                </div>
            </div>
        </div>
    );
}

export default EditClaimModal;