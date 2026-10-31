import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const UA =
  "HanoiResidencesBot/1.0 (https://hanoiresidence.site; district-hero optimization)";
const OUT_DIR = path.resolve("public/images/districts");
const WIDTH = 2400;
const HEIGHT = 800;

const SOURCES = [
  {
    slug: "ba-dinh",
    title: "File:One Pillar Pagoda, Hanoi (1345321938).jpg",
    position: "centre",
  },
  {
    slug: "hoan-kiem",
    title: "File:The Huc Bridge.jpg",
    position: "centre",
  },
  {
    slug: "tay-ho",
    title: "File:West lake 11-12-2016.jpg",
    position: "centre",
  },
  {
    slug: "cau-giay",
    title: "File:Keangnam Hanoi Landmark Tower misty 01.jpg",
    position: "south",
    local: "public/images/cau-giay.webp",
  },
  {
    slug: "dong-da",
    title: "File:Vườn hoa Quốc Tử Giám, Hà Nội 001.JPG",
    position: "centre",
  },
  {
    slug: "hai-ba-trung",
    title: "File:Times City 31-8-2013 Newone-IMG 0531.jpg",
    position: "centre",
  },
  {
    slug: "thanh-xuan",
    title: "File:Royal City, Thanh Xuân, Hanoi 0395.jpg",
    position: "centre",
  },
  {
    slug: "hoang-mai",
    title: "File:20220528 Yên Sở, Hà Nội.jpg",
    position: "centre",
  },
  {
    slug: "long-bien",
    title: "File:Long-bien-bridge-3371615.jpg",
    position: "centre",
  },
  {
    slug: "nam-tu-liem",
    title: "File:Sunset over Hanoi After the Rain.jpg",
    position: "centre",
  },
  {
    slug: "bac-tu-liem",
    title: "File:Vietnam, Hanoi, Life on the streets of central Hanoi 2.jpg",
    position: "centre",
  },
  {
    slug: "ha-dong",
    title: "File:Ha Dong Station - Metro Hanoi - Panorama.jpg",
    position: "centre",
  },
];

async function commonsSource(title) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("titles", title);
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|size|mime");
  api.searchParams.set("iiurlwidth", "2560");

  const res = await fetch(api, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status} for ${title}`);
  const data = await res.json();
  const page = Object.values(data.query.pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`No imageinfo for ${title}`);
  return info.thumburl || info.url;
}

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Download ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const file of fs.readdirSync(OUT_DIR)) {
  if (file.startsWith("_preview-")) fs.unlinkSync(path.join(OUT_DIR, file));
}

for (const source of SOURCES) {
  const dest = path.join(OUT_DIR, `${source.slug}.webp`);
  process.stdout.write(`${source.slug}… `);
  const raw = source.local
    ? fs.readFileSync(source.local)
    : await download(await commonsSource(source.title));
  const out = await sharp(raw, { failOn: "none" })
    .rotate()
    .resize(WIDTH, HEIGHT, {
      fit: "cover",
      position: source.position,
    })
    .webp({ quality: 80, effort: 6 })
    .toBuffer();
  fs.writeFileSync(dest, out);
  console.log(`${Math.round(out.length / 1024)} KB`);
}

console.log(`Done → ${OUT_DIR}`);
