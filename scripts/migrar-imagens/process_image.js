// Lê o JSON salvo pelo download_file_content do Drive, converte a imagem pra
// WebP (padrão) + JPG (fallback) e sobe pro Storage do Supabase, depois insere
// a linha em imagens_equipamento. Chave lida só de env var, nunca gravada em arquivo.
const fs = require("fs");
const sharp = require("sharp");

const [, , jsonPath, equipamentoId, ordemStr, tipo] = process.argv;
const ordem = Number(ordemStr);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente");
  process.exit(1);
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const buffer = Buffer.from(raw.content, "base64");
  const slug = raw.title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.]+/g, "-")
    .toLowerCase();

  const img = sharp(buffer).rotate();
  const meta = await img.metadata();
  const resize = meta.width && meta.width > 1600 ? { width: 1600 } : null;

  const webpBuffer = await (resize ? img.clone().resize(resize) : img.clone())
    .webp({ quality: 82 })
    .toBuffer();
  const jpgBuffer = await (resize ? img.clone().resize(resize) : img.clone())
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 85 })
    .toBuffer();

  const basePath = `${equipamentoId}/${ordem}-${slug}`;
  const webpPath = `${basePath}.webp`;
  const jpgPath = `${basePath}.jpg`;

  await uploadToStorage(webpPath, webpBuffer, "image/webp");
  await uploadToStorage(jpgPath, jpgBuffer, "image/jpeg");

  const urlWebp = `${SUPABASE_URL}/storage/v1/object/public/imagens-equipamentos/${webpPath}`;
  const urlJpg = `${SUPABASE_URL}/storage/v1/object/public/imagens-equipamentos/${jpgPath}`;

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/imagens_equipamento`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      equipamento_id: equipamentoId,
      url_webp: urlWebp,
      url_jpg_fallback: urlJpg,
      tipo: tipo || "produto",
      ordem,
    }),
  });
  if (!insertRes.ok) {
    throw new Error(`Insert falhou (${insertRes.status}): ${await insertRes.text()}`);
  }

  console.log(`OK  ${raw.title}  ->  ${equipamentoId}  ordem=${ordem}`);
}

async function uploadToStorage(path, buffer, contentType) {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/imagens-equipamentos/${path}`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: buffer,
    },
  );
  if (!res.ok) {
    throw new Error(`Upload falhou (${path}, ${res.status}): ${await res.text()}`);
  }
}

main().catch((err) => {
  console.error("ERRO:", err.message);
  process.exit(1);
});
