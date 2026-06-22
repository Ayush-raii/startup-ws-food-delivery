import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Doorly - Merchant-Led Delivery App',
  description: 'Doorly — a fast, decentralized food delivery platform where restaurants manage and assign their own delivery staff.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth overflow-x-hidden">
      <body className={`${inter.className} flex flex-col min-h-screen overflow-x-hidden`}>
        <CartProvider>
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
