# Image Optimization Script

A lightweight Node.js script for batch-optimizing images for web use.
Designed for photography portfolios and media-heavy sites where performance matters.

## Features

* Converts images to **WebP** format
* Generates **multiple sizes** (thumbnail + full resolution)
* Compresses images to reduce file size without noticeable quality loss
* Preserves directory structure (`thumbs/` and `full/`)
* Fast and simple — built for local workflows

## Use Case

This script is used to prepare images for a portfolio site:

* **Thumbnails** → fast loading gallery (`~800px`)
* **Full images** → lightbox / high-res view (`~1800px`)
* Optimized for performance + visual quality balance

## Requirements

* Node.js (v16+ recommended)
* Dependencies (install before running):

```bash
npm install sharp fs path
```

## Folder Structure

```
project/
├── input/          # original images
├── assets/
│   ├── thumbs/     # generated thumbnails
│   └── full/       # generated full-size images
├── optimize.js     # script
```

## Usage

Run the script:

```bash
node optimize.js
```

## Output

For each input image:

* `thumbs/image-800.webp`
* `full/image-1800.webp`

## Notes

* Input images should be high quality (RAW exports or large JPEGs)
* Script overwrites existing optimized files
* WebP chosen for best compression/performance balance

## Customization

You can tweak:

* Output sizes (e.g. 800 → 1200)
* Compression quality
* Output format (WebP → JPEG/AVIF)

Example (inside script):

```js
.resize(800) // thumbnail size
.webp({ quality: 75 })
```

## Why This Exists

Large unoptimized images kill performance.
This script ensures:

* Faster load times
* Better Lighthouse scores
* Smoother gallery experience

---

Built for real-world portfolio workflows, not just demos.
