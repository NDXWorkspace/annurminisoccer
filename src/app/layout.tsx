import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "An-Nur Mini Soccer",
    template: "%s · An-Nur Mini Soccer",
  },
  description:
    "Website resmi Turnamen Mini Soccer An-Nur. Jadwal, skor live, klasemen, dan profil tim peserta.",
  applicationName: "An-Nur Mini Soccer",
  keywords: ["mini soccer", "turnamen", "An-Nur", "jadwal", "skor live"],
  openGraph: {
    title: "An-Nur Mini Soccer",
    description: "Website resmi Turnamen Mini Soccer An-Nur.",
    type: "website",
    locale: "id_ID",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#060b16",
  colorScheme: "dark",
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
      className={`${barlow.variable} ${jakarta.variable} ${jetbrains.variable} scroll-smooth`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
