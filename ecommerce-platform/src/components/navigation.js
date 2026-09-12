import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navigation() {
  const [filters, setFilters] = useState({
    category: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
    availability: "",
    search: "",
    sortBy: "newest",
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  // Check user role from localStorage or session
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const setFilter = (name, value) => setFilters({ ...filters, [name]: value });

  // Apply filters and navigate
  const applyFilters = () => {
    const queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.set("search", filters.search);
    if (filters.category) queryParams.set("category", filters.category);
    if (filters.brand) queryParams.set("brand", filters.brand);
    if (filters.minPrice) queryParams.set("minPrice", filters.minPrice);
    if (filters.maxPrice) queryParams.set("maxPrice", filters.maxPrice);
    if (filters.minRating) queryParams.set("minRating", filters.minRating);
    if (filters.availability) queryParams.set("availability", filters.availability);
    if (filters.sortBy) queryParams.set("sortBy", filters.sortBy);
    
    router.push(`/products?${queryParams.toString()}`);
    setIsMenuOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
      availability: "",
      search: "",
      sortBy: "newest",
    });
    // Don't navigate - just reset state
    // The URL params will be handled by the page
  };

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl font-bold text-primary">
            <span className="hidden md:inline">E</span>
            <span className="hidden md:inline">Shop</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-700 hover:text-primary transition-colors font-medium">Home</Link>
          <Link href="/products" className="text-gray-700 hover:text-primary transition-colors font-medium">Products</Link>
          
          {/* Categories dropdown */}
          <div className="relative">
            <Link href="/categories" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Categories
            </Link>
            <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>

          {/* Wishlist and Cart */}
          <div className="relative">
            <Link href="/wishlist" className="relative text-gray-700 hover:text-primary transition-colors flex items-center gap-1">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21c1.4 0 2.7-.5 3.8-1.4l4.4 4.3c.5.5.6 1.4.1 2.1l-4.4 4.4c-.5.5-1.3.5-1.8 0l-4.4-4.4c-.5-.5-.6-1.3-.1-1.9S8.1 12 9.5 11.5l4.3-4.4c.5-.5.6-.6.1-1.8L12 15l-5.8-5.7z"/>
              </svg>
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                0
              </span>
            </Link>
          </div>
          
          <div className="relative">
            <Link href="/cart" className="relative text-gray-700 hover:text-primary transition-colors flex items-center gap-1">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 3.5a2.5 2.5 0 0 1 2.5 2.5h7a2.5 2.5 0 0 1 0 5h-7A2.5 2.5 0 0 1 4 8.5v-1.5zM4 11.5a2.5 2.5 0 0 1 2.5 2.5h7a2.5 2.5 0 0 1 0 5h-7A2.5 2.5 0 0 1 4 14v-2.5zm0 3.5a2.5 2.5 0 0 1 2.5 2.5h11a2.5 2.5 0 0 1 0 5h-11A2.5 2.5 0 0 1 4 19v-2.5zm-1.5-9.75l2.5 3.09L17 6.75l2.38 3.17L23 9.25l-4.25 2.66L16.5 14.4l-2.19-2.88L11 11.68l-2.38-3.17L4 14.18l2.19 2.88L7.5 9.6l2.19-2.88L1.5 6.75l2.38-3.17z"/>
              </svg>
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                0
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden flex items-center gap-2 p-2 text-gray-700 hover:text-primary"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 12l2-2m0 0l2-2m-2 2l2 2m2-2l2 2M9 10v6h6v-6M9 6v6h6M15 10v6h6v-6M15 6v6h-6V6" />
          </svg>
          <span className="hidden md:inline">Menu</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white px-6 py-8">
          <Link href="/" className="text-2xl font-bold mb-4 block">E-Shop</Link>
          <div className="space-y-4">
            <Link href="/products" className="block text-lg hover:text-primary transition-colors">
              Products
            </Link>
            <Link href="/categories" className="block text-lg hover:text-primary transition-colors">
              Categories
            </Link>
            <Link href="/wishlist" className="block text-lg hover:text-primary transition-colors">
              Wishlist
            </Link>
            <Link href="/cart" className="block text-lg hover:text-primary transition-colors">
              Cart
            </Link>
          </div>
          
          {/* Auth links */}
          {userRole ? (
            <div>
              <span className="text-sm text-gray-600 block mb-2">Hello, {userRole}</span>
              <Link href="/profile" className="text-sm text-primary block">Profile</Link>
              <button
                onClick={() => {
                  localStorage.removeItem("userRole");
                  router.push("/login");
                }}
                className="text-sm text-red-600 hover underline block"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/login" className="text-sm text-primary block">Login</Link>
              <Link href="/register" className="text-sm text-primary block">Register</Link>
            </div>
          )}
          
          <button
            onClick={clearFilters}
            className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            Clear Filters
          </button>
        </div>
      )}
    </nav>
  );
}