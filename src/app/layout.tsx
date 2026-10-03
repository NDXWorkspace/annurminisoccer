import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Catatan: "Big Shoulders Display" tidak ada di daftar next/font versi ini,
// dipakai "Big Shoulders" (kerangka yang sama) sebagai pengganti setara.
const bigShoulders = Big_Shoulders({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-big-shoulders",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-public-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "An-Nur Mini Soccer",
    template: "%s · An-Nur Mini Soccer",
  },
  description:
    "Turnamen mini soccer An-Nur, 9–10 Oktober 2026. Jadwal dan skor diperbarui langsung oleh panitia.",
  applicationName: "An-Nur Mini Soccer",
  keywords: ["mini soccer", "turnamen", "An-Nur", "jadwal", "skor"],
  openGraph: {
    title: "An-Nur Mini Soccer",
    description: "Turnamen mini soccer An-Nur, 9–10 Oktober 2026.",
    type: "website",
    locale: "id_ID",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F5F7FA",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${bigShoulders.variable} ${publicSans.variable} ${plexMono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
