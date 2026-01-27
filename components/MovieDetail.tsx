
import React from 'react';
import { Movie } from '../types';

interface MovieDetailProps {
  movie: Movie;
  onClose: () => void;
  onBook: () => void;
}

const MovieDetail: React.FC<MovieDetailProps> = ({ movie, onClose, onBook }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose}></div>
      
      <div className="glass w-full max-w-6xl h-[90vh] rounded-[3rem] overflow-hidden relative z-10 flex flex-col md:flex-row animate-in zoom-in-95 duration-500 border-white/10">
        <button onClick={onClose} className="absolute top-8 right-8 z-20 text-white/50 hover:text-white bg-black/20 hover:bg-red-600 p-3 rounded-full transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <div className="w-full md:w-2/5 h-1/2 md:h-full relative shrink-0">
          <img src={movie.posterUrl} className="w-full h-full object-cover" alt={movie.title} />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-transparent to-transparent"></div>
        </div>

        <div className="flex-1 p-8 md:p-16 overflow-y-auto custom-scrollbar flex flex-col justify-center">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              {movie.genre.map(g => (
                <span key={g} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">{g}</span>
              ))}
              <span className="px-4 py-1.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest italic">IMAX</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.85] text-white">
              {movie.title}
            </h2>

            <div className="flex items-center gap-10">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic mb-1">Thời lượng</span>
                <span className="text-xl font-black italic text-white">{movie.duration}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic mb-1">Xếp hạng</span>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#e11d48"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span className="text-xl font-black italic text-white">{movie.rating > 0 ? movie.rating : '8.5'}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic mb-1">Ngày chiếu</span>
                <span className="text-xl font-black italic text-white">{movie.releaseDate}</span>
              </div>
            </div>

            <p className="text-zinc-400 text-lg leading-relaxed font-medium italic max-w-2xl">
              "{movie.description}"
            </p>

            <div className="pt-8 flex flex-wrap gap-6">
              <button onClick={onBook} className="bg-red-600 hover:bg-red-700 text-white font-black py-6 px-16 rounded-2xl shadow-2xl shadow-red-600/30 transition-all hover:-translate-y-2 active:translate-y-0 uppercase italic tracking-widest text-xs">
                MUA VÉ NGAY
              </button>
              <button className="bg-white/5 hover:bg-white/10 text-white font-black py-6 px-16 rounded-2xl border border-white/10 transition-all hover:-translate-y-2 uppercase italic tracking-widest text-xs">
                XEM TRAILER
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
