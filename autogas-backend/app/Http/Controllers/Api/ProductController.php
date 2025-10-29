<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     * GET /api/products
     */
    public function index(Request $request)
    {
        // Faqat tasdiqlangan va faol mahsulotlarni ko'rsatish
        $query = Product::public();

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Filter by stock status
        if ($request->has('stockStatus') && $request->stockStatus) {
            $query->where('stockStatus', $request->stockStatus);
        }

        // Search by name
        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter by seller
        if ($request->has('seller_id') && $request->seller_id) {
            $query->where('seller_id', $request->seller_id);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate or get all
        if ($request->has('per_page')) {
            $products = $query->paginate($request->per_page);
        } else {
            $products = $query->get();
        }

        return response()->json($products);
    }

    /**
     * Store a newly created resource in storage.
     * POST /api/products
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'imageUrl' => 'nullable|string',
            'stockStatus' => 'required|in:in_stock,out_of_stock',
            'quantity' => 'required|integer|min:0',
            'seller_id' => 'nullable|exists:users,id',
            'status' => 'nullable|in:pending,approved,rejected',
            'is_active' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validatsiya xatosi',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Set seller_id from authenticated user if not provided
        if (!isset($data['seller_id']) && auth()->check()) {
            $data['seller_id'] = auth()->id();
        }

        // Set default status and is_active if not provided
        if (!isset($data['status'])) {
            $data['status'] = 'approved';
        }
        if (!isset($data['is_active'])) {
            $data['is_active'] = true;
        }

        $product = Product::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Mahsulot muvaffaqiyatli yaratildi',
            'data' => $product
        ], 201);
    }

    /**
     * Display the specified resource.
     * GET /api/products/{id}
     */
    public function show(string $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Mahsulot topilmadi'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    /**
     * Update the specified resource in storage.
     * PUT/PATCH /api/products/{id}
     */
    public function update(Request $request, string $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Mahsulot topilmadi'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'category' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'imageUrl' => 'nullable|string',
            'stockStatus' => 'sometimes|required|in:in_stock,out_of_stock',
            'quantity' => 'sometimes|required|integer|min:0',
            'seller_id' => 'nullable|exists:users,id',
            'status' => 'sometimes|required|in:pending,approved,rejected',
            'is_active' => 'sometimes|required|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validatsiya xatosi',
                'errors' => $validator->errors()
            ], 422);
        }

        $product->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Mahsulot muvaffaqiyatli yangilandi',
            'data' => $product
        ]);
    }

    /**
     * Remove the specified resource from storage.
     * DELETE /api/products/{id}
     */
    public function destroy(string $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Mahsulot topilmadi'
            ], 404);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mahsulot muvaffaqiyatli o\'chirildi'
        ]);
    }
}
