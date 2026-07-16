import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const srcDir = path.join(root, 'src');
const outputRoot = path.join(publicDir, 'images', '_optimized');
const manifestPath = path.join(srcDir, 'generated', 'image-manifest.json');
const imagePrefix = '/growth-design-site/images/';
const rasterExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const videoExtensions = new Set(['.mp4', '.webm']);
const widths = [320, 480, 720, 960, 1280];

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.astro') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else if (/\.(astro|tsx?|mdx?|json|ya?ml|css)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeUrl(url) {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

function shouldOptimizeUrl(url) {
  return url.startsWith(imagePrefix) && !url.includes('/images/_optimized/');
}

function publicPathFromUrl(url) {
  return path.join(publicDir, normalizeUrl(url).replace('/growth-design-site/', ''));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function discoverUrls() {
  const files = await listFiles(srcDir);
  const urls = new Set();
  const mediaRe = /\/growth-design-site\/images\/[^"')\]}<>]+?\.(?:png|jpe?g|webp|mp4|webm)/gi;

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    for (const match of text.matchAll(mediaRe)) {
      const url = normalizeUrl(match[0]);
      if (shouldOptimizeUrl(url)) urls.add(url);
    }
  }

  for (const url of [...urls]) {
    const ext = path.extname(url).toLowerCase();
    if (!videoExtensions.has(ext)) continue;
    const base = url.replace(/\.(mp4|webm)$/i, '');
    for (const posterExt of ['.jpg', '.jpeg', '.png', '.webp']) {
      const posterUrl = `${base}${posterExt}`;
      if (await exists(publicPathFromUrl(posterUrl))) {
        urls.add(posterUrl);
        break;
      }
    }
  }

  return [...urls]
    .filter((url) => shouldOptimizeUrl(url))
    .filter((url) => rasterExtensions.has(path.extname(url).toLowerCase()))
    .sort();
}

function variantUrlFor(url, width) {
  const rel = normalizeUrl(url).replace(imagePrefix, '');
  const parsed = path.parse(rel);
  const safeName = `${parsed.name}-${width}.webp`;
  return `${imagePrefix}_optimized/${parsed.dir ? `${parsed.dir}/` : ''}${safeName}`;
}

async function generateVariant(inputPath, outputUrl, width) {
  const outputPath = publicPathFromUrl(outputUrl);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(inputPath)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 76, effort: 4 })
    .toFile(outputPath);
  const meta = await sharp(outputPath).metadata();
  const stat = await fs.stat(outputPath);
  return {
    src: outputUrl,
    width: meta.width,
    height: meta.height,
    bytes: stat.size,
  };
}

async function main() {
  const urls = await discoverUrls();
  const manifest = {};
  await fs.rm(outputRoot, { recursive: true, force: true });

  for (const url of urls) {
    const inputPath = publicPathFromUrl(url);
    if (!await exists(inputPath)) continue;

    const meta = await sharp(inputPath).metadata();
    if (!meta.width || !meta.height) continue;

    const targetWidths = widths.filter((width) => width <= meta.width);
    if (targetWidths.length === 0) targetWidths.push(meta.width);

    const variants = [];
    for (const width of targetWidths) {
      variants.push(await generateVariant(inputPath, variantUrlFor(url, width), width));
    }

    const fallback = variants.find((variant) => variant.width >= 960) ?? variants.at(-1);
    manifest[url] = {
      src: fallback.src,
      width: fallback.width,
      height: fallback.height,
      originalWidth: meta.width,
      originalHeight: meta.height,
      variants,
    };
  }

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const totalKb = Object.values(manifest)
    .flatMap((entry) => entry.variants)
    .reduce((sum, variant) => sum + variant.bytes / 1024, 0);
  console.log(`Generated ${Object.keys(manifest).length} optimized images (${totalKb.toFixed(1)} KB).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
