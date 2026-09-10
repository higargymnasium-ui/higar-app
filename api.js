// Helper untuk memanggil Apps Script Web App (backend Google Sheets).
// Aktif otomatis begitu VITE_API_URL diisi di file .env
// (lihat higar-panduan-live-publish.md Bagian 3 & 4)

const API_URL = import.meta.env.VITE_API_URL;

export async function listRows(sheet) {
  if (!API_URL) return null; // fallback: pakai data dummy di App.jsx
  const res = await fetch(`${API_URL}?sheet=${sheet}&action=list`);
  const json = await res.json();
  return json.data;
}

export async function createRow(sheet, data) {
  if (!API_URL) return { success: false, error: "VITE_API_URL belum diisi" };
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ sheet, action: "create", data }),
  });
  return res.json();
}

export async function updateRow(sheet, id, data) {
  if (!API_URL) return { success: false, error: "VITE_API_URL belum diisi" };
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ sheet, action: "update", id, data }),
  });
  return res.json();
}

export async function deleteRow(sheet, id) {
  if (!API_URL) return { success: false, error: "VITE_API_URL belum diisi" };
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ sheet, action: "delete", id }),
  });
  return res.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result; // "data:image/png;base64,xxxxx"
      resolve(String(result).split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Kecilkan & kompres foto di browser sebelum diunggah (foto kamera HP bisa 5-10MB,
// ini bikin browser berat/hang saat diubah jadi teks base64). Hasil dikecilkan
// maksimal 1280px di sisi terpanjang dan dikompres ke JPEG kualitas ~70%.
function compressImage(file, maxDimension = 1280, quality = 0.72) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => resolve(blob || file), // kalau kompresi gagal, pakai file asli
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => resolve(file); // gagal decode gambar, pakai file asli
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch (err) {
      resolve(file); // ada apa-apa, aman fallback ke file asli
    }
  });
}

// Unggah foto ke Google Drive (lewat Apps Script) dan dapatkan URL publiknya.
// Kembalikan { success: false } dengan aman kalau VITE_API_URL belum diisi atau upload gagal.
export async function uploadImage(file) {
  if (!API_URL) return { success: false, error: "VITE_API_URL belum diisi" };
  if (!file) return { success: false, error: "Tidak ada file" };
  if (file.size > 20 * 1024 * 1024) {
    return { success: false, error: "Ukuran file terlalu besar (maks 20MB)" };
  }
  try {
    const compressed = await compressImage(file);
    const base64 = await fileToBase64(compressed);
    const safeName = (file.name || "foto").replace(/\.[^.]+$/, "") + ".jpg";
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "uploadImage", filename: safeName, mimeType: "image/jpeg", base64 }),
    });
    return res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}
