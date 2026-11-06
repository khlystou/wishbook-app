import { Send } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span>© {new Date().getFullYear()} Мастер желаний</span>
        <a href="https://t.me/khlystou" target="_blank" rel="noopener noreferrer"
          aria-label="Написать автору в Telegram">
          <Send size={14} aria-hidden="true" /> Написать автору
        </a>
        <small>Сайт предоставляется «как есть», без гарантий. Автор сайта не несёт ответственности за последствия его использования.</small>
      </div>
    </footer>
  );
}
