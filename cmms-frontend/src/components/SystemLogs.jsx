import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Clock, User, Tag, FileText } from 'lucide-react';

function SystemLogs({ onBack }) {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        
        const fetchLogs = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL;
                const response = await fetch(`${API_URL}/api/logs`);
                const data = await response.json();
                setLogs(data);
            } catch (error) {
                console.error('Error fetching logs:', error);
            }
        };

        fetchLogs(); 
        
    }, []); 

    // ฟังก์ชันค้นหาประวัติ (หาจากเบอร์งาน, ชื่อคนทำ, หรือรายละเอียด)
    const filteredLogs = logs.filter(log => {
        const term = searchTerm.toLowerCase();
        return (
            (log.job_id && log.job_id.toLowerCase().includes(term)) ||
            (log.performed_by && log.performed_by.toLowerCase().includes(term)) ||
            (log.action_detail && log.action_detail.toLowerCase().includes(term)) ||
            (log.action_type && log.action_type.toLowerCase().includes(term))
        );
    });

    // แปลงวันที่ให้อ่านง่าย
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('th-TH', options);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans bg-slate-50 min-h-screen">
            
            {/* ส่วนหัว */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-2.5 bg-white text-slate-600 rounded-xl border border-gray-200 hover:bg-slate-100 hover:text-slate-800 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">ประวัติการทำงานระบบ (System Logs)</h1>
                        <p className="text-sm text-slate-500 mt-1">บันทึกทุกการเคลื่อนไหวของงานซ่อมและเคลม</p>
                    </div>
                </div>

                {/* ช่องค้นหาในหน้า Log */}
                <div className="relative w-full sm:w-72 shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-400" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="ค้นหา (เบอร์งาน, ผู้ทำรายการ)..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10 transition-all text-sm shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* ตารางแสดง Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100/50 text-slate-600 text-sm border-b border-gray-200">
                                <th className="p-4 font-bold whitespace-nowrap"><div className="flex items-center gap-2"><Clock size={16}/> วันเวลา</div></th>
                                <th className="p-4 font-bold whitespace-nowrap"><div className="flex items-center gap-2"><Tag size={16}/> หมายเลขงาน</div></th>
                                <th className="p-4 font-bold whitespace-nowrap"><div className="flex items-center gap-2"><User size={16}/> ผู้ทำรายการ</div></th>
                                <th className="p-4 font-bold whitespace-nowrap">หมวดหมู่</th>
                                <th className="p-4 font-bold min-w-75"><div className="flex items-center gap-2"><FileText size={16}/> รายละเอียด</div></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.log_id} className="hover:bg-slate-50/80 transition-colors text-sm">
                                        <td className="p-4 text-slate-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                                        <td className="p-4 font-mono font-bold text-blue-600 whitespace-nowrap">{log.job_id}</td>
                                        <td className="p-4 font-medium text-slate-700 whitespace-nowrap">
                                            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs">{log.performed_by || 'System'}</span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="text-slate-600 font-medium">{log.action_type}</span>
                                        </td>
                                        <td className="p-4 text-slate-600 wrap-break-word max-w-md">{log.action_detail}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">
                                        ไม่มีประวัติการทำงาน หรือ ไม่พบข้อมูลที่ค้นหา
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

export default SystemLogs;