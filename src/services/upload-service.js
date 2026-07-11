import { AppError } from '../app/errors.js';
import { config } from '../app/config.js';

export function validatePreviewFile(file) {
  if (!file) throw new AppError('FILE_REQUIRED', 'Choose a file.');
  if (!config.uploadTypes.includes(file.type))
    throw new AppError('UNSUPPORTED_FILE_TYPE', 'Use a JPG, PNG, or PDF file.');
  if (file.size > config.maxUploadBytes)
    throw new AppError('FILE_TOO_LARGE', 'The preview file limit is 5 MB.');
  return { name: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'), mimeType: file.type, size: file.size };
}

export function createPreviewObjectUrl(file) {
  return URL.createObjectURL(file);
}
export function revokePreviewObjectUrl(url) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}
