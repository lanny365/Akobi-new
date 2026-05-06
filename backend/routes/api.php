<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\LabCatalogController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PharmacyInventoryController;
use App\Http\Controllers\Api\TheatreCaseController;
use App\Http\Controllers\Api\VisitController;
use Illuminate\Support\Facades\Route;

Route::get('/health', static fn () => response()->json([
    'status' => 'ok',
    'service' => 'akobi-hospital-backend',
]));

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/departments', [DepartmentController::class, 'index']);

    Route::get('/patients', [PatientController::class, 'index']);
    Route::post('/patients', [PatientController::class, 'store']);
    Route::get('/patients/{patient}', [PatientController::class, 'show']);

    Route::get('/visits', [VisitController::class, 'index']);
    Route::post('/visits', [VisitController::class, 'store']);
    Route::get('/queue/vital-signs', [VisitController::class, 'vitalSignsQueue']);

    Route::get('/pharmacy/items', [PharmacyInventoryController::class, 'index']);
    Route::get('/laboratory/tests', [LabCatalogController::class, 'index']);
    Route::get('/theatre/cases', [TheatreCaseController::class, 'index']);
});
