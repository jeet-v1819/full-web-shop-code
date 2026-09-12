"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Header from "@/components/header";

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const minRating = searchParams.get("minRating") || "";
  const availability = searchParams.get("availability") || "";
  const sortBy = searchParams.get("sortBy") || "newest";
  const search = searchParams.get("search") || "";

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
  }, [category, brand, minPrice, maxPrice, minRating, availability, sortBy, search]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/products?category=${category}&brand=${brand}&minPrice=${minPrice}&maxPrice=${maxPrice}&minRating=${minRating}&availability=${availability}&sortBy=${sortBy}&search=${search}`
      );
      const data = await response.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await fetch("/api/brands");
      const data = await response.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading brands:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Loading products...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="py-8">
        <Navigation />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Products Grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square w-full bg-gray-200">
                      <img
                        src={Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "/placeholder-product.jpg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {product.description ? product.description.substring(0, 50) + "..." : ""}
                      </p>
                      
                      <div className="mt-2 flex items-baseline gap-2">
                        {product.discount > 0 && (
                          <span className="text-red-500 line-through text-sm">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                        <span className="text-xl font-bold text-green-700">
                          {product.discountPrice > 0 ? `$${product.discountPrice.toFixed(2)}` : `$${product.price.toFixed(2)}`}
                        </span>
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/product/${product.id}`}
                          className="flex-1 bg-green-700 text-white px-3 py-1.5 text-sm rounded hover:bg-green-800 transition-colors text-center"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => alert("Add to cart functionality coming soon")}
                          className="flex-1 bg-gray-100 text-gray-700 px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {total > 12 && (
                <nav className="mt-6 flex justify-end">
                  <Link
                    href={`/products?category=${category}&brand=${brand}&minPrice=${minPrice}&maxPrice=${maxPrice}&minRating=${minRating}&availability=${availability}&sortBy=${sortBy}&search=${search}&page=2`}
                    className="text-sm text-green-700 hover:underline"
                  >
                    Older
                  </Link>
                </nav>
              )}
            </div>

            {/* Filters Sidebar */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="mb-4">
                <label htmlFor="search" className="block text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search products..."
                  defaultValue={search}
                  onChange={(e) => {
                    const params = new URLSearchParams();
                    params.set("search", e.target.value);
                    window.location.search = params.toString();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:outline-none"
                />
              </div>
              
              {categories.length > 0 && (
                <div className="mb-4">
                  <label htmlFor="category" className="block text-sm font-medium mb-2">Category</label>
                  <select
                    defaultValue={category}
                    onChange={(e) => {
                      const params = new URLSearchParams();
                      params.set("category", e.target.value);
                      window.location.search = params.toString();
                    }}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {brands.length > 0 && (
                <div className="mb-4">
                  <label htmlFor="brand" className="block text-sm font-medium mb-2">Brand</label>
                  <select
                    defaultValue={brand}
                    onChange={(e) => {
                      const params = new URLSearchParams();
                      params.set("brand", e.target.value);
                      window.location.search = params.toString();
                    }}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.slug}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
