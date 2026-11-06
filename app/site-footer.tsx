export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span>© {new Date().getFullYear()} Мастер желаний</span>
        <a href="https://t.me/khlystou" target="_blank" rel="noopener noreferrer">
          Telegram · @khlystou
        </a>
        <small>Сервис предоставляется «как есть», без гарантий. Авторы сервиса не несут ответственности за последствия его использования.</small>
      </div>
    </footer>
  );
}
