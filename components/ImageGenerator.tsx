
import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [ratio, setRatio] = useState<'3:4' | '16:9' | '1:1'>('3:4');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!(window as any).aistudio?.hasSelectedApiKey()) {
         await (window as any).aistudio?.openSelectKey();
      }

      const img = await GeminiService.generateMoviePoster(prompt, size, ratio as any);
      setGeneratedImg(img);
    } catch (err: any) {
      if (err.message.includes("Requested entity was not found")) {
        await (window as any).aistudio?.openSelectKey();
      }
      setError('Không thể tạo hình ảnh. Vui lòng kiểm tra lại prompt hoặc API key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black italic uppercase mb-4 bg-gradient-to-r from-white via-red-500 to-white bg-clip-text text-transparent tracking-tighter">
          QUINQUIN AI ARTIST
        </h2>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Thiết kế poster phim độc bản cùng QuinQuin Cinemas</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div className="space-y-6 glass p-8 rounded-[2.5rem] border-white/10">
          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-500 mb-3 italic tracking-widest">Ý tưởng phim của bạn</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ví dụ: Một phi hành gia lạc giữa rừng hoa neon trên hành tinh lạ..."
              className="w-full h-32 bg-black border border-white/10 rounded-2xl p-4 text-sm focus:border-red-600 outline-none resize-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2 italic">Chất lượng</label>
              <select 
                value={size}
                onChange={(e) => setSize(e.target.value as any)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none"
              >
                <option value="1K">Tiêu chuẩn (1K)</option>
                <option value="2K">Sắc nét (2K)</option>
                <option value="4K">Cao cấp (4K)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2 italic">Khung hình</label>
              <select 
                value={ratio}
                onChange={(e) => setRatio(e.target.value as any)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none"
              >
                <option value="3:4">Poster (3:4)</option>
                <option value="1:1">Vuông (1:1)</option>
                <option value="16:9">Ngang (16:9)</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isLoading || !prompt}
            className={`w-full py-5 rounded-2xl font-black italic uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
              isLoading || !prompt 
              ? 'bg-zinc-800 text-gray-500 cursor-not-allowed' 
              : 'bg-red-600 text-white hover:bg-red-700 shadow-2xl shadow-red-600/30'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ĐANG SÁNG TẠO...
              </>
            ) : (
              'KHỞI TẠO TÁC PHẨM'
            )}
          </button>
          
          {error && <p className="text-red-500 text-[10px] text-center font-bold">{error}</p>}
        </div>

        <div className="glass rounded-[3rem] border-white/10 overflow-hidden aspect-[3/4] flex items-center justify-center relative bg-zinc-950 shadow-2xl">
          {generatedImg ? (
            <img 
              src={generatedImg} 
              alt="Generated poster" 
              className="w-full h-full object-cover animate-in fade-in duration-700"
            />
          ) : (
            <div className="text-center p-12">
              <div className="w-20 h-20 border-2 border-dashed border-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </div>
              <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">Tác phẩm nghệ thuật sẽ hiển thị tại đây</p>
            </div>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center p-8">
                <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-white font-black italic uppercase tracking-tighter text-lg animate-pulse">QuinQuin AI đang vẽ...</p>
                <p className="text-zinc-400 text-[8px] mt-2 font-bold uppercase tracking-widest italic">Quá trình này có thể mất vài giây</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
