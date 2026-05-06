<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LabTest;
use Illuminate\Http\JsonResponse;

class LabCatalogController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => LabTest::query()->where('status', 'active')->orderBy('name')->get(),
        ]);
    }
}
