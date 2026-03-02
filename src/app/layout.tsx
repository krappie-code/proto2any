import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "proto2any - Convert Protocol Buffers to Any Format",
  description: "Transform your .proto files into JavaScript, TypeScript, JSON Schema, and more. Generate code, schemas, and documentation from your Protocol Buffer definitions.",
  keywords: "protocol buffers, proto, protobuf, converter, javascript, typescript, json schema, code generation",
  authors: [{ name: "proto2any" }],
  creator: "proto2any",
  publisher: "proto2any",
  icons: {
    icon: [
      { url: "/favicon-p2a.ico?cache=1772440264&v=p2a&t=" + Date.now(), sizes: "any" },
      { url: "/favicon-p2a.svg?cache=1772440264&v=p2a&t=" + Date.now(), type: "image/svg+xml" },
      { url: "/favicon-p2a-16x16.png?cache=1772440264&v=p2a&t=" + Date.now(), sizes: "16x16", type: "image/png" },
      { url: "/favicon-p2a-32x32.png?cache=1772440264&v=p2a&t=" + Date.now(), sizes: "32x32", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon-p2a.png?cache=1772440264&v=p2a&t=" + Date.now(), sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/site-p2a.webmanifest",
  openGraph: {
    title: "proto2any - Convert Protocol Buffers to Any Format",
    description: "Transform your .proto files into JavaScript, TypeScript, JSON Schema, and more.",
    url: "https://proto2any.com",
    siteName: "proto2any",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "proto2any - Convert Protocol Buffers to Any Format",
    description: "Transform your .proto files into JavaScript, TypeScript, JSON Schema, and more."
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-p2a.ico?cache=1772440264&v=p2a&force=true" sizes="any" />
        <link rel="icon" href="/favicon-p2a.svg?cache=1772440264&v=p2a&force=true" type="image/svg+xml" />
        <link rel="icon" href="/favicon-p2a-16x16.png?cache=1772440264&v=p2a&force=true" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-p2a-32x32.png?cache=1772440264&v=p2a&force=true" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon-p2a.png?cache=1772440264&v=p2a&force=true" sizes="180x180" />
        <link rel="preload" href="/favicon-p2a.svg?cache=1772440264&v=p2a&force=true" as="image" type="image/svg+xml" />
        <link rel="preload" href="/favicon-p2a.ico?cache=1772440264&v=p2a&force=true" as="image" />
        <meta name="msapplication-TileImage" content="/favicon-p2a-512x512.png?cache=1772440264&v=p2a&force=true" />
        {/* Backup favicon references with original names */}
        <link rel="shortcut icon" href="/favicon.ico?cache=1772440264&v=p2a&force=true" />
        <link rel="alternate icon" href="/favicon.svg?cache=1772440264&v=p2a&force=true" type="image/svg+xml" />
        {/* Force cache clear */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
