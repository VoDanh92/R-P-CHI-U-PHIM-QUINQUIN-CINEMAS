
export enum SyncEventType {
  MOVIE_UPDATED = 'MOVIE_UPDATED',
  TICKET_BOOKED = 'TICKET_BOOKED',
  SEAT_LOCK = 'SEAT_LOCK',
  SERVER_ANNOUNCEMENT = 'SERVER_ANNOUNCEMENT'
}

export interface SyncMessage {
  type: SyncEventType;
  payload: any;
  clientId: string;
  timestamp: number;
}

class SyncService {
  private channel: BroadcastChannel;
  private clientId: string;

  constructor() {
    this.channel = new BroadcastChannel('quinquin_cinema_network');
    this.clientId = 'client_' + Math.random().toString(36).substr(2, 5);
  }

  // Gửi thông điệp đến tất cả các Client khác
  broadcast(type: SyncEventType, payload: any) {
    const message: SyncMessage = {
      type,
      payload,
      clientId: this.clientId,
      timestamp: Date.now()
    };
    this.channel.postMessage(message);
    
    // Tự cập nhật local (vì BroadcastChannel không gửi cho chính nó)
    window.dispatchEvent(new CustomEvent('sync_message', { detail: message }));
  }

  // Đăng ký lắng nghe sự kiện từ "Server" hoặc các Client khác
  subscribe(callback: (msg: SyncMessage) => void) {
    this.channel.onmessage = (event) => {
      callback(event.data as SyncMessage);
    };
    
    const localHandler = (event: any) => {
      callback(event.detail);
    };
    window.addEventListener('sync_message', localHandler);
    
    return () => {
      window.removeEventListener('sync_message', localHandler);
    };
  }

  getClientId() {
    return this.clientId;
  }
}

export const syncService = new SyncService();
