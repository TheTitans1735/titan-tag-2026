function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export async function filesToMediaItems(fileList) {
  const files = Array.from(fileList || []);
  const items = [];

  for (const file of files) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;

    if (file.size > 15 * 1024 * 1024) {
      throw new Error('קובץ גדול מדי (מעל 15MB). נסו קובץ קטן יותר.');
    }

    const dataUrl = await fileToDataUrl(file);
    items.push({
      id: `M-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      kind: file.type.startsWith('video/') ? 'video' : 'image',
      mime: file.type,
      name: file.name || '',
      dataUrl
    });
  }

  return items;
}
