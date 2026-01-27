
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Movie, Ticket } from '../types';
import { MOVIES as DEFAULT_MOVIES, THEATERS, COMBOS } from '../constants';
import { GeminiService } from '../services/geminiService';

interface AdminPanelProps {
  onClose: () => void;
  onUpdate?: () => void;
}

interface UserRegistry {
  name: string;
  phone: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onUpdate }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [movies, setMovies] = useState<Movie[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<UserRegistry[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'movies' | 'customers'>('dashboard');
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  
  const [bookingSearch, setBookingSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');

  const posterFileRef = useRef<HTMLInputElement>(null);
  const backdropFileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(() => {
    try {
      const savedMovies = localStorage.getItem('cine_movies');
      if (savedMovies) {
        setMovies(JSON.parse(savedMovies));
      } else {
        setMovies(DEFAULT_MOVIES);
      }
      
      const savedTickets = localStorage.getItem('cine_tickets');
      setTickets(savedTickets ? JSON.parse(savedTickets) : []);

      const savedCustomers = localStorage.getItem('quinquin_users_registry');
      setCustomers(savedCustomers ? JSON.parse(savedCustomers) : []);
    } catch (err) {
      console.error("Data Load Error:", err);
    }
  }, []);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') setIsLoggedIn(true);
    fetchData();
    
    window.addEventListener('storage', fetchData);
    return () => window.removeEventListener('storage', fetchData);
  }, [fetchData]);

  const stats = useMemo(() => {
    const activeTickets = tickets.filter(t => t.status === 'active');
    const totalRevenue = activeTickets.reduce((sum, t) => sum + t.totalPrice, 0);
    const totalTickets = activeTickets.length;
    
    const movieStats: { [key: string]: { count: number, revenue: number } } = {};
    activeTickets.forEach(t => {
      if (!movieStats[t.movieTitle]) movieStats[t.movieTitle] = { count: 0, revenue: 0 };
      movieStats[t.movieTitle].count += 1;
      movieStats[t.movieTitle].revenue += t.totalPrice;
    });

    const sortedByCount = Object.entries(movieStats).sort((a, b) => b[1].count - a[1].count);
    const topMovie = sortedByCount[0]?.[0] || 'N/A';

    return { totalRevenue, totalTickets, topMovie };
  }, [tickets]);

  const filteredBookings = useMemo(() => {
    return tickets.filter(t => {
      const searchLower = bookingSearch.toLowerCase().trim();
      return t.id.toLowerCase().includes(searchLower) || 
             t.phoneNumber.includes(searchLower) || 
             t.movieTitle.toLowerCase().includes(searchLower);
    }).reverse();
  }, [tickets, bookingSearch]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const search = customerSearch.toLowerCase();
      return c.name.toLowerCase().includes(search) || 
             c.phone.includes(search);
    });
  }, [customers, customerSearch]);

  const handleDeleteCustomer = (phone: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản khách hàng SĐT: ${phone}?`)) {
      const updated = customers.filter(c => c.phone !== phone);
      localStorage.setItem('quinquin_users_registry', JSON.stringify(updated));
      setCustomers(updated);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'poster' | 'backdrop') => {
    const file = e.target.files?.[0];
    if (!file || !editingMovie) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh quá lớn (trên 2MB). Vui lòng chọn ảnh nhẹ hơn.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'poster') setEditingMovie({ ...editingMovie, posterUrl: base64, isManualPoster: true });
      else setEditingMovie({ ...editingMovie, backdropUrl: base64, isManualBackdrop: true });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie) return;

    let updatedMovies;
    if (isAddingNew) {
      updatedMovies = [...movies, { ...editingMovie, id: 'm' + Date.now() }];
    } else {
      updatedMovies = movies.map(m => (m.id === editingMovie.id ? editingMovie : m));
    }
    
    localStorage.setItem('cine_movies', JSON.stringify(updatedMovies));
    setMovies(updatedMovies);
    window.dispatchEvent(new Event('storage'));
    if (onUpdate) onUpdate();
    setEditingMovie(null);
    setIsAddingNew(false);
    alert("Hệ thống đã cập nhật thành công!");
  };

  const handleGenerateAI = async (type: 'poster' | 'backdrop') => {
    if (!editingMovie?.title) return alert("Vui lòng nhập tên phim trước!");
    setIsGeneratingImg(true);
    try {
      if (!(window as any).aistudio?.hasSelectedApiKey()) await (window as any).aistudio?.openSelectKey();
      const img = await GeminiService.generateMoviePoster(editingMovie.title, '1K', type === 'poster' ? '3:4' : '16:9');
      if (type === 'poster') setEditingMovie({ ...editingMovie, posterUrl: img, isManualPoster: false });
      else setEditingMovie({ ...editingMovie, backdropUrl: img, isManualBackdrop: false });
    } catch (err: any) {
      alert("Lỗi AI: " + err.message);
    } finally { setIsGeneratingImg(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (username === 'admin' && password === '123') {
            setIsLoggedIn(true);
            sessionStorage.setItem('admin_auth', 'true');
          } else setLoginError('Sai tài khoản hoặc mật khẩu!');
        }} className="glass w-full max-w-md p-10 rounded-[2.5rem] border-white/10 shadow-2xl">
          <div className="text-center mb-10"><div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center font-black text-3xl italic text-white mx-auto mb-4 shadow-2xl">Q</div><h2 className="text-2xl font-black italic uppercase tracking-tighter">QUẢN TRỊ VIÊN</h2></div>
          <div className="space-y-6"><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600 transition-all" placeholder="Tài khoản" required /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600 transition-all" placeholder="Mật khẩu" required />{loginError && <p className="text-red-500 text-xs text-center font-bold">{loginError}</p>}<button type="submit" className="w-full bg-red-600 text-white font-black py-4 rounded-2xl uppercase italic tracking-widest hover:bg-red-700 transition-all">XÁC NHẬN TRUY CẬP</button><button type="button" onClick={onClose} className="w-full text-zinc-600 text-[10px] font-black uppercase text-center tracking-widest mt-4 hover:text-white transition-colors italic">Quay lại trang chủ</button></div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] overflow-y-auto animate-in fade-in duration-300 custom-scrollbar pb-20">
      <div className="container mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 border-b border-white/5 pb-8 gap-6">
          <div className="flex items-center gap-4"><div className="w-1 h-8 bg-red-600 rounded-full"></div><h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">QUẢN TRỊ <span className="text-red-600">QUINQUIN</span></h1></div>
          <div className="flex gap-4"><button onClick={() => { sessionStorage.removeItem('admin_auth'); setIsLoggedIn(false); }} className="bg-zinc-900 text-zinc-500 px-6 py-3 rounded-xl font-black text-[10px] uppercase border border-white/5 hover:text-white transition-all">Đăng xuất</button><button onClick={onClose} className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-red-600 hover:text-white transition-all">Thoát</button></div>
        </header>

        <nav className="flex flex-wrap gap-4 mb-12">
          {[
            { id: 'dashboard', label: 'THỐNG KÊ' },
            { id: 'bookings', label: 'DANH SÁCH VÉ' },
            { id: 'movies', label: 'KHO PHIM' },
            { id: 'customers', label: 'QUẢN LÝ TÀI KHOẢN' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as any); setEditingMovie(null); }} 
              className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase italic tracking-widest transition-all ${activeTab === tab.id ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'bg-zinc-900 text-zinc-500 hover:text-white border border-white/5'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'dashboard' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6">
              <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 border-l-4 border-l-green-600"><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">DOANH THU</p><h3 className="text-3xl font-black text-white italic tracking-tighter">{stats.totalRevenue.toLocaleString()} Đ</h3></div>
              <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 border-l-4 border-l-red-600"><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">VÉ ĐÃ BÁN</p><h3 className="text-3xl font-black text-white italic tracking-tighter">{stats.totalTickets} VÉ</h3></div>
              <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 border-l-4 border-l-blue-600"><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">NGƯỜI DÙNG</p><h3 className="text-3xl font-black text-white italic tracking-tighter">{customers.length} USER</h3></div>
           </div>
        )}

        {activeTab === 'bookings' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
             <div className="glass p-6 rounded-[2rem] border-white/5 bg-zinc-900/40">
                <input type="text" value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} placeholder="Tìm kiếm vé theo SĐT, mã vé, phim..." className="w-full bg-black/50 border border-white/10 rounded-2xl py-5 px-6 text-xs text-white outline-none focus:border-red-600 font-bold placeholder:text-zinc-700" />
             </div>
             <div className="glass rounded-[3rem] border-white/5 overflow-hidden bg-zinc-900/20 shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-black/60 text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] italic border-b border-white/5">
                    <tr><th className="p-8">MÃ VÉ</th><th className="p-8">KHÁCH HÀNG</th><th className="p-8">PHIM & RẠP</th><th className="p-8 text-right">TỔNG TIỀN</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredBookings.map(t => (
                      <tr key={t.id} className="hover:bg-white/5 transition-all"><td className="p-8 font-black text-zinc-600 text-[10px]">{t.id}</td><td className="p-8 font-black text-white italic uppercase">{t.phoneNumber}</td><td className="p-8"><p className="text-[11px] font-black text-red-600 uppercase italic leading-none">{t.movieTitle}</p><p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">{t.theaterName}</p></td><td className="p-8 text-right font-black text-white text-sm italic">{t.totalPrice.toLocaleString()} Đ</td></tr>
                    ))}
                  </tbody>
                </table>
             </div>
           </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
            <div className="glass p-6 rounded-[2rem] border-white/5 bg-zinc-900/40">
               <input type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Tìm kiếm khách hàng theo tên hoặc SĐT..." className="w-full bg-black/50 border border-white/10 rounded-2xl py-5 px-6 text-xs text-white outline-none focus:border-red-600 font-bold placeholder:text-zinc-700" />
            </div>
            <div className="glass rounded-[3rem] border-white/5 overflow-hidden bg-zinc-900/20 shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-black/60 text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] italic border-b border-white/5">
                    <tr><th className="p-8">STT</th><th className="p-8">HỌ VÀ TÊN</th><th className="p-8">SỐ ĐIỆN THOẠI</th><th className="p-8 text-right">THAO TÁC</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCustomers.length === 0 ? (
                      <tr><td colSpan={4} className="p-32 text-center text-zinc-800 italic font-black uppercase tracking-widest text-sm">CHƯA CÓ KHÁCH HÀNG NÀO</td></tr>
                    ) : (
                      filteredCustomers.map((user, idx) => (
                        <tr key={user.phone} className="hover:bg-white/5 transition-all">
                          <td className="p-8 font-black text-zinc-700 text-[10px]">{idx + 1}</td>
                          <td className="p-8 font-black text-white italic uppercase text-sm">{user.name}</td>
                          <td className="p-8 text-zinc-500 font-bold text-xs">{user.phone}</td>
                          <td className="p-8 text-right"><button onClick={() => handleDeleteCustomer(user.phone)} className="text-[9px] font-black text-zinc-700 hover:text-red-600 uppercase italic tracking-widest transition-colors">XÓA TÀI KHOẢN</button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'movies' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase italic text-zinc-500">DANH SÁCH PHIM</h3>
                <button 
                  onClick={() => { setIsAddingNew(true); setEditingMovie({ id: '', title: '', description: '', genre: [''], rating: 0, duration: '', posterUrl: '', backdropUrl: '', releaseDate: new Date().toISOString().split('T')[0] }); }}
                  className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase shadow-lg shadow-red-600/20"
                >+ THÊM PHIM MỚI</button>
              </div>
              <div className="grid gap-3 h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {movies.map(movie => (
                  <div key={movie.id} onClick={() => { setEditingMovie(movie); setIsAddingNew(false); }} className={`glass p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-center ${editingMovie?.id === movie.id ? 'border-red-600 bg-red-600/10' : 'border-white/5 bg-zinc-950/40 hover:border-white/10'}`}>
                    <div className="w-14 h-20 overflow-hidden rounded-xl bg-zinc-900 shrink-0 border border-white/10"><img src={movie.posterUrl} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0"><h4 className="font-black text-white uppercase italic text-sm truncate">{movie.title}</h4><p className="text-[9px] text-zinc-600 font-bold uppercase mt-1 italic">{movie.genre.join(', ')}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              {editingMovie ? (
                <form onSubmit={handleSubmitMovie} className="glass p-10 rounded-[3rem] border-white/10 bg-zinc-900/40 space-y-10 animate-in slide-in-from-right-4">
                  <h2 className="text-3xl font-black uppercase italic text-red-600">{isAddingNew ? 'PHIM MỚI' : 'CHỈNH SỬA PHIM'}</h2>
                  
                  {/* MEDIA UPLOAD SECTION - NÂNG CẤP MỤC BỎ HÌNH */}
                  <div className="bg-black/20 p-8 rounded-[2.5rem] border border-white/5 space-y-8">
                    <h3 className="text-xs font-black uppercase italic text-zinc-500 tracking-widest border-l-4 border-red-600 pl-4">QUẢN LÝ HÌNH ẢNH (MEDIA)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-zinc-400 italic">POSTER CHÍNH (3:4)</label>
                        <div 
                           onClick={() => posterFileRef.current?.click()}
                           className="aspect-[3/4] rounded-[2rem] overflow-hidden bg-black border-2 border-dashed border-white/10 hover:border-red-600/50 transition-all cursor-pointer relative shadow-2xl group flex items-center justify-center"
                        >
                          {editingMovie.posterUrl ? (
                            <img src={editingMovie.posterUrl} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                          ) : (
                            <div className="text-center p-6"><svg className="mx-auto mb-2 text-zinc-700" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><p className="text-zinc-600 font-black italic uppercase text-[9px]">Click để nạp Poster</p></div>
                          )}
                          <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center font-black text-[10px] uppercase italic tracking-widest">Thay đổi hình ảnh</div>
                        </div>
                        <div className="flex gap-2">
                           <button type="button" onClick={() => handleGenerateAI('poster')} disabled={isGeneratingImg} className="flex-1 bg-red-600/10 text-red-600 py-3 rounded-xl font-black text-[9px] uppercase italic hover:bg-red-600 hover:text-white transition-all">🪄 AI GENERATE</button>
                           <input type="text" value={editingMovie.posterUrl || ''} onChange={(e) => setEditingMovie({...editingMovie, posterUrl: e.target.value})} className="flex-[2] bg-black/40 border border-white/10 rounded-xl px-4 text-[9px] text-zinc-500 font-bold outline-none" placeholder="Hoặc dán URL ảnh..." />
                        </div>
                        <input type="file" ref={posterFileRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'poster')} />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-zinc-400 italic">ẢNH BÌA / BACKDROP (16:9)</label>
                        <div 
                           onClick={() => backdropFileRef.current?.click()}
                           className="aspect-[16/9] rounded-[2rem] overflow-hidden bg-black border-2 border-dashed border-white/10 hover:border-orange-600/50 transition-all cursor-pointer relative shadow-2xl group flex items-center justify-center"
                        >
                          {editingMovie.backdropUrl ? (
                            <img src={editingMovie.backdropUrl} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                          ) : (
                            <div className="text-center p-6"><svg className="mx-auto mb-2 text-zinc-700" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><p className="text-zinc-600 font-black italic uppercase text-[9px]">Click để nạp Backdrop</p></div>
                          )}
                          <div className="absolute inset-0 bg-orange-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center font-black text-[10px] uppercase italic tracking-widest">Thay đổi hình ảnh</div>
                        </div>
                        <div className="flex gap-2">
                           <button type="button" onClick={() => handleGenerateAI('backdrop')} disabled={isGeneratingImg} className="flex-1 bg-orange-600/10 text-orange-600 py-3 rounded-xl font-black text-[9px] uppercase italic hover:bg-orange-600 hover:text-white transition-all">✨ AI GENERATE</button>
                           <input type="text" value={editingMovie.backdropUrl || ''} onChange={(e) => setEditingMovie({...editingMovie, backdropUrl: e.target.value})} className="flex-[2] bg-black/40 border border-white/10 rounded-xl px-4 text-[9px] text-zinc-500 font-bold outline-none" placeholder="Hoặc dán URL ảnh..." />
                        </div>
                        <input type="file" ref={backdropFileRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'backdrop')} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 block italic ml-1">TÊN PHIM *</label><input type="text" value={editingMovie.title} onChange={(e) => setEditingMovie({...editingMovie, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white font-black uppercase italic outline-none focus:border-red-600" required /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 block italic ml-1">THỂ LOẠI</label><input type="text" value={editingMovie.genre.join(', ')} onChange={(e) => setEditingMovie({...editingMovie, genre: e.target.value.split(',').map(g => g.trim())})} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:border-red-600" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 block italic ml-1">RATING</label><input type="number" step="0.1" value={editingMovie.rating} onChange={(e) => setEditingMovie({...editingMovie, rating: parseFloat(e.target.value)})} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white font-bold" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 block italic ml-1">THỜI LƯỢNG</label><input type="text" value={editingMovie.duration} onChange={(e) => setEditingMovie({...editingMovie, duration: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white font-bold" /></div>
                      </div>
                    </div>
                    <div className="space-y-2 flex flex-col"><label className="text-[10px] font-black uppercase text-zinc-500 block italic ml-1">MÔ TẢ PHIM *</label><textarea value={editingMovie.description} onChange={(e) => setEditingMovie({...editingMovie, description: e.target.value})} className="flex-1 w-full bg-black border border-white/10 rounded-3xl px-6 py-5 text-white text-sm font-medium outline-none focus:border-red-600 resize-none min-h-[200px]" required /></div>
                  </div>
                  <div className="pt-10 flex gap-4">
                    <button type="submit" className="flex-1 bg-red-600 text-white font-black py-7 rounded-[2rem] italic uppercase tracking-widest shadow-2xl shadow-red-600/40 hover:bg-red-700 transition-all">LƯU THÔNG TIN</button>
                    <button type="button" onClick={() => { setEditingMovie(null); setIsAddingNew(false); }} className="px-12 bg-zinc-800 text-zinc-400 font-black py-7 rounded-[2rem] uppercase italic tracking-widest hover:text-white transition-all">HỦY BỎ</button>
                  </div>
                </form>
              ) : (
                <div className="glass p-20 rounded-[4rem] border-white/5 bg-zinc-900/10 text-center h-[850px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 animate-in fade-in duration-700">
                   <p className="text-zinc-700 font-black uppercase italic text-xl tracking-[0.3em]">CHỌN PHIM ĐỂ QUẢN TRỊ</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
