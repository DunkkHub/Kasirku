<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class AdminLoginRedirectController extends Controller
{
    public function __invoke(): RedirectResponse
    {
        return redirect()->route('login');
    }
}
