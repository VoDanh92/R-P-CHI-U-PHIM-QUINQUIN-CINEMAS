
import React from 'react';
import { SeatStatus } from '../types';

interface SeatMapProps {
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
}

const SeatMap: React.FC<SeatMapProps> = ({ selectedSeats, onToggleSeat }) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = 12;

  // Mock data ghế đã đặt
  const reserved = ['C5', 'C6', 'D10', 'D11', 'A1', 'A2', 'H12', 'F5', 'F6'];

  const getSeatType = (row: string): 'regular' | 'vip' | 'couple' => {
    if (row === 'H') return 'couple';
    if (['E', 'F', 'G'].includes(row)) return 'vip';
    return 'regular';
  };

  const getSeatStatus = (id: string): SeatStatus => {
    if (reserved.includes(id)) return 'reserved';
    if (selectedSeats.includes(id)) return 'selected';
    return 'available';
  };

  return (
    <div className="flex flex-col items-center">
      {/* Curved Screen */}
      <div className="relative w-full max-w-3xl mb-24 flex flex-col items-center">
        <div className="w-full h-2 bg-gradient-to-r from-transparent via-red-600 to-transparent rounded-full blur-[2px] opacity-50"></div>
        <div 
          className="w-full h-12 bg-gradient-to-t from-red-600/20 to-transparent rounded-[50%] absolute top-0"
          style={{ transform: 'perspective(100px) rotateX(-20deg)' }}
        ></div>
        <p className="text-zinc-600 text-[9px] uppercase tracking-[0.6em] font-black mt-4 text-center">MÀN HÌNH CHÍNH (IMAX)</p>
      </div>

      {/* Grid */}
      <div className="space-y-4 mb-20">
        {rows.map(row => (
          <div key={row} className="flex gap-4 items-center justify-center">
            <span className="w-6 text-[10px] text-zinc-700 font-black text-center">{row}</span>
            <div className="flex gap-2.5">
              {Array.from({ length: cols }).map((_, i) => {
                const id = `${row}${i + 1}`;
                const status = getSeatStatus(id);
                const type = getSeatType(row);
                
                return (
                  <button
                    key={id}
                    disabled={status === 'reserved'}
                    onClick={() => onToggleSeat(id)}
                    className={`
                      w-8 h-8 md:w-9 md:h-9 rounded-lg transition-all duration-300 border-2 relative group flex items-center justify-center
                      ${status === 'reserved' 
                        ? 'bg-zinc-900 border-zinc-950 cursor-not-allowed opacity-30'
                        : status === 'selected'
                        ? 'bg-red-600 border-red-400 scale-110 shadow-[0_0_20px_rgba(225,29,72,0.5)] z-10'
                        : type === 'vip' 
                        ? 'bg-zinc-900/40 border-orange-500/30 hover:border-orange-500'
                        : type === 'couple'
                        ? 'bg-zinc-900/40 border-purple-500/30 hover:border-purple-500 w-16 md:w-20'
                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-500'
                      }
                    `}
                  >
                    <span className={`text-[9px] font-black transition-colors ${
                      status === 'selected' ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-300'
                    }`}>
                      {id}
                    </span>
                    
                    {/* Visual indicators for seat types */}
                    {status !== 'selected' && status !== 'reserved' && (
                      <div className={`absolute -bottom-1 w-1/2 h-[1px] ${
                        type === 'vip' ? 'bg-orange-500' : type === 'couple' ? 'bg-purple-500' : 'bg-zinc-800'
                      }`}></div>
                    )}
                  </button>
                );
              })}
            </div>
            <span className="w-6 text-[10px] text-zinc-700 font-black text-center">{row}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-8 bg-black/40 px-10 py-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-md bg-zinc-900 border-2 border-zinc-800"></div>
          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Trống</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-md bg-red-600 shadow-[0_0_10px_rgba(225,29,72,0.5)]"></div>
          <span className="text-[9px] font-black uppercase text-zinc-300 tracking-widest">Đang chọn</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-md bg-zinc-900 opacity-30 border-2 border-zinc-950"></div>
          <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Đã đặt</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-md border-2 border-orange-500"></div>
          <span className="text-[9px] font-black uppercase text-orange-500 tracking-widest">VIP</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-4 rounded-md border-2 border-purple-500"></div>
          <span className="text-[9px] font-black uppercase text-purple-500 tracking-widest">COUPLE</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
