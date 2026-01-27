
import React, { useState } from 'react';

interface CustomerLoginProps {
  onLoginSuccess: (user: any) => void;
  onClose: () => void;
}

const CustomerLogin: React.FC<CustomerLoginProps> = ({ onLoginSuccess, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate số điện thoại đơn giản
    if (!/^\d{10,11}$/.test(formData.phone)) {
      setError('Số điện thoại không hợp lệ (phải từ 10-11 số)!');
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      // Lấy danh sách người dùng từ "Backend" (LocalStorage)
      const registry = JSON.parse(localStorage.getItem('quinquin_users_registry') || '[]');

      if (isRegister) {
        // --- XỬ LÝ ĐĂNG KÝ ---
        
        // 1. Kiểm tra xem SĐT đã tồn tại chưa
        const existingUser = registry.find((u: any) => u.phone === formData.phone);
        if (existingUser) {
          setError('Số điện thoại này đã được đăng ký. Vui lòng đăng nhập!');
          setIsLoading(false);
          return;
        }

        // 2. Tạo user mới
        const newUser = { 
          name: formData.name, 
          phone: formData.phone,
          password: formData.password, // Lưu mật khẩu để verify khi login
          joinDate: new Date().toISOString()
        };
        
        // 3. Lưu vào registry (Database giả lập)
        registry.push(newUser);
        localStorage.setItem('quinquin_users_registry', JSON.stringify(registry));
        
        // 4. Lưu phiên đăng nhập hiện tại
        localStorage.setItem('quinquin_customer', JSON.stringify(newUser));
        
        // 5. Thông báo cho Admin Panel biết có update
        window.dispatchEvent(new Event('storage'));
        
        onLoginSuccess(newUser);

      } else {
        // --- XỬ LÝ ĐĂNG NHẬP ---

        // 1. Tìm user trong registry khớp Phone và Password
        const user = registry.find((u: any) => u.phone === formData.phone && u.password === formData.password);

        if (user) {
          // Đăng nhập thành công
          localStorage.setItem('quinquin_customer', JSON.stringify(user));
          onLoginSuccess(user);
        } else {
          // Đăng nhập thất bại
          setError('Sai số điện thoại hoặc mật khẩu!');
          setIsLoading(false);
        }
      }
    }, 1000); // Giả lập độ trễ mạng
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="glass w-full max-w-md p-10 rounded-[3rem] border-white/10 shadow-[0_0_100px_rgba(220,38,38,0.15)] relative z-10 animate-in zoom-in-95 duration-500">
        <button onClick={onClose} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center font-black text-3xl italic text-white mx-auto mb-6 shadow-2xl">Q</div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">{isRegister ? 'THÀNH VIÊN MỚI' : 'ĐĂNG NHẬP'}</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">Hệ thống định danh QuinQuin Cinemas</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-600/50 p-4 rounded-2xl mb-6 text-center animate-pulse">
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest italic">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 block italic tracking-widest ml-1">Họ và tên</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium outline-none focus:border-red-600 transition-colors" placeholder="Nguyễn Văn A" /></div>
          )}
          
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 block italic tracking-widest ml-1">Số điện thoại</label><input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium outline-none focus:border-red-600 transition-colors" placeholder="09xx xxx xxx" /></div>
          
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 block italic tracking-widest ml-1">Mật khẩu</label><input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium outline-none focus:border-red-600 transition-colors" placeholder="••••••••" /></div>
          
          {!isRegister && <div className="flex justify-end"><button type="button" className="text-[10px] font-black uppercase text-zinc-500 hover:text-red-500 transition-colors italic">Quên mật khẩu?</button></div>}
          
          <button type="submit" disabled={isLoading} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase italic tracking-widest shadow-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3">
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRegister ? 'ĐĂNG KÝ NGAY' : 'VÀO RẠP NGAY')}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">{isRegister ? 'Bạn đã có tài khoản?' : 'Bạn chưa có tài khoản QuinQuin?'}</p>
          <button onClick={() => { setIsRegister(!isRegister); setError(''); setFormData({ phone: '', password: '', name: '' }); }} className="text-white font-black uppercase italic tracking-tighter text-sm hover:text-red-500 transition-colors">
            {isRegister ? 'ĐĂNG NHẬP TẠI ĐÂY' : 'ĐĂNG KÝ BẰNG SỐ ĐIỆN THOẠI'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
