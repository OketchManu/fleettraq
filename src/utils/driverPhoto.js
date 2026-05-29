const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_DIMENSION = 256;

export function validateDriverPhotoFile(file) {
  if (!file) return null;
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_BYTES) {
    return "Photo must be 5 MB or smaller.";
  }
  return null;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Resize the image client-side to a small JPEG data URL so it fits inside a
 * Firestore document field (no Firebase Storage required).
 */
export async function processDriverPhoto(file) {
  const err = validateDriverPhotoFile(file);
  if (err) throw new Error(err);

  const dataUrl = await readFileAsDataUrl(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch (e) {
        reject(new Error("Could not process the image."));
      }
    };
    img.onerror = () => reject(new Error("Could not load the image."));
    img.src = dataUrl;
  });
}
