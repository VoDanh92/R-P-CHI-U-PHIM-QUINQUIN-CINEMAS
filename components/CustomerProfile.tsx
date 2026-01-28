
import React, { useMemo, useState, useEffect } from 'react';
import { Ticket } from '../types';

interface CustomerProfileProps {
  user: { 
    name: string; 
    phone: string;
    dob?: string;
    gender?: string;
    city?: string;
  };
  onLogout: () => void;
  onClose: () => void;
  onUpdateUser: (updatedUser: any) => void;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ user, onLogout, onClose, onUpdateUser }) => {
  const [activeMenu, setActiveMenu] = useState('THÔNG TIN CHUNG');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState('');
  
  const [editData, setEditData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    dob: user.dob || '01/01/2000',
    gender: user.gender || 'NAM',
    city: user.city || 'TP. HỒ CHÍ MINH'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const savedAvatar = localStorage.getItem(`avatar_${user.phone}`);
    if (savedAvatar) setAvatar(savedAvatar);
  }, [user.phone]);

  useEffect(() => {
    setEditData({
      name: user.name || '',
      phone: user.phone || '',
      dob: user.dob || '01/01/2000',
      gender: user.gender || 'NAM',
      city: user.city || 'TP. HỒ CHÍ MINH'
    });
  }, [user.name, user.phone]);

  const tickets: Ticket[] = useMemo(() => {
    const saved = localStorage.getItem('cine_tickets') || '[]';
    return JSON.parse(saved).filter((t: Ticket) => 
      t.phoneNumber === editData.phone
    ).reverse();
  }, [editData.phone]);

  const stats = useMemo(() => {
    const totalSpend = tickets.reduce((acc, t) => acc + t.totalPrice, 0);
    const points = Math.floor(totalSpend / 1000);
    
    let tierName = 'ĐỒNG';
    let tierClass = 'text-orange-500';
    let cardBg = 'bg-gradient-to-br from-orange-900/40 to-zinc-900';
    let progress = Math.min(100, (tickets.length / 20) * 100);

    if (tickets.length >= 15) { 
      tierName = 'VÀNG'; tierClass = 'text-yellow-400';
      cardBg = 'bg-gradient-to-br from-yellow-700/40 to-zinc-900';
    } else if (tickets.length >= 5) { 
      tierName = 'BẠC'; tierClass = 'text-zinc-400';
      cardBg = 'bg-gradient-to-br from-zinc-500/40 to-zinc-900';
    }

    return { totalSpend, points, tierName, tierClass, progress, cardBg };
  }, [tickets]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatar(base64);
        localStorage.setItem(`avatar_${user.phone}`, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAccount = () => {
    setIsSaving(true);
    setTimeout(() => {
      onUpdateUser(editData);
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 600);
  };

  const handleRedeem = (type: string) => {
    if (!redeemCode.trim()) return;
    alert(`Đã nhận diện mã ${redeemCode}. ${type} sẽ được kích hoạt sau khi hệ thống xác thực.`);
    setRedeemCode('');
  };

  const renderGeneralInfo = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col xl:flex-row items-center gap-12">
        <div className="flex-shrink-0 text-center group">
          <div className="w-44 h-44 rounded-full border-4 border-zinc-900 bg-zinc-900 flex items-center justify-center overflow-hidden shadow-2xl relative">
            {avatar ? <img src={avatar} alt="Ảnh đại diện" className="w-full h-full object-cover" /> : (
              <div className="bg-zinc-800 w-full h-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#27272a" strokeWidth="1"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            )}
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-[9px] font-black uppercase italic tracking-widest">Tải ảnh<input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} /></label>
          </div>
        </div>
        <div className="flex-1 text-center xl:text-left">
          <h2 className="text-3xl md:text-4xl font-black italic mb-4 leading-tight">Xin chào <span className="text-red-600 uppercase">{editData.name},</span></h2>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl font-medium italic">Chào mừng bạn quay lại hệ thống rạp QUINQUIN CINEMAS cao cấp.</p>
        </div>
        <div className="w-full max-w-[280px]">
           <div className="glass p-6 rounded-[2.5rem] border-white/5 bg-zinc-900/40 relative overflow-hidden group hover:scale-105 transition-transform duration-500">
              <div className="flex flex-col items-center">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">HẠNG HIỆN TẠI</p>
                <span className={`text-4xl font-black italic tracking-tighter ${stats.tierName === 'VÀNG' ? 'text-yellow-400' : stats.tierName === 'BẠC' ? 'text-zinc-400' : 'text-orange-500'}`}>{stats.tierName}</span>
                <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden"><div className="h-full bg-red-600" style={{ width: `${stats.progress}%` }}></div></div>
              </div>
           </div>
        </div>
      </div>
      <div className="glass rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl bg-zinc-900/20 divide-x divide-white/5 grid grid-cols-2 md:grid-cols-6">
        {[
          { label: 'CẤP ĐỘ', val: stats.tierName, action: () => setActiveMenu('THẺ THÀNH VIÊN') },
          { label: 'CHI TIÊU', val: `${stats.totalSpend.toLocaleString()} Đ`, action: () => setActiveMenu('LỊCH SỬ GIAO DỊCH') },
          { label: 'ĐIỂM', val: `${stats.points} P`, color: 'text-red-600', action: () => setActiveMenu('ĐIỂM THƯỞNG') },
          { label: 'VOUCHER', val: '3', action: () => setActiveMenu('VOUCHER') },
          { label: 'COUPON', val: '2', action: () => setActiveMenu('COUPON') },
          { label: 'GIFT CARD', val: '2', action: () => setActiveMenu('THẺ QUÀ TẶNG') }
        ].map((item, idx) => (
          <div key={idx} className="p-7 space-y-2 hover:bg-white/5 transition-all group cursor-pointer" onClick={item.action}>
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic">{item.label}</p>
            <span className={`text-sm font-black italic uppercase ${item.color || 'text-white'}`}>{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPoints = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-[2.5rem] border-red-600/20 bg-red-600/5 text-center">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 italic">TỔNG ĐIỂM TÍCH LŨY</p>
          <h3 className="text-5xl font-black text-red-600 italic tracking-tighter">{stats.points.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-600 font-bold uppercase mt-4">1,000 Đ = 1 ĐIỂM QUINQUIN</p>
        </div>
        <div className="md:col-span-2 glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/20">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase mb-6 tracking-widest italic">QUYỀN LỢI ĐIỂM THƯỞNG</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5"><p className="text-white font-black text-xs italic mb-1 uppercase">Đổi bắp nước</p><p className="text-[9px] text-zinc-500">Dùng điểm thanh toán trực tiếp tại quầy Combo.</p></div>
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5"><p className="text-white font-black text-xs italic mb-1 uppercase">Đổi vé miễn phí</p><p className="text-[9px] text-zinc-500">Tích lũy đủ 1000 điểm đổi ngay 01 vé 2D bất kỳ.</p></div>
          </div>
        </div>
      </div>
      <div className="glass rounded-[3rem] border-white/5 overflow-hidden">
        <h5 className="p-8 text-[11px] font-black uppercase text-white bg-white/5 border-b border-white/5 italic">Lịch sử tích điểm gần đây</h5>
        <div className="divide-y divide-white/5">
          {tickets.length === 0 ? (
            <p className="p-20 text-center text-zinc-700 font-black uppercase italic tracking-widest">Chưa có lịch sử tích điểm</p>
          ) : tickets.slice(0, 5).map(t => (
            <div key={t.id} className="p-6 flex justify-between items-center hover:bg-white/5 transition-all">
              <div>
                <p className="text-sm font-black text-white italic uppercase">{t.movieTitle}</p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Giao dịch mã {t.id} • {new Date(t.bookingDate).toLocaleDateString('vi-VN')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-green-500">+{Math.floor(t.totalPrice / 1000)} P</p>
                <p className="text-[8px] text-zinc-700 font-black uppercase">Đã cộng</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGiftCards = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="glass p-10 rounded-[3rem] border-white/5 space-y-8 bg-zinc-900/40">
           <div>
              <h4 className="text-xl font-black italic uppercase tracking-tighter mb-2">Kích hoạt thẻ quà tặng</h4>
              <p className="text-xs text-zinc-500 font-medium italic">Nhập mã PIN hoặc mã cào từ thẻ QuinQuin Gift Card của bạn.</p>
           </div>
           <div className="space-y-4">
              <input 
                type="text" 
                value={redeemCode} 
                onChange={(e) => setRedeemCode(e.target.value)} 
                placeholder="XXXX-XXXX-XXXX-XXXX" 
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-white outline-none focus:border-red-600 transition-all placeholder:text-zinc-800"
              />
              <button onClick={() => handleRedeem('Thẻ quà tặng')} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl uppercase italic tracking-widest text-[10px] shadow-2xl shadow-red-600/20">KÍCH HOẠT NGAY</button>
           </div>
        </div>
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-zinc-800 to-zinc-950 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity"><div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-2xl italic text-black">Q</div></div>
              <div className="relative z-10">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">SỐ DƯ THẺ QUÀ TẶNG</p>
                <h3 className="text-4xl font-black text-white italic tracking-tighter">500,000 Đ</h3>
                <div className="mt-8 flex gap-4">
                   <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black text-zinc-400 uppercase tracking-widest">HSD: 12/2025</div>
                   <div className="px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-xl text-[8px] font-black text-red-500 uppercase tracking-widest">SẴN SÀNG</div>
                </div>
              </div>
           </div>
           <div className="glass p-6 rounded-2xl border-white/5 bg-zinc-900/20 flex items-center justify-between group cursor-pointer hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                 <p className="text-[10px] font-black uppercase text-zinc-400 italic">Mua thêm thẻ quà tặng</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
           </div>
        </div>
      </div>
    </div>
  );

  const renderVoucherCoupon = (isCoupon: boolean) => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-4">
         <div className="flex bg-zinc-900/60 p-1.5 rounded-2xl border border-white/5">
            <button className="bg-red-600 text-white font-black px-6 py-2.5 rounded-xl text-[9px] uppercase italic tracking-widest">SẮP HẾT HẠN</button>
            <button className="text-zinc-500 font-black px-6 py-2.5 rounded-xl text-[9px] uppercase italic tracking-widest hover:text-white transition-colors">TẤT CẢ</button>
         </div>
         <div className="flex gap-4">
            <input type="text" placeholder="Nhập mã ưu đãi..." className="bg-black/40 border border-white/10 rounded-xl px-5 py-2.5 text-[10px] font-bold text-white outline-none focus:border-red-600 min-w-[200px]" />
            <button className="bg-white text-black font-black px-6 py-2.5 rounded-xl text-[9px] uppercase italic tracking-widest">ÁP DỤNG</button>
         </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: isCoupon ? 'GIẢM 20% TỔNG BILL' : 'VOUCHER BẮP 0Đ', desc: isCoupon ? 'Áp dụng cho mọi suất chiếu IMAX' : 'Đổi ngay 01 bắp (L) tại quầy', code: isCoupon ? 'QUIN20IMAX' : 'POPCORNFREE', date: '30/09/2024' },
          { title: isCoupon ? 'GIẢM 50K VÉ 2D' : 'COMBO ĐÔI 99Đ', desc: isCoupon ? 'Dành riêng cho thành viên Bạc' : 'Giá gốc 125.000đ', code: isCoupon ? 'SILVER50K' : 'DOUBLE99', date: '15/10/2024' },
          { title: isCoupon ? 'HAPPY DAY - GIẢM 15%' : 'NƯỚC NGỌT FREE', desc: isCoupon ? 'Áp dụng vào Thứ 4 hàng tuần' : 'Khi mua 01 bắp size L bất kỳ', code: isCoupon ? 'HAPPY15' : 'DRINKLOVER', date: '01/10/2024' }
        ].map((item, i) => (
          <div key={i} className="glass rounded-[2rem] border-white/5 overflow-hidden flex flex-col group hover:border-red-600/30 transition-all cursor-pointer">
            <div className={`h-24 p-6 flex flex-col justify-center ${isCoupon ? 'bg-gradient-to-br from-red-600/20 to-transparent' : 'bg-gradient-to-br from-blue-600/20 to-transparent'}`}>
              <h5 className="text-sm font-black text-white uppercase italic tracking-tighter leading-tight">{item.title}</h5>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1 italic">{item.desc}</p>
            </div>
            <div className="p-6 space-y-4 bg-zinc-950/40">
              <div className="flex justify-between items-center bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                <span className="text-[10px] font-mono text-zinc-300 font-bold">{item.code}</span>
                <button className="text-[8px] font-black text-red-500 uppercase italic hover:text-white transition-colors">Sao chép</button>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[8px] font-black text-zinc-700 uppercase italic">HSD: {item.date}</p>
                <button className="text-[9px] font-black text-white uppercase italic tracking-widest bg-zinc-800 px-4 py-2 rounded-lg group-hover:bg-red-600 transition-all">SỬ DỤNG</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const menuItems = [
    { id: 'THÔNG TIN CHUNG', label: 'THÔNG TIN CHUNG' },
    { id: 'CHI TIẾT TÀI KHOẢN', label: 'CHI TIẾT TÀI KHOẢN' },
    { id: 'THẺ THÀNH VIÊN', label: 'THẺ THÀNH VIÊN' },
    { id: 'ĐIỂM THƯỞNG', label: 'ĐIỂM THƯỞNG' },
    { id: 'THẺ QUÀ TẶNG', label: 'THẺ QUÀ TẶNG' },
    { id: 'VOUCHER', label: 'VOUCHER' },
    { id: 'COUPON', label: 'COUPON' },
    { id: 'LỊCH SỬ GIAO DỊCH', label: 'LỊCH SỬ GIAO DỊCH' }
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'THÔNG TIN CHUNG': return renderGeneralInfo();
      case 'CHI TIẾT TÀI KHOẢN': return renderAccountDetails();
      case 'ĐIỂM THƯỞNG': return renderPoints();
      case 'THẺ QUÀ TẶNG': return renderGiftCards();
      case 'VOUCHER': return renderVoucherCoupon(false);
      case 'COUPON': return renderVoucherCoupon(true);
      case 'THẺ THÀNH VIÊN': return (
        <div className="max-w-xl mx-auto py-10 space-y-12 animate-in fade-in slide-in-from-right-10">
          <div className={`aspect-[1.6/1] w-full rounded-[3rem] p-10 relative overflow-hidden shadow-2xl ${stats.cardBg} border border-white/10`}><div className="absolute top-0 right-0 p-8"><div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center font-black text-3xl italic text-white/50 border border-white/10">Q</div></div><div className="h-full flex flex-col justify-between relative z-10"><div><p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-2 italic">THẺ THÀNH VIÊN QUINQUIN</p><h4 className={`text-5xl font-black italic tracking-tighter uppercase ${stats.tierName === 'VÀNG' ? 'text-yellow-400' : stats.tierName === 'BẠC' ? 'text-zinc-400' : 'text-orange-500'}`}>{stats.tierName}</h4></div><div className="space-y-1"><p className="text-xl font-bold tracking-widest text-white/90 font-mono">**** **** **** 8888</p><p className="text-[11px] font-black uppercase italic text-white/50">{editData.name}</p></div></div></div>
          <div className="glass p-8 rounded-[2.5rem] border-white/5 text-center bg-zinc-900/40"><h5 className="text-[11px] font-black uppercase italic tracking-widest text-zinc-500 mb-6">MÃ ĐỊNH DANH QR</h5><div className="w-40 h-40 bg-white p-3 rounded-3xl mx-auto shadow-2xl"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QUINQUIN-${user.phone}`} alt="QR" className="w-full h-full grayscale" /></div><p className="mt-6 text-[10px] font-bold text-zinc-600 italic uppercase">Đưa mã này cho nhân viên để tích điểm</p></div>
        </div>
      );
      case 'LỊCH SỬ GIAO DỊCH': return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10">
          <div className="glass rounded-[2.5rem] border-white/5 overflow-hidden bg-zinc-900/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]"><thead className="bg-black/40 text-zinc-500 text-[10px] font-black uppercase tracking-widest italic border-b border-white/5"><tr><th className="p-8">MÃ VÉ</th><th className="p-8">BỘ PHIM</th><th className="p-8">RẠP / SUẤT</th><th className="p-8">GHẾ / COMBO</th><th className="p-8 text-right">GIÁ</th></tr></thead><tbody className="divide-y divide-white/5">{tickets.length === 0 ? <tr><td colSpan={5} className="p-20 text-center text-zinc-800 font-black italic uppercase tracking-widest">Chưa có lịch sử giao dịch</td></tr> : tickets.map(t => (
                <tr key={t.id} className="hover:bg-white/5 transition-all group">
                  <td className="p-8 font-black text-zinc-400 text-xs">{t.id}</td>
                  <td className="p-8"><span className="text-sm font-black text-white uppercase italic">{t.movieTitle}</span></td>
                  <td className="p-8 flex flex-col"><span className="text-[11px] font-bold text-zinc-300 uppercase">{t.theaterName}</span><span className="text-[9px] font-black text-zinc-600 mt-0.5">{t.showtime}</span></td>
                  <td className="p-8 flex flex-col gap-2"><div className="flex flex-wrap gap-1">{t.seats.map(s => <span key={s} className="text-[10px] font-black text-red-500 bg-red-600/10 px-2 py-0.5 rounded-lg border border-red-600/20">{s}</span>)}</div>{t.combos && t.combos.map((c, i) => <span key={i} className="text-[9px] font-bold text-zinc-500 italic leading-none">{c.quantity}x {c.name}</span>)}</td>
                  <td className="p-8 text-right font-black text-white text-sm italic">{t.totalPrice.toLocaleString()} Đ</td>
                </tr>
              ))}</tbody></table>
            </div>
          </div>
        </div>
      );
      default: return <div className="p-20 text-center text-zinc-500 italic font-black uppercase tracking-widest">Tính năng đang phát triển</div>;
    }
  };

  const renderAccountDetails = () => (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8">
       <div className="glass p-10 rounded-[3rem] border-white/5 bg-zinc-900/40 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8">
             {[
               { label: 'HỌ VÀ TÊN', value: editData.name, key: 'name' },
               { label: 'SỐ ĐIỆN THOẠI', value: editData.phone, key: 'phone', placeholder: '0944XXXXXX', disabled: true },
               { label: 'NGÀY SINH', value: editData.dob, key: 'dob' },
               { label: 'GIỚI TÍNH', value: editData.gender, key: 'gender' },
               { label: 'KHU VỰC', value: editData.city, key: 'city' }
             ].map((field) => (
               <div key={field.key} className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-zinc-500 italic tracking-widest ml-1">{field.label}</label>
                  <input 
                    type="text" 
                    value={field.value} 
                    onChange={(e) => !field.disabled && handleInputChange(field.key, e.target.value)} 
                    disabled={field.disabled}
                    className={`w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-red-600 transition-all ${field.disabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  />
               </div>
             ))}
          </div>
          <div className="mt-12 flex flex-col items-center gap-6">
             <button onClick={handleSaveAccount} disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white font-black py-5 px-16 rounded-2xl shadow-2xl uppercase italic tracking-widest text-xs transition-all disabled:bg-zinc-800 disabled:text-zinc-500 flex items-center gap-3">
                {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
             </button>
          </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12 bg-[#050505] text-white">
      {showToast && <div className="fixed top-24 right-12 z-[200] bg-green-500 text-white font-black italic px-8 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-500 uppercase tracking-widest text-xs">HỆ THỐNG ĐÃ CẬP NHẬT THÀNH CÔNG!</div>}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
        <aside className="w-full lg:w-72 shrink-0">
          <div className="mb-14 select-none"><div className="flex items-center gap-4 mb-8 group cursor-pointer" onClick={onClose}><div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center font-black text-2xl italic text-white">Q</div><div className="flex flex-col"><span className="text-xl font-black tracking-tighter uppercase italic">QUINQUIN</span><span className="text-[10px] font-black tracking-[0.3em] uppercase italic text-red-600">CINEMAS</span></div></div><div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mb-8"></div><div className="px-2"><p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic mb-1">CHỦ TÀI KHOẢN</p><h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{editData.name}</h2></div></div>
          <div className="flex flex-col space-y-1">{menuItems.map((item) => (<button key={item.id} onClick={() => setActiveMenu(item.id)} className={`relative h-14 flex items-center px-7 text-[10px] font-black uppercase tracking-widest transition-all ${activeMenu === item.id ? 'bg-red-600 text-white shadow-2xl' : 'bg-zinc-900/30 text-zinc-500 border border-white/5'}`}>{activeMenu === item.id && <div className="absolute left-full top-0 bottom-0 w-5 bg-red-600 [clip-path:polygon(0%_0%,100%_50%,0%_100%)]"></div>}{item.label}</button>))} <button onClick={onLogout} className="h-14 flex items-center px-7 text-[10px] font-black uppercase text-zinc-700 hover:text-red-600 transition-colors pt-12">ĐĂNG XUẤT</button></div>
        </aside>
        <main className="flex-1 min-w-0"><div className="bg-zinc-900 border-l-4 border-red-600 px-10 py-5 mb-12 shadow-2xl flex items-center"><h3 className="text-sm font-black uppercase tracking-[0.4em] italic text-white">{activeMenu}</h3></div><div>{renderContent()}</div><div className="mt-20 pt-10 border-t border-white/5"><button onClick={onClose} className="px-12 py-5 bg-zinc-900 border border-white/10 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-white hover:text-black transition-all shadow-2xl active:scale-95">QUAY LẠI TRANG CHỦ</button></div></main>
      </div>
    </div>
  );
};

export default CustomerProfile;
