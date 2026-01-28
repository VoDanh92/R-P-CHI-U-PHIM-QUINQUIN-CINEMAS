
import React, { useState, useEffect, useRef } from 'react';
import { Movie } from '../types';

interface MovieDetailProps {
  movie: Movie;
  onClose: () => void;
  onBook: () => void;
}

const MovieDetail: React.FC<MovieDetailProps> = ({ movie, onClose, onBook }) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [trailerBlobUrl, setTrailerBlobUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  useEffect(() => {
    let url: string | null = null;
    
    const prepareVideo = async () => {
      if (showTrailer && movie.trailerUrl) {
        setVideoLoading(true);
        try {
          const response = await fetch(movie.trailerUrl);
          const blob = await response.blob();
          url = URL.createObjectURL(blob);
          setTrailerBlobUrl(url);
        } catch (e) {
          console.error("Lỗi xử lý video:", e);
          setTrailerBlobUrl(movie.trailerUrl || null);
        }
      }
    };

    prepareVideo();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
      setTrailerBlobUrl(null);
    };
  }, [showTrailer, movie.trailerUrl]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={onClose}></div>
      <div className="glass w-full max-w-6xl h-[85vh] rounded-[3.5rem] overflow-hidden relative z-10 flex flex-col md:flex-row animate-in zoom-in border-white/10">
        <button onClick={onClose} className="absolute top-8 right-8 z-20 bg-white/5 hover:bg-red-600 p-4 rounded-full transition-all group active:scale-90 shadow-2xl border border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <div className="w-full md:w-[45%] h-[40%] md:h-full relative shrink-0">
          <img src={movie.posterUrl} className="w-full h-full object-cover shadow-[20px_0_50px_rgba(0,0,0,0.5)]" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-black/10 to-transparent"></div>
        </div>

        <div className="flex-1 p-10 md:p-20 flex flex-col justify-center overflow-y-auto custom-scrollbar">
          <div className="space-y-10">
            <div>
               <div className="flex items-center gap-3 mb-6">
                  <span className="bg-red-600 px-3 py-1 rounded-lg text-[10px] font-black italic uppercase text-white shadow-xl shadow-red-600/20">IMAX 1080P FULL HD</span>
                  <span className="text-zinc-500 font-black italic uppercase text-[10px] tracking-widest">{movie.duration} • {movie.genre.join(', ')}</span>
               </div>
               <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] text-white drop-shadow-2xl">{movie.title}</h2>
            </div>
            
            <p className="text-zinc-400 text-lg leading-relaxed font-medium italic max-w-2xl border-l-4 border-red-600 pl-8">"{movie.description}"</p>
            
            <div className="pt-10 flex flex-wrap gap-6">
              {!movie.isComingSoon && (
                <button onClick={onBook} className="bg-red-600 hover:bg-red-700 text-white font-black py-6 px-16 rounded-[2rem] shadow-[0_20px_50px_rgba(225,29,72,0.4)] transition-all hover:-translate-y-2 uppercase italic tracking-widest text-xs">MUA VÉ NGAY</button>
              )}
              <button onClick={() => movie.trailerUrl && setShowTrailer(true)} disabled={!movie.trailerUrl} className={`bg-white/5 hover:bg-white/10 text-white font-black py-6 px-16 rounded-[2rem] border border-white/10 transition-all hover:-translate-y-2 uppercase italic tracking-widest text-xs ${!movie.trailerUrl ? 'opacity-20 cursor-not-allowed' : ''}`}>XEM TRAILER 1080P</button>
            </div>
          </div>
        </div>
      </div>

      {showTrailer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-black/98 animate-in fade-in duration-300 backdrop-blur-xl">
           <div className="absolute inset-0 cursor-pointer" onClick={() => setShowTrailer(false)}></div>
           <div className="w-full max-w-7xl aspect-video rounded-[3rem] overflow-hidden border border-white/10 relative shadow-[0_0_100px_rgba(225,29,72,0.2)] animate-in zoom-in-95 bg-black">
              <button onClick={() => setShowTrailer(false)} className="absolute top-8 right-8 z-30 bg-black/50 hover:bg-red-600 text-white p-4 rounded-full transition-all border border-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              
              {videoLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
                   <div className="w-16 h-16 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-6"></div>
                   <p className="text-white font-black italic uppercase tracking-[0.3em] text-sm animate-pulse">STREAMING 1080P FULL HD...</p>
                </div>
              )}

              {trailerBlobUrl && (
                <video 
                  ref={videoRef}
                  src={trailerBlobUrl} 
                  className="w-full h-full object-contain" 
                  controls 
                  autoPlay 
                  preload="auto"
                  playsInline
                  onCanPlayThrough={() => setVideoLoading(false)}
                  onWaiting={() => setVideoLoading(true)}
                  onPlaying={() => setVideoLoading(false)}
                  disablePictureInPicture
                  controlsList="nodownload"
                />
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;
