<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PharmacyItem;
use Illuminate\Http\JsonResponse;

class PharmacyInventoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => PharmacyItem::query()->orderBy('name')->get(),
        ]);
    }
}
