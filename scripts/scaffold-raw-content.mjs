// Ham içerik iskelesi üretici.
//
// courses.ts'i kaynak alır (tek doğru kaynak) ve her ders için gruplı,
// boş bir "raw sayfa" oluşturur: content/raw/courses/<grup>/<contentSlug>.md
//
// - İçinde zaten dosya varsa ÜZERİNE YAZMAZ (idempotent) — yapıştırdığınız
//   içerik korunur.
// - Yeni ders eklendiğinde tekrar çalıştırılabilir: `node scripts/scaffold-raw-content.mjs`

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const COURSES_TS = path.join(ROOT, "src", "data", "courses.ts");
const OUT_DIR = path.join(ROOT, "content", "raw", "courses");

// Müfredat grubu yorum satırı -> klasör adı (sıra korunur).
const GROUPS = [
  { marker: "Ortak / üniversite zorunlu", dir: "01-ortak-universite-zorunlu", label: "Ortak / Üniversite Zorunlu" },
  { marker: "Üniversite seçmeli", dir: "02-universite-secmeli", label: "Üniversite Seçmeli" },
  { marker: "Fakülte zorunlu", dir: "03-fakulte-zorunlu", label: "Fakülte Zorunlu" },
  { marker: "Uzmanlık zorunlu", dir: "04-uzmanlik-zorunlu", label: "Uzmanlık Zorunlu" },
  { marker: "Din Usûlü uzmanlık zorunlu", dir: "05-din-usulu-uzmanlik-zorunlu", label: "Din Usûlü Uzmanlık Zorunlu" },
  { marker: "Uzmanlık seçmeli", dir: "06-uzmanlik-secmeli", label: "Uzmanlık Seçmeli" },
  { marker: "Genel zorunlu", dir: "07-genel-zorunlu", label: "Genel Zorunlu" },
];

function findGroup(commentText) {
  return GROUPS.find((g) => commentText.includes(g.marker));
}

const src = fs.readFileSync(COURSES_TS, "utf-8");
const lines = src.split("\n");

const courseLineRe =
  /\{\s*id:\s*"([^"]+)".*?titleAr:\s*"([^"]+)".*?contentSlug:\s*"([^"]+)"\s*\}/;
const commentRe = /^\s*\/\/\s*-+\s*(.+?)\s*-+\s*$/;

let current = null;
const byGroup = new Map();
const seen = new Set();

for (const line of lines) {
  const c = line.match(commentRe);
  if (c) {
    const g = findGroup(c[1]);
    if (g) current = g;
    continue;
  }
  const m = line.match(courseLineRe);
  if (m && current) {
    const [, id, titleAr, contentSlug] = m;
    if (seen.has(contentSlug)) continue;
    seen.add(contentSlug);
    if (!byGroup.has(current.dir)) byGroup.set(current.dir, []);
    byGroup.get(current.dir).push({ id, titleAr, contentSlug, group: current });
  }
}

function pageTemplate({ titleAr, contentSlug, group }) {
  return `# ${titleAr}

<!--
  contentSlug: ${contentSlug}
  Grup: ${group.label}

  Ham içeriği ilgili başlığın ALTINA yapıştır. Her hafta için "## Hafta X"
  alt başlığı kullan. Şablon örnekleri: content/raw/_templates/
  Detaylı iş akışı ve token kuralları: content/raw/README.md

  Bu sayfa bir "toplama alanı"dır; agent buradan okuyup site formatına çevirir.
  Bir seferde tek hafta + tek modül işlet.
-->

## Zihin Şeması

<!-- Girintili ağaç (Arapça | Türkçe). Örnek: _templates/mindmap.template.md -->


## Ders / Kitap Özeti

<!-- Serbest metin. Örnek: _templates/summary.template.md -->


## Kelime Kartları

<!-- Tablo: Arapça | Türkçe | Açıklama. Örnek: _templates/keywords.template.md -->
`;
}

let created = 0;
let skipped = 0;
let total = 0;

for (const g of GROUPS) {
  const courses = byGroup.get(g.dir) ?? [];
  if (courses.length === 0) continue;
  const groupDir = path.join(OUT_DIR, g.dir);
  fs.mkdirSync(groupDir, { recursive: true });

  // Grup indeks dosyası (ders listesi).
  const indexPath = path.join(groupDir, "_index.md");
  const indexBody =
    `# ${g.label}\n\n` +
    `Bu gruptaki dersler (${courses.length}):\n\n` +
    courses.map((c) => `- \`${c.contentSlug}.md\` — ${c.titleAr}`).join("\n") +
    "\n";
  fs.writeFileSync(indexPath, indexBody, "utf-8");

  for (const course of courses) {
    total += 1;
    const filePath = path.join(groupDir, `${course.contentSlug}.md`);
    if (fs.existsSync(filePath)) {
      skipped += 1;
      continue;
    }
    fs.writeFileSync(filePath, pageTemplate(course), "utf-8");
    created += 1;
  }
}

console.log(`Gruplar: ${byGroup.size}`);
console.log(`Toplam ders: ${total}`);
console.log(`Oluşturulan: ${created}, atlanan (mevcut): ${skipped}`);
