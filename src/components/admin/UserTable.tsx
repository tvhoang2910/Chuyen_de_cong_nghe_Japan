import React from 'react';
import { type AdminUserItem, type AppRole } from '../../api/axiosClient';
import { ShieldCheck, User, MoreHorizontal, Mail, Fingerprint, History, Calendar, School, BookOpen, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserTableProps {
  users: AdminUserItem[];
  isLoading: boolean;
  actionLoadingUserId: number | null;
  statusReasonByUserId: Record<number, string>;
  setStatusReasonByUserId: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onToggleStatus: (user: AdminUserItem) => void;
  onChangeRole: (userId: number, role: AppRole) => void;
  spotlightUserId?: number | null;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  actionLoadingUserId,
  statusReasonByUserId,
  setStatusReasonByUserId,
  onToggleStatus,
  onChangeRole,
  spotlightUserId,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white/50 backdrop-blur-xl rounded-[40px] border border-white shadow-2xl overflow-hidden">
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-8 animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-100 rounded-[24px]" />
                <div className="space-y-3">
                  <div className="h-5 bg-slate-100 rounded-lg w-48" />
                  <div className="h-4 bg-slate-100 rounded-lg w-64" />
                </div>
              </div>
              <div className="h-12 bg-slate-100 rounded-2xl w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white/50 backdrop-blur-xl rounded-[40px] border border-white p-32 text-center shadow-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center border border-slate-100 shadow-inner">
            <User className="w-12 h-12 text-slate-200" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">Không có dữ liệu</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 font-medium">Chúng tôi không tìm thấy kết quả nào phù hợp với yêu cầu của bạn.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-[40px] border border-white shadow-2xl overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30 border-b border-slate-100/50">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hồ sơ chi tiết</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thông tin bổ sung</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Phân quyền</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            <AnimatePresence mode="popLayout">
              {users.map((user, index) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  index={index}
                  isSpotlight={spotlightUserId === user.id}
                  isActionLoading={actionLoadingUserId === user.id}
                  reason={statusReasonByUserId[user.id] ?? ''}
                  setReason={(val) => setStatusReasonByUserId(prev => ({ ...prev, [user.id]: val }))}
                  onToggleStatus={() => onToggleStatus(user)}
                  onChangeRole={(role) => onChangeRole(user.id, role)}
                />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface UserTableRowProps {
  user: AdminUserItem;
  index: number;
  isActionLoading: boolean;
  isSpotlight: boolean;
  reason: string;
  setReason: (val: string) => void;
  onToggleStatus: () => void;
  onChangeRole: (role: AppRole) => void;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  index,
  isActionLoading,
  isSpotlight,
  reason,
  setReason,
  onToggleStatus,
  onChangeRole,
}) => {
  const statusLabel = user.status ? 'Khóa tài khoản' : 'Mở khóa ngay';
  const joinedDate = new Date(user.createdAt).toLocaleDateString('vi-VN', { 
    day: '2-digit', month: '2-digit', year: 'numeric' 
  });

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        backgroundColor: isSpotlight ? 'rgba(236, 254, 255, 0.8)' : 'transparent'
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`group transition-all hover:bg-white/80`}
    >
      <td className="px-8 py-7">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[24px] flex items-center justify-center border-2 border-white shadow-lg overflow-hidden group-hover:scale-105 transition-transform duration-500">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-slate-400">{user.fullName.charAt(0)}</span>
              )}
            </div>
            <motion.div 
              animate={{ scale: user.status ? [1, 1.2, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white rounded-full ${user.status ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-rose-500 shadow-lg shadow-rose-500/50'}`} 
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
               <p className="font-black text-slate-950 text-base truncate group-hover:text-indigo-600 transition-colors" title={user.fullName}>{user.fullName}</p>
               {user.role === 'ADMIN' && <Fingerprint className="w-4 h-4 text-rose-500" />}
            </div>
            <div className="flex flex-col gap-1 text-slate-500">
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 opacity-70" />
                <p className="text-[10px] font-black uppercase tracking-wider">ID: {user.id}</p>
              </div>
               <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 opacity-70" />
                  <p className="text-xs font-bold truncate max-w-[180px]" title={user.email}>{user.email}</p>
               </div>
               <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 opacity-70" />
                  <p className="text-[10px] font-black uppercase tracking-wider">Gia nhập: {joinedDate}</p>
               </div>
            </div>
          </div>
        </div>
      </td>
      <td className="px-8 py-7">
        <div className="space-y-2">
           {user.school && (
             <div className="flex items-center gap-2 text-slate-600">
                <School className="w-3.5 h-3.5 opacity-50" />
                <span className="text-xs font-bold truncate max-w-[150px]">{user.school}</span>
             </div>
           )}
           {user.subject && (
             <div className="flex items-center gap-2 text-slate-600">
                <BookOpen className="w-3.5 h-3.5 opacity-50" />
                <span className="text-xs font-bold truncate max-w-[150px]">{user.subject}</span>
             </div>
           )}
           {user.phoneNumber && (
             <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 opacity-50" />
                <span className="text-xs font-black tracking-widest">{user.phoneNumber}</span>
             </div>
           )}
           {!user.school && !user.subject && !user.phoneNumber && (
             <span className="text-[10px] text-slate-400 font-black uppercase italic tracking-widest">Không có thông tin</span>
           )}
        </div>
      </td>
      <td className="px-8 py-7">
        <div className="flex flex-col gap-3">
          {getRoleBadge(user.role)}
          <div className="relative group/select">
            <select
              aria-label={`role-${user.id}`}
              value={user.role}
              onChange={(e) => onChangeRole(e.target.value as AppRole)}
              disabled={isActionLoading}
              className="w-full text-[11px] font-black bg-slate-50 border-none rounded-xl px-4 py-2 outline-none focus:ring-4 focus:ring-indigo-600/10 disabled:opacity-50 appearance-none cursor-pointer group-hover/select:bg-white group-hover/select:shadow-sm transition-all text-slate-700 uppercase tracking-widest"
            >
              <option value="USER">HỌC SINH</option>
              <option value="CONTRIBUTOR">GIÁO VIÊN</option>
              <option value="ADMIN">QUẢN TRỊ</option>
            </select>
            <MoreHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </td>
      <td className="px-8 py-7">
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={user.status ? "Lý do khóa..." : "Lý do mở..."}
              className="w-full px-4 py-2.5 text-xs font-bold bg-white/50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-200 outline-none transition-all placeholder:text-slate-300 shadow-inner"
            />
          </div>
          <AnimatePresence>
            {user.statusReason && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-start gap-2 text-[10px] text-slate-400 font-bold px-1"
              >
                <History className="w-3 h-3 mt-0.5 shrink-0 text-indigo-400" />
                <span className="line-clamp-2 italic">"{user.statusReason}"</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </td>
      <td className="px-8 py-7 text-right">
        <button
          onClick={onToggleStatus}
          disabled={isActionLoading}
          className={`
            min-w-[130px] px-6 py-3.5 rounded-[20px] text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-[0.95] disabled:opacity-50 shadow-lg
            ${user.status
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:shadow-rose-600/40'
              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-emerald-600/40'}
          `}
        >
          {isActionLoading ? (
             <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Xử lý...</span>
             </div>
          ) : statusLabel}
        </button>
      </td>
    </motion.tr>
  );
};

function getRoleBadge(role: AppRole) {
  switch (role) {
    case 'ADMIN':
      return <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-rose-50 to-orange-50 text-rose-700 text-[10px] font-black rounded-full border border-rose-100 uppercase tracking-widest shadow-sm"><ShieldCheck className="w-3.5 h-3.5" /> Admin</span>;
    case 'CONTRIBUTOR':
      return <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 text-[10px] font-black rounded-full border border-cyan-100 uppercase tracking-widest shadow-sm"><ShieldCheck className="w-3.5 h-3.5" /> Giáo viên</span>;
    default:
      return <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-slate-500 text-[10px] font-black rounded-full border border-slate-100 uppercase tracking-widest shadow-sm"><User className="w-3.5 h-3.5" /> Học sinh</span>;
  }
}

export default UserTable;