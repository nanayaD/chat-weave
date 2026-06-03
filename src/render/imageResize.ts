const AVATAR_MAX = 96;
const AVATAR_QUALITY = 0.82;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error ?? new Error("파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

function downscale(dataUrl: string, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("캔버스를 사용할 수 없습니다."));
        return;
      }
      // JPEG는 투명도를 지원하지 않으므로 흰 배경으로 평탄화한다.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", AVATAR_QUALITY));
    };
    img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    img.src = dataUrl;
  });
}

// 프로필 이미지를 작은 정사각 범위(96px)로 줄이고 JPEG로 재인코딩해
// Data URL 용량을 수백 KB → 수 KB 수준으로 낮춘다. 실패하면 원본을 그대로 사용한다.
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const original = await readFileAsDataUrl(file);
  try {
    return await downscale(original, AVATAR_MAX);
  } catch {
    return original;
  }
}
