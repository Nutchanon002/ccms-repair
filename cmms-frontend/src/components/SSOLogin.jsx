import React, { useEffect, useState } from 'react';

const SSOLogin = ({ onLoginSuccess }) => {
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const loginViaServicePro = async () => {
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);

            // ดึง Parameter จาก URL เหมือนเดิม
            const empId = urlParams.get('empid') || urlParams.get('ppid');
            const objId = urlParams.get('id') || urlParams.get('_id');

            if (!empId && !objId) {
                setErrorMsg('ไม่พบพารามิเตอร์รหัสพนักงานใน URL กรุณาเข้าสู่ระบบผ่าน Service Pro');
                return;
            }

            try {
                const API_URL = import.meta.env.VITE_API_URL;
                const apiUrl = `${API_URL}/api/sso-login?empid=${empId || ''}&id=${objId || ''}`;

                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    throw new Error('ไม่สามารถดึงข้อมูลจาก Service Pro ได้');
                }

                const data = await response.json();

                if (data && (data.empid || data.id)) {
                    // จัดข้อมูลพนักงานที่ได้มา
                    const userData = {
                        id: data.id || objId,
                        empid: data.empid,
                        fname: data.fname,
                        lname: data.lname,
                        fullName: `${data.fname || ''} ${data.lname || ''}`.trim() || 'พนักงาน ServicePro',
                        position: data.position,
                        department: data.department
                    };

                    console.log("✅ เข้าสู่ระบบ CMMS สำเร็จ:", userData);

                    // บันทึกลง LocalStorage (ใช้ชื่อคีย์สำหรับระบบซ่อม)
                    localStorage.setItem('cmms_user', JSON.stringify(userData));

                    // เรียกใช้ฟังก์ชันที่ส่งมาจาก App.jsx เพื่อพากลับไปหน้า Dashboard
                    setTimeout(() => {
                        onLoginSuccess(userData);
                    }, 1000); 

                } else {
                    setErrorMsg("ไม่พบข้อมูลพนักงานรหัสนี้ในระบบ");
                }

            } catch (error) {
                console.error("SSO API Error:", error);
                setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ Service Pro API');
            }
        };

        loginViaServicePro();
    }, [onLoginSuccess]);

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-slate-700">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center min-w-[320px]">
                {errorMsg ? (
                    <>
                        <div className="w-16 h-16 flex items-center justify-center bg-red-50 text-red-500 rounded-full mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">เข้าสู่ระบบไม่สำเร็จ</h2>
                        <p className="text-sm text-red-500 mt-2 text-center max-w-xs">{errorMsg}</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                        <h2 className="text-xl font-bold text-slate-800">กำลังเชื่อมต่อระบบ...</h2>
                        <p className="text-sm text-slate-500 mt-2">โปรดรอสักครู่ ระบบกำลังดึงข้อมูลพนักงาน</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default SSOLogin;