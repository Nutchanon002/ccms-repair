import React from 'react';
import { Wrench, Truck, Home, UserCheck, FileText } from 'lucide-react';

function DashboardStats({ jobs = [], claims = [] }) {
// 1. งานทั้งหมด (รับงานเข้า)
  const jobsInStep1 = jobs.filter(job => {
      const isClaimed = claims.some(c => c.job_id === job.job_id);
      if (isClaimed) return false;
      return true; 
  }).length;

  // 2. กำลังส่งเคลม (ส่งไปแล้ว ยังไม่มีวันที่รับกลับ)
  const jobsInStep2 = claims.filter(c => !c.date_received_back).length;

  // 3. กลับบริษัท (มีวันที่รับกลับแล้ว แต่ยังไม่มีวันที่คืนลูกค้า)
  const jobsInStep3 = claims.filter(c => c.date_received_back && !c.date_returned_customer).length;

  // 4. คืนลูกค้าแล้ว (มีวันที่คืนลูกค้าแล้ว)
  const jobsInStep4 = claims.filter(c => c.date_returned_customer).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
      {/* Card 1: งานทั้งหมด */}
      <div className="bg-linear-to-r from-blue-400 to-cyan-300 text-white p-8 m-1 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300">
        <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-semibold text-xl">1.รับเครื่องมารอซ่อม/รอส่งใหม่</p>
              <h3 className="text-3xl font-bold mt-1">{jobsInStep1} งาน</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Wrench size={30} /></div>
        </div>
      </div>

      {/* Card 2: ส่งเคลมศูนย์ */}
      <div className="bg-linear-to-r from-red-400 to-amber-300 text-white p-8 m-1 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300">
        <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-semibold text-xl">2.ส่งเคลมศูนย์</p>
              <h3 className="text-3xl font-bold mt-1">{jobsInStep2} งาน</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Truck size={30} /></div>
        </div>
      </div>

      {/* Card 3: กลับบริษัท */}
      <div className="bg-linear-to-r from-green-400 to-teal-300 text-white p-8 m-1 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300">
        <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-semibold text-xl">3.รับกลับอยู่ที่บริษัทเเล้ว</p>
              <h3 className="text-3xl font-bold mt-1">{jobsInStep3} งาน</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Home size={30} /></div>
        </div>
      </div>

      {/* Card 4: คืนลูกค้าแล้ว (หรือจะโชว์ยอดเงินก็ได้ ผมใส่คืนลูกค้าให้ก่อนตาม Flow) */}
      <div className="bg-linear-to-r from-violet-500 to-pink-300 text-white p-8 m-1 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300">
        <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-semibold text-xl">4.ส่งคืนลูกค้า</p>
              <h3 className="text-3xl font-bold mt-1">{jobsInStep4} งาน</h3>
              {/* <p className="text-xs mt-1 text-white/70">รายรับ: ฿ {totalRevenue.toLocaleString()}</p> */}
            </div>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><UserCheck size={30} /></div>
        </div>
      </div>

    </div>
  );
}

export default DashboardStats;