<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TheatreCase;
use Illuminate\Http\JsonResponse;

class TheatreCaseController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => TheatreCase::query()
                ->with(['patient.card', 'requestingDoctor.department', 'surgeon.department'])
                ->latest()
                ->get(),
        ]);
    }
}
