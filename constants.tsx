
import { Movie, Theater, Combo } from './types';

export const MOVIES: Movie[] = [
  {
    id: 'm1',
    title: 'Transformers Chiến Binh Cuối Cùng',
    description: 'Khi con người và Transformers xung đột, Optimus Prime đã ra đi. Chìa khóa cứu rỗi tương lai nằm chôn vùi trong những bí mật lịch sử của Transformers trên Trái Đất. Cade Yeager cùng Bumblebee và các đồng minh phải đứng lên để cứu lấy nhân loại trong cuộc chiến khốc liệt nhất.',
    genre: ['Hành động', 'Khoa học viễn tưởng', 'Phiêu lưu'],
    rating: 9.1,
    duration: '2h 34m',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/s5HQfPixVrMWtnsA2Mizwoeeybr.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/Yc9q6Pu6roMX8uYxEn0796U08y.jpg',
    releaseDate: '2024-09-20'
  },
  {
    id: 'm2',
    title: 'Transformers Một',
    description: 'Câu chuyện chưa kể về nguồn gốc của Optimus Prime và Megatron, từ những người bạn thân thiết trở thành kẻ thù không đội trời chung trên hành tinh Cybertron.',
    genre: ['Hoạt hình', 'Hành động', 'Sci-Fi'],
    rating: 8.9,
    duration: '1h 44m',
    posterUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/6Y00p49EivhY47D0y793pS6k8Uv.jpg',
    backdropUrl: 'https://www.themoviedb.org/t/p/original/66986C9S798pS6k8Uv.jpg',
    releaseDate: '2024-09-20'
  },
  {
    id: 'm3',
    title: 'Không Nói Điều Dữ',
    description: 'Một gia đình Mỹ được mời đến nghỉ cuối tuần tại điền trang nông thôn của một gia đình người Anh. Chuyến đi nhanh chóng trở thành một cơn ác mộng tâm lý.',
    genre: ['Kinh dị', 'Giật gân'],
    rating: 7.8,
    duration: '1h 50m',
    posterUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/36p8Uv6Y00p49EivhY47D0y79.jpg',
    backdropUrl: 'https://www.themoviedb.org/t/p/original/speak-no-evil-backdrop.jpg',
    releaseDate: '2024-09-13'
  },
  {
    id: 'm4',
    title: 'Lật Mặt 7: Một Điều Ước',
    description: 'Tác phẩm của đạo diễn Lý Hải kể về nỗi lòng của bà Hai và 5 người con. Phim lấy đi nước mắt của hàng triệu khán giả Việt bởi thông điệp gia đình sâu sắc.',
    genre: ['Tâm lý', 'Gia đình'],
    rating: 9.2,
    duration: '2h 18m',
    posterUrl: 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/l/m/lm7_teaser_poster_1_.jpg',
    backdropUrl: 'https://iguov8nhvyobj.vcdn.cloud/media/banner/cache/1/b58515f018eb9da2a7589055a435ae0e/l/a/lat_mat_7_980x448.jpg',
    releaseDate: '2024-04-26'
  },
  {
    id: 'm5',
    title: 'Ma Da',
    description: 'Dựa trên truyền thuyết đô thị về Ma Da kéo giò, bộ phim xoay quanh nghề hạ bạc trên sông nước miền Tây và những bí ẩn tâm linh rợn người.',
    genre: ['Kinh dị', 'Tâm linh'],
    rating: 7.5,
    duration: '1h 35m',
    posterUrl: 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/m/a/mada_poster_final_ngang_1_.jpg',
    backdropUrl: 'https://iguov8nhvyobj.vcdn.cloud/media/banner/cache/1/b58515f018eb9da2a7589055a435ae0e/m/a/mada_980x448.jpg',
    releaseDate: '2024-08-16'
  },
  {
    id: 'm6',
    title: 'Joker: Điên Có Đôi',
    description: 'Phần tiếp theo của siêu phẩm Joker (2019). Arthur Fleck giờ đây gặp gỡ Harley Quinn và tạo nên một bản nhạc điên rồ giữa lòng Gotham.',
    genre: ['Tội phạm', 'Kịch tính', 'Âm nhạc'],
    rating: 0,
    duration: '2h 18m',
    posterUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/n66986C9S798pS6k8Uv.jpg',
    backdropUrl: 'https://www.themoviedb.org/t/p/original/joker-2-bg.jpg',
    releaseDate: '2024-10-04',
    isComingSoon: true
  },
  {
    id: 'm7',
    title: 'Võ Sĩ Giác Đấu II',
    description: 'Tiếp nối huyền thoại Ridley Scott, Lucius bước vào đấu trường Colosseum để đối mặt với quá khứ và tìm lại vinh quang cho Rome.',
    genre: ['Hành động', 'Sử thi'],
    rating: 0,
    duration: '2h 30m',
    posterUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/gladiator-2-poster.jpg',
    backdropUrl: 'https://www.themoviedb.org/t/p/original/gladiator-2-bg.jpg',
    releaseDate: '2024-11-22',
    isComingSoon: true
  },
  {
    id: 'm8',
    title: 'Moana 2',
    description: 'Moana nhận được một lời kêu gọi bất ngờ từ tổ tiên và thực hiện chuyến hành trình xa xôi đến các vùng biển rộng lớn của Châu Đại Dương.',
    genre: ['Hoạt hình', 'Phiêu lưu'],
    rating: 0,
    duration: '1h 45m',
    posterUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/moana-2-poster.jpg',
    backdropUrl: 'https://www.themoviedb.org/t/p/original/moana-2-bg.jpg',
    releaseDate: '2024-11-27',
    isComingSoon: true
  }
];

