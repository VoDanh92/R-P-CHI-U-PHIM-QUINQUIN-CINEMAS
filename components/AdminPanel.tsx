
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Movie, Ticket } from '../types';
import { MOVIES as DEFAULT_MOVIES } from '../constants';
import { syncService, SyncEventType } from '../services/syncService';
import { storageService } from '../services/storageService';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [movies, setMovies] = useState<Movie[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'movies' | 'customers' | 'network'>('movies');
  const [logs, setLogs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Movie | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const movieList = await storageService.getMovies();
      setMovies(movieList);
      
      const savedTickets = localStorage.getItem('cine_tickets');
      const parsedTickets = savedTickets ? JSON.parse(savedTickets) : [];
      setTickets(parsedTickets);

      const registry = JSON.parse(localStorage.getItem('quinquin_users_registry') || '[]');
      setUsers(registry);

      if (!selectedMovieId && movieList.length > 0) {
        setSelectedMovieId(movieList[0].id);
        setEditForm({ ...movieList[0] });
      }
    } catch (e) {
      setMovies(DEFAULT_MOVIES);
    }
  }, [selectedMovieId]);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') setIsLoggedIn(true);
    fetchData();
    
    setLogs(prev => [
      `[${new Date().toLocaleTimeString()}] Hệ thống quản trị đã trực tuyến.`,
      `[${new Date().toLocaleTimeString()}] Kết nối cơ sở dữ liệu: THÀNH CÔNG.`,
      ...prev
    ]);

    const unsubscribe = syncService.subscribe((msg) => {
      if (msg.type === SyncEventType.TICKET_BOOKED) fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const stats = useMemo(() => {
    const totalRev = tickets.reduce((s, t) => s + (t.status === 'active' ? t.totalPrice : 0), 0);
    const totalUnits = tickets.length;
    const avg = totalUnits > 0 ? Math.floor(totalRev / totalUnits) : 0;
    const movieCounts: Record<string, number> = {};
    tickets.forEach(t => { movieCounts[t.movieTitle] = (movieCounts[t.movieTitle] || 0) + 1; });
    const topMovie = Object.entries(movieCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    return { totalRev, totalUnits, avg, topMovie };
  }, [tickets]);

  const saveMovies = async (updatedList: Movie[]) => {
    try {
      await storageService.saveMovies(updatedList);
      setMovies(updatedList);
      syncService.broadcast(SyncEventType.MOVIE_UPDATED, updatedList);
    } catch (e) {
      console.error(e);
      alert("Cảnh báo: Lỗi khi lưu trữ dữ liệu. Vui lòng thử lại với file nhỏ hơn hoặc xóa bộ nhớ trình duyệt.");
    }
  };

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovieId(movie.id);
    setEditForm({ ...movie });
  };

  const handleSaveMovie = async () => {
    if (!editForm) return;
    const updated = movies.map(m => m.id === editForm.id ? { ...editForm } : m);
    await saveMovies(updated);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] Đã cập nhật & đồng bộ: ${editForm.title}`, ...prev]);
    alert("Dữ liệu phim đã được lưu và đồng bộ toàn hệ thống!");
  };

  const handleFileUpload = (type: 'poster' | 'backdrop' | 'trailer') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'trailer' ? 'video/mp4,video/webm' : 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        if (type === 'trailer' && file.size > 50 * 1024 * 1024) {
          alert("Video quá lớn! Vui lòng chọn clip ngắn hơn 50MB.");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (editForm) {
            const updated = { ...editForm };
            if (type === 'poster') updated.posterUrl = result;
            else if (type === 'backdrop') updated.backdropUrl = result;
            else updated.trailerUrl = result;
            setEditForm(updated);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.phone.includes(searchQuery)
    );
  }, [users, searchQuery]);

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#050505] flex items-center justify-center p-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (username === 'admin' && password === '123') {
            setIsLoggedIn(true);
            sessionStorage.setItem('admin_auth', 'true');
          } else setLoginError('ID hoặc mật mã không chính xác!');
        }} className="glass w-full max-w-md p-12 rounded-[3rem] border-white/10 text-center shadow-[0_0_80px_rgba(225,29,72,0.1)]">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center font-black text-3xl italic text-white mx-auto mb-6 shadow-2xl">Q</div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">QUINQUIN CONSOLE</h2>
          <div className="space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600 transition-all" placeholder="ID Quản trị" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600 transition-all" placeholder="Mật mã" />
            {loginError && <p className="text-red-500 text-[10px] font-black uppercase italic tracking-widest">{loginError}</p>}
            <button type="submit" className="w-full bg-red-600 py-5 rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-2xl hover:bg-red-700 transition-all">TRUY CẬP HỆ THỐNG</button>
            <button type="button" onClick={onClose} className="w-full text-zinc-700 text-[9px] font-black uppercase tracking-widest mt-2 hover:text-zinc-500">Quay lại trang chủ</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#020202] overflow-y-auto custom-scrollbar text-white">
      <div className="container mx-auto px-6 py-10 min-h-screen flex flex-col">
        {/* Top Header Section */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center font-black text-2xl italic shadow-xl shadow-red-600/20">Q</div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">QUINQUIN <span className="text-red-600">BẢNG ĐIỀU KHIỂN CHÍNH</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { sessionStorage.removeItem('admin_auth'); setIsLoggedIn(false); }} className="px-6 py-3 bg-zinc-900/50 border border-white/5 rounded-xl text-[9px] font-black uppercase italic text-zinc-600 hover:text-white transition-all">ĐĂNG XUẤT</button>
            <button onClick={onClose} className="px-8 py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase italic shadow-2xl hover:bg-gray-200 transition-all">THOÁT CONSOLE</button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex gap-2 mb-10 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'dashboard', label: 'THỐNG KÊ' },
            { id: 'bookings', label: 'VÉ ĐÃ ĐẶT' },
            { id: 'movies', label: 'KHO PHIM' },
            { id: 'customers', label: 'KHÁCH HÀNG' },
            { id: 'network', label: 'GIÁM SÁT MẠNG' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase italic tracking-[0.2em] transition-all border whitespace-nowrap ${activeTab === tab.id ? 'bg-red-600 text-white border-red-500 shadow-xl' : 'bg-zinc-900/30 text-zinc-600 border-white/5 hover:border-white/10'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Contents */}
        <div className="flex-1">
          {activeTab === 'movies' && (
            <div className="flex flex-col lg:flex-row gap-8 animate-in pb-10">
              {/* Sidebar List */}
              <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6">
                <button onClick={() => {
                  const newMovie: Movie = { id: 'm' + Date.now(), title: 'PHIM MỚI', description: '', genre: ['Hành động'], rating: 0, duration: '0h 00m', posterUrl: '', backdropUrl: '', releaseDate: new Date().toISOString().split('T')[0], isComingSoon: false };
                  const updatedList = [newMovie, ...movies];
                  saveMovies(updatedList);
                  handleSelectMovie(newMovie);
                }} className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black italic uppercase tracking-widest text-[11px] shadow-2xl hover:scale-[1.02] transition-transform">
                  + THÊM PHIM MỚI
                </button>
                
                <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[60vh]">
                  {['ĐANG CHIẾU', 'SẮP CHIẾU'].map(section => (
                    <div key={section} className="space-y-4">
                      <h3 className="text-[9px] font-black text-zinc-700 uppercase italic tracking-widest ml-4">{section}</h3>
                      {movies.filter(m => section === 'ĐANG CHIẾU' ? !m.isComingSoon : m.isComingSoon).map(movie => (
                        <div 
                          key={movie.id} 
                          onClick={() => handleSelectMovie(movie)}
                          className={`group p-4 rounded-[2rem] flex items-center gap-5 cursor-pointer border-2 transition-all ${selectedMovieId === movie.id ? 'bg-zinc-900/50 border-red-600 shadow-[0_0_25px_rgba(225,29,72,0.15)]' : 'bg-zinc-900/10 border-white/5 hover:border-white/10'}`}
                        >
                          <div className="w-14 h-20 bg-zinc-800 rounded-2xl overflow-hidden shrink-0">
                             {movie.posterUrl ? <img src={movie.posterUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-900 font-black">?</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-[11px] font-black uppercase italic truncate ${selectedMovieId === movie.id ? 'text-white' : 'text-zinc-600 group-hover:text-white'}`}>{movie.title}</h4>
                            <p className="text-[8px] font-black text-zinc-700 uppercase italic mt-1">{movie.genre[0]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Editor Pane */}
              <div className="flex-1 glass p-10 rounded-[3.5rem] border-white/10 bg-zinc-900/5 min-h-[750px]">
                {editForm ? (
                  <div className="space-y-10 h-full flex flex-col animate-in">
                    <h2 className="text-3xl font-black italic uppercase text-red-600 tracking-tighter">CHỈNH SỬA PHIM</h2>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                      {/* Left Side: Media Uploads */}
                      <div className="space-y-8">
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                               <p className="text-[9px] font-black text-zinc-600 uppercase italic ml-2">POSTER (3:4)</p>
                               <div onClick={() => handleFileUpload('poster')} className="aspect-[3/4] bg-black rounded-[2.5rem] border-2 border-dashed border-zinc-900 hover:border-red-600 transition-all flex items-center justify-center overflow-hidden cursor-pointer group relative">
                                  {editForm.posterUrl ? <img src={editForm.posterUrl} className="w-full h-full object-cover group-hover:opacity-30 transition-opacity" /> : <span className="text-zinc-900 text-4xl font-black">+</span>}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                     <span className="text-[8px] font-black uppercase text-white bg-red-600 px-3 py-1 rounded-full">Tải ảnh lên</span>
                                  </div>
                               </div>
                            </div>
                            <div className="space-y-6">
                               <div className="space-y-3">
                                  <p className="text-[9px] font-black text-zinc-600 uppercase italic ml-2">ẢNH BÌA (16:9)</p>
                                  <div onClick={() => handleFileUpload('backdrop')} className="aspect-video bg-black rounded-[2.5rem] border-2 border-dashed border-zinc-900 hover:border-red-600 transition-all flex items-center justify-center overflow-hidden cursor-pointer group relative">
                                     {editForm.backdropUrl ? <img src={editForm.backdropUrl} className="w-full h-full object-cover group-hover:opacity-30 transition-opacity" /> : <span className="text-zinc-900 text-4xl font-black">+</span>}
                                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[8px] font-black uppercase text-white bg-red-600 px-3 py-1 rounded-full">Tải ảnh lên</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                     <label className="text-[8px] font-black text-zinc-700 uppercase ml-2 tracking-widest">THỜI LƯỢNG</label>
                                     <input type="text" value={editForm.duration} onChange={(e) => setEditForm({...editForm, duration: e.target.value})} className="w-full bg-black border border-white/5 rounded-xl p-4 text-[11px] font-bold outline-none focus:border-red-600/50" />
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[8px] font-black text-zinc-700 uppercase ml-2 tracking-widest">ĐIỂM SỐ</label>
                                     <input type="number" step="0.1" value={editForm.rating} onChange={(e) => setEditForm({...editForm, rating: parseFloat(e.target.value)})} className="w-full bg-black border border-white/5 rounded-xl p-4 text-[11px] font-bold outline-none focus:border-red-600/50" />
                                  </div>
                               </div>
                               <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-white/5">
                                  <span className="text-[9px] font-black text-zinc-500 uppercase italic tracking-widest">PHIM SẮP CHIẾU</span>
                                  <input type="checkbox" checked={editForm.isComingSoon} onChange={(e) => setEditForm({...editForm, isComingSoon: e.target.checked})} className="w-5 h-5 accent-red-600 cursor-pointer" />
                               </div>
                            </div>
                         </div>

                         {/* Trailer Section */}
                         <div className="p-8 bg-black rounded-[2.5rem] border border-white/5 space-y-6">
                            <div className="flex justify-between items-center">
                               <p className="text-[9px] font-black text-red-600 uppercase italic tracking-widest">QUẢN LÝ TRAILER (MP4)</p>
                               {editForm.trailerUrl && <span className="text-[8px] text-green-500 font-bold uppercase italic">ĐÃ TẢI LÊN</span>}
                            </div>
                            <button onClick={() => handleFileUpload('trailer')} className="w-full py-5 bg-zinc-900/50 hover:bg-zinc-800 rounded-2xl border border-white/5 text-[10px] font-black uppercase italic tracking-[0.2em] transition-all">
                               TẢI VIDEO THỦ CÔNG TỪ MÁY TÍNH
                            </button>
                            {editForm.trailerUrl && (
                              <div className="aspect-video bg-zinc-950 rounded-[2rem] overflow-hidden border border-white/5 relative group">
                                 <video key={editForm.trailerUrl} src={editForm.trailerUrl} className="w-full h-full object-contain" controls />
                                 <button onClick={() => setEditForm({...editForm, trailerUrl: ''})} className="absolute top-4 right-4 bg-red-600 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                 </button>
                              </div>
                            )}
                         </div>
                      </div>

                      {/* Right Side: Text Fields */}
                      <div className="space-y-8">
                         <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-600 uppercase italic ml-2">TÊN PHIM</label>
                            <input type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full bg-black border border-white/5 rounded-[1.5rem] p-6 text-xl font-black italic uppercase text-white outline-none focus:border-red-600" />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-600 uppercase italic ml-2">MÔ TẢ</label>
                            <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full h-[380px] bg-black border border-white/5 rounded-[2rem] p-8 text-sm leading-relaxed font-medium italic text-zinc-400 outline-none focus:border-red-600 resize-none custom-scrollbar" />
                         </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-auto pt-10 flex gap-4 border-t border-white/5">
                       <button onClick={handleSaveMovie} className="flex-1 bg-red-600 text-white py-6 rounded-2xl font-black italic uppercase tracking-[0.3em] text-xs shadow-2xl hover:bg-red-700 transition-all">
                          LƯU & ĐỒNG BỘ
                       </button>
                       <button onClick={() => fetchData()} className="px-12 bg-zinc-900 text-zinc-600 py-6 rounded-2xl font-black italic uppercase tracking-widest border border-white/5 hover:text-white transition-all">
                          HỦY BỎ
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                     <p className="font-black italic uppercase tracking-[0.3em] text-sm">Chọn phim từ danh sách để bắt đầu chỉnh sửa</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in">
              {[
                { label: 'DOANH THU', val: `${stats.totalRev.toLocaleString()}Đ`, color: 'border-l-green-500' },
                { label: 'TỔNG VÉ', val: `${stats.totalUnits} UNIT`, color: 'border-l-red-600' },
                { label: 'TB/VÉ', val: `${stats.avg.toLocaleString()}Đ`, color: 'border-l-blue-600' },
                { label: 'PHIM ĂN KHÁCH', val: stats.topMovie, color: 'border-l-orange-500' }
              ].map((card, i) => (
                <div key={i} className={`glass p-10 rounded-[2.5rem] border-l-4 ${card.color} bg-zinc-900/10`}>
                  <p className="text-[8px] font-black text-zinc-700 uppercase italic tracking-widest mb-1">{card.label}</p>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter truncate">{card.val}</h3>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="glass rounded-[3rem] border-white/5 overflow-hidden bg-zinc-900/5 animate-in">
                <table className="w-full text-left">
                  <thead className="bg-black text-[9px] font-black uppercase italic text-zinc-700 tracking-[0.2em] border-b border-white/5">
                    <tr><th className="p-10">MÃ VÉ</th><th className="p-10">KHÁCH HÀNG</th><th className="p-10">PHIM / RẠP</th><th className="p-10 text-center">GHẾ</th><th className="p-10 text-right">TỔNG TIỀN</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tickets.length === 0 ? (
                      <tr><td colSpan={5} className="p-40 text-center text-zinc-900 font-black italic uppercase tracking-widest">Chưa có giao dịch phát sinh</td></tr>
                    ) : tickets.map(t => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-10 font-mono text-zinc-500 text-xs">{t.id}</td>
                        <td className="p-10 font-black text-white italic uppercase text-xs">{t.phoneNumber}</td>
                        <td className="p-10"><p className="text-xs font-black uppercase italic text-white">{t.movieTitle}</p><p className="text-[10px] text-zinc-700 font-bold uppercase mt-1">{t.theaterName}</p></td>
                        <td className="p-10 text-center"><div className="flex justify-center gap-1.5">{t.seats.map(s => <span key={s} className="bg-red-600/10 text-red-600 text-[9px] font-black px-3 py-1 rounded-xl italic border border-red-600/20">{s}</span>)}</div></td>
                        <td className="p-10 text-right font-black italic text-base text-white">{t.totalPrice.toLocaleString()}Đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-6 animate-in">
              <div className="glass p-7 rounded-[2.5rem] border-white/5 bg-zinc-900/10 flex items-center gap-5">
                 <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                 <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Tìm theo Tên hoặc Số điện thoại..." 
                  className="bg-transparent border-none outline-none flex-1 text-sm font-bold text-white placeholder:text-zinc-800" 
                 />
              </div>
              <div className="glass rounded-[3rem] border-white/5 overflow-hidden bg-zinc-900/5">
                <table className="w-full text-left min-w-[1000px]">
                  <thead className="bg-black text-[9px] font-black uppercase italic text-zinc-700 tracking-[0.2em] border-b border-white/5">
                    <tr>
                      <th className="p-10">NGÀY THAM GIA</th>
                      <th className="p-10">HỌ TÊN</th>
                      <th className="p-10">SỐ ĐIỆN THOẠI</th>
                      <th className="p-10">TỔNG CHI TIÊU</th>
                      <th className="p-10 text-right">XẾP HẠNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="p-40 text-center text-zinc-800 font-black italic uppercase tracking-widest">Không tìm thấy khách hàng nào</td></tr>
                    ) : filteredUsers.map(u => {
                      const userTickets = tickets.filter(t => t.phoneNumber === u.phone && t.status === 'active');
                      const totalSpend = userTickets.reduce((sum, t) => sum + t.totalPrice, 0);
                      const tier = totalSpend >= 15000000 ? 'VÀNG' : totalSpend >= 5000000 ? 'BẠC' : 'ĐỒNG';
                      const tierColor = tier === 'VÀNG' ? 'text-yellow-400' : tier === 'BẠC' ? 'text-zinc-400' : 'text-orange-500';
                      
                      return (
                        <tr key={u.phone} className="hover:bg-white/5 transition-colors">
                          <td className="p-10 text-[11px] font-bold text-zinc-600">
                            {u.joinDate ? new Date(u.joinDate).toLocaleDateString('vi-VN') : '28/01/2024'}
                          </td>
                          <td className="p-10 font-black text-white italic uppercase text-xs">{u.name}</td>
                          <td className="p-10 font-mono text-zinc-500 text-sm">{u.phone}</td>
                          <td className="p-10 font-black italic text-sm text-white">{totalSpend.toLocaleString()} Đ</td>
                          <td className={`p-10 text-right font-black italic text-xs tracking-widest ${tierColor}`}>{tier}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
             <div className="flex flex-col lg:flex-row gap-8 animate-in">
                <div className="flex-1 glass p-10 rounded-[3.5rem] border-white/5 bg-zinc-900/5 flex flex-col min-h-[500px]">
                   <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8">GIÁM SÁT LƯU LƯỢNG MẠNG</h2>
                   <div className="space-y-4 flex-1 overflow-y-auto pr-3 custom-scrollbar">
                      {logs.map((log, i) => (
                        <div key={i} className="bg-black/40 p-5 rounded-[2rem] border border-white/5 font-mono text-xs text-zinc-500">
                          {log}
                        </div>
                      ))}
                   </div>
                </div>
                <div className="w-full lg:w-[350px] shrink-0 space-y-6">
                   <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/10">
                      <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest italic mb-6">TRẠNG THÁI HỆ THỐNG</p>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center"><span className="text-xs font-bold text-zinc-500">SERVER</span><span className="text-[10px] font-black text-green-500 uppercase">ONLINE</span></div>
                         <div className="flex justify-between items-center"><span className="text-xs font-bold text-zinc-500">CLIENT ID</span><span className="text-[10px] font-black text-blue-500 uppercase">{syncService.getClientId()}</span></div>
                         <div className="flex justify-between items-center"><span className="text-xs font-bold text-zinc-500">THỜI GIAN</span><span className="text-[10px] font-black text-zinc-300 uppercase">{new Date().toLocaleTimeString()}</span></div>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
