
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import MovieCard from './components/MovieCard';
import ChatBot from './components/ChatBot';
import SeatMap from './components/SeatMap';
import AdminPanel from './components/AdminPanel';
import CustomerLogin from './components/CustomerLogin';
import CustomerProfile from './components/CustomerProfile';
import MovieDetail from './components/MovieDetail';
import { MOVIES as DEFAULT_MOVIES, THEATERS, COMBOS } from './constants';
import { Movie, Theater, ShowTime, Ticket } from './types';
import { syncService, SyncEventType, SyncMessage } from './services/syncService';
import { storageService } from './services/storageService';

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
  
  const [showHeroTrailer, setShowHeroTrailer] = useState(false);
  const [heroVideoLoading, setHeroVideoLoading] = useState(true);
  const [heroBlobUrl, setHeroBlobUrl] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'online' | 'syncing'>('online');
  const [liveNotification, setLiveNotification] = useState<string | null>(null);

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isHoveringHero, setIsHoveringHero] = useState(false);
  const carouselTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMovies = async () => {
    const data = await storageService.getMovies();
    setMovies(data);
  };

  useEffect(() => {
    loadMovies();
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

  useEffect(() => {
    if (activePage === 'home' && nowShowing.length > 0 && !isHoveringHero && !showDetail && !isBooking && !showHeroTrailer) {
      carouselTimer.current = setInterval(() => {
        setCurrentHeroIndex(prev => (prev + 1) % nowShowing.length);
      }, 8000);
    }
    return () => { if (carouselTimer.current) clearInterval(carouselTimer.current); };
  }, [activePage, nowShowing.length, isHoveringHero, showDetail, isBooking, showHeroTrailer]);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setShowDetail(true);
  };

  const startBooking = () => {
    // KIỂM TRA ĐĂNG NHẬP TRƯỚC KHI ĐẶT VÉ
    if (!currentUser) {
      setShowDetail(false); // Đóng chi tiết phim để tập trung đăng nhập
      setIsLoginModalOpen(true);
      return;
    }

    setShowDetail(false);
    setIsBooking(true);
    setBookingStep(1);
    setSelectedTheater(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setSelectedCombos({});
    setIsBooked(false);
    setPhoneNumber(currentUser.phone || ''); // Tự động điền SĐT từ tài khoản
  };

  const handleToggleSeat = (seatId: string) => {
    setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]);
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
      const quantityValue = qty as number;
      const combo = COMBOS.find(c => c.id === id);
      return total + ((combo?.price || 0) * quantityValue);
    }, 0);
    return seatPrice + comboPrice;
  };

  const handleFinalBooking = () => {
    const combosToSave = Object.entries(selectedCombos)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([id, qty]) => ({
        name: COMBOS.find(c => c.id === id)?.name || '',
        quantity: qty as number
      }));

    const newTicket: Ticket = {
      id: 'QM' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      movieTitle: selectedMovie?.title || '',
      theaterName: selectedTheater?.name || '',
      showtime: `${selectedShowtime?.time} (${selectedShowtime?.format})`,
      seats: selectedSeats,
      phoneNumber: phoneNumber,
      totalPrice: calculateTotal(),
      status: 'active',
      bookingDate: new Date().toISOString(),
      combos: combosToSave
    };
    const existing = JSON.parse(localStorage.getItem('cine_tickets') || '[]');
    localStorage.setItem('cine_tickets', JSON.stringify([...existing, newTicket]));
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

  const heroMovie = nowShowing[currentHeroIndex] || nowShowing[0];

  useEffect(() => {
    let url: string | null = null;
    const processHeroVideo = async () => {
      if (showHeroTrailer && heroMovie?.trailerUrl) {
        setHeroVideoLoading(true);
        try {
          const response = await fetch(heroMovie.trailerUrl);
          const blob = await response.blob();
          url = URL.createObjectURL(blob);
          setHeroBlobUrl(url);
        } catch (e) {
          setHeroBlobUrl(heroMovie.trailerUrl || null);
        }
      }
    };
    processHeroVideo();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [showHeroTrailer, heroMovie?.id]);

  const renderTrailerContent = () => {
    if (!heroBlobUrl) return null;
    return (
      <div className="w-full h-full relative">
        {heroVideoLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 backdrop-blur-sm">
             <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4"></div>
             <p className="text-[10px] font-black italic uppercase tracking-widest text-white/50 animate-pulse">BUFFERING 1080P FULL HD TRAILER...</p>
          </div>
        )}
        <video 
          src={heroBlobUrl} 
          className="w-full h-full object-contain" 
          controls 
          autoPlay 
          preload="auto"
          playsInline
          onCanPlayThrough={() => setHeroVideoLoading(false)}
          onWaiting={() => setHeroVideoLoading(true)}
          onPlaying={() => setHeroVideoLoading(false)}
          controlsList="nodownload"
        />
      </div>
    );
  };

  const renderHome = () => (
    <div className="space-y-32">
      <section 
        className="relative h-[85vh] w-full overflow-hidden rounded-[3rem] mt-24 shadow-2xl group cursor-default"
        onMouseEnter={() => setIsHoveringHero(true)}
        onMouseLeave={() => setIsHoveringHero(false)}
      >
        <div key={`hero-bg-${heroMovie?.id}`} className="absolute inset-0 animate-in fade-in zoom-in duration-1000">
          <img src={heroMovie?.backdropUrl || ''} className="w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent"></div>
        </div>
        <div className="absolute inset-0 flex items-center px-12 md:px-24">
          <div key={`hero-content-${heroMovie?.id}`} className="max-w-4xl animate-in fade-in slide-in-from-left-12 duration-1000">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-12 h-1 bg-red-600 rounded-full"></span>
              <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">Hot nhất hôm nay • 1080P FULL HD</span>
            </div>
            <h1 className="text-6xl md:text-9xl font-black italic mb-10 leading-[0.85] uppercase tracking-tighter drop-shadow-2xl">{heroMovie?.title}</h1>
            <p className="text-zinc-400 text-sm md:text-lg italic font-medium max-w-xl mb-12 line-clamp-3 leading-relaxed drop-shadow-lg">{heroMovie?.description}</p>
            <div className="flex gap-6">
              <button onClick={() => handleMovieSelect(heroMovie)} className="bg-red-600 hover:bg-red-700 text-white font-black py-6 px-16 rounded-2xl shadow-2xl shadow-red-600/40 transition-all hover:-translate-y-2 uppercase italic tracking-widest text-xs">XEM CHI TIẾT</button>
              <button onClick={() => {
                if(heroMovie?.trailerUrl) {
                  setShowHeroTrailer(true);
                }
              }} disabled={!heroMovie?.trailerUrl} className={`bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white font-black py-6 px-16 rounded-2xl border border-white/10 transition-all hover:-translate-y-2 uppercase italic tracking-widest text-xs ${!heroMovie?.trailerUrl ? 'opacity-30 cursor-not-allowed' : ''}`}>XEM TRAILER 1080P</button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-12 left-12 right-12 flex gap-4">
          {nowShowing.map((_, idx) => (
            <div key={idx} onClick={() => setCurrentHeroIndex(idx)} className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden group/bar">
              <div className={`h-full bg-red-600 transition-all duration-[8000ms] ease-linear ${idx === currentHeroIndex && !isHoveringHero && !showHeroTrailer ? 'w-full' : 'w-0'} ${idx < currentHeroIndex ? 'w-full duration-0' : ''}`} />
            </div>
          ))}
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
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-600 overflow-x-hidden">
      <Navbar activePage={activePage} onNavigate={navigate} />
      
      <main className="container mx-auto px-6">
        {isBooking ? (
          <div className="pt-32 pb-24">
             <div className="flex items-center justify-center gap-4 mb-16">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${bookingStep >= step ? 'bg-red-600 text-white shadow-xl shadow-red-600/30' : 'bg-zinc-900 text-zinc-600'}`}>{step}</div>
                  {step < 4 && <div className={`w-12 h-1 ${bookingStep > step ? 'bg-red-600' : 'bg-zinc-900'}`}></div>}
                </div>
              ))}
            </div>
            
            {isBooked ? (
               <div className="max-w-xl mx-auto text-center py-20 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-green-500/40"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg></div>
                <h2 className="text-5xl font-black italic mb-4 uppercase tracking-tighter">XÁC NHẬN THÀNH CÔNG!</h2>
                <button onClick={() => navigate('profile')} className="bg-red-600 text-white font-black py-5 px-16 rounded-2xl shadow-2xl uppercase italic tracking-widest text-xs hover:bg-white hover:text-red-600 transition-all">XEM VÉ CỦA TÔI</button>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                {bookingStep === 1 && (
                  <div>
                    <h3 className="text-3xl font-black italic uppercase mb-10 text-center tracking-tighter">Chọn rạp & Suất chiếu</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {THEATERS.map(t => (
                        <div key={t.id} className="glass p-8 rounded-[2.5rem] bg-zinc-900/40 border-white/5">
                          <h4 className="font-black text-xl italic uppercase mb-2">{t.name}</h4>
                          <p className="text-[10px] text-zinc-600 uppercase italic tracking-widest">{t.location}</p>
                          <div className="flex flex-wrap gap-4 mt-6">
                            {t.showtimes.map(st => (
                              <button key={st.id} onClick={() => { setSelectedTheater(t); setSelectedShowtime(st); }} className={`px-8 py-5 rounded-2xl font-black transition-all border ${selectedShowtime?.id === st.id ? 'bg-red-600 text-white border-red-500 shadow-xl' : 'bg-black/40 text-zinc-500 border-white/5 hover:border-white/20'}`}>
                                <span className="block text-lg">{st.time}</span>
                                <span className="text-[9px] uppercase tracking-widest opacity-60">{st.format} • {st.price.toLocaleString()}đ</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-12 flex justify-center"><button disabled={!selectedShowtime} onClick={() => setBookingStep(2)} className="bg-red-600 disabled:bg-zinc-800 text-white px-20 py-6 rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-2xl">TIẾP TỤC</button></div>
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
                  <div className="animate-in slide-in-from-bottom-8 max-w-6xl mx-auto">
                    <h3 className="text-3xl font-black italic uppercase mb-12 text-center tracking-tighter">Bắp & Nước (Combo)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto px-4 custom-scrollbar pb-10">
                      {COMBOS.map(combo => (
                        <div key={combo.id} className="glass p-8 rounded-[3rem] flex gap-8 items-center border-white/5 hover:border-red-600/20 transition-all bg-zinc-900/20 group">
                          <div className="w-28 h-28 rounded-[2rem] overflow-hidden shrink-0 shadow-2xl border border-white/5 bg-zinc-800">
                            <img 
                              src={combo.imageUrl} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              alt={combo.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?q=80&w=400&h=400&auto=format&fit=crop';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black italic uppercase text-sm mb-1 text-white truncate">{combo.name}</h4>
                            <p className="text-[9px] text-zinc-500 font-medium italic mb-4 line-clamp-1">{combo.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-red-600 font-black italic text-base">{combo.price.toLocaleString()}đ</span>
                              <div className="flex items-center gap-6 bg-black/60 px-5 py-2.5 rounded-2xl border border-white/5">
                                <button onClick={() => updateCombo(combo.id, -1)} className="text-zinc-500 hover:text-white transition-colors text-xl font-bold">-</button>
                                <span className="text-sm font-black text-white min-w-[20px] text-center">{selectedCombos[combo.id] || 0}</span>
                                <button onClick={() => updateCombo(combo.id, 1)} className="text-zinc-500 hover:text-white transition-colors text-xl font-bold">+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-16 flex items-center justify-between pt-10 border-t border-white/5">
                      <button onClick={() => setBookingStep(2)} className="text-zinc-600 hover:text-white font-black uppercase italic tracking-widest text-[10px] transition-colors">Quay lại</button>
                      <button onClick={() => setBookingStep(4)} className="bg-red-600 hover:bg-red-700 text-white px-20 py-6 rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-2xl transition-all hover:-translate-y-1">XÁC NHẬN VÉ</button>
                    </div>
                  </div>
                )}
                {bookingStep === 4 && (
                  <div className="animate-in slide-in-from-bottom-8 max-w-4xl mx-auto">
                    <div className="glass p-12 rounded-[3rem] border-red-600/20 shadow-2xl">
                      <div className="flex flex-col md:flex-row gap-10 border-b border-white/5 pb-10">
                        <img src={selectedMovie?.posterUrl} className="w-40 rounded-2xl shadow-2xl" alt="" />
                        <div className="flex-1 space-y-4">
                          <h2 className="text-4xl font-black italic uppercase tracking-tighter">{selectedMovie?.title}</h2>
                          <p className="text-sm font-black italic text-zinc-500">{selectedTheater?.name} • {selectedShowtime?.time}</p>
                          <p className="text-sm font-black italic text-red-600 uppercase tracking-widest">Ghế: {selectedSeats.join(', ')}</p>
                          {Object.entries(selectedCombos).some(([_, qty]) => (qty as number) > 0) && (
                            <div className="pt-2">
                               <p className="text-[10px] font-black uppercase text-zinc-600 italic mb-2 tracking-widest">Combo đã chọn:</p>
                               <div className="flex flex-wrap gap-2">
                                  {Object.entries(selectedCombos).map(([id, qty]) => {
                                    const comboQty = qty as number;
                                    if (comboQty === 0) return null;
                                    const combo = COMBOS.find(c => c.id === id);
                                    return <span key={id} className="text-[9px] font-bold text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded-lg italic">{comboQty}x {combo?.name}</span>;
                                  })}
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="py-10 space-y-6">
                        <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Nhập số điện thoại liên hệ" className="w-full bg-black/40 border border-white/10 p-6 rounded-2xl font-black text-white focus:border-red-600 outline-none transition-all placeholder:text-zinc-800" />
                        <div className="flex justify-between items-end">
                          <div><p className="text-5xl font-black text-red-600 italic tracking-tighter">{calculateTotal().toLocaleString()}đ</p></div>
                          <button onClick={handleFinalBooking} disabled={!phoneNumber || phoneNumber.length < 10} className="bg-red-600 hover:bg-red-700 text-white px-16 py-6 rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-2xl disabled:bg-zinc-800 transition-all">THANH TOÁN NGAY</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {activePage === 'home' && renderHome()}
            {activePage === 'movies' && (
              <div className="pt-32 pb-32">
                 <h1 className="text-8xl font-black italic uppercase text-center mb-24 tracking-tighter">DANH SÁCH <span className="text-red-600">PHIM</span></h1>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">{nowShowing.map(m => <MovieCard key={m.id} movie={m} onSelect={handleMovieSelect} />)}</div>
              </div>
            )}
            {activePage === 'coming_soon' && (
              <div className="pt-32 pb-32">
                 <h1 className="text-8xl font-black italic uppercase text-center mb-24 tracking-tighter">SẮP <span className="text-zinc-500">RA MẮT</span></h1>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
                    {comingSoon.length === 0 ? (
                      <div className="col-span-full py-40 text-center text-zinc-800 font-black italic uppercase tracking-widest">Đang cập nhật thêm siêu phẩm mới...</div>
                    ) : comingSoon.map(m => <MovieCard key={m.id} movie={m} onSelect={handleMovieSelect} />)}
                 </div>
              </div>
            )}
            {activePage === 'profile' && currentUser && <CustomerProfile user={currentUser} onLogout={() => { localStorage.removeItem('quinquin_customer'); setCurrentUser(null); setActivePage('home'); }} onClose={() => setActivePage('home')} onUpdateUser={(u) => { setCurrentUser(u); localStorage.setItem('quinquin_customer', JSON.stringify(u)); }} />}
            {activePage === 'admin' && <AdminPanel onClose={() => setActivePage('home')} />}
          </>
        )}
      </main>

      {showDetail && selectedMovie && <MovieDetail movie={selectedMovie} onClose={() => setShowDetail(false)} onBook={startBooking} />}
      {isLoginModalOpen && <CustomerLogin onLoginSuccess={(u) => { setCurrentUser(u); setIsLoginModalOpen(false); navigate('profile'); }} onClose={() => setIsLoginModalOpen(false)} />}
      
      {showHeroTrailer && heroMovie?.trailerUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 animate-in fade-in duration-300 backdrop-blur-sm">
           <div className="absolute inset-0 cursor-pointer" onClick={() => setShowHeroTrailer(false)}></div>
           <div className="w-full max-w-5xl aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-[0_0_100px_rgba(225,29,72,0.3)] animate-in zoom-in-95 bg-black">
              <button onClick={() => setShowHeroTrailer(false)} className="absolute top-6 right-6 z-30 bg-black/40 hover:bg-red-600 text-white p-3 rounded-full transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              {renderTrailerContent()}
           </div>
        </div>
      )}

      <ChatBot onStartBooking={(title) => { const m = movies.find(x => x.title.toLowerCase().includes(title.toLowerCase())); if(m) handleMovieSelect(m); }} />
    </div>
  );
};

export default App;
