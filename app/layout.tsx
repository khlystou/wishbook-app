import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Мастер желаний — создайте чековую книжку",
  description: "Пошаговый редактор чековой книжки желаний с предпросмотром и печатью карточек 15 × 10 см.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
