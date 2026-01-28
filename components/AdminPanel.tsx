
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Movie, Ticket } from '../types';
import { MOVIES as DEFAULT_MOVIES, THEATERS, COMBOS } from '../constants';
import { syncService, SyncEventType } from '../services/syncService';

interface AdminPanelProps {
  onClose: () => void;
  onUpdate?: () => void;
}

interface UserRegistry {
  name: string;
  phone: string;
  joinDate: string;
  password?: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onUpdate }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [movies, setMovies] = useState<Movie[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<UserRegistry[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'movies' | 'customers' | 'network'>('dashboard');
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const posterFileRef = useRef<HTMLInputElement>(null);
  const backdropFileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(() => {
    try {
      const savedMovies = localStorage.getItem('cine_movies');
      setMovies(savedMovies ? JSON.parse(savedMovies) : DEFAULT_MOVIES);
      const savedTickets = localStorage.getItem('cine_tickets');
      setTickets(savedTickets ? JSON.parse(savedTickets) : []);
      const savedCustomers = localStorage.getItem('quinquin_users_registry');
      setCustomers(savedCustomers ? JSON.parse(savedCustomers) : []);
    } catch (err) {
      console.error("Lỗi nạp dữ liệu:", err);
    }
  }, []);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') setIsLoggedIn(true);
    fetchData();

    setLogs([
      `[${new Date().toLocaleTimeString()}] Trung tâm điều hành đã sẵn sàng.`,
      `[${new Date().toLocaleTimeString()}] Kết nối thành công với Nút: ${syncService.getClientId()}`,
      `[${new Date().toLocaleTimeString()}] Kiểm tra cơ sở dữ liệu: HOÀN TẤT.`
    ]);

    const unsubscribe = syncService.subscribe((msg) => {
      if (msg.type === SyncEventType.TICKET_BOOKED) {
        fetchData();
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] Yêu cầu đến: Vé mới cho phim ${msg.payload.movieTitle}`, ...prev].slice(0, 50));
      }
    });

    return () => unsubscribe();
  }, [fetchData]);

  const metrics = useMemo(() => {
    const active = tickets.filter(t => t.status === 'active');
    const totalRev = active.reduce((s, t) => s + t.totalPrice, 0);
    const avgTicket = totalRev / (active.length || 1);
    
    const moviePopularity: Record<string, number> = {};
    active.forEach(t => {
      moviePopularity[t.movieTitle] = (moviePopularity[t.movieTitle] || 0) + 1;
    });
    const topMovie = Object.entries(moviePopularity).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A';

    return { totalRev, totalTickets: active.length, avgTicket, topMovie };
  }, [tickets]);

  const filteredBookings = useMemo(() => {
    return tickets.filter(t => 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.phoneNumber.includes(searchTerm) ||
      t.movieTitle.toLowerCase().includes(searchTerm.toLowerCase())
    ).reverse();
  }, [tickets, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const handleSaveMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie) return;
    let updated;
    if (isAddingNew) updated = [...movies, { ...editingMovie, id: 'm' + Date.now() }];
    else updated = movies.map(m => m.id === editingMovie.id ? editingMovie : m);
    
    localStorage.setItem('cine_movies', JSON.stringify(updated));
    setMovies(updated);
    syncService.broadcast(SyncEventType.MOVIE_UPDATED, updated);
    setEditingMovie(null);
    setIsAddingNew(false);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] CẬP NHẬT CSDL: Danh sách phim đã đồng bộ toàn hệ thống.`, ...prev]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'poster' | 'backdrop') => {
    const file = e.target.files?.[0];
    if (file && editingMovie) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'poster') {
          setEditingMovie({ ...editingMovie, posterUrl: base64 });
        } else {
          setEditingMovie({ ...editingMovie, backdropUrl: base64 });
        }
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] TẢI ẢNH: Đã cập nhật ${type === 'poster' ? 'Poster' : 'Ảnh bìa'} cho ${editingMovie.title}`, ...prev]);
      };
      reader.readAsDataURL(file);
    }
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
          <div className="text-center mb-10"><h2 className="text-2xl font-black italic uppercase tracking-tighter">ĐĂNG NHẬP QUẢN TRỊ</h2></div>
          <div className="space-y-6">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" placeholder="Tài khoản" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600" placeholder="Mật khẩu" required />
            <button type="submit" className="w-full bg-red-600 text-white font-black py-4 rounded-2xl uppercase italic tracking-widest">TRUY CẬP HỆ THỐNG</button>
            <button type="button" onClick={onClose} className="w-full text-zinc-600 text-[10px] font-black uppercase text-center mt-4 italic">Về trang chủ</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] overflow-y-auto pb-20 selection:bg-red-600 selection:text-white">
      <div className="container mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 border-b border-white/5 pb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black italic text-white shadow-xl shadow-red-600/30">Q</div>
            <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">QUINQUIN <span className="text-red-600">BẢNG ĐIỀU KHIỂN CHÍNH</span></h1>
          </div>
          <div className="flex gap-4">
             <button onClick={() => { sessionStorage.removeItem('admin_auth'); setIsLoggedIn(false); }} className="bg-zinc-900 text-zinc-500 px-6 py-3 rounded-xl font-black text-[10px] uppercase border border-white/5 hover:text-white transition-all">Đăng xuất</button>
             <button onClick={onClose} className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-red-600 hover:text-white transition-all">Thoát Console</button>
          </div>
        </header>

        <nav className="flex flex-wrap gap-4 mb-12">
          {[
            { id: 'dashboard', label: 'THỐNG KÊ' },
            { id: 'bookings', label: 'VÉ ĐÃ ĐẶT' },
            { id: 'movies', label: 'KHO PHIM' },
            { id: 'customers', label: 'KHÁCH HÀNG' },
            { id: 'network', label: 'GIÁM SÁT MẠNG' }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase italic tracking-widest transition-all ${activeTab === tab.id ? 'bg-red-600 text-white shadow-[0_0_25px_rgba(225,29,72,0.35)]' : 'bg-zinc-900 text-zinc-500 hover:text-white border border-white/5'}`}>{tab.label}</button>
          ))}
        </nav>

        {activeTab === 'dashboard' && (
           <div className="space-y-10 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 border-l-4 border-l-green-600"><p className="text-[9px] font-black text-zinc-500 uppercase mb-1 italic">DOANH THU</p><h3 className="text-3xl font-black text-white italic tracking-tighter">{metrics.totalRev.toLocaleString()} Đ</h3></div>
                <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 border-l-4 border-l-red-600"><p className="text-[9px] font-black text-zinc-500 uppercase mb-1 italic">TỔNG VÉ</p><h3 className="text-3xl font-black text-white italic tracking-tighter">{metrics.totalTickets} UNIT</h3></div>
                <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 border-l-4 border-l-blue-600"><p className="text-[9px] font-black text-zinc-500 uppercase mb-1 italic">TB/VÉ</p><h3 className="text-3xl font-black text-white italic tracking-tighter">{Math.round(metrics.avgTicket).toLocaleString()} Đ</h3></div>
                <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40 border-l-4 border-l-yellow-600"><p className="text-[9px] font-black text-zinc-500 uppercase mb-1 italic">PHIM ĂN KHÁCH</p><h3 className="text-xl font-black text-white italic tracking-tight truncate">{metrics.topMovie}</h3></div>
              </div>
              <div className="glass p-10 rounded-[3rem] border-white/5 bg-zinc-900/20">
                 <h4 className="text-xs font-black uppercase text-zinc-500 mb-8 italic tracking-widest">HIỆU SUẤT DOANH THU (GIẢ LẬP)</h4>
                 <div className="flex items-end gap-4 h-64">
                    {[65, 45, 85, 30, 95, 70, 55, 90, 40, 60, 75, 50].map((v, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-red-600/10 to-red-600 rounded-t-xl group relative" style={{ height: `${v}%` }}>
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{(v * 1000).toLocaleString()}Đ</div>
                      </div>
                    ))}
                 </div>
                 <div className="flex justify-between mt-6 px-2 text-[8px] font-black text-zinc-700 uppercase italic">
                    <span>Th1</span><span>Th2</span><span>Th3</span><span>Th4</span><span>Th5</span><span>Th6</span><span>Th7</span><span>Th8</span><span>Th9</span><span>Th10</span><span>Th11</span><span>Th12</span>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="glass p-6 rounded-[2rem] border-white/5"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm theo SĐT, Mã vé hoặc Tên phim..." className="w-full bg-black/50 border border-white/10 rounded-2xl py-5 px-6 text-xs text-white outline-none focus:border-red-600 font-bold" /></div>
             <div className="glass rounded-[3rem] border-white/5 overflow-hidden bg-zinc-900/20 shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-black/60 text-zinc-500 text-[9px] font-black uppercase tracking-widest italic border-b border-white/5">
                    <tr><th className="p-8">MÃ VÉ</th><th className="p-8">KHÁCH HÀNG</th><th className="p-8">PHIM / RẠP</th><th className="p-8">GHẾ</th><th className="p-8 text-right">TỔNG TIỀN</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan={5} className="p-32 text-center text-zinc-800 italic font-black uppercase tracking-widest text-sm">KHÔNG TÌM THẤY DỮ LIỆU</td></tr>
                    ) : filteredBookings.map(t => (
                      <tr key={t.id} className="hover:bg-white/5 transition-all">
                        <td className="p-8 font-black text-zinc-600 text-[10px]">{t.id}</td>
                        <td className="p-8 font-black text-white italic uppercase text-xs">{t.phoneNumber}</td>
                        <td className="p-8"><p className="text-[11px] font-black text-red-600 uppercase italic leading-none">{t.movieTitle}</p><p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">{t.theaterName}</p></td>
                        <td className="p-8 font-black text-zinc-400 text-[10px]">{t.seats.join(', ')}</td>
                        <td className="p-8 text-right font-black text-white text-sm italic">{t.totalPrice.toLocaleString()} Đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'movies' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in">
             <div className="lg:col-span-4 space-y-6">
                <button onClick={() => { setIsAddingNew(true); setEditingMovie({ id: '', title: '', description: '', genre: [''], rating: 0, duration: '', posterUrl: '', backdropUrl: '', releaseDate: new Date().toISOString().split('T')[0], isComingSoon: false }); }} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-lg shadow-red-600/20">+ THÊM PHIM MỚI</button>
                <div className="grid gap-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="text-[9px] font-black text-zinc-600 uppercase italic mb-2 tracking-widest pl-2">Đang chiếu</div>
                  {movies.filter(m => !m.isComingSoon).map(movie => (
                    <div key={movie.id} onClick={() => { setEditingMovie(movie); setIsAddingNew(false); }} className={`glass p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-center ${editingMovie?.id === movie.id ? 'border-red-600 bg-red-600/10' : 'border-white/5 bg-zinc-950/40 hover:border-white/10'}`}>
                      <div className="w-10 h-14 rounded-lg bg-zinc-900 shrink-0 overflow-hidden"><img src={movie.posterUrl} className="w-full h-full object-cover" /></div>
                      <div className="flex-1 min-w-0"><h4 className="font-black text-white uppercase italic text-[11px] truncate">{movie.title}</h4><p className="text-[8px] text-zinc-600 font-bold uppercase mt-1 italic">{movie.genre[0]}</p></div>
                    </div>
                  ))}
                  <div className="text-[9px] font-black text-zinc-600 uppercase italic mt-6 mb-2 tracking-widest pl-2">Sắp chiếu</div>
                  {movies.filter(m => m.isComingSoon).map(movie => (
                    <div key={movie.id} onClick={() => { setEditingMovie(movie); setIsAddingNew(false); }} className={`glass p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-center ${editingMovie?.id === movie.id ? 'border-red-600 bg-red-600/10' : 'border-white/5 bg-zinc-950/40 hover:border-white/10'}`}>
                      <div className="w-10 h-14 rounded-lg bg-zinc-900 shrink-0 overflow-hidden"><img src={movie.posterUrl} className="w-full h-full object-cover" /></div>
                      <div className="flex-1 min-w-0"><h4 className="font-black text-white uppercase italic text-[11px] truncate">{movie.title}</h4><p className="text-[8px] text-zinc-600 font-bold uppercase mt-1 italic">{movie.genre[0]}</p></div>
                    </div>
                  ))}
                </div>
             </div>
             <div className="lg:col-span-8">
                {editingMovie ? (
                  <form onSubmit={handleSaveMovie} className="glass p-10 rounded-[3rem] border-white/10 bg-zinc-900/40 space-y-8 animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-black uppercase italic text-red-600">{isAddingNew ? 'MỤC MỚI' : 'CHỈNH SỬA PHIM'}</h2></div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase text-zinc-500 italic">POSTER (3:4)</label>
                          <div className="aspect-[3/4] rounded-2xl bg-black border border-white/10 overflow-hidden relative group">
                             {editingMovie.posterUrl ? <img src={editingMovie.posterUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-800 text-[10px] font-black uppercase italic">Chưa có ảnh</div>}
                             <input type="file" ref={posterFileRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'poster')} />
                             <button type="button" onClick={() => posterFileRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-[9px] uppercase italic tracking-widest">TẢI ẢNH LÊN</button>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase text-zinc-500 italic">ẢNH BÌA (16:9)</label>
                          <div className="aspect-[16/9] rounded-2xl bg-black border border-white/10 overflow-hidden relative group">
                             {editingMovie.backdropUrl ? <img src={editingMovie.backdropUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-800 text-[10px] font-black uppercase italic">Chưa có ảnh</div>}
                             <input type="file" ref={backdropFileRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'backdrop')} />
                             <button type="button" onClick={() => backdropFileRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-[9px] uppercase italic tracking-widest">TẢI ẢNH LÊN</button>
                          </div>
                          <div className="space-y-4">
                             <div className="space-y-1"><label className="text-[8px] font-black text-zinc-500 uppercase italic">TÊN PHIM</label><input type="text" value={editingMovie.title} onChange={(e) => setEditingMovie({...editingMovie, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-600" /></div>
                             <div className="flex gap-4">
                               <div className="flex-1 space-y-1"><label className="text-[8px] font-black text-zinc-500 uppercase italic">THỜI LƯỢNG</label><input type="text" value={editingMovie.duration} onChange={(e) => setEditingMovie({...editingMovie, duration: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-600" /></div>
                               <div className="flex-1 space-y-1"><label className="text-[8px] font-black text-zinc-500 uppercase italic">ĐIỂM SỐ</label><input type="number" step="0.1" value={editingMovie.rating} onChange={(e) => setEditingMovie({...editingMovie, rating: parseFloat(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-600" /></div>
                             </div>
                             <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                                <label className="text-[10px] font-black text-zinc-400 uppercase italic flex-1">PHIM SẮP CHIẾU</label>
                                <input type="checkbox" checked={editingMovie.isComingSoon} onChange={(e) => setEditingMovie({...editingMovie, isComingSoon: e.target.checked})} className="w-5 h-5 accent-red-600" />
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-1"><label className="text-[8px] font-black text-zinc-500 uppercase italic">MÔ TẢ</label><textarea value={editingMovie.description} onChange={(e) => setEditingMovie({...editingMovie, description: e.target.value})} className="w-full h-24 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-400 outline-none focus:border-red-600" /></div>
                    <div className="pt-4 flex gap-4"><button type="submit" className="flex-1 bg-red-600 text-white font-black py-5 rounded-2xl italic uppercase tracking-widest shadow-2xl shadow-red-600/30">LƯU & ĐỒNG BỘ</button><button type="button" onClick={() => setEditingMovie(null)} className="px-10 bg-zinc-800 text-zinc-500 py-5 rounded-2xl font-black italic uppercase tracking-widest">HỦY BỎ</button></div>
                  </form>
                ) : (
                  <div className="glass p-20 rounded-[4rem] border-white/5 bg-zinc-900/10 text-center h-[700px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-900"><p className="text-zinc-700 font-black uppercase italic text-sm tracking-[0.4em]">CHỌN MỘT BỘ PHIM ĐỂ QUẢN TRỊ</p></div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="glass p-6 rounded-[2rem] border-white/5"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm theo Tên hoặc Số điện thoại..." className="w-full bg-black/50 border border-white/10 rounded-2xl py-5 px-6 text-xs text-white outline-none focus:border-red-600 font-bold" /></div>
             <div className="glass rounded-[3rem] border-white/5 overflow-hidden bg-zinc-900/20 shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-black/60 text-zinc-500 text-[9px] font-black uppercase tracking-widest italic border-b border-white/5">
                    <tr><th className="p-8">NGÀY THAM GIA</th><th className="p-8">HỌ TÊN</th><th className="p-8">SỐ ĐIỆN THOẠI</th><th className="p-8">TỔNG CHI TIÊU</th><th className="p-8 text-right">XẾP HẠNG</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCustomers.length === 0 ? (
                      <tr><td colSpan={5} className="p-32 text-center text-zinc-800 italic font-black uppercase tracking-widest text-sm">CHƯA CÓ KHÁCH HÀNG ĐĂNG KÝ</td></tr>
                    ) : filteredCustomers.map(c => {
                      const clientTickets = tickets.filter(t => t.phoneNumber === c.phone && t.status === 'active');
                      const spend = clientTickets.reduce((s, t) => s + t.totalPrice, 0);
                      const tier = clientTickets.length >= 15 ? 'VÀNG' : clientTickets.length >= 5 ? 'BẠC' : 'ĐỒNG';
                      const tierColor = tier === 'VÀNG' ? 'text-yellow-400' : tier === 'BẠC' ? 'text-zinc-400' : 'text-orange-500';
                      
                      return (
                        <tr key={c.phone} className="hover:bg-white/5 transition-all">
                          <td className="p-8 font-black text-zinc-600 text-[10px]">{new Date(c.joinDate).toLocaleDateString('vi-VN')}</td>
                          <td className="p-8 font-black text-white italic uppercase text-xs">{c.name}</td>
                          <td className="p-8 font-black text-zinc-400 text-[10px]">{c.phone}</td>
                          <td className="p-8 font-black text-zinc-300 text-[11px]">{spend.toLocaleString()} Đ</td>
                          <td className={`p-8 text-right font-black italic text-[10px] tracking-widest ${tierColor}`}>{tier}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="glass p-12 rounded-[4rem] border-white/5 bg-zinc-950/50 space-y-10 animate-in zoom-in-95">
             <div className="flex items-center justify-between border-b border-white/10 pb-8">
                <div>
                   <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">GIÁM SÁT LƯU LƯỢNG MẠNG</h2>
                   <p className="text-[9px] font-black text-zinc-500 uppercase italic tracking-widest mt-1">DÒNG DỮ LIỆU BROADCASTCHANNEL THỜI GIAN THỰC</p>
                </div>
                <div className="flex gap-4">
                   <span className="bg-green-600/10 text-green-500 text-[10px] font-black px-5 py-2 rounded-xl border border-green-600/20 flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> HỆ THỐNG ỔN ĐỊNH</span>
                   <span className="bg-blue-600/10 text-blue-500 text-[10px] font-black px-5 py-2 rounded-xl border border-blue-600/20 uppercase tracking-widest italic">{syncService.getClientId()}</span>
                </div>
             </div>
             
             <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                   {logs.map((log, idx) => (
                     <div key={idx} className="flex items-center justify-between p-5 bg-zinc-900/60 rounded-2xl border border-white/5 group hover:border-red-600/20 transition-all">
                        <p className={`text-[11px] font-mono leading-relaxed ${log.includes('Yêu cầu') ? 'text-red-500 font-black' : log.includes('CẬP NHẬT CSDL') ? 'text-blue-400' : 'text-zinc-500'}`}>{log}</p>
                        <span className="text-[8px] font-black text-zinc-800 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Trace Route OK</span>
                     </div>
                   ))}
                </div>
                <div className="space-y-6">
                   <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/20">
                      <h5 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic">NÚT MÁY CHỦ</h5>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-white uppercase italic tracking-tight">QUINQUIN-MÁY-CHỦ-CHÍNH</span><span className="text-[9px] font-black text-green-500 uppercase">Chính</span></div>
                         <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-zinc-500 uppercase italic tracking-tight">QUINQUIN-CSDL</span><span className="text-[9px] font-black text-green-500 uppercase">Sẵn sàng</span></div>
                         <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-zinc-500 uppercase italic tracking-tight">CẦU-NỐI-AI</span><span className="text-[9px] font-black text-blue-500 uppercase">Đang chạy</span></div>
                      </div>
                   </div>
                   <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/20">
                      <h5 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic">TẢI HỆ THỐNG</h5>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-red-600 w-[64%] shadow-[0_0_10px_#e11d48]"></div></div>
                      <p className="mt-3 text-[10px] font-black text-white italic">64.2% CPU <span className="text-zinc-700 ml-4">1.2GB RAM</span></p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
