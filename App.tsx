
import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import MovieCard from './components/MovieCard';
import ChatBot from './components/ChatBot';
import SeatMap from './components/SeatMap';
import AdminPanel from './components/AdminPanel';
import CustomerLogin from './components/CustomerLogin';
import CustomerProfile from './components/CustomerProfile';
import MovieDetail from './components/MovieDetail';
import { MOVIES as DEFAULT_MOVIES, THEATERS, COMBOS } from './constants';
import { Movie, Theater, ShowTime, Combo, Ticket } from './types';
import { syncService, SyncEventType, SyncMessage } from './services/syncService';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('home');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);

  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<ShowTime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedCombos, setSelectedCombos] = useState<{ [id: string]: number }>({});
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isBooked, setIsBooked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Trạng thái Client-Server
  const [serverStatus, setServerStatus] = useState<'online' | 'syncing'>('online');
  const [liveNotification, setLiveNotification] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      const saved = localStorage.getItem('cine_movies');
      setMovies(saved ? JSON.parse(saved) : DEFAULT_MOVIES);
    };
    loadData();

    // Đăng ký nhận cập nhật từ "Máy chủ"
    const unsubscribe = syncService.subscribe((msg: SyncMessage) => {
      setServerStatus('syncing');
      
      if (msg.type === SyncEventType.MOVIE_UPDATED) {
        setMovies(msg.payload);
        setLiveNotification("🎬 Hệ thống vừa cập nhật danh sách phim mới!");
      }

      if (msg.type === SyncEventType.TICKET_BOOKED) {
        setLiveNotification(`🎟️ Một khách hàng vừa đặt vé phim ${msg.payload.movieTitle}!`);
      }

      setTimeout(() => {
        setServerStatus('online');
        setTimeout(() => setLiveNotification(null), 5000);
      }, 1000);
    });

    const customer = localStorage.getItem('quinquin_customer');
    if (customer) {
      const user = JSON.parse(customer);
      setCurrentUser(user);
      setPhoneNumber(user.phone || '');
    }

    return () => unsubscribe();
  }, []);

  const nowShowing = useMemo(() => movies.filter(m => !m.isComingSoon), [movies]);
  const comingSoon = useMemo(() => movies.filter(m => m.isComingSoon), [movies]);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setShowDetail(true);
  };

  const startBooking = () => {
    setShowDetail(false);
    setIsBooking(true);
    setBookingStep(1);
    setSelectedTheater(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setSelectedCombos({});
    setIsBooked(false);
  };

  const handleToggleSeat = (seatId: string) => {
    setSelectedSeats(prev => 
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    );
  };

  const updateCombo = (id: string, delta: number) => {
    setSelectedCombos(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return next === 0 ? { ...prev, [id]: 0 } : { ...prev, [id]: next };
    });
  };

  const calculateTotal = () => {
    const seatPrice = selectedSeats.length * (selectedShowtime?.price || 0);
    const comboPrice = Object.entries(selectedCombos).reduce((total, [id, qty]) => {
      const combo = COMBOS.find(c => c.id === id);
      return total + ((combo?.price || 0) * (qty as number));
    }, 0);
    return seatPrice + comboPrice;
  };

  const handleFinalBooking = () => {
    const newTicket: Ticket = {
      id: 'QM' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      movieTitle: selectedMovie?.title || '',
      theaterName: selectedTheater?.name || '',
      showtime: `${selectedShowtime?.time} (${selectedShowtime?.format})`,
      seats: selectedSeats,
      phoneNumber: phoneNumber,
      totalPrice: calculateTotal(),
      status: 'active',
      bookingDate: new Date().toISOString()
    };
    
    const existing = JSON.parse(localStorage.getItem('cine_tickets') || '[]');
    localStorage.setItem('cine_tickets', JSON.stringify([...existing, newTicket]));
    
    // Phát tín hiệu tới các client khác
    syncService.broadcast(SyncEventType.TICKET_BOOKED, { movieTitle: selectedMovie?.title });
    
    setIsBooked(true);
  };

  const navigate = (page: string) => {
    if (page === 'login') {
      if (currentUser) setActivePage('profile');
      else setIsLoginModalOpen(true);
      return;
    }
    setActivePage(page);
    setIsBooking(false);
    setShowDetail(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-600 overflow-x-hidden">
      {/* Huy hiệu trạng thái mạng */}
      <div className="fixed top-24 right-6 z-[60] flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/5 shadow-2xl">
        <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500 animate-pulse'}`}></div>
        <span className="text-[8px] font-black uppercase tracking-widest italic text-zinc-400">
          {serverStatus === 'online' ? 'Đã kết nối máy chủ' : 'Đang đồng bộ...'}
        </span>
        <span className="text-[8px] font-mono text-zinc-600 border-l border-white/10 pl-2">ID: {syncService.getClientId()}</span>
      </div>

      {/* Thông báo trực tuyến */}
      {liveNotification && (
        <div className="fixed bottom-24 left-6 z-[60] animate-in slide-in-from-left-10 duration-500">
          <div className="bg-red-600 text-white font-black italic px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-red-400/20">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">📡</div>
            <p className="text-[10px] uppercase tracking-widest leading-tight">{liveNotification}</p>
          </div>
        </div>
      )}

      <Navbar activePage={activePage} onNavigate={navigate} />
      
      <main className="container mx-auto px-6">
        {isBooking ? (
          <div className="pt-32 pb-24">
             <div className="flex items-center justify-center gap-4 mb-16">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${bookingStep >= step ? 'bg-red-600 text-white shadow-xl shadow-red-600/30' : 'bg-zinc-900 text-zinc-600'}`}>
                    {step}
                  </div>
                  {step < 4 && <div className={`w-12 h-1 ${bookingStep > step ? 'bg-red-600' : 'bg-zinc-900'}`}></div>}
                </div>
              ))}
            </div>
            
            {isBooked ? (
               <div className="max-w-xl mx-auto text-center py-20 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-green-500/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h2 className="text-5xl font-black italic mb-4 uppercase tracking-tighter">XÁC NHẬN THÀNH CÔNG!</h2>
                <p className="text-zinc-500 mb-12 italic font-medium">Hệ thống đã ghi nhận vé của bạn. Hẹn gặp bạn tại QuinQuin Cinemas!</p>
                <button onClick={() => navigate('profile')} className="bg-red-600 text-white font-black py-5 px-16 rounded-2xl shadow-2xl uppercase italic tracking-widest text-xs hover:bg-white hover:text-red-600 transition-all">XEM VÉ CỦA TÔI</button>
              </div>
            ) : (
              <>
                {bookingStep === 1 && (
                  <div className="animate-in slide-in-from-bottom-8 duration-500">
                    <h3 className="text-3xl font-black italic uppercase mb-10 text-center tracking-tighter">Chọn rạp & Suất chiếu</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {THEATERS.map(t => (
                        <div key={t.id} className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40">
                          <h4 className="font-black text-xl italic uppercase mb-2">{t.name}</h4>
                          <p className="text-[10px] text-zinc-500 mb-6 italic">{t.location}</p>
                          <div className="flex flex-wrap gap-4">
                            {t.showtimes.map(st => (
                              <button 
                                key={st.id} 
                                onClick={() => { setSelectedTheater(t); setSelectedShowtime(st); }}
                                className={`px-8 py-5 rounded-2xl font-black transition-all border ${selectedShowtime?.id === st.id ? 'bg-red-600 text-white border-red-500 shadow-xl' : 'bg-black/40 text-zinc-500 border-white/5 hover:border-white/20'}`}
                              >
                                <span className="block text-lg">{st.time}</span>
                                <span className="text-[9px] uppercase tracking-widest opacity-60">{st.format} • {st.price.toLocaleString()}đ</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-12 flex justify-center">
                      <button disabled={!selectedShowtime} onClick={() => setBookingStep(2)} className="bg-red-600 disabled:bg-zinc-800 text-white px-20 py-6 rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-2xl">TIẾP TỤC</button>
                    </div>
                  </div>
                )}
                {bookingStep === 2 && (
                  <div className="animate-in slide-in-from-bottom-8">
                    <h3 className="text-3xl font-black italic uppercase mb-12 text-center tracking-tighter">Sơ đồ ghế ngồi cao cấp</h3>
                    <SeatMap selectedSeats={selectedSeats} onToggleSeat={handleToggleSeat} />
                    <div className="mt-16 flex justify-between">
                      <button onClick={() => setBookingStep(1)} className="text-zinc-500 font-black uppercase italic tracking-widest text-[10px]">Quay lại</button>
                      <button disabled={selectedSeats.length === 0} onClick={() => setBookingStep(3)} className="bg-red-600 disabled:bg-zinc-800 text-white px-20 py-6 rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-2xl">CHỌN COMBO</button>
                    </div>
                  </div>
                )}
                {bookingStep === 3 && (
                  <div className="animate-in slide-in-from-bottom-8">
                    <h3 className="text-3xl font-black italic uppercase mb-10 text-center tracking-tighter">Bắp & Nước (Combo)</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {COMBOS.map(combo => (
                        <div key={combo.id} className="glass p-6 rounded-[2.5rem] flex gap-6 items-center border-white/5">
                          <img src={combo.imageUrl} className="w-24 h-24 rounded-2xl object-cover" alt="" />
                          <div className="flex-1">
                            <h4 className="font-black italic uppercase text-sm mb-1">{combo.name}</h4>
                            <p className="text-[10px] text-zinc-500 font-medium mb-4 italic">{combo.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-red-600 font-black italic">{combo.price.toLocaleString()}đ</span>
                              <div className="flex items-center gap-4 bg-black/40 px-3 py-1.5 rounded-xl">
                                <button onClick={() => updateCombo(combo.id, -1)} className="text-zinc-500 hover:text-white">-</button>
                                <span className="text-sm font-black">{selectedCombos[combo.id] || 0}</span>
                                <button onClick={() => updateCombo(combo.id, 1)} className="text-zinc-500 hover:text-white">+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-12 flex justify-between">
                      <button onClick={() => setBookingStep(2)} className="text-zinc-500 font-black uppercase italic tracking-widest text-[10px]">Quay lại</button>
                      <button onClick={() => setBookingStep(4)} className="bg-red-600 text-white px-20 py-6 rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-2xl">XÁC NHẬN VÉ</button>
                    </div>
                  </div>
                )}
                {bookingStep === 4 && (
                  <div className="animate-in slide-in-from-bottom-8 max-w-4xl mx-auto">
                    <div className="glass p-12 rounded-[3rem] border-red-600/20 shadow-2xl">
                      <div className="flex flex-col md:flex-row gap-10 border-b border-white/5 pb-10">
                        <img src={selectedMovie?.posterUrl} className="w-40 rounded-2xl shadow-2xl" alt="" />
                        <div className="flex-1 space-y-6">
                          <h2 className="text-4xl font-black italic uppercase tracking-tighter">{selectedMovie?.title}</h2>
                          <div className="grid grid-cols-2 gap-y-4">
                            <div><p className="text-[9px] font-black text-zinc-500 uppercase italic">Rạp</p><p className="font-black italic">{selectedTheater?.name}</p></div>
                            <div><p className="text-[9px] font-black text-zinc-500 uppercase italic">Suất chiếu</p><p className="font-black italic">{selectedShowtime?.time} ({selectedShowtime?.format})</p></div>
                            <div><p className="text-[9px] font-black text-zinc-500 uppercase italic">Ghế ngồi</p><p className="font-black text-red-600 italic">{selectedSeats.join(', ')}</p></div>
                          </div>
                        </div>
                      </div>
                      <div className="py-10 space-y-6">
                        <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Nhập số điện thoại liên hệ" className="w-full bg-black/40 border border-white/10 p-6 rounded-2xl font-black text-white focus:border-red-600 outline-none transition-all placeholder:text-zinc-800" />
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[9px] font-black text-zinc-500 uppercase italic tracking-widest">Tổng cộng</p>
                            <p className="text-5xl font-black text-red-600 italic tracking-tighter">{calculateTotal().toLocaleString()}đ</p>
                          </div>
                          <button onClick={handleFinalBooking} disabled={!phoneNumber || phoneNumber.length < 10} className="bg-red-600 hover:bg-red-700 text-white px-16 py-6 rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-2xl disabled:bg-zinc-800 transition-all">THANH TOÁN NGAY</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {activePage === 'home' && (
              <div className="space-y-32">
                <section className="relative h-[85vh] w-full overflow-hidden rounded-[3rem] mt-24 shadow-2xl group">
                  <img src={nowShowing[0]?.backdropUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1920'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Hero" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
                  <div className="absolute inset-0 flex items-center px-12">
                    <div className="max-w-3xl animate-in fade-in slide-in-from-left-12 duration-1000">
                      <div className="flex items-center gap-3 mb-8"><span className="w-12 h-1 bg-red-600 rounded-full"></span><span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">Hot nhất hôm nay</span></div>
                      <h1 className="text-7xl md:text-9xl font-black italic mb-10 leading-[0.8] uppercase tracking-tighter drop-shadow-2xl">{nowShowing[0]?.title}</h1>
                      <div className="flex gap-6">
                        <button onClick={() => handleMovieSelect(nowShowing[0])} className="bg-red-600 hover:bg-red-700 text-white font-black py-6 px-16 rounded-2xl shadow-2xl shadow-red-600/40 transition-all hover:-translate-y-2 uppercase italic tracking-widest text-xs">XEM CHI TIẾT</button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="px-4">
                  <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4 border-l-8 border-red-600 pl-8">
                    <div>
                      <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white">PHIM ĐANG <span className="text-red-600">CHIẾU</span></h2>
                      <p className="text-zinc-600 font-black uppercase italic text-[10px] tracking-widest mt-2">Cập nhật suất chiếu mới nhất mỗi ngày</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
                    {nowShowing.map(movie => <MovieCard key={movie.id} movie={movie} onSelect={handleMovieSelect} />)}
                  </div>
                </section>

                <section className="px-4 pb-32">
                   <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4 border-l-8 border-zinc-800 pl-8">
                    <div>
                      <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-zinc-400">PHIM SẮP <span className="text-red-600/50">RA MẮT</span></h2>
                      <p className="text-zinc-700 font-black uppercase italic text-[10px] tracking-widest mt-2">Đừng bỏ lỡ những siêu phẩm sắp cập bến QuinQuin</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10 opacity-70 grayscale hover:grayscale-0 transition-all duration-700">
                    {comingSoon.map(movie => <MovieCard key={movie.id} movie={movie} onSelect={handleMovieSelect} />)}
                  </div>
                </section>
              </div>
            )}
            {activePage === 'movies' && (
              <div className="pt-32 pb-32">
                 <h1 className="text-8xl font-black italic uppercase text-center mb-24 tracking-tighter">DANH SÁCH <span className="text-red-600">PHIM</span></h1>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">{movies.map(m => <MovieCard key={m.id} movie={m} onSelect={handleMovieSelect} />)}</div>
              </div>
            )}
            {activePage === 'profile' && currentUser && <CustomerProfile user={currentUser} onLogout={() => { localStorage.removeItem('quinquin_customer'); setCurrentUser(null); setActivePage('home'); }} onClose={() => setActivePage('home')} onUpdateUser={(u) => { setCurrentUser(u); localStorage.setItem('quinquin_customer', JSON.stringify(u)); }} />}
            {activePage === 'admin' && <AdminPanel onClose={() => setActivePage('home')} />}
          </>
        )}
      </main>

      {showDetail && selectedMovie && <MovieDetail movie={selectedMovie} onClose={() => setShowDetail(false)} onBook={startBooking} />}
      {isLoginModalOpen && <CustomerLogin onLoginSuccess={(u) => { setCurrentUser(u); setIsLoginModalOpen(false); navigate('profile'); }} onClose={() => setIsLoginModalOpen(false)} />}
      <ChatBot onStartBooking={(title) => { const m = movies.find(x => x.title.toLowerCase().includes(title.toLowerCase())); if(m) handleMovieSelect(m); }} />
    </div>
  );
};

export default App;
