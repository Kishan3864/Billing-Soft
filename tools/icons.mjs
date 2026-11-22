import sharp from "sharp";
const svg = (pad) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${pad ? 0 : 112}" fill="#4f46e5"/><text x="256" y="345" font-family="Arial, Helvetica, sans-serif" font-size="${pad ? 230 : 290}" font-weight="700" fill="#fff" text-anchor="middle">₹</text></svg>`);
await sharp(svg(false)).resize(192).png().toFile("public/icon-192.png");
await sharp(svg(false)).resize(512).png().toFile("public/icon-512.png");
await sharp(svg(true)).resize(512).png().toFile("public/icon-maskable.png");
await sharp(svg(true)).resize(180).png().toFile("public/apple-touch-icon.png");
console.log("icons ok");
