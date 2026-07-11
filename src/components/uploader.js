import {
  validatePreviewFile,
  createPreviewObjectUrl,
  revokePreviewObjectUrl,
} from '../services/upload-service.js';

export function bindUploader(input, output, onReady) {
  let url = null;
  input.addEventListener('change', () => {
    try {
      const metadata = validatePreviewFile(input.files[0]);
      revokePreviewObjectUrl(url);
      url = createPreviewObjectUrl(input.files[0]);
      output.innerHTML = `<div class="alert success"><div><strong>Preview file validated</strong><p>${metadata.name} · ${(metadata.size / 1024).toFixed(1)} KB. No Drive upload occurred.</p></div></div>`;
      onReady?.({ ...metadata, objectUrl: url });
    } catch (error) {
      output.innerHTML = `<div class="alert error"><div><strong>${error.code}</strong><p>${error.message}</p></div></div>`;
    }
  });
  return () => revokePreviewObjectUrl(url);
}
