<?php

namespace Database\Seeders;

use App\Models\RestaurantSetting;
use Illuminate\Database\Seeder;

class RestaurantSettingSeeder extends Seeder
{
    public function run(): void
    {
        RestaurantSetting::query()->updateOrCreate(
            ['id' => 1],
            RestaurantSetting::defaults(),
        );
    }
}
