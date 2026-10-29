import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, AlertCircle, ShoppingBasket, User } from 'lucide-react';
import Swal from 'sweetalert2';

function ApprovalModal({ isOpen, onClose, pendingJobs, onApprove }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const openTimer = setTimeout(() => {
                setIsVisible(true);
                document.body.style.overflow = 'hidden'; 
                setTimeout(() => setIsAnimating(true), 20);
            }, 0);
            return () => { clearTimeout(openTimer); document.body.style.overflow = 'unset'; };
        } else {
            const closeTimer = setTimeout(() => {
                setIsAnimating(false);
                document.body.style.overflow = 'unset';
                setTimeout(() => setIsVisible(false), 300);
            }, 0);
            return () => { clearTimeout(closeTimer); document.body.style.overflow = 'unset'; };
        }
    }, [isOpen]);

    // ✅ ฟังก์ชันแปลง วันที่+เวลา ให้อ่านง่าย (เช่น 25 ก.พ. 69 เวลา 14:30 น.)
    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { 
            year: '2-digit', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) + ' น.';
    };

    // ฟังก์ชันดักการกดปุ่มอนุมัติ เพื่อโชว์ทวนข้อมูลก่อน
    const handleApproveClick = (job) => {
        let summaryHTML = `
            <div style="text-align: left; font-size: 14px; padding: 15px; background: #eff6ff; border-radius: 8px; margin-top: 10px;">
                <p style="margin-bottom: 8px;"><b>หมายเลขงาน:</b> <span style="color: #2563eb; font-family: monospace; font-size: 16px;">${job.job_id}</span></p>
                <p style="margin-bottom: 8px;"><b>ลูกค้า/ดีลเลอร์:</b> ${job.customer_name}</p>
                <p style="margin-bottom: 8px;"><b>ผู้ส่งเครื่อง:</b> ${job.contact_person || '-'}</p>
                <hr style="margin: 10px 0; border-color: #bfdbfe;"/>
                <p style="margin-bottom: 0; color: #dc2626;"><b>อาการเสีย:</b> ${job.symptom || '-'}</p>
            </div>
        `;

        Swal.fire({
            title: 'ยืนยันรับงานเข้าระบบ',
            html: summaryHTML,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb', // สีฟ้า
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ใช่, อนุมัติรับงาน!',
            cancelButtonText: 'ยกเลิก',
            customClass: { popup: 'font-sans' }
        }).then((result) => {
            if (result.isConfirmed) {
                onApprove(job); // ถ้ายืนยัน ให้ส่ง job กลับไปให้หน้าหลักทำงานต่อ
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

            <div className={`relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 flex flex-col max-h-[85vh] ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
                
                {/* Header */}
                <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                <ShoppingBasket size={20} />
                            </div>
                            ตะกร้ารอรับงาน ({pendingJobs.length})
                        </h2>
                        <p className="text-slate-500 text-sm mt-1 ml-11">รายการงานซ่อมที่รอตรวจสอบเพื่อรับเข้าระบบ</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 rounded-full hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-xl border border-transparent hover:border-gray-200 transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
                    {pendingJobs.length > 0 ? (
                        <div className="space-y-4">
                            {pendingJobs.map(job => (
                                <div key={job.job_id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-orange-300 transition-colors">
                                    
                                    <div className="space-y-2.5 flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md text-sm border border-orange-100">
                                                {job.job_id}
                                            </span>
                                            <span className="text-sm font-bold text-slate-700">{job.customer_name}</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 mt-2 min-w-0">

                                            {/* แถวบน: ผู้ส่งฟอร์ม + บันทึกเมื่อ */}
                                            <div className="text-sm text-slate-600 flex items-center gap-2 min-w-0">
                                                <User size={15} className="text-slate-400 shrink-0" /> 
                                                <span className="truncate">ผู้ส่งฟอร์ม : <span className="font-medium text-slate-800">{job.contact_person || 'ไม่ระบุ'}</span></span>
                                            </div>

                                            <div className="text-xs text-slate-500 flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 min-w-0">
                                                <Clock size={13} className="text-orange-400 shrink-0" /> 
                                                <span className="truncate">บันทึกเมื่อ : <span className="font-bold text-slate-700">{formatDateTime(job.date_received)}</span></span>
                                            </div>

                                            {/* แถวล่าง: อาการ เต็มความกว้าง */}
                                            <div className="col-span-5 text-sm text-slate-600 flex items-start gap-2 min-w-0">
                                                <AlertCircle size={15} className="text-slate-400 shrink-0 mt-0.5" /> 
                                                <span className="min-w-0 flex-1 line-clamp-5" style={{ overflowWrap: 'break-word' }}>
                                                    อาการ : <span className="font-medium text-slate-800">{job.symptom}</span>
                                                </span>
                                            </div>
                                        </div>                                    
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleApproveClick(job)}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap h-fit"
                                    >
                                        <CheckCircle size={18} /> อนุมัติรับงานเข้า
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <ShoppingBasket size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-bold text-slate-500">ไม่มีรายการรอดำเนินการ</p>
                            <p className="text-sm mt-1">ตะกร้างานว่างเปล่าในขณะนี้</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ApprovalModal;