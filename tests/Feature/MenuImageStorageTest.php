<?php

use App\Services\MenuImageStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

function menuStorageTinyPng(string $name = 'menu-image.png'): UploadedFile
{
    return UploadedFile::fake()->createWithContent(
        $name,
        base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
    );
}

test('menu image storage writes sanitized images with generated paths', function () {
    Storage::fake('public');

    $path = app(MenuImageStorage::class)->store(menuStorageTinyPng(), 'categories');

    expect($path)->toStartWith('categories/')
        ->and($path)->toEndWith(function_exists('imagewebp') ? '.webp' : '.jpg');

    Storage::disk('public')->assertExists($path);
    expect(Storage::disk('public')->size($path))->toBeGreaterThan(0);
});

test('menu image storage fails safely when the filesystem write fails', function () {
    config([
        'filesystems.disks.failing-menu-images' => [
            'driver' => 'local',
            'root' => __FILE__,
            'throw' => false,
            'report' => false,
        ],
    ]);

    Log::spy();

    expect(fn () => app(MenuImageStorage::class)->store(
        menuStorageTinyPng(),
        'categories',
        disk: 'failing-menu-images',
    ))->toThrow(ValidationException::class);

    Log::shouldHaveReceived('warning')
        ->with(
            Mockery::on(fn (string $message): bool => str_starts_with($message, 'Menu image storage')),
            Mockery::on(fn (array $context): bool => ($context['disk'] ?? null) === 'failing-menu-images'
                && ($context['directory'] ?? null) === 'categories')
        )
        ->once();
});

test('menu image storage rejects invalid image data before writing', function () {
    Storage::fake('public');

    expect(fn () => app(MenuImageStorage::class)->store(
        UploadedFile::fake()->createWithContent('fake.png', 'not real image bytes'),
        'categories',
    ))->toThrow(ValidationException::class);

    expect(Storage::disk('public')->allFiles())->toBeEmpty();
});
