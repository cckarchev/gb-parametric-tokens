export const downloadBlob = (
  bytes: Uint8Array | string,
  fileName: string,
  mimeType: string,
): void => {
  // TypeScript 7's DOM lib types BlobPart against Uint8Array<ArrayBuffer>, but Uint8Array-producing
  // APIs like fflate's zipSync return the wider Uint8Array<ArrayBufferLike> — safe at runtime, so cast.
  const blob = new Blob([bytes as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
};
