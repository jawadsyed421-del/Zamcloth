const multer = require('multer');
const sharp = require('sharp');

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 80_000_000;

const imageUpload = (maxFiles) => multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE, files: maxFiles },
}).array('images', maxFiles);

async function optimizeImage(buffer, { width = 2000, height = 2000 } = {}) {
    try {
        const image = sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS, animated: false });
        const metadata = await image.metadata();
        if (!metadata.format || !['jpeg', 'png', 'webp', 'gif', 'tiff', 'avif', 'heif', 'magick', 'svg'].includes(metadata.format)) {
            throw new Error('Unsupported image format');
        }
        return await image
            .rotate()
            .resize({ width, height, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 86, effort: 4 })
            .toBuffer();
    } catch (error) {
        if (error.message === 'Unsupported image format') throw error;
        throw new Error('This file could not be decoded as an image. Try saving it as JPG, PNG, or WebP and upload it again.');
    }
}

function imageUploadError(error) {
    if (error.code === 'LIMIT_FILE_SIZE') return { status: 413, message: 'Each image must be smaller than 15 MB.' };
    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        return { status: 400, message: 'Too many images selected for this upload.' };
    }
    return null;
}

module.exports = { imageUpload, imageUploadError, optimizeImage };
