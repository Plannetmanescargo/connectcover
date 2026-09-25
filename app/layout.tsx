import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import {
  SiteHeader as Header,
  SiteFooter as Footer,
  SiteCookies as CookieBanner,
} from "@/components/documents/Chrome";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/* =========================================================
   METADATA (COVERZA)
========================================================= */
export const metadata: Metadata = {
  metadataBase: new URL("https://www.coverza.net"),

  title: {
    default: "Coverza | Vehicle Documents & Technical Guidance",
    template: "%s | Coverza",
  },

  description:
    "Vehicle-specific documents, technical guidance and supporting digital resources, with clearly defined scope and electronic delivery.",

  applicationName: "Coverza",
  authors: [{ name: "Coverza" }],
  creator: "Coverza",
  publisher: "Coverza",
  category: "automotive",
  keywords: [
    "vehicle documents",
    "automotive technical guidance",
    "vehicle configuration guides",
    "digital documents",
    "Coverza",
  ],

  alternates: {
    canonical: "https://www.coverza.net",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    url: "https://www.coverza.net",
    title: "Coverza | Vehicle Documents & Technical Guidance",
    description:
      "Vehicle-specific documents, technical guidance and supporting digital resources.",
    siteName: "Coverza",
    locale: "en_GB",
    images: [
      {
        url: "/brand/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Coverza vehicle documents",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Coverza | Vehicle Documents & Technical Guidance",
    description:
      "Vehicle-specific documents, technical guidance and supporting digital resources.",
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
