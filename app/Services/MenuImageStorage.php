<?php

namespace App\Services;

use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MenuImageStorage
{
    /**
     * Decode, normalize, strip metadata, resize, re-encode, and store an uploaded menu image.
     */
    public function store(
        UploadedFile $file,
        string $directory,
        string $attribute = 'image',
        int $maxWidth = 1600,
        int $maxHeight = 1600,
        int $quality = 82,
        string $disk = 'public',
    ): string {
        $this->validateExtension($file, $attribute);

        $sourcePath = $file->getRealPath();

        if (! is_string($sourcePath) || ! is_file($sourcePath)) {
            $this->fail($attribute, 'Le fichier image est illisible.');
        }

        $imageInfo = @getimagesize($sourcePath);

        if (! is_array($imageInfo) || ! isset($imageInfo[0], $imageInfo[1], $imageInfo[2])) {
            $this->fail($attribute, 'Le fichier doit être une image valide.');
        }

        [$width, $height, $type] = $imageInfo;

        if (! in_array($type, [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            $this->fail($attribute, 'Seules les images JPG, PNG et WebP sont acceptées.');
        }

        $source = $this->decode($sourcePath, $type, $attribute);
        $source = $this->normalizeJpegOrientation($source, $sourcePath, $type);

        $width = imagesx($source);
        $height = imagesy($source);
        $scale = min($maxWidth / max(1, $width), $maxHeight / max(1, $height), 1);
        $targetWidth = max(1, (int) floor($width * $scale));
        $targetHeight = max(1, (int) floor($height * $scale));

        $target = imagecreatetruecolor($targetWidth, $targetHeight);

        if (! $target instanceof GdImage) {
            imagedestroy($source);
            $this->fail($attribute, 'Impossible de préparer l’image.');
        }

        imagealphablending($target, false);
        imagesavealpha($target, true);
        $transparent = imagecolorallocatealpha($target, 0, 0, 0, 127);
        imagefilledrectangle($target, 0, 0, $targetWidth, $targetHeight, $transparent);

        imagecopyresampled($target, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);
        imagedestroy($source);

        $extension = function_exists('imagewebp') ? 'webp' : 'jpg';
        $storedPath = trim($directory, '/').'/'.Str::uuid().'.'.$extension;
        $temporaryPath = tempnam(sys_get_temp_dir(), 'menu-image-');

        if ($temporaryPath === false) {
            imagedestroy($target);
            $this->fail($attribute, 'Impossible de préparer le stockage de l’image.');
        }

        $encoded = $extension === 'webp'
            ? imagewebp($target, $temporaryPath, $quality)
            : imagejpeg($target, $temporaryPath, $quality);

        imagedestroy($target);

        if (! $encoded) {
            @unlink($temporaryPath);
            $this->fail($attribute, 'Impossible d’optimiser l’image.');
        }

        $stream = fopen($temporaryPath, 'rb');

        if (! is_resource($stream)) {
            @unlink($temporaryPath);
            $this->fail($attribute, 'Impossible de lire l’image optimisée.');
        }

        try {
            Storage::disk($disk)->put($storedPath, $stream);
        } finally {
            fclose($stream);
            @unlink($temporaryPath);
        }

        return $storedPath;
    }

    private function validateExtension(UploadedFile $file, string $attribute): void
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            $this->fail($attribute, 'L’extension de l’image doit être jpg, jpeg, png ou webp.');
        }
    }

    private function decode(string $path, int $type, string $attribute): GdImage
    {
        $image = match ($type) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            default => false,
        };

        if (! $image instanceof GdImage) {
            $this->fail($attribute, 'L’image ne peut pas être décodée.');
        }

        imagepalettetotruecolor($image);
        imagealphablending($image, true);
        imagesavealpha($image, true);

        return $image;
    }

    private function normalizeJpegOrientation(GdImage $image, string $path, int $type): GdImage
    {
        if ($type !== IMAGETYPE_JPEG || ! function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($path);
        $orientation = is_array($exif) ? (int) ($exif['Orientation'] ?? 1) : 1;

        $rotated = match ($orientation) {
            3 => imagerotate($image, 180, 0),
            6 => imagerotate($image, -90, 0),
            8 => imagerotate($image, 90, 0),
            default => false,
        };

        if ($rotated instanceof GdImage) {
            imagedestroy($image);

            return $rotated;
        }

        return $image;
    }

    private function fail(string $attribute, string $message): never
    {
        throw ValidationException::withMessages([$attribute => $message]);
    }
}
