export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

// 个人相册以后从这里添加；暂不沿用模板作者的示例内容。
export const albums: Album[] = [];