export const THEATERS: Theater[] = [
  {
    id: 't1',
    name: 'CGV Vincom Đồng Khởi',
    location: '72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    showtimes: [
      { id: 's1', time: '09:00', format: '2D', price: 110000 },
      { id: 's2', time: '13:45', format: 'IMAX', price: 250000 },
      { id: 's3', time: '17:00', format: '2D', price: 110000 },
      { id: 's4', time: '21:30', format: '3D', price: 160000 }
    ]
  },
  {
    id: 't2',
    name: 'Galaxy Nguyễn Du',
    location: '116 Nguyễn Du, Quận 1, TP. Hồ Chí Minh',
    showtimes: [
      { id: 's5', time: '10:15', format: '2D', price: 85000 },
      { id: 's6', time: '14:30', format: '2D', price: 85000 },
      { id: 's7', time: '19:00', format: '2D', price: 95000 },
      { id: 's8', time: '22:15', format: '2D', price: 75000 }
    ]
  },
  {
    id: 't3',
    name: 'Lotte Cinema Gò Vấp',
    location: '242 Nguyễn Văn Lượng, Quận Gò Vấp, TP. Hồ Chí Minh',
    showtimes: [
      { id: 's9', time: '11:00', format: '2D', price: 90000 },
      { id: 's10', time: '15:20', format: '3D', price: 130000 },
      { id: 's11', time: '20:45', format: '2D', price: 90000 }
    ]
  }
];

export const COMBOS: Combo[] = [
  {
    id: 'c1',
    name: 'COMBO ĐƠN (1 BẮP + 1 NƯỚC)',
    description: '1 Bắp lớn (Vị ngọt/mặn) + 1 Nước ngọt cỡ lớn',
    price: 85000,
    imageUrl: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=400&h=400&auto=format&fit=crop'
  },
  {
    id: 'c2',
    name: 'COMBO ĐÔI (1 BẮP + 2 NƯỚC)',
    description: '1 Bắp lớn (L) + 2 Nước ngọt (L)',
    price: 125000,
    imageUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400&h=400&auto=format&fit=crop'
  },
  {
    id: 'c4',
    name: 'COMBO GIA ĐÌNH SIÊU KHỦNG',
    description: '2 Bắp lớn + 4 Nước ngọt lớn + 1 Khoai tây chiên',
    price: 195000,
    imageUrl: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?q=80&w=400&h=400&auto=format&fit=crop'
  },
  {
    id: 'c3',
    name: 'BẮP RANG LẺ (SIZE L)',
    description: 'Bắp rang bơ vàng óng, thơm lừng vị phô mai hoặc truyền thống',
    price: 55000,
    imageUrl: 'https://images.unsplash.com/photo-1572177191856-3cde618dee1f?q=80&w=400&h=400&auto=format&fit=crop'
  },
  {
    id: 'c5',
    name: 'NƯỚC NGỌT LẺ (SIZE L)',
    description: 'Thức uống có gas sảng khoái với nhiều đá lạnh',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&h=400&auto=format&fit=crop'
  }
];
