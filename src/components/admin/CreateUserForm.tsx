import React from 'react';
import { UserPlus, Mail, Lock, Shield, User } from 'lucide-react';
import { type AppRole } from '../../api/axiosClient';

interface CreateUserFormProps {
  createForm: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: AppRole;
  };
  setCreateForm: React.Dispatch<React.SetStateAction<{
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: AppRole;
  }>>;
  isCreating: boolean;
  onCreate: (e: React.FormEvent) => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({
  createForm,
  setCreateForm,
  isCreating,
  onCreate,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-cyan-600" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 leading-none">Khởi tạo</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Thông tin tài khoản mới</p>
        </div>
      </div>

      <form onSubmit={onCreate} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Họ và tên</label>
          <div className="relative group">
            <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-600 transition-colors" />
            <input
              name="fullName"
              value={createForm.fullName}
              onChange={handleChange}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-[20px] focus:bg-white focus:border-cyan-600 focus:ring-0 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email liên hệ</label>
          <div className="relative group">
            <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-600 transition-colors" />
            <input
              name="email"
              type="email"
              value={createForm.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-[20px] focus:bg-white focus:border-cyan-600 focus:ring-0 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mật khẩu bảo mật</label>
          <div className="relative group">
            <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-600 transition-colors" />
            <input
              name="password"
              type="password"
              value={createForm.password}
              onChange={handleChange}
              placeholder="Ít nhất 8 ký tự..."
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-[20px] focus:bg-white focus:border-cyan-600 focus:ring-0 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nhập lại mật khẩu</label>
          <div className="relative group">
            <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-600 transition-colors" />
            <input
              id="admin-create-confirm-password"
              name="confirmPassword"
              type="password"
              value={createForm.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu..."
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-[20px] focus:bg-white focus:border-cyan-600 focus:ring-0 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="space-y-2 pb-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phân quyền</label>
          <div className="relative group">
            <Shield className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-600 transition-colors" />
            <select
              name="role"
              value={createForm.role}
              onChange={handleChange}
              className="w-full pl-11 pr-8 py-3.5 bg-slate-50 border-2 border-transparent rounded-[20px] focus:bg-white focus:border-cyan-600 focus:ring-0 outline-none transition-all appearance-none cursor-pointer font-black text-slate-700 uppercase text-xs tracking-widest"
            >
              <option value="USER">Học sinh (USER)</option>
              <option value="CONTRIBUTOR">Giáo viên (CONTRIBUTOR)</option>
              <option value="ADMIN">Quản trị (ADMIN)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-cyan-600 hover:shadow-cyan-600/20 transition-all active:scale-[0.95] disabled:opacity-50"
        >
          {isCreating ? (
            <div className="flex items-center justify-center gap-2">
               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
               <span>Đang tạo...</span>
            </div>
          ) : 'Xác nhận tạo mới'}
        </button>
      </form>
    </div>
  );
};

export default CreateUserForm;
