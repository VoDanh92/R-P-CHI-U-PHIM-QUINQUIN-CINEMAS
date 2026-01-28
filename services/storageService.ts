
import { Movie } from '../types';
import { MOVIES as DEFAULT_MOVIES } from '../constants';

const DB_NAME = 'QuinQuinCinemaDB';
const STORE_NAME = 'movies';
const DB_VERSION = 1;

class StorageService {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db!);
      };

      request.onerror = (event: any) => {
        reject('IndexedDB error: ' + event.target.errorCode);
      };
    });
  }

  async getMovies(): Promise<Movie[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('cine_movies');

        request.onsuccess = () => {
          const movies = request.result;
          if (movies && Array.isArray(movies) && movies.length > 0) {
            resolve(movies);
          } else {
            // Fallback to localStorage for backward compatibility or default
            const legacy = localStorage.getItem('cine_movies');
            resolve(legacy ? JSON.parse(legacy) : DEFAULT_MOVIES);
          }
        };
        request.onerror = () => resolve(DEFAULT_MOVIES);
      });
    } catch (e) {
      return DEFAULT_MOVIES;
    }
  }

  async saveMovies(movies: Movie[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(movies, 'cine_movies');

      request.onsuccess = () => {
        // Also clear legacy to save space
        localStorage.removeItem('cine_movies');
        resolve();
      };
      request.onerror = () => reject('Failed to save movies to IndexedDB');
    });
  }
}

export const storageService = new StorageService();
