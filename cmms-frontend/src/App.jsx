import { useState, useEffect } from 'react';
import './App.css';
import JobTable from './components/JobTable';
import SystemLogs from './components/SystemLogs'; 
import SSOLogin from './components/SSOLogin'; 
import DashboardAnalytics from './components/DashboardAnalytics';

function App() {
  // 1. State สำหรับเปลี่ยนหน้าไปมา
  // หน้าเริ่มต้นคือ analytics
  const [currentPage, setCurrentPage] = useState('analytics');
  
  // 2. State สำหรับระบบผู้ใช้งาน
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);

  // 3. ตรวจสอบตอนเปิดเว็บว่าเคย Login ไว้หรือยังมี Parameter ส่งมาไหม
  useEffect(() => {
    const checkLoginStatus = () => {
      const savedUser = localStorage.getItem('cmms_user');
      
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
        setIsCheckingLogin(false);
        return;
      }

      setIsCheckingLogin(false);
    };

    checkLoginStatus();
  }, []);

  // 4. เมื่อ SSOLogin ดึงข้อมูลจาก ServicePro สำเร็จ
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // -----------------------------------------------------
  // 🚧 ส่วนแสดงผลหน้าจอ (ด่านตรวจ)
  // -----------------------------------------------------

  if (isCheckingLogin) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
  }

  if (!currentUser) {
      return <SSOLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* โชว์หน้า Dashboard Analytics เป็นค่าเริ่มต้น */}
      {currentPage === 'analytics' && (
        <DashboardAnalytics 
            onViewJobs={() => setCurrentPage('dashboard')} 
            currentUser={currentUser}
        />
      )}

      {/* โชว์หน้าตารางงานซ่อม */}
      {currentPage === 'dashboard' && (
        <JobTable 
            onViewLogs={() => setCurrentPage('logs')} 
            onViewAnalytics={() => setCurrentPage('analytics')}
            currentUser={currentUser}
        />
      )}

      {/* โชว์หน้าประวัติการทำงาน */}
      {currentPage === 'logs' && (
        <SystemLogs onBack={() => setCurrentPage('dashboard')} />
      )}

    </div>
  );
}

export default App;