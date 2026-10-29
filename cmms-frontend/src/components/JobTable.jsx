import React, { useEffect, useState, useCallback } from 'react';
import { Search,Filter, CheckCircle, AlertCircle, ChevronDown, Truck, Camera, ImageIcon, User, UserCheck, PlayCircle, ShoppingBasket, Edit, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import AddJobModal from './AddJobModal';
import AddClaimModal from './AddClaimModal'; 
import PrintJobModal from './PrintJobModal'; 
import UpdateClaimModal from './UpdateClaimModal'; 
import ApprovalModal from './ApprovalModal'; 
import DashboardStats from './DashboardStats';
import logoImage from '../assets/logo.png'; 
import Swal from 'sweetalert2';
import EditJobModal from './EditJobModal';
import EditClaimModal from './EditClaimModal';
import { History } from 'lucide-react';

function JobTable({ onViewLogs, onViewAnalytics, currentUser }) {
    const [jobs, setJobs] = useState([]);
    const [claims, setClaims] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All'); 
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30; 

    const API_URL = import.meta.env.VITE_API_URL;
    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);           
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false); 
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);          
    const [printJob, setPrintJob] = useState(null);
    
    const [jobToClaim, setJobToClaim] = useState(null);
    const [selectedClaim, setSelectedClaim] = useState(null); 
    const [claimActionType, setClaimActionType] = useState('');
    const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false); 
    const [isEditClaimModalOpen, setIsEditClaimModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [resJobs, resClaims] = await Promise.all([
                fetch(`${API_URL}/api/jobs`),
                fetch(`${API_URL}/api/claims`)
            ]);

            if (resJobs.ok) setJobs(await resJobs.json());
            if (resClaims.ok) setClaims(await resClaims.json());
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [API_URL]); 

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        const isAnyModalOpen = 
            isModalOpen || 
            isClaimModalOpen || 
            isApprovalModalOpen || 
            !!printJob || 
            !!selectedClaim || 
            isEditJobModalOpen || 
            isEditClaimModalOpen;

        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden'; 
            document.body.style.paddingRight = '8px'; // กันจอกระตุก
        } else {
            // คืนค่าให้กลับมาเลื่อนได้ปกติ
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            document.body.style.paddingRight = '0px';
        }

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            document.body.style.paddingRight = '0px';
        };
    }, [isModalOpen, isClaimModalOpen, isApprovalModalOpen, printJob, selectedClaim, isEditJobModalOpen, isEditClaimModalOpen]);
    // ============================================================
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const getDaysElapsed = (dateStr) => {
        if (!dateStr) return 0;
        const receivedDate = new Date(dateStr);
        const today = new Date();
        receivedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - receivedDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; 
        return diffDays > 0 ? diffDays : 1; 
    };

    const renderMedia = (fileNameStr) => {
        if (!fileNameStr) return <div className="flex items-center justify-center text-slate-300"><Camera size={18} /></div>;
        const files = fileNameStr.split(',');
        const firstFile = files[0]; 
        const extraCount = files.length - 1;

        const url = `${API_URL}/uploads/${firstFile}`;
        const isVideo = firstFile.match(/\.(mp4|webm|ogg|mov)$/i);

        return (
            <div 
                onClick={(e) => { e.stopPropagation(); window.open(url, '_blank'); }}
                className="w-16 h-16 mx-auto rounded-md border border-slate-200 p-0.5 bg-white shadow-sm hover:scale-110 transition-transform cursor-pointer overflow-hidden relative group flex items-center justify-center">
                {isVideo ? (
                    <>
                        <video src={url} className="w-full h-full object-cover rounded-sm opacity-80" />
                        <PlayCircle size={20} className="absolute text-slate-700/80 group-hover:text-blue-500 drop-shadow-md" />
                    </>
                ) : (
                    <img src={url} alt="Job" className="w-full h-full object-cover rounded-sm" onError={(e) => { e.target.style.display = 'none'; }} />
                )}
                {extraCount > 0 && (
                    <div className="absolute bottom-0 right-0 bg-neutral-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-md rounded-br-sm backdrop-blur-sm">
                        +{extraCount}
                    </div>
                )}
            </div>
        );
    };

    const handleSaveJob = async (formData) => {
        try {
            
            formData.append('performed_by', currentUser?.fullName || 'พนักงาน (ไม่ระบุตัวตน)');

            const response = await fetch(`${API_URL}/api/jobs`, { method: 'POST', body: formData });
            if (response.ok) { 
                Swal.fire({ title: 'รับงานสำเร็จ!', text: 'ข้อมูลเข้าตะกร้ารออนุมัติแล้ว', icon: 'success', timer: 1500, showConfirmButton: false });
                setIsModalOpen(false); 
                fetchData(); 
            } 
            else { 
                const errData = await response.json(); 
                Swal.fire('ผิดพลาด', errData.error || 'ไม่สามารถบันทึกได้', 'error');
            }
        } catch (error) { console.error(error); Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error'); }
    };

    const handleApproveJob = async (job) => {
            try {
            const response = await fetch(`${API_URL}/api/jobs/${job.job_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: 'New',
                    performed_by: currentUser?.fullName || 'พนักงาน (ไม่ระบุตัวตน)' 
                }) 
            });
            if (response.ok) {
                Swal.fire({ title: 'อนุมัติสำเร็จ!', text: `รับงาน ${job.job_id} เข้าสู่ระบบเรียบร้อย`, icon: 'success', timer: 1500, showConfirmButton: false });
                fetchData(); 
                if (pendingJobs.length <= 1) setIsApprovalModalOpen(false); 
            } else { Swal.fire('ผิดพลาด', 'อนุมัติไม่สำเร็จ', 'error'); }
        } catch (error) { console.error(error); Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error'); }
    };

    const handleSaveClaim = async (newClaimData) => {
            try {
            const dataToSend = {
                ...newClaimData,
                performed_by: currentUser?.fullName || 'พนักงาน (ไม่ระบุตัวตน)'
            };

            const response = await fetch(`${API_URL}/api/claims`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(dataToSend) 
            });
            if (response.ok) { 
                Swal.fire({ title: 'ส่งเคลมสำเร็จ!', text: 'งานถูกย้ายสถานะแล้ว', icon: 'success', timer: 1500, showConfirmButton: false });
                setIsClaimModalOpen(false); 
                setJobToClaim(null); 
                fetchData(); 
            }
            else { const errData = await response.json(); Swal.fire('ผิดพลาด', errData.error, 'error'); }
        } catch (error) { console.error(error); Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error'); }
    };

    const handleUpdateClaimStatus = async (claimId, updateData) => {
            try {
            const dataToSend = {
                ...updateData,
                performed_by: currentUser?.fullName || 'พนักงาน (ไม่ระบุตัวตน)'
            };

            const response = await fetch(`${API_URL}/api/claims/${claimId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(dataToSend) 
            });
            if (response.ok) { 
                Swal.fire({ title: 'บันทึกสำเร็จ!', text: 'อัปเดตสถานะเรียบร้อย!', icon: 'success', timer: 1500, showConfirmButton: false });
                setSelectedClaim(null); 
                fetchData(); 
            } 
            else { Swal.fire('ผิดพลาด', 'อัปเดตไม่สำเร็จ', 'error'); }
        } catch (error) { console.error(error); Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error'); }
    };

    const toggleRow = (id) => { setExpandedRow(expandedRow === id ? null : id); };

    const pendingJobs = jobs.filter(j => j.status === 'Pending');

    // ==========================================
    // ระบบ Filter ค้นหา & กรอง 5 สถานะ
    // ==========================================
    const getFilteredData = () => {
        const lowerTerm = searchTerm.toLowerCase();
        let activeJobs = jobs.filter(j => j.status !== 'Pending');

        return activeJobs.filter(j => {
            const c = claims.find(claim => claim.job_id === j.job_id) || {};

            // คำนวณ "สถานะที่แท้จริง" (Effective Status)
            let currentStatus = 'New'; 
            
            // ลำดับ 1: ถ้างานนี้มีประวัติส่งเคลม ให้ยึดวันที่เคลมเป็นหลัก!
            if (c.claim_id) {
                if (c.date_returned_customer) {
                    currentStatus = 'Returned'; // 4. ส่งคืนลูกค้า
                } else if (c.date_received_back) {
                    if (c.is_return_failed) {
                        currentStatus = 'ReturnFailed'; // 3.5 ตีกลับ (รอส่งคืน)
                    } else {
                        currentStatus = 'Received'; // 3. รับกลับอยู่ที่บริษัทเเล้ว
                    }
                } else {
                    currentStatus = 'Claimed';  // 2. ส่งเคลมศูนย์
                }
            }
            // ลำดับ 2: ถ้าไม่ได้อยู่ในกระบวนการเคลม ค่อยดูสถานะในตารางหลัก
            else {
                if (j.status === 'ClaimFailed') {
                    currentStatus = 'ClaimFailed'; // 5. ส่งเคลมไม่สำเร็จ
                } else if (j.status === 'Returned') {
                    currentStatus = 'Returned'; // 4. ส่งคืนลูกค้า (กรณีไม่ส่งเคลม)
                } else {
                    currentStatus = 'New'; // 1. รับเครื่องมารอซ่อม
                }
            }

            // กรองตาม Dropdown สถานะ
            if (statusFilter !== 'All' && currentStatus !== statusFilter) {
                return false; 
            }

            // 🔍 กรองตามคำค้นหา (Super Search)
            return (
                (j.job_id && j.job_id.toLowerCase().includes(lowerTerm)) || 
                (j.customer_name && j.customer_name.toLowerCase().includes(lowerTerm)) ||
                (j.contact_person && j.contact_person.toLowerCase().includes(lowerTerm)) ||
                (j.product_type && j.product_type.toLowerCase().includes(lowerTerm)) ||
                (j.expert_serial_number && j.expert_serial_number.toLowerCase().includes(lowerTerm)) ||
                (j.serial_number && j.serial_number.toLowerCase().includes(lowerTerm)) ||
                (j.model_name && j.model_name.toLowerCase().includes(lowerTerm)) ||
                (j.symptom && j.symptom.toLowerCase().includes(lowerTerm)) ||      
                (j.device_details && j.device_details.toLowerCase().includes(lowerTerm)) ||
                (j.extra_notes && j.extra_notes.toLowerCase().includes(lowerTerm)) ||      
                (c.service_center_name && c.service_center_name.toLowerCase().includes(lowerTerm)) || 
                (c.sender_name && c.sender_name.toLowerCase().includes(lowerTerm)) ||                 
                (c.return_sender_name && c.return_sender_name.toLowerCase().includes(lowerTerm))      
            );
        }).sort((a, b) => b.job_id.localeCompare(a.job_id));
    };

    const filteredData = getFilteredData();
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

const handleDeleteJob = async (jobId) => {
        Swal.fire({
            title: 'ยืนยันการลบข้อมูล?', 
            text: "หากลบแล้ว จะไม่สามารถกู้คืนได้!", 
            icon: 'warning',
            showCancelButton: true, 
            confirmButtonColor: '#ef4444', 
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ใช่, ลบเลย!', 
            cancelButtonText: 'ยกเลิก', 
            scrollbarPadding: false, 
            customClass: { popup: 'font-sans' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ performed_by: currentUser?.fullName || 'พนักงาน (ไม่ระบุตัวตน)' })
                    });
                    
                    if (response.ok) {
                        Swal.fire({ title: 'ลบสำเร็จ!', text: 'ข้อมูลถูกลบออกจากระบบแล้ว', icon: 'success', timer: 1500, showConfirmButton: false, scrollbarPadding: false });
                        fetchData(); 
                    } else { 
                        Swal.fire({ title: 'ผิดพลาด', text: 'ลบข้อมูลไม่สำเร็จ', icon: 'error', scrollbarPadding: false }); 
                    }
                } catch (error) { 
                    console.error(error); 
                    Swal.fire({ title: 'ผิดพลาด', text: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', icon: 'error', scrollbarPadding: false }); 
                }
            }
        });
    };

    const handleRevertToNew = async (jobId) => {
        Swal.fire({
            title: 'ซ่อม/เคลม ไม่สำเร็จ?', text: "ระบบจะเปลี่ยนสถานะเป็น 'รอส่งเคลมใหม่อีกครั้ง' และล้างประวัติการเคลมรอบนี้ทิ้ง", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#f59e0b', cancelButtonColor: '#94a3b8',
            confirmButtonText: 'นำของกลับไปรอส่งเคลมอีกครั้ง', cancelButtonText: 'ยกเลิก', scrollbarPadding: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ 
                            status: 'ClaimFailed',
                            performed_by: currentUser?.fullName || 'พนักงาน (ไม่ระบุตัวตน)' 
                        }) 
                    });
                    if (response.ok) {
                        Swal.fire({ title: 'สำเร็จ!', text: 'ย้อนสถานะกลับเรียบร้อย', icon: 'success', timer: 1500, showConfirmButton: false, scrollbarPadding: false });
                        fetchData(); 
                    } else { Swal.fire({ title: 'ผิดพลาด', text: 'อัปเดตไม่สำเร็จ', icon: 'error', scrollbarPadding: false }); }
                } catch (error) { console.error(error); Swal.fire({ title: 'ผิดพลาด', text: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', icon: 'error', scrollbarPadding: false }); }
            }
        });
    };

    const handleRevertReturn = async (claimId) => {
        Swal.fire({
            title: 'ส่งคืนลูกค้าไม่สำเร็จ?',
            text: "ของตีกลับบริษัท ระบบจะลบประวัติการส่งรอบนี้ และเปลี่ยนสถานะกลับเป็น 'รับกลับอยู่ที่บริษัทแล้ว' (รอส่งใหม่)",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b', // สีส้ม
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ใช่, ของตีกลับ',
            cancelButtonText: 'ยกเลิก',
            scrollbarPadding: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${API_URL}/api/claims/revert-return/${claimId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ performed_by: currentUser?.fullName || 'พนักงาน (ไม่ระบุตัวตน)' })
                    });
                    if (response.ok) {
                        Swal.fire({ title: 'สำเร็จ!', text: 'ย้อนสถานะกลับมารอส่งคืนใหม่เรียบร้อย', icon: 'success', timer: 1500, showConfirmButton: false, scrollbarPadding: false });
                        fetchData(); 
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

    const handleExportToExcel = () => {
        const excelData = jobs.map(j => {
            const c = claims.find(claim => claim.job_id === j.job_id) || {};
            let statusText = 'รับเครื่องมารอซ่อม';
            if (c.claim_id) {
                if (c.date_returned_customer) statusText = 'ส่งคืนลูกค้า';
                else if (c.date_received_back) statusText = c.is_return_failed ? 'พัสดุตีกลับ (รอส่งซ้ำ)' : 'รับกลับอยู่ที่บริษัทแล้ว';
                else statusText = 'ส่งเคลมศูนย์';
            } else {
                if (j.status === 'ClaimFailed') statusText = 'ส่งเคลมไม่สำเร็จ';
                else if (j.status === 'Returned') statusText = 'ส่งคืนลูกค้า';
            }
            return {
                'หมายเลขงาน (Job ID)': j.job_id || '',
                'วันที่รับเครื่อง': j.date_received ? new Date(j.date_received).toLocaleDateString('th-TH') : '',
                'โรงพยาบาล/ลูกค้า': j.customer_name || '',
                'ผู้ติดต่อนำส่ง': j.contact_person || '',
                'เบอร์โทรลูกค้า': j.phone_number || '',
                'ประเภท/ชื่อสินค้า': j.product_type || '',
                'รุ่น (Model)': j.model_name || '',
                'Serial Number': j.serial_number || '',
                'S/N (Expert)': j.expert_serial_number || '',
                'รายละเอียดเครื่อง': j.device_details || '',
                'อาการเสีย': j.symptom || '',
                'อุปกรณ์ประกอบ': j.accessories || '',
                'หมายเหตุเพิ่มเติม': j.extra_notes || '',
                'สถานะปัจจุบัน': statusText,
                'วันที่เริ่มรับประกัน': j.warranty_start_date ? new Date(j.warranty_start_date).toLocaleDateString('th-TH') : '',
                'วันสิ้นสุดการรับประกัน': j.warranty_end_date ? new Date(j.warranty_end_date).toLocaleDateString('th-TH') : '',
                'รายละเอียด/เงื่อนไขประกัน': j.warranty_details || '',
                'ศูนย์บริการ (ส่งเคลม)': c.service_center_name || '',
                'ที่อยู่ศูนย์ซ่อม': c.service_center_address || '',
                'พนักงานที่ไปส่งเคลม': c.sender_name || '',
                'วันที่ส่งเคลม': c.date_sent ? new Date(c.date_sent).toLocaleDateString('th-TH') : '',
                'อาการที่แจ้งส่งศูนย์': c.remark_send || '',
                'เลขพัสดุ/ขนส่ง (ขาไป)': c.tracking_number || '',
                'วันที่ของกลับมาถึงบริษัท': c.date_received_back ? new Date(c.date_received_back).toLocaleDateString('th-TH') : '',
                'วันที่พนักงานมอบคืนลูกค้า': c.date_returned_customer ? new Date(c.date_returned_customer).toLocaleDateString('th-TH') : '',
                'ผู้ไปส่งคืนลูกค้า': c.return_sender_name || '',
                'วิธีการ/เบอร์ขนส่งคืนลูกค้า': c.return_method || '',
                'ที่อยู่ส่งคืนลูกค้า': c.customer_address || '',
                'หมายเหตุ/Tracking ขาออก': c.return_remark || ''
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CMMS_All_Data");
        
        // กำหนดขนาดความกว้างแต่ละคอลัมน์ให้อ่านง่าย
        const colsWidth = [
            {wch:15}, {wch:12}, {wch:25}, {wch:18}, {wch:15}, {wch:20}, {wch:15}, {wch:20}, {wch:18}, {wch:25}, 
            {wch:35}, {wch:20}, {wch:20}, {wch:20}, {wch:15}, {wch:15}, {wch:20}, {wch:25}, {wch:35}, {wch:20}, 
            {wch:15}, {wch:25}, {wch:20}, {wch:15}, {wch:15}, {wch:20}, {wch:20}, {wch:35}, {wch:25}
        ];
        worksheet['!cols'] = colsWidth;
        
        // ดาวน์โหลด
        XLSX.writeFile(workbook, `CMMS_All_Data_Export_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
    };
    
    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans">
            
            {/* ================= HEADER SECTION ================= */}
            <div className="flex flex-col gap-5 mb-8 border-b border-gray-200 pb-6">
                
                {/* แถวที่ 1: โลโก้ (ซ้าย) + โปรไฟล์พนักงาน (ขวา) */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <img src={logoImage} alt="Logo" className="h-16 w-auto object-contain" />
                        <div className="h-10 w-px bg-gray-300 hidden md:block"></div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Service Dashboard</h1>
                            <p className="text-slate-500 text-sm">ระบบบริหารจัดการงานซ่อมและเคลมสินค้า</p>
                        </div>
                    </div>

                    {/* กล่องโปรไฟล์พนักงาน */}
                    {currentUser && (
                        <div className="hidden sm:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-xs cursor-default">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                                <User size={20} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm font-bold text-slate-800 leading-tight">{currentUser.fullName}</span>
                                <span className="text-xs text-slate-500 leading-tight mt-0.5">
                                    {currentUser.position || 'เจ้าหน้าที่'} {currentUser.department ? `(${currentUser.department})` : ''}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 🔴 แถวที่ 2: เครื่องมือ (ค้นหา, กรอง, ตะกร้า, ปุ่มเพิ่มงาน) */}
                <div className="flex flex-wrap gap-3 w-full justify-end items-center mt-2">
                    
                    <div className="relative flex-1 md:w-150 min-w-50">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="ค้นหา..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10 transition-all text-sm shadow-sm" 
                        onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    {/* Dropdown กรองสถานะ */}
                    <div className="relative sm:w-64 shrink-0 shadow-xs rounded-xl">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter size={18} className="text-slate-500" />
                        </div>
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-7 py-2.5 rounded-xl bg-white text-slate-600 border border-gray-200 hover:bg-slate-50 transition-all font-bold appearance-none cursor-pointer outline-none shadow-sm"
                        >
                            <option value="All">ดูข้อมูลสถานะทั้งหมด</option>
                            <option value="New">1. รับเครื่องมารอซ่อม</option>
                            <option value="Claimed">2. ส่งเคลมศูนย์</option>
                            <option value="Received">3. รับกลับอยู่ที่บริษัทเเล้ว</option>
                            <option value="Returned">4. ส่งคืนลูกค้า</option>
                            <option value="ClaimFailed">5. ส่งเคลมไม่สำเร็จ</option>
                            <option value="ReturnFailed">6. พัสดุตีกลับ (รอส่งซ้ำ)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    <button 
                        onClick={() => onViewAnalytics()} 
                        className="cursor-pointer flex items-center justify-center gap-2 px-5 py-3 bg-white text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-all font-bold w-full sm:w-auto shrink-0 shadow-sm"
                    >
                        <UserCheck size={18} />
                        หน้าสรุปข้อมูล (Dashboard)
                    </button>
                    
                    <button 
                        onClick={() => onViewLogs()} 
                        className="cursor-pointer flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-600 border border-gray-200 rounded-xl hover:bg-slate-50 transition-all font-bold w-full sm:w-auto shrink-0 shadow-sm"
                    >
                        <History size={18} />
                        ดูประวัติระบบ
                    </button>

                    <div className="relative">
                        <button onClick={() => setIsApprovalModalOpen(true)} className={`cursor-pointer px-5 py-3.5 rounded-xl flex items-center gap-2 font-bold whitespace-nowrap transition-all shadow-sm border border-gray-200 ${pendingJobs.length > 0 ? 'bg-orange-500 hover:bg-orange-600 text-white border-transparent animate-shake' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                            <ShoppingBasket size={18} className={pendingJobs.length > 0 ? "animate-pulse" : ""} />
                        </button>
                        {pendingJobs.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                {pendingJobs.length}
                            </span>
                        )}
                    </div>
                    
                    <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-2 font-bold whitespace-nowrap shadow-xs cursor-pointer border border-transparent">
                        + เพิ่มงานใหม่
                    </button>
                    <button onClick={handleExportToExcel} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-bold whitespace-nowrap shadow-xs cursor-pointer border border-transparent transition-transform active:scale-95">
                        <Download size={18} /> ออกรายงาน Excel
                    </button>
                </div>
            </div>
            {/* ========================================================== */}
            <DashboardStats jobs={jobs.filter(j => j.status !== 'Pending')} claims={claims} />
            <div className={`bg-white rounded-sm shadow-xs overflow-hidden border border-gray-200 mt-8`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse whitespace-nowrap border border-gray-100">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider border-b border-gray-200 divide-x divide-gray-200">      
                                <th className="p-4 pl-6 text-center">หมายเลขส่งซ่อม</th>
                                <th className="p-4 text-center">รูป/วิดีโอ</th>
                                <th className="p-4 text-center">วันที่</th>
                                <th className="p-4 text-center">ผู้ส่งเครื่องมาซ่อม</th>
                                <th className="p-4 text-center">โรงพยาบาล/ดีลเลอร์</th>
                                <th className="p-4 text-center">ชื่อสินค้า</th> 
                                <th className="p-4 text-center">SN(Expert)</th>
                                <th className="p-4 text-center">Serial Number</th>
                                <th className="p-4 text-center">รุ่น</th>
                                <th className="p-4 text-center">ลักษณะอาการที่ส่งซ่อม</th>
                                <th className="p-4 text-center text-blue-600">สถานะ</th> 
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-600 text-sm divide-y divide-gray-100">
                            {currentItems.length > 0 ? currentItems.map((job) => {
                                const claim = claims.find(c => c.job_id === job.job_id) || null;
                                let status = job.status || 'New';
                                if (claim) {
                                    if (claim.date_returned_customer) {
                                        status = 'Returned'; 
                                    } else if (claim.date_received_back) {
                                        if (claim.is_return_failed) {
                                            status = 'ReturnFailed';
                                        } else {
                                            status = 'ReceivedBack'; 
                                        }
                                    } else {
                                        status = 'Claiming'; 
                                    }
                                }
                                return (
                                <React.Fragment key={job.job_id}>
                                    
                                    {/* --- แถวหลัก (Main Row) --- */}
                                    <tr onClick={() => toggleRow(job.job_id)} className={`cursor-pointer transition-colors duration-200 hover:bg-blue-50/50 divide-x divide-gray-100 ${expandedRow === job.job_id ? 'bg-blue-50/80' : ''}`}>
                                        <td className="p-4 text-center"><span className="font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-xm border border-amber-100">{job.job_id}</span></td>
                                        <td className="p-4 text-center">{renderMedia(job.images)}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                {/* โชว์วันที่รับ หรือ วันที่ส่งเคลม ตามสถานะ */}
                                                <span className="text-slate-600 font-medium">
                                                    {status === 'New' ? formatDate(job.date_received) : (claim ? formatDate(claim.date_sent) : '-')}
                                                </span>
                                                {/* โชว์ป้าย รับมาแล้ว หรือ ส่งไปแล้ว ตามสถานะ */}
                                                {status === 'New' ? (
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md border whitespace-nowrap ${getDaysElapsed(job.date_received) > 7 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                        รับเครื่องมาเเล้ว {getDaysElapsed(job.date_received)} วัน
                                                    </span>
                                                ) : (
                                                    claim && !claim.date_received_back && (
                                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md border whitespace-nowrap ${getDaysElapsed(claim.date_sent) > 14 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                            ส่งเคลมไปเเล้ว {getDaysElapsed(claim.date_sent)} วัน
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center"><div className="flex items-center justify-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shadow-sm"><User size={16} /></div><span className="font-medium">{job.contact_person || '-'}</span></div></td>
                                        <td className="p-4 text-center text-slate-600 whitespace-normal min-w-37 max-w-50 leading-snug" style={{ overflowWrap: 'break-word' }}>{job.customer_name}</td>
                                        <td className="p-4 text-center text-slate-600">{job.product_type || '-'}</td>
                                        <td className="p-4 text-center text-slate-500">{job.expert_serial_number || '-'}</td>
                                        <td className="p-4 text-center">{job.serial_number}</td>
                                        <td className="p-4 text-center">{job.model_name}</td>
                                        <td className="p-4 text-center"><div className="mx-auto min-w-45 max-w-62 whitespace-normal text-left leading-snug" title={job.symptom} style={{ overflowWrap: 'break-word' }}>
                                                {job.symptom}
                                            </div>
                                        </td>
                                        
                                        {/* คอลัมน์สถานะตอนท้ายตาราง */}
                                        <td className="p-4 text-center">
                                            {status === 'New' && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md font-bold text-sm whitespace-nowrap">รับเครื่องมารอซ่อม</span>}
                                            {status === 'ClaimFailed' && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-md font-bold text-sm whitespace-nowrap">ส่งเคลมไม่สำเร็จ (รอส่งใหม่)</span>}
                                            {status === 'Claiming' && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-md font-bold text-sm whitespace-nowrap">ส่งเคลมศูนย์</span>}
                                            {status === 'ReceivedBack' && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md font-bold text-sm whitespace-nowrap">รับกลับอยู่ที่บริษัทเเล้ว</span>}
                                            {status === 'Returned' && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md font-bold text-sm whitespace-nowrap">ส่งคืนลูกค้า</span>}
                                            {status === 'ReturnFailed' && <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-md font-bold text-sm whitespace-nowrap">พัสดุตีกลับ (รอส่งคืนลูกค้าซ้ำ)</span>}    
                                        </td>
                                        
                                        <td className="p-4 text-center text-gray-400"><ChevronDown size={18} className={`transition-transform duration-300 ${expandedRow === job.job_id ? 'rotate-180 text-blue-500' : ''}`} /></td>
                                    </tr>

                                    {/* --- แถวขยายรายละเอียด (Expanded Row) --- */}
                                    <tr className="border-0">
                                        <td colSpan="12" className="p-0 border-none max-w-0">
                                            <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${expandedRow === job.job_id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                                <div className="overflow-hidden min-h-0 bg-blue-50/30 whitespace-normal wrap-break-words w-full">
                                                    <div className="p-6">
                                                        
                                                        {/* ตรวจสอบว่าต้องโชว์ข้อมูลแบบ "รับงานเข้า" หรือ "ส่งเคลม" */}
                                                        {(status === 'New' || status === 'ClaimFailed' || !claim) ? (
                                                            
                                                            /* ============================================== */
                                                            /* 📦 รูปแบบการ์ด: รับงานเข้า (เหมือนเดิม 100%) */
                                                            /* ============================================== */
                                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                                                                    <div>
                                                                        <h3 className="text-slate-500 text-sm font-bold flex items-center gap-2 mb-4"><AlertCircle className="text-red-500 w-4 h-4" /> รายละเอียดเพิ่มเติม :</h3>
                                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.job_id); }} className="flex-1 py-1.5 bg-gray-400 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-all shadow-sm border border-transparent">ลบเครื่องนี้ออก</button>
                                                                            <button onClick={(e) => { e.stopPropagation(); setEditData(job); setIsEditJobModalOpen(true); }} className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm border border-transparent flex justify-center items-center gap-1"><Edit size={12} /> แก้ไขข้อมูล</button>
                                                                            <button onClick={(e) => { e.stopPropagation(); setJobToClaim(job); setIsClaimModalOpen(true); }} className="w-full py-2 bg-orange-400 hover:bg-orange-500 text-white text-sm font-bold rounded-lg transition-all shadow-md flex justify-center items-center gap-1 mt-1"><Truck size={14} /> กดปุ่มเพื่อบันทึกส่งเคลมศูนย์</button>
                                                                        </div>
                                                                        <div className="space-y-3 text-sm">
                                                                            <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-slate-700 text-sm">รายละเอียดเครื่อง :</span> <span className="font-medium text-slate-500 text-right text-sm max-w-[60%]">{job.device_details || '-'}</span></div>
                                                                            <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-slate-700 text-sm">อุปกรณ์ที่รับ :</span> <span className="font-medium text-slate-500 text-right text-sm max-w-[60%]">{job.accessories || '-'}</span></div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-slate-50 p-3 rounded-lg text-slate-600 mt-4 text-sm border border-slate-100 text-left"><span className=" text-slate-500 text-sm font-bold mb-1 block">หมายเหตุเเละอื่นๆ : {job.extra_notes || '-'}</span></div>
                                                                </div>

                                                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                                                                    <h3 className="text-slate-500 text-sm font-bold mb-4 flex items-center gap-2"><CheckCircle className="text-green-500 w-4 h-4" /> ข้อมูลประกัน :</h3>
                                                                    <div className="space-y-3 text-sm flex-1">
                                                                        <p className="flex justify-between border-b border-gray-50 pb-2"><span className="text-slate-500 text-sm">เริ่มประกัน :</span> <span className="font-medium text-sm">{job.warranty_start_date ? new Date(job.warranty_start_date).toLocaleDateString('th-TH') : '-'}</span></p>
                                                                        <p className="flex justify-between border-b border-gray-50 pb-2"><span className="text-slate-500 text-sm">สิ้นสุด :</span> <span className="text-red-500 font-bold text-sm">{job.warranty_end_date ? new Date(job.warranty_end_date).toLocaleDateString('th-TH') : '-'}</span></p>
                                                                        <div className="pt-2 mt-auto"><p className="bg-slate-50 p-3 rounded-lg text-slate-600 text-sm border border-slate-100 text-left"><span className="text-slate-500 text-sm font-bold mb-1 block">รายละเอียดเพิ่มเติม : {job.warranty_details || '-'}</span></p></div>
                                                                    </div>
                                                                </div>

                                                                {/* กล่องขวา: ไฟล์แนบ*/}
                                                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                                                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Camera className="text-blue-500 w-4 h-4" /> ไฟล์แนบทั้งหมด</h3>
                                                                    {job.images ? (
                                                                        <div className="flex gap-2 overflow-x-auto p-1 custom-scrollbar">
                                                                            {job.images.split(',').map((file, idx) => {
                                                                                const fileUrl = `${API_URL}/uploads/${file}`;
                                                                                const isVid = file.match(/\.(mp4|webm|ogg|mov)$/i);
                                                                                return (
                                                                                    <div key={idx} onClick={(e) => { e.stopPropagation(); window.open(fileUrl, '_blank'); }} className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-md border border-slate-200 p-0.5 bg-white cursor-pointer hover:scale-105 transition-transform relative group shadow-sm">
                                                                                        {isVid ? (
                                                                                            <div className="w-full h-full bg-slate-900 rounded-sm flex items-center justify-center"><PlayCircle size={20} className="text-white opacity-80 group-hover:opacity-100" /></div>
                                                                                        ) : (
                                                                                            <img src={fileUrl} alt="attachment" className="w-full h-full object-cover rounded-sm" />
                                                                                        )}
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-gray-200 text-slate-400 min-h-30">
                                                                            <ImageIcon size={24} className="mb-2 opacity-30" />
                                                                            <span className="text-[11px]">ไม่มีไฟล์แนบในงานนี้</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                        ) : (

                                                            /* ============================================== */
                                                            /* 📦 รูปแบบการ์ด: ส่งเคลม 
                                                            /* ============================================== */
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                                                                
                                                                {/* กล่องซ้าย: รายละเอียดการส่งเคลม */}
                                                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-left h-full">
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <h3 className="text-lg font-bold text-slate-700">รายละเอียดการส่งเคลม</h3>
                                                                        <div className="flex items-center gap-2">
                                                                            {/* เปลี่ยนตรงนี้เป็น status === 'Claiming' แทนครับ */}
                                                                            {status === 'Claiming' && (
                                                                                <button onClick={(e) => { e.stopPropagation(); handleRevertToNew(job.job_id); }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all">
                                                                                    <AlertCircle size={14} /> ซ่อมไม่สำเร็จ
                                                                                </button>
                                                                            )}
                                                                            {status === 'Claiming' && (
                                                                                <button onClick={(e) => { e.stopPropagation(); setSelectedClaim(claim); setClaimActionType('receive'); }} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all">
                                                                                    <CheckCircle size={14}/> รับของกลับ
                                                                                </button>
                                                                            )}
                                                                            {(status === 'ReceivedBack' || status === 'ReturnFailed') && (
                                                                                <button onClick={(e) => { e.stopPropagation(); setSelectedClaim(claim); setClaimActionType('return'); }} className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-lg transition-all">
                                                                                    <UserCheck size={14}/> คืนลูกค้า
                                                                                </button>
                                                                            )}
                                                                            {status === 'Returned' && (
                                                                                <button onClick={(e) => { e.stopPropagation(); handleRevertReturn(claim.claim_id); }} className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-all">
                                                                                    <AlertCircle size={14} /> ตีกลับ/ส่งไม่สำเร็จ
                                                                                </button>
                                                                            )}
                                                                            <button onClick={(e) => { e.stopPropagation(); setEditData(claim); setIsEditClaimModalOpen(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-gray-400 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all">
                                                                                <Edit size={14} /> แก้ไขข้อมูล
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <p className="text-sm text-slate-600 mb-2">ผู้นำไปส่งเคลม : <span className="font-medium text-slate-800">{claim.sender_name || '-'}</span></p>
                                                                    <p className="text-sm text-slate-600 mb-2">ชื่อศูนย์รับซ่อม : <span className="font-medium text-slate-800">{claim.service_center_name || '-'}</span></p>
                                                                    <p className="text-sm text-slate-600 mb-2">ที่อยู่ศูนย์รับซ่อม : <span className="font-medium">{claim.service_center_address || '-'}</span></p>
                                                                    <p className="text-sm text-slate-600 mb-2">เบอร์โทรศูนย์รับซ่อม : <span className="font-medium">{claim.service_center_phone || '-'}</span></p>
                                                                    <p className="text-sm text-slate-600 mb-2">สถานะประกัน : <span className={`font-bold ml-1 ${claim.warranty_status_claim === 'In Warranty' ? 'text-emerald-600' : (claim.warranty_status_claim === 'Out of Warranty' ? 'text-red-500' : 'text-slate-800')}`}>{claim.warranty_status_claim || '-'}</span></p>
                                                                    <p className="text-sm text-slate-600 mb-2">ลักษณะอาการที่ส่งซ่อม : <span className="font-medium text-amber-700">{claim.remark_send || '-'}</span></p>
                                                                    <p className="text-sm text-slate-600 mb-2 ">เลขพัสดุ / ขนส่ง : <span className="font-bold text-blue-600">{claim.tracking_number || '-'}</span></p>
                                                                    {status === 'Returned' && (
                                                                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                                                                            <h4 className="text-lg font-bold text-slate-700 mb-2">ข้อมูลการจัดส่งคืนลูกค้า</h4>
                                                                            <p className="text-sm text-slate-600">ผู้นำไปส่งคืน : <span className="font-medium text-slate-800">{claim.return_sender_name || '-'}</span></p>
                                                                            <p className="text-sm text-slate-600">วิธีการส่งคืน : <span className="font-medium text-slate-800">{claim.return_method || '-'}</span></p>
                                                                            <p className="text-sm text-slate-600 mb-2">ชื่อลูกค้า : <span className="font-medium text-slate-800">{claim.customer_name || '-'}</span></p>
                                                                            <p className="text-sm text-slate-600">ที่อยู่จัดส่งลูกค้า : <span className="font-medium text-slate-800">{claim.customer_address || '-'}</span></p>
                                                                            <p className="text-sm text-slate-600 mb-2">เลขพัสดุ / ขนส่ง / หมายเหตุ : <span className="font-medium text-purple-600">{claim.return_remark || '-'}</span></p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* กล่องขวา: ไฟล์แนบ */}
                                                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-left h-full flex flex-col">
                                                                    <span className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5"><Camera size={16} className="text-slate-400"/> ไฟล์แนบทั้งหมด</span>
                                                                    {(claim.images || claim.job_images) ? ( 
                                                                        <div className="flex gap-2 overflow-x-auto p-1 custom-scrollbar">
                                                                            {(claim.images || claim.job_images).split(',').map((file, idx) => {
                                                                                const fileUrl = `${API_URL}/uploads/${file}`;
                                                                                const isVid = file.match(/\.(mp4|webm|ogg|mov)$/i);
                                                                                return (
                                                                                    <div key={idx} onClick={(e) => { e.stopPropagation(); window.open(fileUrl, '_blank'); }} className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-md border border-slate-200 p-0.5 bg-white cursor-pointer hover:scale-105 transition-transform relative group">
                                                                                        {isVid ? (<div className="w-full h-full bg-slate-900 rounded-sm flex items-center justify-center"><PlayCircle size={20} className="text-white opacity-80 group-hover:opacity-100" /></div>) : (<img src={fileUrl} alt="attachment" className="w-full h-full object-cover rounded-sm" />)}
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    ) : (<div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-lg bg-slate-50 text-slate-400 py-6"><Camera size={24} className="mb-2 opacity-30" /><span className="text-xs">ไม่มีไฟล์แนบ</span></div>)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                                )}) : (
                                <tr><td colSpan="12" className="p-8 text-center text-slate-400">ยังไม่มีรายการข้อมูล</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="bg-white border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-sm">
                        <div className="text-sm text-slate-500 font-medium">
                            แสดงข้อมูล <span className="font-bold text-slate-700">{indexOfFirstItem + 1}</span> ถึง <span className="font-bold text-slate-700">{Math.min(indexOfLastItem, filteredData.length)}</span> จากทั้งหมด <span className="font-bold text-blue-600">{filteredData.length}</span> รายการ
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                ก่อนหน้า
                            </button>
                            
                            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-50 sm:max-w-md">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                    <button
                                        key={number}
                                        onClick={() => setCurrentPage(number)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all shadow-sm ${
                                            currentPage === number 
                                            ? 'bg-blue-600 text-white border-transparent' 
                                            : 'bg-white text-slate-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                        }`}
                                    >
                                        {number}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AddJobModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveJob} jobs={jobs}/>
            <AddClaimModal 
                isOpen={isClaimModalOpen} 
                onClose={() => { 
                    setIsClaimModalOpen(false); 
                    setTimeout(() => setJobToClaim(null), 300);
                }} 
                onSave={handleSaveClaim} 
                selectedJob={jobToClaim} 
            />
            <PrintJobModal key={printJob?.job_id || 'print-modal'} isOpen={!!printJob} onClose={() => setPrintJob(null)} job={printJob} />
            <UpdateClaimModal 
                isOpen={!!selectedClaim} 
                onClose={() => setSelectedClaim(null)} 
                claim={selectedClaim}
                type={claimActionType}
                onUpdate={handleUpdateClaimStatus}
            />
            <ApprovalModal 
                isOpen={isApprovalModalOpen} 
                onClose={() => setIsApprovalModalOpen(false)} 
                pendingJobs={pendingJobs} 
                onApprove={handleApproveJob} 
            />
            <EditJobModal
                isOpen={isEditJobModalOpen}
                onClose={() => { setIsEditJobModalOpen(false); setEditData(null); }}
                jobData={editData}
                onSuccess={fetchData}
            />
            <EditClaimModal
                isOpen={isEditClaimModalOpen}
                onClose={() => { setIsEditClaimModalOpen(false); setEditData(null); }}
                claimData={editData}
                onSuccess={fetchData}
            />
        </div>
    );
}

const style = document.createElement('style');
style.id = 'custom-theme-styles'; 
style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap'); 
    body, html, * { font-family: 'Sarabun', sans-serif !important; }
    
    input, textarea, select { line-height: 1.6 !important; }
    .text-sm { line-height: 1.6rem !important; }
    .text-xs { line-height: 1.4rem !important; }

    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 500px; } }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes shake {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
        75% { transform: rotate(-5deg); }
    }
    .animate-shake { animation: shake 1.5s infinite; }
`;
if (!document.getElementById('custom-theme-styles')) {
    document.head.appendChild(style);
}
export default JobTable;