import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Check auth state
  useEffect(() => {
    // In a real app, this would check the session
    // For now, we'll set a default user
    const checkUser = () => {
      // This would typically check cookies/localStorage or API
      setUser(null); // Placeholder - will be set by auth
    };
    checkUser();
  }, []);

  const handleMenuOpen = () => setIsMenuOpen(true);
  const handleMenuClose = () => setIsMenuOpen(false);

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl font-bold text-primary">
            E-Shop
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-600 hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/products" className="text-gray-600 hover:text-primary transition-colors">
            Products
          </Link>
          <Link href="/categories" className="text-gray-600 hover:text-primary transition-colors">
            Categories
          </Link>
          
          {/* Wishlist and Cart */}
          <div className="relative">
            <Link href="/wishlist" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21c1.4 0 2.7-.5 3.8-1.4l4.4 4.3c.5.5.6 1.4.1 2.1l-4.4 4.4c-.5.5-1.3.5-1.8 0l-4.4-4.4c-.5-.5-.6-1.3-.1-1.9S8.1 12 9.5 11.5l4.3-4.4c.5-.5.6-1.2.1-1.8s-1.2-.6-1.8-.1L12 15l-5.8-5.7z"/>
              </svg>
              <span className="hidden md:inline">Wishlist</span>
            </Link>
          </div>
          
          <div className="relative">
            <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 3.5a2.5 2.5 0 0 1 2.5 2.5h7a2.5 2.5 0 0 1 0 5h-7A2.5 2.5 0 0 1 4 8.5v-1.5zM4 11.5a2.5 2.5 0 0 1 2.5 2.5h7a2.5 2.5 0 0 1 0 5h-7A2.5 2.5 0 0 1 4 14v-2.5zm0 3.5a2.5 2.5 0 0 1 2.5 2.5h11a2.5 2.5 0 0 1 0 5h-11A2.5 2.5 0 0 1 4 19v-2.5zm-1.5-9.75l2.5 3.09L17 6.75l2.38 3.17L23 9.25l-4.25 2.66L16.5 14.4l-2.19-2.88L11 11.68l-2.38-3.17L4 14.18l2.19 2.88L7.5 9.6l2.19-2.88L1.5 6.75l2.38-3.17z"/>
              </svg>
              <span className="hidden md:inline">Cart</span>
            </Link>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={handleMenuOpen}
          className="md:hidden flex items-center gap-2 p-2 text-gray-600 hover:text-primary"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 12l2-2m0 0l2-2m-2 2l2 2m2-2l2 2M9 10v6h6v-6M9 6v6h6V6m-3 0h.01M15 10v6h6v-6M15 6v6h-6V6m-3 0h.01" />
          </svg>
          <span className="hidden md:inline">Menu</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white px-6 py-8">
          <Link href="/" className="text-2xl font-bold mb-4 block">E-Shop</Link>
          <div className="space-y-3">
            <Link href="/products" className="block text-lg hover:text-primary transition-colors">
              Products
            </Link>
            <Link href="/cart" className="block text-lg hover:text-primary transition-colors">
              Cart
            </Link>
            <Link href="/wishlist" className="block text-lg hover:text-primary transition-colors">
              Wishlist
            </Link>
            <Link href="/profile" className="block text-lg hover:text-primary transition-colors">
              Profile
            </Link>
          </div>
          {user ? (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <span className="text-sm text-gray-600 block mb-2">Hello, {user.name || 'User'}</span>
              <Link href="/login" className="text-sm text-primary block">Login</Link>
              <Link href="/register" className="text-sm text-primary block">Register</Link>
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link href="/login" className="text-sm text-primary block mr-2">Login</Link>
              <Link href="/register" className="text-sm text-primary">Register</Link>
            </div>
          )}
          <button
            onClick={handleMenuClose}
            className="mt-4 w-full py-2 bg-primary text-white rounded-md hover:bg-secondary-transitions text-sm"
          >
            Close Menu
          </button>
        </div>
      )}
    </header>
  );
}