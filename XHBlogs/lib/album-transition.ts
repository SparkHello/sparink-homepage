// The original photo index stays stable when a preview or gallery changes display order.
function albumToken(albumId: string) {
  return Array.from(albumId, character => character.codePointAt(0)!.toString(16)).join('-');
}

export function albumPhotoName(albumId: string, originalIndex: number) {
  return `album-${albumToken(albumId)}-photo-${originalIndex}`;
}

export function albumTitleName(albumId: string) {
  return `album-${albumToken(albumId)}-title`;
}
