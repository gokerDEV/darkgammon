import type { Metadata } from "next";
import { Figtree, Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { GlobalNotificationListener } from "@/components/notifications/GlobalNotificationListener";
import { SideProvider } from "@/components/side/SideProvider";
import { Toaster } from "@/components/ui/sonner";
import { DARKGAMMON_COPY } from "@/lib/copy/darkgammon";
import { cn } from "@/lib/utils";

const figtreeHeading = Figtree({
  subsets: ["latin"],
  variable: "--font-heading",
});

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: DARKGAMMON_COPY.brand.title,
  description: DARKGAMMON_COPY.brand.description,
  openGraph: {
    title: DARKGAMMON_COPY.brand.title,
    description: DARKGAMMON_COPY.brand.description,
    images: ["/darkgammon-og.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: DARKGAMMON_COPY.brand.title,
    description: DARKGAMMON_COPY.brand.description,
    images: ["/darkgammon-og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        outfit.variable,
        figtreeHeading.variable,
      )}
    >
      <head>
        <link
          rel="icon"
          type="image/png"
          sizes="64x64"
          href="/tavlabe-64.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="128x128"
          href="/tavlabe-128.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="256x256"
          href="/tavlabe-256.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/tavlabe-512.png"
        />
        <link rel="apple-touch-icon" href="/tavlabe-256.png" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6920776915496505"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="min-h-full flex flex-col">
        <SideProvider>
          {children}
          <Toaster position="top-center" richColors />
          <GlobalNotificationListener />
        </SideProvider>
      </body>
    </html>
  );
}
