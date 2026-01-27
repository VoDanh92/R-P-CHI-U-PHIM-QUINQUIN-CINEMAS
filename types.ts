
export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string[];
  rating: number;
  duration: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  trailerUrl?: string;
  isComingSoon?: boolean;
  isManualPoster?: boolean;
  isManualBackdrop?: boolean;
}

export interface ShowTime {
  id: string;
  time: string;
  format: '2D' | '3D' | 'IMAX';
  price: number;
}

export interface Theater {
  id: string;
  name: string;
  location: string;
  showtimes: ShowTime[];
}

export type SeatStatus = 'available' | 'selected' | 'reserved';

export interface Seat {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
  type: 'regular' | 'vip' | 'couple';
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

export interface Ticket {
  id: string;
  movieTitle: string;
  theaterName: string;
  showtime: string;
  seats: string[];
  phoneNumber: string;
  totalPrice: number;
  status: 'active' | 'cancelled';
  bookingDate: string;
  combos?: { name: string; quantity: number }[];
}

export interface Booking {
  movieId: string;
  theaterId: string;
  showtimeId: string;
  seats: string[];
  combos: { comboId: string; quantity: number }[];
  phoneNumber: string;
  totalPrice: number;
}
