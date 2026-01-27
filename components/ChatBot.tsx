
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { Ticket } from '../types';
import { MOVIES } from '../constants';

interface ChatBotProps {
  onStartBooking?: (movieTitle: string) => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ onStartBooking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'Chào bạn! Tôi là QuinQuin Cinemas AI 🍿. Bạn muốn đặt vé phim gì, kiểm tra vé hay cần tôi tư vấn phim hay nào không?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getTickets = (): Ticket[] => JSON.parse(localStorage.getItem('cine_tickets') || '[]');
  const saveTickets = (tickets: Ticket[]) => localStorage.setItem('cine_tickets', JSON.stringify(tickets));

  const executeFunction = async (name: string, args: any) => {
    const tickets = getTickets();

    if (name === 'check_ticket_status') {
      const found = tickets.filter(t => t.phoneNumber === args.phoneNumber && t.status === 'active');
      if (found.length === 0) return "Tôi không tìm thấy vé nào gắn với số điện thoại này tại rạp QuinQuin. Bạn vui lòng kiểm tra lại nhé!";
      return `Tôi tìm thấy ${found.length} vé của bạn tại QuinQuin Cinemas:\n` + found.map(t => 
        `- Mã vé: ${t.id}\n  Phim: ${t.movieTitle}\n  Rạp: ${t.theaterName}\n  Suất: ${t.showtime}\n  Ghế: ${t.seats.join(', ')}`
      ).join('\n\n');
    }

    if (name === 'cancel_ticket') {
      const index = tickets.findIndex(t => t.id === args.ticketId && t.phoneNumber === args.phoneNumber);
      if (index === -1) return "Rất tiếc, tôi không tìm thấy vé nào khớp với thông tin mã vé và SĐT bạn cung cấp.";
      tickets[index].status = 'cancelled';
      saveTickets(tickets);
      return `Xác nhận: Vé ${args.ticketId} của bạn đã được hủy thành công. QuinQuin Cinemas sẽ hoàn tiền theo quy định của chúng tôi.`;
    }

    if (name === 'book_movie') {
      const movie = MOVIES.find(m => m.title.toLowerCase().includes(args.movieTitle.toLowerCase()));
      if (movie) {
        if (onStartBooking) {
          setTimeout(() => onStartBooking(movie.title), 500);
          return `Tuyệt vời! Tôi đang chuyển bạn đến trang đặt vé phim "${movie.title}". Chúc bạn có trải nghiệm tuyệt vời tại QuinQuin Cinemas!`;
        }
      }
      return `Hiện tại rạp QuinQuin không có phim "${args.movieTitle}" trong lịch chiếu. Bạn có muốn xem danh sách các phim đang hot không?`;
    }

    return "Chức năng này đang được cập nhật.";
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await GeminiService.chat(userMsg);
      
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          const result = await executeFunction(fc.name, fc.args);
          setMessages(prev => [...prev, { role: 'bot', text: result }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: response.text || 'Tôi chưa hiểu ý bạn lắm, bạn có thể nói rõ hơn được không?' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'bot', text: 'Hệ thống AI đang bận một chút, bạn vui lòng thử lại sau nhé!' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className="glass w-[350px] md:w-[400px] h-[550px] rounded-[2rem] flex flex-col shadow-2xl overflow-hidden border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-red-600 p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-md font-black text-red-600 italic">Q</div>
              <div>
                <h4 className="font-black text-sm uppercase italic tracking-tighter text-white">QuinQuin Cinemas AI</h4>
                <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                   <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">Trực tuyến</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-black/20 p-2 rounded-xl transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-5 bg-[#0a0a0a]/90">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' 
                  ? 'bg-red-600 text-white font-bold rounded-tr-none shadow-lg' 
                  : 'bg-zinc-900 text-zinc-300 font-medium rounded-tl-none border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 p-4 rounded-[1.5rem] rounded-tl-none border border-white/5 flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-zinc-900 border-t border-white/5 flex items-center gap-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi QuinQuin về lịch chiếu phim..."
              className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:ring-1 focus:ring-red-600 outline-none text-white font-medium placeholder:text-zinc-600"
            />
            <button 
              disabled={!input.trim() || isTyping}
              onClick={handleSend}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                !input.trim() || isTyping ? 'bg-zinc-800 text-zinc-600' : 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-600/30 active:scale-95'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-red-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl hover:scale-105 transition-all hover:bg-red-700 relative group animate-bounce"
        >
          <div className="absolute -top-14 right-0 bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-2xl border border-gray-100 italic">
            QuinQuin AI sẵn sàng giúp!
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      )}
    </div>
  );
};

export default ChatBot;
