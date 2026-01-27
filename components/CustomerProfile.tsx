
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
    // Lưu avatar theo số điện thoại thay vì email
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
    // Lọc vé chỉ dựa trên số điện thoại
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
            {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : (
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
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">RANK HIỆN TẠI</p>
                <span className={`text-4xl font-black italic tracking-tighter ${stats.tierClass}`}>{stats.tierName}</span>
                <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden"><div className="h-full bg-red-600" style={{ width: `${stats.progress}%` }}></div></div>
              </div>
           </div>
        </div>
      </div>
      <div className="glass rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl bg-zinc-900/20 divide-x divide-white/5 grid grid-cols-2 md:grid-cols-6">
        {[
          { label: 'CẤP ĐỘ', val: stats.tierName, color: stats.tierClass, action: () => setActiveMenu('THẺ THÀNH VIÊN') },
          { label: 'CHI TIÊU', val: `${stats.totalSpend.toLocaleString()} Đ`, action: () => setActiveMenu('LỊCH SỬ GIAO DỊCH') },
          { label: 'ĐIỂM', val: `${stats.points} P`, color: 'text-red-600', action: () => setActiveMenu('ĐIỂM THƯỞNG') },
          { label: 'VOUCHER', val: '3', action: () => setActiveMenu('VOUCHER') },
          { label: 'COUPON', val: '2', action: () => setActiveMenu('COUPON') },
          { label: 'GIFT CARD', val: '2', action: () => setActiveMenu('THÈ QUÀ TẶNG') }
        ].map((item, idx) => (
          <div key={idx} className="p-7 space-y-2 hover:bg-white/5 transition-all group cursor-pointer" onClick={item.action}>
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic">{item.label}</p>
            <span className={`text-sm font-black italic uppercase ${item.color || 'text-white'}`}>{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );

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

  const renderGiftCards = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-10">
      <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40">
        <p className="text-[10px] font-black uppercase text-zinc-500 italic tracking-widest mb-4">THÊM THẺ QUÀ TẶNG MỚI</p>
        <div className="flex gap-4">
          <input type="text" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} placeholder="Nhập mã thẻ quà tặng (VD: GIF-8888-XX)" className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-red-600" />
          <button onClick={() => handleRedeem('Thẻ quà tặng')} className="bg-red-600 px-8 py-4 rounded-2xl font-black text-xs uppercase italic tracking-widest hover:bg-red-700 transition-all">KÍCH HOẠT</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { code: 'QUIN-8822-XP', val: '200,000 Đ', color: 'from-purple-900/40 to-black' },
          { code: 'QUIN-1155-GT', val: '500,000 Đ', color: 'from-blue-900/40 to-black' }
        ].map((card, idx) => (
          <div key={idx} className={`glass p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-br ${card.color} h-60 flex flex-col justify-between group hover:scale-105 transition-all`}>
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black italic text-white/40">Q</div>
             <div><h4 className="text-3xl font-black italic text-white mb-2">{card.val}</h4><p className="text-xs font-mono text-white/30 tracking-widest uppercase">{card.code}</p></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVoucherList = (type: 'VOUCHER' | 'COUPON') => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
      <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-zinc-900/40">
        <p className="text-[10px] font-black uppercase text-zinc-500 italic tracking-widest mb-4">NHẬP MÃ {type}</p>
        <div className="flex gap-4">
          <input type="text" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} placeholder={`Nhập mã ${type.toLowerCase()} của bạn...`} className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-red-600" />
          <button onClick={() => handleRedeem(type)} className="bg-red-600 px-8 py-4 rounded-2xl font-black text-xs uppercase italic tracking-widest hover:bg-red-700 transition-all">SỬ DỤNG</button>
        </div>
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-[2rem] border-white/5 flex h-36 bg-zinc-900/20 group hover:border-red-600/30 transition-colors">
             <div className={`w-36 h-full flex items-center justify-center font-black italic text-4xl shrink-0 ${type === 'VOUCHER' ? 'bg-red-600/10 text-red-600' : 'bg-orange-600/10 text-orange-600'}`}>{type === 'VOUCHER' ? '-50K' : '-20%'}</div>
             <div className="flex-1 p-6 flex flex-col justify-between">
                <div><h5 className="font-black italic uppercase tracking-tighter text-lg">{type} QUINQUIN HẠNG {stats.tierName}</h5><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 italic">Áp dụng cho mọi suất chiếu tại hệ thống rạp</p></div>
                <div className="flex items-center justify-between"><span className="text-[10px] font-black text-zinc-600 uppercase italic">HSD: 31/12/2024</span><button className={`text-[10px] font-black px-6 py-2 rounded-xl italic transition-all ${type === 'VOUCHER' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}>DÙNG NGAY</button></div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const menuItems = [
    { id: 'THÔNG TIN CHUNG', label: 'THÔNG TIN CHUNG' },
    { id: 'CHI TIẾT TÀI KHOẢN', label: 'CHI TIẾT TÀI KHOẢN' },
    { id: 'THÈ THÀNH VIÊN', label: 'THÈ THÀNH VIÊN' },
    { id: 'ĐIỂM THƯỞNG', label: 'ĐIỂM THƯỞNG' },
    { id: 'THÈ QUÀ TẶNG', label: 'THÈ QUÀ TẶNG' },
    { id: 'VOUCHER', label: 'VOUCHER' },
    { id: 'COUPON', label: 'COUPON' },
    { id: 'LỊCH SỬ GIAO DỊCH', label: 'LỊCH SỬ GIAO DỊCH' }
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'THÔNG TIN CHUNG': return renderGeneralInfo();
      case 'CHI TIẾT TÀI KHOẢN': return renderAccountDetails();
      case 'THÈ THÀNH VIÊN': return (
        <div className="max-w-xl mx-auto py-10 space-y-12 animate-in fade-in slide-in-from-right-10">
          <div className={`aspect-[1.6/1] w-full rounded-[3rem] p-10 relative overflow-hidden shadow-2xl ${stats.cardBg} border border-white/10`}><div className="absolute top-0 right-0 p-8"><div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center font-black text-3xl italic text-white/50 border border-white/10">Q</div></div><div className="h-full flex flex-col justify-between relative z-10"><div><p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-2 italic">QUINQUIN MEMBER CARD</p><h4 className={`text-5xl font-black italic tracking-tighter uppercase ${stats.tierClass}`}>{stats.tierName}</h4></div><div className="space-y-1"><p className="text-xl font-bold tracking-widest text-white/90 font-mono">**** **** **** 8888</p><p className="text-[11px] font-black uppercase italic text-white/50">{editData.name}</p></div></div></div>
          <div className="glass p-8 rounded-[2.5rem] border-white/5 text-center bg-zinc-900/40"><h5 className="text-[11px] font-black uppercase italic tracking-widest text-zinc-500 mb-6">MÃ ĐỊNH DANH QR</h5><div className="w-40 h-40 bg-white p-3 rounded-3xl mx-auto shadow-2xl"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QUINQUIN-${user.phone}`} alt="QR" className="w-full h-full grayscale" /></div><p className="mt-6 text-[10px] font-bold text-zinc-600 italic uppercase">Đưa mã này cho nhân viên để tích điểm</p></div>
        </div>
      );
      case 'LỊCH SỬ GIAO DỊCH': return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10">
          <div className="glass rounded-[2.5rem] border-white/5 overflow-hidden bg-zinc-900/20">
            <table className="w-full text-left"><thead className="bg-black/40 text-zinc-500 text-[10px] font-black uppercase tracking-widest italic border-b border-white/5"><tr><th className="p-8">MÃ VÉ</th><th className="p-8">BỘ PHIM</th><th className="p-8">RẠP / SUẤT</th><th className="p-8">GHẾ / COMBO</th><th className="p-8 text-right">GIÁ</th></tr></thead><tbody className="divide-y divide-white/5">{tickets.map(t => (
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
      );
      case 'ĐIỂM THƯỞNG': return (
        <div className="space-y-10 animate-in fade-in zoom-in-95">
           <div className="grid md:grid-cols-2 gap-8"><div className="glass p-10 rounded-[3rem] border-white/5 bg-zinc-900/40 relative overflow-hidden"><p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest italic mb-2">ĐIỂM HIỆN CÓ</p><h4 className="text-6xl font-black italic tracking-tighter text-red-600">{stats.points} <span className="text-2xl text-white/20">POINTS</span></h4></div><div className="glass p-10 rounded-[3rem] border-white/5 bg-zinc-900/40"><p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest italic mb-4">QUY ĐỔI</p><button className={`w-full text-[9px] font-black px-4 py-4 rounded-2xl transition-all ${stats.points >= 500 ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>ĐỔI VOUCHER 50K (500P)</button></div></div>
        </div>
      );
      case 'THÈ QUÀ TẶNG': return renderGiftCards();
      case 'VOUCHER': return renderVoucherList('VOUCHER');
      case 'COUPON': return renderVoucherList('COUPON');
      default: return null;
    }
  };

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
