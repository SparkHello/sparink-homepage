import albumData from './albums.json';

// thumb / width / height 由 Sparink Studio 上传时写入；旧记录可能没有，渲染端需自行兜底。
export interface Photo { url: string; caption?: string; thumb?: string; width?: number; height?: number; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

// 由本地 Sparink Studio 维护；JSON 仍可直接审阅和版本控制。
export const albums: Album[] = albumData;
