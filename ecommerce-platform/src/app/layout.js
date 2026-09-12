import "./globals.css";

export const metadata = {
  title: "E-commerce Platform",
  description: "Multi-vendor E-commerce platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
