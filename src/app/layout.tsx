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
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/site.webmanifest",
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
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/favicon-16x16.png?v=2" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png?v=2" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" sizes="180x180" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
