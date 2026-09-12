"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Header from "@/components/header";

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Parse filter params from URL
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
      setProducts(data.products);
      setTotal(data.total);
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
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await fetch("/api/brands");
      const data = await response.json();
      setBrands(data);
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
                    className="group border rounded-lg overflow-hidden hover-shadow-lg transition-shadow"
                  >
                    {/* Product Image */}
                    <div className="aspect-square w-full bg-gray-200">
                      <img
                        src={product.images?.[0] || "/placeholder-product.jpg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Product Details */}
                    <div className="p-4">
                      <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {product.description ? product.description.substring(0, 50) + "..." : ""}
                      </p>
                      
                      {/* Price */}
                      <div className="mt-2 flex items-baseline gap-2">
                        {product.discount > 0 && (
                          <span className="text-red-500 line-through text-sm">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                        <span className="text-xl font-bold text-primary">
                          {product.discountPrice > 0 ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/product/${product.id}`}
                          className="flex-1 bg-primary text-white px-3 py-1.5 text-sm rounded hover:bg-secondary-transitions transition-colors"
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

              {/* Pagination */}
              {total > 12 && (
                <nav className="mt-6 flex justify-end">
                  <Link
                    href={`/products?category=${category}&brand=${brand}&minPrice=${minPrice}&maxPrice=${maxPrice}&minRating=${minRating}&availability=${availability}&sortBy=${sortBy}&search=${search}&page=2`}
                    className="text-sm text-primary hover-underline"
                  >
                    Older
                  </Link>
                </nav>
              )}
            </div>

            {/* Filters Sidebar */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              {/* Search */}
              <div className="mb-4">
                <label htmlFor="search" className="block text-sm font-medium mb-2">Search</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 21l-5-5c-.58-.58-1.52-.58-2.1 0L16 18l-5 5c-.58.58-.58 1.42 0 2.1l5 5c.58.58 1.42.58 2.1 0l2-2c.58-.58.58-1.42 0-2.1z"/>
                  </svg>
                  <input
                    type="text"
                    id="search"
                    placeholder="Search products, brands & categories..."
                    value={search}
                    onChange={(e) => {
                      const params = new URLSearchParams();
                      params.set("search", e.target.value);
                      params.set("sortBy", "newest");
                      window.location.search = params.toString();
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="mb-4">
                  <label htmlFor="category" className="block text-sm font-medium mb-2">Category</label>
                  <select
                    onChange={(e) => {
                      const params = new URLSearchParams();
                      params.set("category", e.target.value);
                      params.set("sortBy", "newest");
                      window.location.search = params.toString();
                    }}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option
                        key={cat.id}
                        value={cat.slug}
                        selected={category === cat.slug}
                      >
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Brand Filter */}
              {brands.length > 0 && (
                <div className="mb-4">
                  <label htmlFor="brand" className="block text-sm font-medium mb-2">Brand</label>
                  <select
                    onChange={(e) => {
                      const params = new URLSearchParams();
                      params.set("brand", e.target.value);
                      params.set("sortBy", "newest");
                      window.location.search = params.toString();
                    }}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.slug}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Price Filter */}
              <div className="mb-4">
                <label htmlFor="price" className="block text-sm font-medium mb-2">Price Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    onChange={(e) => {
                      const params = new URLSearchParams();
                      params.set("minPrice", e.target.value);
                      window.location.search = params.toString();
                    }}
                    className="py-1 px-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    onChange={(e) => {
                      const params = new URLSearchParams();
                      params.set("maxPrice", e.target.value);
                      window.location.search = params.toString();
                    }}
                    className="py-1 px-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
              
              {/* Rating Filter */}
              {["1", "2", "3", "4", "5"].includes(minRating) && (
                <div className="mb-4">
                  <label htmlFor="rating" className="block text-sm font-medium mb-2">Minimum Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const isSelected = Number(minRating) >= rating;
                      return (
                        <button
                          key={rating}
                          onClick={() => {
                            const params = new URLSearchParams();
                            params.set("minRating", rating);
                            window.location.search = params.toString();
                          }}
                          className={`px-2 py-1 text-sm rounded ${
                            isSelected ? "bg-primary text-white" : "text-gray-300"
                          }`}
                        >
                          {rating}+
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Availability Filter */}
              {availability !== "" && (
                <div className="mb-4">
                  <label>
                    <input
                      type="radio"
                      name="availability"
                      value="in-stock"
                      checked={availability === "in-stock"}
                      onChange={() => {
                        const params = new URLSearchParams();
                        params.set("availability", "in-stock");
                        window.location.search = params.toString();
                      }}
                      className="mr-1 accent-primary"
                    />
                    In stock only
                  </label>
                </div>
              )}
              
              {/* Sort Selector */}
              <div className="mb-4">
                <label htmlFor="sort" className="block text-sm font-medium mb-2">Sort</label>
                <select
                  onChange={(e) => {
                    const params = new URLSearchParams();
                    params.set("sortBy", e.target.value);
                    window.location.search = params.toString();
                  }}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="newest" selected={sortBy === "newest"}>Newest</option>
                  <option value="oldest" selected={sortBy === "oldest"}>Oldest</option>
                  <option value="price-low" selected={sortBy === "price-low"}>Price Low to High</option>
                  <option value="price-high" selected={sortBy === "price-high"}>Price High to Low</option>
                  <option value="name-az" selected={sortBy === "name-az"}>Name A-Z</option>
                  <option value="name-za" selected={sortBy === "name-za"}>Name Z-A</option>
                  <option value="rating" selected={sortBy === "rating"}>Highest Rated</option>
                </select>
              </div>
              
              {/* Clear Filters Button */}
              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  window.location.search = params.toString();
                }}
                className="w-full py-2 bg-primary text-white rounded-md hover:bg-secondary-transitions text-sm mt-4"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* No results message */}
          {products.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 18a8 8 0 0 0 1.8-12.6L22 4l-4 9-5-1.1L10 18z"/>
              </svg>
              <h3 className="text-xl font-medium mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} E-Shop. All rights reserved.
        </p>
      </footer>
    </div>
  );
}