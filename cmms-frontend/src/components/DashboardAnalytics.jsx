import React, { useState, useEffect, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
    LayoutDashboard, UserCog, Headset, Settings, ArrowRight,
    TrendingUp, Clock, AlertTriangle, Users, MonitorSmartphone,
    Search, CheckCircle, Truck, Package, XCircle, Home, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import logoImage from '../assets/logo.png';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardAnalytics({ onViewJobs, currentUser }) {
    const [jobs, setJobs] = useState([]);
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [slaDays, setSlaDays] = useState(14);
    
    // สำหรับ Service Tracker
    const [searchQuery, setSearchQuery] = useState('');

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        // โหลด SLA จาก LocalStorage
        const savedSLA = localStorage.getItem('cmms_sla_days');
        if (savedSLA) setSlaDays(parseInt(savedSLA));

        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resJobs, resClaims] = await Promise.all([
                fetch(`${API_URL}/api/jobs`),
                fetch(`${API_URL}/api/claims`)
            ]);
            if (resJobs.ok) setJobs(await resJobs.json());
            if (resClaims.ok) setClaims(await resClaims.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportToExcel = () => {
        const workbook = XLSX.utils.book_new();

        // 1. ภาพรวมระบบ (Overview)
        const overviewData = [
            { 'หัวข้อ': 'งานค้างรอจบ', 'จำนวน': metrics.totalPending, 'หน่วย': 'งาน' },
            { 'หัวข้อ': 'งานที่สำเร็จแล้ว', 'จำนวน': metrics.totalCompleted, 'หน่วย': 'งาน' },
            { 'หัวข้อ': 'เวลาเฉลี่ยสิ้นสุดกระบวนการ (E2E)', 'จำนวน': metrics.avgE2e, 'หน่วย': 'วัน' },
            { 'หัวข้อ': 'เฉลี่ย รับเรื่อง ➔ ส่งเคลม', 'จำนวน': metrics.avgStep1, 'หน่วย': 'วัน' },
            { 'หัวข้อ': 'เฉลี่ย ส่งเคลม ➔ ศูนย์ซ่อม', 'จำนวน': metrics.avgStep2, 'หน่วย': 'วัน' },
            { 'หัวข้อ': 'เฉลี่ย รับกลับ ➔ คืนลูกค้า', 'จำนวน': metrics.avgStep3, 'หน่วย': 'วัน' },
            { 'หัวข้อ': 'กำหนดเวลา SLA', 'จำนวน': slaDays, 'หน่วย': 'วัน' },
            { 'หัวข้อ': 'จำนวนงานที่เกิน SLA', 'จำนวน': metrics.breaches?.length || 0, 'หน่วย': 'งาน' }
        ];
        const wsOverview = XLSX.utils.json_to_sheet(overviewData);
        wsOverview['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(workbook, wsOverview, "1.ภาพรวมระบบ");

        // 2. รุ่นที่ซ่อมบ่อยสุด (Top Models)
        const wsModels = XLSX.utils.json_to_sheet((metrics.topModels || []).map((m, i) => ({
            'อันดับ': i + 1,
            'ชื่อรุ่น (Model)': m.name,
            'จำนวนที่ซ่อม (เครื่อง)': m.count
        })));
        wsModels['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(workbook, wsModels, "2.รุ่นที่ซ่อมบ่อย");

        // 3. ลูกค้าที่มาบ่อยสุด (Top Customers)
        const wsCustomers = XLSX.utils.json_to_sheet((metrics.topCustomers || []).map((c, i) => ({
            'อันดับ': i + 1,
            'ชื่อโรงพยาบาล/ลูกค้า': c.name,
            'จำนวนที่ส่งซ่อม (เครื่อง)': c.count
        })));
        wsCustomers['!cols'] = [{ wch: 10 }, { wch: 50 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(workbook, wsCustomers, "3.ลูกค้าที่มาบ่อย");

        // 4. งานค้างเกินกำหนด (SLA Breaches)
        const breachesData = (metrics.breaches || []).map(b => ({
            'หมายเลขงาน': b.job_id,
            'ลูกค้า': b.customer_name || '-',
            'รุ่นสินค้า': b.model_name || '-',
            'สถานะปัจจุบัน': b.currentStatus,
            'วันที่รับเครื่อง': b.date_received ? new Date(b.date_received).toLocaleDateString('th-TH') : '-',
            'ค้างมาแล้ว (วัน)': b.daysWaiting,
            'เกิน SLA (วัน)': b.daysWaiting - slaDays
        }));
        const wsBreaches = XLSX.utils.json_to_sheet(breachesData);
        wsBreaches['!cols'] = [{ wch: 15 }, { wch: 35 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, wsBreaches, "4.งานค้างเกินกำหนด(SLA)");

        // 5. ช้าสุด-เร็วสุด (Job Speeds)
        const speedData = [];
        (metrics.fastestJobs || []).forEach((j, i) => {
            speedData.push({ 'กลุ่ม': 'ซ่อมเร็วที่สุด 5 อันดับแรก', 'อันดับ': i + 1, 'หมายเลขงาน': j.job_id, 'ลูกค้า': j.customer_name, 'รุ่น': j.model_name, 'ใช้เวลา (วัน)': j.e2e });
        });
        (metrics.slowestJobs || []).forEach((j, i) => {
            speedData.push({ 'กลุ่ม': 'ซ่อมช้าที่สุด 5 อันดับแรก', 'อันดับ': i + 1, 'หมายเลขงาน': j.job_id, 'ลูกค้า': j.customer_name, 'รุ่น': j.model_name, 'ใช้เวลา (วัน)': j.e2e });
        });
        const wsSpeed = XLSX.utils.json_to_sheet(speedData);
        wsSpeed['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 35 }, { wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, wsSpeed, "5.ความเร็วการซ่อม");

        XLSX.writeFile(workbook, `Dashboard_Summary_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
    };

    const handleConfigSLA = () => {
        Swal.fire({
            title: 'ตั้งค่า SLA (วัน)',
            text: 'ระบบจะแจ้งเตือนเมื่อระยะเวลางานเกินกว่าที่กำหนด',
            input: 'number',
            inputValue: slaDays,
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                const newSla = parseInt(result.value);
                if (newSla > 0) {
                    setSlaDays(newSla);
                    localStorage.setItem('cmms_sla_days', newSla);
                    Swal.fire('บันทึกสำเร็จ', `ปรับ SLA เป็น ${newSla} วันแล้ว`, 'success');
                }
            }
        });
    };

    // =====================================
    // Helper Functions
    // =====================================
    const getDaysBetween = (d1, d2) => {
        if (!d1 || !d2) return null;
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return Math.max(1, Math.round((date2 - date1) / (1000 * 60 * 60 * 24)));
    };

    const getDaysElapsed = (dateStr) => {
        if (!dateStr) return 0;
        const diffTime = new Date() - new Date(dateStr);
        return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
    };

    // =====================================
    // Data Processors (Memoized)
    // =====================================
    const metrics = useMemo(() => {
        let totalPending = 0;
        let totalCompleted = 0;
        let atCompany = 0;
        let atCenter = 0;
        let returned = 0;

        let totalE2eTime = 0;
        let completedJobsCount = 0;

        let step1Time = 0, step1Count = 0; // รับถึงส่งเคลม
        let step2Time = 0, step2Count = 0; // เคลมถึงรับกลับ
        let step3Time = 0, step3Count = 0; // รับกลับถึงคืนลูกค้า

        const breaches = [];
        const modelCounts = {};
        const customerCounts = {};
        const jobSpeeds = [];

        jobs.forEach(job => {
            if (job.status === 'Pending') return; // ไม่นำงานที่ยังไม่อนุมัติมาคิด

            const c = claims.find(claim => claim.job_id === job.job_id);
            let isCompleted = false;
            let currentStatus = 'New';

            // จัดกลุ่มสถานะ
            if (c) {
                if (c.date_returned_customer) {
                    isCompleted = true; returned++; currentStatus = 'Returned';
                } else if (c.date_received_back) {
                    atCompany++; currentStatus = 'ReceivedBack';
                } else {
                    atCenter++; currentStatus = 'Claiming';
                }
            } else {
                if (job.status === 'Returned') {
                    isCompleted = true; returned++; currentStatus = 'Returned';
                } else if (job.status === 'ClaimFailed') {
                    atCompany++; currentStatus = 'ClaimFailed';
                } else {
                    atCompany++; currentStatus = 'New';
                }
            }

            if (!isCompleted) totalPending++;
            else totalCompleted++;

            // โมเดลเสียบ่อย
            if (job.model_name) {
                modelCounts[job.model_name] = (modelCounts[job.model_name] || 0) + 1;
            }
            // ลูกค้าที่มีปัญหา
            if (job.customer_name) {
                customerCounts[job.customer_name] = (customerCounts[job.customer_name] || 0) + 1;
            }

            // คำนวณเวลา (Bottlenecks)
            if (c && c.date_sent) {
                step1Time += getDaysBetween(job.date_received, c.date_sent);
                step1Count++;
            }
            if (c && c.date_received_back) {
                step2Time += getDaysBetween(c.date_sent, c.date_received_back);
                step2Count++;
            }
            if (c && c.date_returned_customer) {
                step3Time += getDaysBetween(c.date_received_back, c.date_returned_customer);
                step3Count++;
            }

            // คำนวณ SLA และ Speed
            const startDate = job.date_received;
            const endDate = c?.date_returned_customer || (job.status === 'Returned' ? job.updated_at : null);
            
            if (isCompleted && endDate) {
                const e2e = getDaysBetween(startDate, endDate);
                totalE2eTime += e2e;
                completedJobsCount++;
                jobSpeeds.push({ ...job, e2e });
            } else if (!isCompleted) {
                const daysWaiting = getDaysElapsed(startDate);
                if (daysWaiting > slaDays) {
                    breaches.push({ ...job, currentStatus, daysWaiting, claimData: c });
                }
            }
        });

        // เรียงลำดับ Speed
        jobSpeeds.sort((a, b) => a.e2e - b.e2e);

        return {
            totalPending, totalCompleted, atCompany, atCenter, returned,
            avgE2e: completedJobsCount > 0 ? Math.round(totalE2eTime / completedJobsCount) : 0,
            avgStep1: step1Count > 0 ? Math.round(step1Time / step1Count) : 0,
            avgStep2: step2Count > 0 ? Math.round(step2Time / step2Count) : 0,
            avgStep3: step3Count > 0 ? Math.round(step3Time / step3Count) : 0,
            topModels: Object.entries(modelCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
            topCustomers: Object.entries(customerCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
            fastestJobs: jobSpeeds.slice(0, 5),
            slowestJobs: jobSpeeds.slice(-5).reverse(),
            breaches: breaches.sort((a, b) => b.daysWaiting - a.daysWaiting)
        };
    }, [jobs, claims, slaDays]);


    // =====================================
    // UI Renderers
    // =====================================

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-5">
                    <img src={logoImage} alt="Logo" className="h-14 w-auto object-contain" />
                    <div className="h-10 w-px bg-gray-300 hidden md:block"></div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics Dashboard</h1>
                        <p className="text-slate-500 text-sm font-medium">สรุปข้อมูลเชิงลึกและภาพรวมของระบบสำหรับทุกฝ่าย</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={handleConfigSLA} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-all shadow-sm">
                        <Settings size={18} /> ตั้งค่า SLA
                    </button>
                    <button onClick={handleExportToExcel} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold shadow-md shadow-emerald-200 transition-all active:scale-95">
                        <Download size={18} /> ออกรายงาน Excel
                    </button>
                    <button onClick={onViewJobs} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-md shadow-blue-200 transition-all">
                        เข้าสู่หน้าตารางงาน <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* === 1. EXECUTIVE SECTION === */}
            <div className="mb-14 space-y-6 animate-fade-in bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-4 border-indigo-100">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><TrendingUp size={28} /></div>
                    <h2 className="text-2xl font-black text-slate-800">แดชบอร์ดสรุปผลสำหรับผู้บริหาร</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="p-4 bg-orange-100 text-orange-600 rounded-xl"><AlertTriangle size={32} /></div>
                        <div className="flex-1 min-w-0"><p className="text-slate-500 font-bold text-sm">งานค้างรอจบ</p><h3 className="text-3xl font-black text-slate-800">{metrics.totalPending} <span className="text-base font-normal">งาน</span></h3></div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="p-4 bg-green-100 text-green-600 rounded-xl"><CheckCircle size={32} /></div>
                        <div className="flex-1 min-w-0"><p className="text-slate-500 font-bold text-sm">งานที่สำเร็จแล้ว</p><h3 className="text-3xl font-black text-slate-800">{metrics.totalCompleted} <span className="text-base font-normal">งาน</span></h3></div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="p-4 bg-blue-100 text-blue-600 rounded-xl"><MonitorSmartphone size={32} /></div>
                        <div className="flex-1 min-w-0"><p className="text-slate-500 font-bold text-sm">รุ่นที่ซ่อมบ่อยสุด</p><h3 className="text-lg font-black text-slate-800 line-clamp-2" title={metrics.topModels[0]?.name}>{metrics.topModels[0]?.name || '-'}</h3></div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="p-4 bg-purple-100 text-purple-600 rounded-xl"><Users size={32} /></div>
                        <div className="flex-1 min-w-0"><p className="text-slate-500 font-bold text-sm">ลูกค้าที่มาบ่อยสุด</p><h3 className="text-lg font-black text-slate-800 line-clamp-2" title={metrics.topCustomers[0]?.name}>{metrics.topCustomers[0]?.name || '-'}</h3></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Bottleneck Analysis */}
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Clock className="text-indigo-500"/> ระยะเวลาเฉลี่ยแต่ละขั้นตอน (วัน)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'รับเรื่อง ➔ ส่งเคลม', days: parseFloat(metrics.avgStep1) },
                                    { name: 'ส่งเคลม ➔ ศูนย์ซ่อม', days: parseFloat(metrics.avgStep2) },
                                    { name: 'รับกลับ ➔ คืนลูกค้า', days: parseFloat(metrics.avgStep3) },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} />
                                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                                    <Bar dataKey="days" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Models Pie */}
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><MonitorSmartphone className="text-pink-500"/> สัดส่วนรุ่นเครื่องที่เสียบ่อยที่สุด</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={metrics.topModels} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {metrics.topModels.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Fastest Jobs */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="text-green-500"/> 5 อันดับ งานที่จบไวที่สุด (ดีเลิศ)</h3>
                        <div className="space-y-3">
                            {metrics.fastestJobs.map((job, idx) => (
                                <div key={job.job_id} className="flex justify-between items-center p-3 bg-white border border-green-100 shadow-sm rounded-xl">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black">{idx+1}</div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{job.job_id} - {job.model_name}</p>
                                            <p className="text-xs text-slate-500">{job.customer_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-black text-green-600">{job.e2e}</span>
                                        <span className="text-xs text-green-600/70 ml-1">วัน</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Slowest Jobs */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="text-red-500 rotate-180"/> 5 อันดับ งานที่ใช้เวลานานที่สุด (ต้องปรับปรุง)</h3>
                        <div className="space-y-3">
                            {metrics.slowestJobs.map((job, idx) => (
                                <div key={job.job_id} className="flex justify-between items-center p-3 bg-white border border-red-100 shadow-sm rounded-xl">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-black">{idx+1}</div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{job.job_id} - {job.model_name}</p>
                                            <p className="text-xs text-slate-500">{job.customer_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-black text-red-600">{job.e2e}</span>
                                        <span className="text-xs text-red-600/70 ml-1">วัน</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* === 2. ADMIN SECTION === */}
            <div className="mb-14 space-y-6 animate-fade-in bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center hover:shadow-md transition-shadow">
                        <p className="text-slate-500 font-bold mb-2">เวลาเฉลี่ยสิ้นสุดกระบวนการ</p>
                        <h3 className="text-5xl font-black text-indigo-600">{metrics.avgE2e} <span className="text-xl font-medium text-slate-400">วัน</span></h3>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center hover:shadow-md transition-shadow">
                        <p className="text-slate-500 font-bold mb-2">งานค้างที่ระบบบริษัท</p>
                        <h3 className="text-5xl font-black text-amber-500">{metrics.atCompany} <span className="text-xl font-medium text-slate-400">เครื่อง</span></h3>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center hover:shadow-md transition-shadow">
                        <p className="text-slate-500 font-bold mb-2">งานค้างที่ศูนย์เคลม</p>
                        <h3 className="text-5xl font-black text-rose-500">{metrics.atCenter} <span className="text-xl font-medium text-slate-400">เครื่อง</span></h3>
                    </div>
                </div>

                {/* SLA Breaches */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50/50">
                        <h3 className="text-lg font-black text-red-600 flex items-center gap-2"><AlertTriangle /> งานค้างเกินกำหนด SLA ({slaDays} วัน)</h3>
                        <span className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full font-bold text-sm shadow-sm">{metrics.breaches.length} รายการ</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                                    <th className="p-4 pl-6">หมายเลขงาน</th>
                                    <th className="p-4">วันที่รับเข้า</th>
                                    <th className="p-4">เวลาที่ผ่านไป (วัน)</th>
                                    <th className="p-4">สถานะปัจจุบัน</th>
                                    <th className="p-4">ลูกค้า</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {metrics.breaches.map(job => (
                                    <tr key={job.job_id} className="hover:bg-red-50/30 transition-colors">
                                        <td className="p-4 pl-6 font-bold text-slate-700">{job.job_id}</td>
                                        <td className="p-4 text-slate-600">{new Date(job.date_received).toLocaleDateString('th-TH')}</td>
                                        <td className="p-4"><span className="font-black text-red-600 text-lg">{job.daysWaiting}</span> <span className="text-xs text-red-400">วัน</span></td>
                                        <td className="p-4 text-sm font-bold text-slate-600">
                                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
                                                {job.currentStatus === 'New' && 'รับเครื่องมารอซ่อม'}
                                                {job.currentStatus === 'Claiming' && 'อยู่ศูนย์เคลม'}
                                                {job.currentStatus === 'ReceivedBack' && 'รับกลับ รอคืน'}
                                                {job.currentStatus === 'ClaimFailed' && 'เคลมไม่สำเร็จรอส่งใหม่'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500">{job.customer_name}</td>
                                    </tr>
                                ))}
                                {metrics.breaches.length === 0 && (
                                    <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-medium text-lg">🎉 ยอดเยี่ยม! ไม่มีงานไหนเกินกำหนด SLA เลย</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* === 3. SERVICE SECTION === */}
            <div className="space-y-6 animate-fade-in bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-4 border-amber-100">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Headset size={28} /></div>
                    <h2 className="text-2xl font-black text-slate-800">ระบบติดตามสถานะลูกค้า</h2>
                </div>

                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                    <p className="text-slate-500 font-medium text-lg mb-6">กรอกหมายเลข Serial Number, รหัสงานซ่อม, หรือชื่อลูกค้า เพื่อดูไทม์ไลน์สถานะ</p>
                    
                    <div className="relative">
                        <Search className="absolute left-4 top-4 text-blue-500" size={24} />
                        <input 
                            type="text" 
                            placeholder="ค้นหาด้วย Serial No, ชื่อลูกค้า, หรือรหัสงาน..." 
                            className="w-full pl-14 pr-4 py-4 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xl shadow-sm font-bold text-slate-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* ผลการค้นหา */}
                {searchQuery.length > 2 && (
                    <div className="space-y-4">
                        {jobs.filter(j => 
                            (j.serial_number && j.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (j.job_id && j.job_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (j.customer_name && j.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
                        ).map(job => {
                            const claim = claims.find(c => c.job_id === job.job_id);
                            let currentStep = 1;
                            if (claim) {
                                if (claim.date_returned_customer) currentStep = 4;
                                else if (claim.date_received_back) currentStep = 3;
                                else currentStep = 2;
                            } else if (job.status === 'Returned') {
                                currentStep = 4;
                            }

                            return (
                                <div key={job.job_id} className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-blue-100 hover:shadow-lg transition-all">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                                        <div>
                                            <h3 className="text-3xl font-black text-blue-700 mb-1">{job.job_id}</h3>
                                            <p className="text-slate-500 font-bold text-lg">{job.model_name} (SN: {job.serial_number})</p>
                                            <p className="text-md font-bold mt-2 text-slate-600 bg-slate-100 inline-block px-3 py-1 rounded-lg">ลูกค้า: {job.customer_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-black text-sm shadow-sm border border-amber-200">
                                                อัปเดตล่าสุด: {new Date(job.updated_at || job.date_received).toLocaleDateString('th-TH')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="relative flex justify-between items-center py-4 max-w-4xl mx-auto">
                                        <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-100 -translate-y-1/2 z-0 rounded-full"></div>
                                        <div className="absolute top-1/2 left-0 h-2 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-1000 rounded-full" style={{ width: `${(currentStep - 1) * 33.33}%` }}></div>
                                        
                                        <div className="relative z-10 flex flex-col items-center gap-3">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white shadow-md transition-colors border-4 border-white ${currentStep >= 1 ? 'bg-blue-600' : 'bg-slate-300'}`}><Package size={24}/></div>
                                            <span className={`text-sm font-black ${currentStep >= 1 ? 'text-blue-700' : 'text-slate-400'}`}>รอซ่อม/ตรวจเช็ค</span>
                                        </div>
                                        <div className="relative z-10 flex flex-col items-center gap-3">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white shadow-md transition-colors border-4 border-white ${currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-300'}`}><Truck size={24}/></div>
                                            <span className={`text-sm font-black ${currentStep >= 2 ? 'text-blue-700' : 'text-slate-400'}`}>ส่งศูนย์เคลม</span>
                                        </div>
                                        <div className="relative z-10 flex flex-col items-center gap-3">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white shadow-md transition-colors border-4 border-white ${currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-300'}`}><Home size={24}/></div>
                                            <span className={`text-sm font-black ${currentStep >= 3 ? 'text-blue-700' : 'text-slate-400'}`}>รับกลับบริษัท</span>
                                        </div>
                                        <div className="relative z-10 flex flex-col items-center gap-3">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white shadow-md transition-colors border-4 border-white ${currentStep >= 4 ? 'bg-blue-600' : 'bg-slate-300'}`}><CheckCircle size={24}/></div>
                                            <span className={`text-sm font-black ${currentStep >= 4 ? 'text-blue-700' : 'text-slate-400'}`}>ส่งคืนลูกค้าแล้ว</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
