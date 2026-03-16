import React from 'react';
import { Search, Sparkles } from 'lucide-react';

interface UserFiltersProps {
  searchInput: string;
  setSearchInput: React.Dispatch<React.SetStateAction<string>>;
  roleFilter: string;
  setRoleFilter: (role: any) => void;
  onSearch: (e: React.FormEvent) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchInput,
  setSearchInput,
  onSearch,
}) => {
  return (
    <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white shadow-2xl">
      <div className="flex flex-col md:flex-row gap-6">
        <form onSubmit={onSearch} className="flex-1 relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 pointer-events-none">
            <Search className="w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <div className="w-px h-5 bg-slate-200 group-focus-within:bg-indigo-200 transition-colors" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm thông minh: Tên, Email, Số điện thoại hoặc Trường học..."
            className="w-full pl-20 pr-8 py-5 bg-white/50 border-2 border-transparent rounded-[28px] focus:bg-white focus:border-indigo-600 focus:ring-0 outline-none transition-all shadow-inner font-bold text-slate-700 placeholder:text-slate-300"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block">
             <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-slate-950 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-[20px] hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-600/20 transition-all active:scale-95">
                <Sparkles className="w-4 h-4" />
                <span>Truy vấn</span>
             </button>
          </div>
        </form>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 px-6">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 mt-1">Gợi ý:</p>
         {['@gmail.com', 'Giáo viên', 'Đã khóa', 'Trường THPT'].map((tag) => (
           <button 
             key={tag}
             type="button"
             onClick={() => setSearchInput(tag)}
             className="px-3 py-1 bg-slate-100/50 hover:bg-white rounded-lg text-[10px] font-bold text-slate-500 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all"
           >
             {tag}
           </button>
         ))}
      </div>
    </div>
  );
};

export default UserFilters;