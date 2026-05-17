<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $role = $request->string('role')->toString();
        $status = $request->string('status')->toString();

        $users = User::query()
            ->with('department')
            ->when($role !== '', fn ($query) => $query->where('role', $role))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $users,
        ]);
    }
}
