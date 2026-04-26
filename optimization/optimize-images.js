const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// ✅ Use SAME folder as this script
const inputDir = __dirname;

const selectedFiles = [
  "_DSC2897-2 (2).jpg"
];

function outBaseName(filename) {
  return path.parse(filename).name;
}

async function processImage(filename) {
  const inputPath = path.join(inputDir, filename);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`File not found: ${inputPath}`);
  }

  const base = outBaseName(filename);

  const thumbPath = path.join(inputDir, `${base}-800.webp`);
  const fullPath = path.join(inputDir, `${base}-1800.webp`);

  await sharp(inputPath)
    .rotate()
    .resize({
      width: 800,
      height: 1000,
      fit: "cover",
      position: "centre"
    })
    .webp({ quality: 72, effort: 6 })
    .toFile(thumbPath);

  await sharp(inputPath)
    .rotate()
    .resize({
      width: 1800,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: 82, effort: 6 })
    .toFile(fullPath);

  console.log(`Done: ${base}`);
}

(async () => {
  try {
    for (const file of selectedFiles) {
      await processImage(file);
    }
    console.log("Finished. 800 + 1800 versions created.");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();