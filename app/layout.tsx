import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const metrikaId = 114113381;
const metrikaScript = `
  (function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j=0; j<document.scripts.length; j++) {
      if (document.scripts[j].src === r) return;
    }
    k=e.createElement(t); a=e.getElementsByTagName(t)[0];
    k.async=1; k.src=r; a.parentNode.insertBefore(k,a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${metrikaId}', 'ym');
  ym(${metrikaId}, 'init', {
    ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer",
    referrer:document.referrer, url:location.href, accurateTrackBounce:true, trackLinks:true
  });
`;

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
      <body className="antialiased">
        <div className="site-content">{children}</div>
        <Script id="yandex-metrika" strategy="afterInteractive">{metrikaScript}</Script>
        <noscript>
          <img src={`https://mc.yandex.ru/watch/${metrikaId}`} width={1} height={1}
            style={{ position: "absolute", left: -9999 }} alt="" />
        </noscript>
      </body>
    </html>
  );
}
