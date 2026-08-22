import albumData from './albums.json';

export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

// 由本地 Sparink Studio 维护；JSON 仍可直接审阅和版本控制。
export const albums: Album[] = albumData;
