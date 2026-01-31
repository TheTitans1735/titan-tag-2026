export async function filesToMediaItems(fileList) {
  const files = Array.from(fileList || []);
  const items = [];

  for (const file of files) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;

    if (file.size > 15 * 1024 * 1024) {
      throw new Error('קובץ גדול מדי (מעל 15MB). נסו קובץ קטן יותר.');
    }

    items.push({
      id: `M-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      kind: file.type.startsWith('video/') ? 'video' : 'image',
      mime: file.type,
      name: file.name || '',
      blob: file
    });
  }

  return items;
}
