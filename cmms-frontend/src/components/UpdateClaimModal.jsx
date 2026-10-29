import React, { useState, useEffect } from 'react';
import { X, Calendar, Save, UserCheck, Home, Package } from 'lucide-react';
import Swal from 'sweetalert2';

function UpdateClaimModal({ isOpen, onClose, claim, type, onUpdate }) {
    const [date, setDate] = useState('');
    const [returnMethod, setReturnMethod] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [returnSenderName, setReturnSenderName] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [returnRemark, setReturnRemark] = useState('');

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [localClaim, setLocalClaim] = useState(null); 
    
    // 🔴 1. เพิ่ม State เก็บรายชื่อลูกค้า
    const [customerList, setCustomerList] = useState([]);
    const getTodayDate = () => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
    useEffect(() => {
        if (isOpen && claim) {
            // 2. ดึงข้อมูลลูกค้าจาก API ตอนเปิดหน้าต่าง
            const fetchCustomers = async () => {
                try {
                    const API_URL = import.meta.env.VITE_API_URL;
                    const response = await fetch(`${API_URL}/api/sso-customers`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}) 
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

            const openTimer = setTimeout(() => {
                setLocalClaim(claim);
                setDate(getTodayDate());
                setReturnMethod('');
                setCustomerAddress('');
                setReturnSenderName('');
                setCustomerName(''); 
                setReturnRemark(''); 
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
    }, [isOpen, claim]);

    // 🔴 3. ฟังก์ชันจัดการเมื่อพิมพ์/เลือกชื่อลูกค้า
    const handleCustomerChange = (e) => {
        const val = e.target.value;
        setCustomerName(val); // อัปเดตช่องชื่อลูกค้า

        // ค้นหาว่าชื่อที่พิมพ์/เลือก ตรงกับในฐานข้อมูลไหม
        const matchedCustomer = customerList.find(c => c.hospital === val);
        if (matchedCustomer) {
            // ถ้าตรง ให้เอาที่อยู่และจังหวัดมาเติมให้อัตโนมัติ
            setCustomerAddress(`${matchedCustomer.address} จ.${matchedCustomer.province}`);
        }
    };

    if (!isVisible || !localClaim) return null;

    const isReceive = type === 'receive'; 
    const HeaderIcon = isReceive ? Home : UserCheck; 
    const title = isReceive ? 'ยืนยันรับของกลับจากศูนย์' : 'ยืนยันส่งคืนลูกค้า';
    const subtitle = isReceive ? 'บันทึกวันที่ได้รับสินค้ากลับจากศูนย์บริการ' : 'บันทึกข้อมูลการจัดส่งสินค้าคืนให้ลูกค้า';

const handleSubmit = (e) => {
        e.preventDefault();

        // 1. ระบบตรวจสอบข้อมูลบังคับกรอก (Validation)
        const missingFields = [];

        // แยกเช็คตามประเภทของหน้าต่าง (รับของกลับ vs คืนลูกค้า)
        if (isReceive) {
            if (!date) missingFields.push('วันที่ของมาถึงบริษัท');
        } else {
            if (!date) missingFields.push('วันที่ส่งของคืนลูกค้า');
            if (!customerName) missingFields.push('ชื่อลูกค้า');
            if (!returnMethod) missingFields.push('วิธีการส่งคืน');
            if (!returnSenderName) missingFields.push('ชื่อผู้นำไปส่งคืน');
            if (!customerAddress) missingFields.push('ที่อยู่ลูกค้า');
            if (!returnRemark) missingFields.push('หมายเหตุ/ใส่เลขพัสดุ'); // ดักจับช่องหมายเหตุตามรูป
        }

        // ถ้ามีช่องว่าง ให้เด้งแจ้งเตือน (เปลี่ยนสีตามประเภทหน้าต่าง)
        if (missingFields.length > 0) {
            Swal.fire({
                title: 'กรอกข้อมูลไม่ครบถ้วน!',
                html: `
                    <div style="text-align: left; margin-top: 10px;">
                        <span style="color: #64748b; font-size: 14px;">กรุณาระบุข้อมูลในช่องที่มีเครื่องหมายดอกจัน (*) ต่อไปนี้:</span>
                        <div style="background: ${isReceive ? '#ecfdf5' : '#faf5ff'}; padding: 12px; border-radius: 8px; color: ${isReceive ? '#059669' : '#9333ea'}; font-size: 14px; margin-top: 10px; border: 1px solid ${isReceive ? '#a7f3d0' : '#e9d5ff'};">
                            • ${missingFields.join('<br/>• ')}
                        </div>
                    </div>
                `,
                icon: 'warning',
                confirmButtonColor: isReceive ? '#059669' : '#9333ea', // เขียว หรือ ม่วง
                confirmButtonText: 'กลับไปแก้ไข',
                customClass: { popup: 'font-sans' }
            });
            return; 
        }

        // 2. ถ้ากรอกครบ ค่อยเด้งหน้าต่างสรุปข้อมูล
        let summaryHTML = `
            <div style="text-align: left; font-size: 14px; padding: 10px; background: #f8fafc; border-radius: 8px;">
                <p style="margin-bottom: 8px;"><b>หมายเลขงาน:</b> <span style="color: #4f46e5;">${localClaim.job_id}</span></p>
                <p style="margin-bottom: 8px;"><b>วันที่ดำเนินการ:</b> ${date.split('-').reverse().join('/')}</p>
        `;

        if (!isReceive) {
            summaryHTML += `
                <p style="margin-bottom: 8px;"><b>ชื่อลูกค้า:</b> ${customerName}</p>
                <p style="margin-bottom: 8px;"><b>วิธีการจัดส่ง:</b> ${returnMethod}</p>
                <p style="margin-bottom: 8px;"><b>ผู้ไปส่ง:</b> ${returnSenderName}</p>
                <p style="margin-bottom: 8px;"><b>ที่อยู่:</b> ${customerAddress}</p>
                <p style="margin-bottom: 0;"><b>หมายเหตุ/เลขพัสดุ:</b> ${returnRemark || '-'}</p>
            `;
        }
        summaryHTML += `</div>`;

        Swal.fire({
            title: 'ตรวจสอบข้อมูลก่อนบันทึก',
            html: summaryHTML,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isReceive ? '#059669' : '#9333ea', 
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ใช่, บันทึกข้อมูลเลย!',
            cancelButtonText: 'กลับไปแก้ไข',
            customClass: { popup: 'font-sans' }
        }).then((result) => {
            if (result.isConfirmed) {
                const payload = isReceive 
                    ? { date_received_back: date } 
                    : { 
                        date_returned_customer: date,
                        return_method: returnMethod,
                        customer_address: customerAddress,
                        return_sender_name: returnSenderName,
                        customer_name: customerName,
                        return_remark: returnRemark
                    };
                
                onUpdate(localClaim.claim_id, payload);
            }
        });
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            <div 
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
                onClick={onClose}
            ></div>

            <div className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
                
                <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${isReceive ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                                <HeaderIcon size={20} />
                            </div>
                            {title}
                        </h2>
                        <p className="text-slate-500 text-xs mt-1 ml-11">{subtitle}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 text-slate-400 rounded-lg hover:bg-white hover:text-slate-800 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="p-8 bg-slate-50 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                            <p className="text-sm text-slate-500 font-bold mb-1">หมายเลขส่งซ่อม</p>
                            <p className={`text-2xl font-black font-mono tracking-wider ${isReceive ? 'text-emerald-600' : 'text-purple-600'}`}>
                                {localClaim.job_id}
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100 text-sm text-slate-600">
                                <span className="font-medium">
                                    ศูนย์รับซ่อม : {localClaim.service_center_name || 'ไม่ระบุศูนย์'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                {isReceive ? 'วันที่ของมาถึงบริษัท' : 'วันที่ส่งของคืนลูกค้า'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar size={18} className="text-slate-400" />
                                </div>
                                <input 
                                    type="date" 
                                    required
                                    value={date} 
                                    onChange={(e) => setDate(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-slate-700 font-medium shadow-sm"
                                />
                            </div>
                        </div>

                        {!isReceive && (
                            <div className="pt-2 border-t border-gray-200 space-y-4">
                                <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2 mb-4">
                                    <Package size={16} /> ข้อมูลการจัดส่งคืน
                                </h3>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อลูกค้า <span className="text-red-500">*</span></label>
                                    {/* 🔴 4. เพิ่ม list และ datalist ในช่องกรอกชื่อลูกค้า */}
                                    <input 
                                        type="text" 
                                        required
                                        list="customer-list-dropdown"
                                        value={customerName} 
                                        onChange={handleCustomerChange} 
                                        placeholder="พิมพ์เพื่อค้นหาชื่อลูกค้า..." 
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none shadow-sm"
                                    />
                                    <datalist id="customer-list-dropdown">
                                        {customerList.map((cus) => (
                                            <option key={cus._id} value={cus.hospital} />
                                        ))}
                                    </datalist>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">วิธีการส่งคืน <span className="text-red-500">*</span></label>
                                        <select 
                                            required
                                            value={returnMethod} 
                                            onChange={(e) => setReturnMethod(e.target.value)} 
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none shadow-sm font-medium">
                                            <option value="" disabled>เลือกวิธีจัดส่ง...</option>
                                            <option value="ไปรษณีย์ไทย">ไปรษณีย์ไทย</option>
                                            <option value="Flash Express">Flash Express</option>
                                            <option value="Kerry Express">Kerry Express</option>
                                            <option value="J&T Express">J&T Express</option>
                                            <option value="ขนส่งเอกชนอื่นๆ">ขนส่งเอกชนอื่นๆ</option>
                                            <option value="รับด้วยตัวเอง">ลูกค้ามารับด้วยตัวเอง</option>
                                            <option value="พนักงานไปส่งเอง">พนักงานไปส่งเอง</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อผู้นำไปส่งคืน <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required
                                            value={returnSenderName} 
                                            onChange={(e) => setReturnSenderName(e.target.value)} 
                                            placeholder="ระบุชื่อพนักงาน..." 
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">ที่อยู่ลูกค้า <span className="text-red-500">*</span></label>
                                    <textarea 
                                        required
                                        value={customerAddress} 
                                        onChange={(e) => setCustomerAddress(e.target.value)} 
                                        placeholder="ระบบจะดึงที่อยู่ให้อัตโนมัติ หรือกรอกเอง..." 
                                        rows="2"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none resize-none shadow-sm"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">หมายเหตุ/ใส่เลขพัสดุ <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={returnRemark} 
                                        onChange={(e) => setReturnRemark(e.target.value)} 
                                        placeholder="เช่น เลขพัสดุ, แจ้งเพิ่มเติม..." 
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-400 font-medium hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-xl border border-transparent hover:border-gray-200 transition-all text-sm">
                            ยกเลิก
                        </button>
                        <button type="submit" className={`px-8 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95 ${isReceive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                            <Save size={18} /> {isReceive ? 'ยืนยันรับของกลับ' : 'บันทึกการส่งคืน'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UpdateClaimModal;