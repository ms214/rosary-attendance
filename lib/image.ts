// 휴대폰 사진(보통 2~10MB)을 업로드 전에 브라우저에서 줄인다.
// 서버 액션 본문 한도(next.config.ts) 안에 들어가도록 긴 변을 줄이고 JPEG로 다시 인코딩한다.
const MAX_SIDE = 1600;
const QUALITY = 0.82;

/** 사진을 JPEG로 축소한다. 디코딩할 수 없는 형식이면 원본을 그대로 돌려준다. */
export async function compressImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    // EXIF 회전 정보를 반영해야 세로 사진이 눕지 않는다.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}
