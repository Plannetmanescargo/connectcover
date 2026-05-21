import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import CookieBanner from "@/components/site/CookieBanner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/* =========================================================
   METADATA (COVERZA)
========================================================= */
export const metadata: Metadata = {
  metadataBase: new URL("https://coverza.co.uk"),

  title: {
    default: "Coverza | Temporary Car Insurance That Fits Around You",
    template: "%s | Coverza",
  },

  description:
    "Coverza offers flexible temporary car insurance from 1 hour to 28 days. Get a quote online, choose the cover you need, and receive your documents in minutes.",

  applicationName: "Coverza",
  authors: [{ name: "Coverza" }],
  creator: "Coverza",
  publisher: "Coverza",
  category: "insurance",
  keywords: [
    "temporary car insurance",
    "short term car insurance",
    "temporary vehicle insurance",
    "hourly car insurance",
    "daily car insurance",
    "car insurance UK",
    "Coverza",
  ],

  alternates: {
    canonical: "https://coverza.co.uk",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    url: "https://coverza.co.uk",
    title: "Coverza | Temporary Car Insurance That Fits Around You",
    description:
      "Flexible temporary car insurance from 1 hour to 28 days. Get covered quickly with a simple online journey and instant documents.",
    siteName: "Coverza",
    locale: "en_GB",
    images: [
      {
        url: "/brand/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Coverza temporary car insurance",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Coverza | Temporary Car Insurance That Fits Around You",
    description:
      "Flexible temporary car insurance from 1 hour to 28 days. Fast quotes, simple cover, instant documents.",
    images: ["/brand/og-image.jpg"],
  },

  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

/* =========================================================
   VIEWPORT
========================================================= */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6C4CF3",
  colorScheme: "light",
};

/* =========================================================
   ROOT LAYOUT
========================================================= */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen text-slate-900 antialiased`}>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg"
        >
          Skip to content
        </a>

        <div className="relative flex min-h-screen flex-col">
          <Header />

          <main id="content" className="relative flex-1">
            {children}
          </main>

          <Footer />
          <CookieBanner />
        </div>
      </body>
    </html>
  );
}