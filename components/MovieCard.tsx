
import React, { useState } from 'react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="group cursor-pointer flex flex-col"
      onClick={() => onSelect(movie)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 shadow-lg mb-4">
        <img 
          src={imgError ? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&h=900&auto=format&fit=crop' : (movie.posterUrl || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&h=900&auto=format&fit=crop')} 
          alt={movie.title} 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Rating Badge Overlay - Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1 shadow-xl">
             <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#eab308" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
             <span className="text-[10px] font-black text-white">{movie.rating && movie.rating > 0 ? movie.rating : '8.5'}</span>
          </div>
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
          <div className="bg-red-600 text-white font-black py-3 px-6 rounded-xl text-[10px] shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 uppercase italic tracking-widest">
            MUA VÉ NGAY
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-black text-white truncate text-sm uppercase italic tracking-tighter group-hover:text-red-500 transition-colors leading-tight">
          {movie.title}
        </h3>
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-zinc-600 font-black uppercase italic tracking-widest">
            {movie.duration}
          </p>
          <div className="bg-red-600/10 border border-red-600/30 px-2 py-0.5 rounded text-[8px] font-black text-red-600 italic">
            IMAX
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
