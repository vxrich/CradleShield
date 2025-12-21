import jsQR from 'jsqr';

export const scanFrame = (
  video: HTMLVideoElement, 
  canvas: HTMLCanvasElement
): string | null => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      return code.data;
    }
  }
  return null;
};