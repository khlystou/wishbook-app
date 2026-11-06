"use client";

import SiteFooter from "./site-footer";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Cake,
  CarFront,
  Check,
  ChevronRight,
  Clapperboard,
  Dice5,
  Download,
  Gamepad2,
  Gift,
  Heart,
  Menu,
  Plus,
  Printer,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Art = "sparkles" | "gift" | "gamepad" | "burger" | "dice" | "heart" | "shopping" | "cake" | "movie" | "car" | "hotwheels";
const DEFAULT_ICON_LAYOUT = { x: 0, y: 0, size: 100 };
type IconLayout = typeof DEFAULT_ICON_LAYOUT;
type Wish = { text: string; palette: number; art: Art; image?: string; iconLayout?: IconLayout };
type Template = "classic" | "frame" | "minimal" | "ticket" | "ribbon";
type Pattern = "confetti" | "dots" | "waves" | "plain";
const PRINT_FORMATS = {
  "9x13": { label: "9 × 13 см", width: 130, height: 90 },
  "10x15": { label: "10 × 15 см", width: 150, height: 100 },
  a6: { label: "A6 · 105 × 148 мм", width: 148, height: 105 },
  a5: { label: "A5 · 148 × 210 мм", width: 210, height: 148 },
} as const;
type PrintFormat = keyof typeof PRINT_FORMATS;

function getPrintFormat(format?: PrintFormat) {
  return PRINT_FORMATS[format ?? "10x15"] ?? PRINT_FORMATS["10x15"];
}

type Book = {
  printFormat?: PrintFormat;
  template?: Template;
  pattern?: Pattern;
  backgroundImage?: string;
  backgroundColor?: string;
  accentColor?: string;
  textColor?: string;
  completed?: number[];
  title: string;
  count: number;
  coverTitle: string;
  recipient: string;
  issued: string;
  validFrom: string;
  validUntil: string;
  coverPalette: number;
  rules: string[];
  wishes: Wish[];
};

const STORAGE_KEY = "wishbook-studio-v1";
const PALETTES = [
  { name: "Небесный", bg: "#dff0ff", accent: "#cc483b", soft: "#fff1cc" },
  { name: "Лимонный", bg: "#fff2ba", accent: "#277a8a", soft: "#fff9df" },
  { name: "Мятный", bg: "#d9f4e7", accent: "#db5f42", soft: "#fff1d5" },
  { name: "Лавандовый", bg: "#e9e4fb", accent: "#7352a5", soft: "#fff1db" },
  { name: "Персиковый", bg: "#ffe3d5", accent: "#bd4b64", soft: "#fff5d4" },
  { name: "Солнечный", bg: "#ffe1a6", accent: "#b8443d", soft: "#fff5e0" },
];

const ART_OPTIONS: { key: Art; name: string; Icon: LucideIcon }[] = [
  { key: "sparkles", name: "Звёзды", Icon: Sparkles },
  { key: "gift", name: "Подарок", Icon: Gift },
  { key: "gamepad", name: "Игры", Icon: Gamepad2 },
  { key: "burger", name: "Угощение", Icon: Utensils },
  { key: "dice", name: "Настолка", Icon: Dice5 },
  { key: "heart", name: "Любовь", Icon: Heart },
  { key: "shopping", name: "Покупки", Icon: ShoppingBag },
  { key: "cake", name: "Сладость", Icon: Cake },
  { key: "movie", name: "Кино", Icon: Clapperboard },
  { key: "car", name: "Машинка", Icon: CarFront },
  { key: "hotwheels", name: "Hot Wheels", Icon: CarFront },
];

const EXAMPLE_WISHES: Wish[] = [
  { text: "10 рублей на карманные расходы", palette: 0, art: "sparkles" },
  { text: "Дополнительные 30 минут на использование гаджетов", palette: 1, art: "gamepad" },
  { text: "Фастфуд на ужин", palette: 2, art: "burger" },
  { text: "Игра в любую настолку всей семьёй", palette: 3, art: "dice" },
  { text: "На отмену наказания", palette: 4, art: "heart" },
  { text: "50 рублей на хотелки на Wildberries", palette: 5, art: "shopping" },
  { text: "Купон на покупку любимой сладости", palette: 0, art: "cake" },
  { text: "День без школы", palette: 1, art: "sparkles" },
  { text: "Поход в кино", palette: 2, art: "movie" },
  { text: "Всей семьёй на пикник", palette: 3, art: "heart" },
  { text: "50 рублей на набор Lego", palette: 4, art: "gift" },
  { text: "Повтор одного желания", palette: 5, art: "sparkles" },
  { text: "Купон на покупку машинки Hot Wheels", palette: 0, art: "hotwheels" },
];

const INITIAL: Book = {
  completed: [],
  title: "13 желаний",
  count: 13,
  coverTitle: "Чековая книжка желаний",
  recipient: "",
  issued: "",
  validFrom: "",
  validUntil: "",
  coverPalette: 0,
  rules: [
    "Чеки могут быть использованы в любом порядке.",
    "В день можно использовать не более одного чека.",
    "Для исполнения отрывная часть чека передаётся дарителю.",
  ],
  wishes: EXAMPLE_WISHES,
};

function makeWish(index: number): Wish {
  return EXAMPLE_WISHES[index] ?? { text: "", palette: index % PALETTES.length, art: "sparkles" };
}

function countTitle(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  const noun = lastTwo >= 11 && lastTwo <= 14 ? "желаний" : last === 1 ? "желание" : last >= 2 && last <= 4 ? "желания" : "желаний";
  return `${count} ${noun}`;
}

function dateLabel(value: string) {
  if (!value) return "—";
  const parts = value.split("-");
  return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : value;
}

function EditableIcon({ image, layout, onChange }: {
  image: string;
  layout: IconLayout;
  onChange?: (layout: IconLayout) => void;
}) {
  const drag = useRef<{ pointer: number; x: number; y: number; width: number; height: number;
    radiusX: number; radiusY: number; layout: IconLayout; resize: boolean } | null>(null);
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  return (
    <div className={onChange ? "custom-art custom-art--editable" : "custom-art"}
      style={{
        left: `${50 + layout.x}%`, top: `${50 + layout.y}%`,
        width: `${85 * layout.size / 100}%`, height: `${78 * layout.size / 100}%`,
      }}
      onPointerDown={onChange ? (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        const box = event.currentTarget.parentElement!.getBoundingClientRect();
        const icon = event.currentTarget.getBoundingClientRect();
        const resize = event.target instanceof Element && !!event.target.closest(".icon-resize");
        drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY,
          width: box.width, height: box.height, radiusX: icon.width / 2, radiusY: icon.height / 2,
          layout, resize };
        event.currentTarget.setPointerCapture(event.pointerId);
      } : undefined}
      onPointerMove={(event) => {
        const start = drag.current;
        if (!onChange || !start || start.pointer !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (start.resize) {
          const scale = 1 + (dx * start.radiusX + dy * start.radiusY) /
            (start.radiusX ** 2 + start.radiusY ** 2);
          onChange({ ...start.layout, size: clamp(Math.round(start.layout.size * scale), 25, 150) });
        } else {
          onChange({ ...start.layout, x: clamp(start.layout.x + dx / start.width * 100, -35, 35),
            y: clamp(start.layout.y + dy / start.height * 100, -50, 50) });
        }
      }}
      onLostPointerCapture={() => { drag.current = null; }}
      onKeyDown={onChange ? (event) => {
        const offset = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
        if (!offset) return;
        event.preventDefault();
        if (event.target !== event.currentTarget) {
          onChange({ ...layout, size: clamp(layout.size + (offset[0] || offset[1]) * 5, 25, 150) });
        } else {
          onChange({ ...layout, x: clamp(layout.x + offset[0] * 2, -35, 35),
            y: clamp(layout.y + offset[1] * 2, -50, 50) });
        }
      } : undefined}
      tabIndex={onChange ? 0 : undefined}
      aria-label={onChange ? "Переместить иконку стрелками" : undefined}
    >
      <img src={image} alt="" draggable={false} />
      {onChange && <button type="button" className="icon-resize" aria-label="Изменить размер иконки стрелками" />}
    </div>
  );
}

function CardArt({ art, accent, image, layout = DEFAULT_ICON_LAYOUT, onChange }: {
  art: Art;
  accent: string;
  image?: string;
  layout?: IconLayout;
  onChange?: (layout: IconLayout) => void;
}) {
  if (image) return <EditableIcon image={tintCatalogIcon(image, accent)} layout={layout} onChange={onChange} />;
  if (art === "hotwheels") {
    return <img className="hotwheels-logo" src="/hot-wheels-logo.png" alt="Hot Wheels" />;
  }
  const Icon = ART_OPTIONS.find((option) => option.key === art)?.Icon ?? Sparkles;
  return (
    <span className="art-symbol" style={{ color: accent }}>
      <Icon strokeWidth={1.6} aria-hidden="true" />
    </span>
  );
}

function BookCard({ book, kind, wishIndex = 0, onIconChange }: { book: Book; kind: "cover" | "rules" | "wish"; wishIndex?: number; onIconChange?: (layout: IconLayout) => void }) {
  const wish = book.wishes[wishIndex] ?? makeWish(wishIndex);
  const palette = PALETTES[kind === "wish" ? wish.palette : book.coverPalette] ?? PALETTES[0];
  const accent = book.accentColor ?? palette.accent;
  const { width, height } = getPrintFormat(book.printFormat);
  const headline = wish.text.trim() || "Ваше желание";
  return (
    <article
      className={`book-card book-card--${kind} template-${book.template ?? "classic"} pattern-${book.pattern ?? "confetti"}`}
      style={{ aspectRatio: `${width} / ${height}`, backgroundColor: book.backgroundColor ?? palette.bg, color: book.textColor, ["--card-accent" as string]: accent, ["--card-soft" as string]: palette.soft }}
      aria-label={kind === "cover" ? "Обложка" : kind === "rules" ? "Правила" : `Чек: ${headline}`}
    >
      {book.backgroundImage && <img className="card-background" src={book.backgroundImage} alt="" />}
      <span className="confetti confetti--one" />
      <span className="confetti confetti--two" />
      <span className="confetti confetti--three" />
      <Star className="card-star card-star--one" fill="#ffbd45" stroke="none" aria-hidden="true" />
      <Star className="card-star card-star--two" fill="var(--card-accent)" stroke="none" aria-hidden="true" />
      <div className="card-main">
        {kind === "cover" && (
          <>
            <div className="card-pill">ПОДАРОК ДЛЯ {book.recipient.trim() || "ТЕБЯ"}</div>
            <div className="cover-heading">{book.coverTitle.trim() || "Чековая книжка желаний"}</div>
            <div className="cover-count">{book.title.trim() || `${book.count} желаний`}</div>
            <div className="cover-dates">
              <span>Выдана: {dateLabel(book.issued)}</span>
              <span>Действует: {dateLabel(book.validFrom)} — {dateLabel(book.validUntil)}</span>
            </div>
          </>
        )}
        {kind === "rules" && (
          <>
            <div className="card-pill">ВАЖНО ЗНАТЬ</div>
            <div className="rules-heading">Правила игры</div>
            <div className="rules-list">
              {book.rules.filter((rule) => rule.trim()).map((rule, index) => (
                <div className="printed-rule" key={`${index}-${rule}`}>
                  <span>{index + 1}</span>
                  <p>{rule}</p>
                </div>
              ))}
            </div>
          </>
        )}
        {kind === "wish" && (
          <>
            <div className="card-pill">ЧЕК ЖЕЛАНИЯ</div>
            <div className={`wish-heading ${headline.length > 63 ? "wish-heading--small" : headline.length > 42 ? "wish-heading--medium" : ""}`}>{headline}</div>
            <div className="art-oval"><CardArt art={wish.art} accent={accent} image={wish.image} layout={wish.iconLayout} onChange={onIconChange} /></div>
            <div className="wish-footer">
              <span>Действителен до {dateLabel(book.validUntil)}</span>
              <span>Использован: <i /></span>
            </div>
          </>
        )}
      </div>
      <aside className="card-stub">
        <div className="stub-top">{kind === "wish" ? "ОТРЫВНОЙ ЧЕК" : kind === "rules" ? "ПРАВИЛА" : "ЖЕЛАНИЯ"}</div>
        <Star className="stub-star" fill="currentColor" stroke="none" aria-hidden="true" />
        <div className="stub-title">{kind === "wish" ? headline : kind === "rules" ? "Как использовать чеки" : book.title || "Книга желаний"}</div>
        <div className="stub-bottom">{kind === "wish" ? "ПЕРЕДАТЬ ДАРИТЕЛЮ" : kind === "rules" ? "ЧИТАЙ И МЕЧТАЙ" : "СДЕЛАНО С ЛЮБОВЬЮ"}</div>
      </aside>
    </article>
  );
}

function ImagePicker({ label, image, onChange, maxKb = 100, svgOnly = false }: {
  label: string;
  image?: string;
  maxKb?: number;
  svgOnly?: boolean;
  onChange: (value?: string) => void;
}) {
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <div className="field">
      <button type="button" className="secondary-button" onClick={() => fileInput.current?.click()}>
        {label}
      </button>
      <input ref={fileInput} hidden type="file" accept={svgOnly ? ".svg,image/svg+xml" : "image/png,image/jpeg,image/webp,image/gif,image/svg+xml"}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (svgOnly) {
            try {
              if (file.size > maxKb * 1000 || !/\.svg$/i.test(file.name)) throw new Error();
              const svg = new DOMParser().parseFromString(await file.text(), "image/svg+xml");
              if (svg.documentElement.localName !== "svg" ||
                  svg.documentElement.namespaceURI !== "http://www.w3.org/2000/svg" ||
                  svg.querySelector("parsererror")) throw new Error();
            } catch {
              setError(`Выберите корректный SVG до ${maxKb} КБ.`);
              return;
            }
          } else if (file.size > maxKb * 1000 || !/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(file.type)) {
            setError("Выберите PNG, JPEG, WebP, GIF или SVG до " + maxKb + " КБ.");
            return;
          }
          setError("");
          const reader = new FileReader();
          reader.onload = () => onChange(String(reader.result));
          reader.onerror = () => setError("Не удалось прочитать изображение.");
          reader.readAsDataURL(svgOnly ? new Blob([file], { type: "image/svg+xml" }) : file);
        }}
      />
      {image && <button className="text-button" type="button" onClick={() => onChange(undefined)}>Убрать изображение</button>}
      {error && <small role="alert">{error}</small>}
    </div>
  );
}

const WISH_ICONS: Record<string, string> = {
  "Подарок": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M3 10h18v4H3z M5 14v7h14v-7 M12 9v12 M12 9C5 9 5 3 8 3c2 0 3 4 4 6 1-2 2-6 4-6 3 0 3 6-4 6Z'/></svg>",
  "Торт": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M3 20h18 M5 20v-8h14v8 M5 15q2 3 4 0 3 3 6 0 2 3 4 0 M9 12V8m6 4V8 M9 6V4m6 2V3'/></svg>",
  "Свеча": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M8 21V11h8v10H8Z M12 9c-4-1-2-5 1-7-1 3 3 5-1 7Z M6 21h12'/></svg>",
  "Воздушный шар": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 17c-5 0-8-4-8-8a8 8 0 0 1 16 0c0 4-3 8-8 8Zm0 0-2 2h4Zm0 2q-3 2 0 4 M7 9q0-3 3-4'/></svg>",
  "Конфетти": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M4 21l4-13 9 9-13 4Zm2-7 5 5 M12 7q0-3 3-4m2 8q3 0 4-3m-3 7 3 1 M18 4l2 1m-4 2 1 1'/></svg>",
  "Фейерверк": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 12V3m0 9 6-7m-6 7 9-1m-9 1 6 6m-6-6v9m0-9-6 6m6-6-9-1m9 1L6 5 M3 4h1m16 0h1m-1 16h1m-18 0h1'/></svg>",
  "Корона": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M3 7l5 4 4-7 4 7 5-4-2 12H5L3 7Zm3 9h12m-7-2h2'/></svg>",
  "Звезда": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Zm-2 11 2 2 3-4'/></svg>",
  "Волшебная палочка": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M4 20l12-12 3 3L7 23 4 20Zm9-9 3 3 M5 4v6m-3-3h6m10-5v4m-2-2h4m1 12v4m-2-2h4'/></svg>",
  "Сердце": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 21 4 13C-2 6 7 1 12 7c5-6 14-1 8 6l-8 8Zm-7-9h4l2-3 2 6 2-3h4'/></svg>",
  "Пицца": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M3 5q9-6 18 0L12 22 3 5Zm2 3q7-4 14 0 M9 9h.1m5 2h.1m-3 4h.1'/></svg>",
  "Бургер": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M3 10a9 7 0 0 1 18 0H3Zm0 4q2-3 5 0t5 0 5 0 3 0 M4 17h16v3H4z M9 7h.1m5-1h.1'/></svg>",
  "Картофель фри": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M5 11l3 10h8l3-10H5Zm2 0L6 4h3l1 7m1 0V2h3v9m1 0 2-7h3l-2 7 M10 16h4'/></svg>",
  "Мороженое": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M6 12l6 10 6-10 M6 12a3 3 0 0 1-1-6 7 7 0 0 1 14 0 3 3 0 0 1-1 6H6Zm3 2 6 4m0-4-5 4'/></svg>",
  "Конфета": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M8 8q4-4 8 0v8q-4 4-8 0V8Zm0 1L2 6v12l6-3m8-6 6-3v12l-6-3 M9 12h6'/></svg>",
  "Печенье": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M20 13a9 9 0 1 1-9-10q0 4 4 4 0 5 5 6Z M7 10h.1m4 4h.1m-4 3h.1m9-2h.1'/></svg>",
  "Пончик": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z M6 9l1 1m9-4 1 1m1 8 1-1m-8 4h1'/></svg>",
  "Какао": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M4 9h13v7q0 4-4 4H8q-4 0-4-4V9Zm13 2h2a3 3 0 0 1 0 6h-2 M7 5q2-1 0-3m5 3q2-1 0-3 M2 22h18'/></svg>",
  "Клубника": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 8q9-5 9 2 0 6-9 12Q3 16 3 10q0-7 9-2Zm0 0q-5-1-4-5 3 0 4 3 1-3 4-3 1 4-4 5Zm-4 4h.1m8 0h.1m-4 4h.1'/></svg>",
  "Попкорн": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M5 10h14l-2 11H7L5 10Zm4 1 1 9m5-9-1 9 M5 10q-4-4 1-5 0-4 4-2 2-4 5 0 4-2 5 3 3 1-1 4'/></svg>",
  "Геймпад": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M7 7h10q3 0 4 5l1 5q0 3-3 2l-4-3H9l-4 3q-3 1-3-2l1-5q1-5 4-5Zm-2 5h5m-2-2v4m8-3h.1m3 2h.1'/></svg>",
  "Игральный кубик": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M4 7l8-4 8 4v10l-8 4-8-4V7Zm0 0 8 4 8-4m-8 4v10 M8 13h.1m8 2h.1m-4-8h.1'/></svg>",
  "Пазл": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M3 4h7v3a2 2 0 1 0 4 0V4h7v7h-3a2 2 0 1 0 0 4h3v6h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V4Z'/></svg>",
  "Конструктор": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M3 10l11-5 7 4v8l-11 5-7-4v-8Zm0 0 7 4 11-5m-11 5v8 M6 8V5l3-1 2 1v2m3-2V2l3 1v3'/></svg>",
  "Машинка": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M3 15v-4l4-1 3-5h6l3 5 2 2v3h-3m-4 0H9m-4 0H3m6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm9 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 10h11m-6-5v5'/></svg>",
  "Ракета": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M9 15C8 9 12 4 21 3c-1 9-6 13-12 12Zm0 0-4 2v-5l4-2m0 5-2 4h5l2-4m1-6h.1 M3 21l3-3'/></svg>",
  "Бумажный самолёт": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M2 10l20-7-7 19-4-8-9-4Zm9 4L22 3m-11 11-2 5 4-2'/></svg>",
  "Кинохлопушка": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M4 10h17v11H4z M4 10 2 6l17-4 2 4-17 4Zm3-5 3 3m3-5 3 3 M10 13v5l5-2.5-5-2.5Z'/></svg>",
  "Наушники": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M4 14v-3a8 8 0 0 1 16 0v3 M4 13h3v7H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Zm13 0h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3v-7Z'/></svg>",
  "Фотоаппарат": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M3 8h5l2-3h4l2 3h5v12H3z M12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm6 1h.1'/></svg>",
  "Воздушный змей": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2l7 9-7 8-7-8 7-9Zm0 0v17m-7-8h14m-7 8q-2 3 3 4m-1-3 3 1'/></svg>",
  "Велосипед": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M7 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm15 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 17l5-8 4 8H4m9 0 4-6m2 6L16 6h3 M7 9h4'/></svg>",
  "Самокат": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M7 19h12l-4-14h4 M7 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z'/></svg>",
  "Футбольный мяч": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5 4 3-2 5h-4l-2-5 4-3Zm0 0V3m4 8 5-1m-7 6 3 4m-7-4-3 4m1-9-5-1'/></svg>",
  "Пикник": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M3 11h18l-2 9H5z M7 11a5 6 0 0 1 10 0 M8 14v3m4-3v3m4-3v3'/></svg>",
  "Палатка": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M2 20 12 4l10 16H2Zm5 0 5-9 5 9M10 4l2 3 2-3'/></svg>",
  "Компас": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-4 13 2-6 6-2-2 6-6 2Zm2-6 4 4'/></svg>",
  "Рюкзак": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M5 11q0-5 5-5h4q5 0 5 5v10H5V11Zm4-5V4q3-4 6 0v2M8 14h8v4H8z M5 12H3v6h2m14-6h2v6h-2'/></svg>",
  "Дерево": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 21v-6m-3 6h6 M7 14a4 4 0 0 1-1-8 6 6 0 0 1 12 0 4 4 0 0 1-1 8H7Z'/></svg>",
  "Цветок": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 10C8 6 11 2 14 4c2 1 2 3 1 5 5-2 7 3 4 5-2 1-4 0-5-1 1 4-4 6-6 2-1-2 0-3 1-4-5 1-6-4-3-5 2-1 4 0 6 4Zm0 6v6m0-2 5-2'/></svg>",
  "Радуга": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M2 17a10 10 0 0 1 20 0m-17 0a7 7 0 0 1 14 0m-11 0a4 4 0 0 1 8 0 M2 17v3m20-3v3'/></svg>",
  "Солнце": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-2V2m0 20v-3m7-7h3M2 12h3m12-5 2-2m-2 12 2 2m-12-2-2 2m2-12L5 5'/></svg>",
  "Луна": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M19 16A9 9 0 0 1 8 4a9 9 0 1 0 11 12Zm-2-12v6m-3-3h6m1 3v4m-2-2h4'/></svg>",
  "Книга": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 6Q8 2 3 4v15q5-2 9 2 4-4 9-2V4q-5-2-9 2v15 M6 8l3 1m-3 3 3 1m6-4 3-1m-3 5 3-1'/></svg>",
  "Карандаш": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M4 16 16 4l4 4L8 20l-5 1 1-5Zm10-10 4 4M4 16l4 4'/></svg>",
  "Палитра": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M13 21C3 22 0 11 5 6c5-6 16-4 16 2 0 4-6 2-6 6 0 2 4 5-2 7ZM7 10h.1m4-4h.1m5 1h.1m-9 8h.1'/></svg>",
  "Монета": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-2 13V8h3a2 2 0 0 1 0 4H9m0 2h5'/></svg>",
  "Пакет покупок": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M5 8h14l2 13H3L5 8Zm4 2V6a3 3 0 0 1 6 0v4 M9 15q3 3 6 0'/></svg>",
  "Ключ": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M8 4a5 5 0 1 0 4 8l8 8 2-2-2-2-2 1-2-2 1-2-4-4a5 5 0 0 0-5-5ZM7 8h.1'/></svg>",
  "Песочные часы": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke=\"currentColor\" stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'><path d='M5 3h14M5 21h14M7 3c0 6 1 6 5 9-4 3-5 3-5 9m10-18c0 6-1 6-5 9 4 3 5 3 5 9m-8-3 3-2 3 2'/></svg>"
};
const CATALOG_IMAGE_PREFIX = "data:image/svg+xml;charset=utf-8,";
const svgImage = (svg: string) => CATALOG_IMAGE_PREFIX + encodeURIComponent(svg);

function tintCatalogIcon(image: string, accent: string) {
  // Catalog icons are URL encoded. Uploaded files use base64 data URLs.
  return image.startsWith(CATALOG_IMAGE_PREFIX)
    ? image.replace(encodeURIComponent('stroke="currentColor"'), encodeURIComponent(`stroke="${accent}"`))
    : image;
}

function WishIconPicker({ accent, onSelect }: { accent: string; onSelect: (image: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const term = query.trim().toLocaleLowerCase("ru");
  const matches = Object.keys(WISH_ICONS).filter((name) => name.toLocaleLowerCase("ru").includes(term));

  return (
    <>
      <button type="button" className="text-button more-icons" aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}>Больше иконок</button>
      <dialog ref={dialog} className="icon-catalog-dialog" aria-labelledby="wish-icon-title">
        <div className="icon-field-heading">
          <h2 id="wish-icon-title">Каталог иконок</h2>
          <button type="button" className="text-button" aria-label="Закрыть"
            onClick={() => dialog.current?.close()}><X size={20} /></button>
        </div>
        <p>50 тематических иконок для книжки желаний.</p>
        <div className="field">
          <input aria-label="Поиск иконок" type="search" value={query} maxLength={80}
            placeholder="Найти иконку" onChange={(event) => setQuery(event.target.value)} />
        </div>
        {!matches.length ? <p>Иконки не найдены.</p> :
          <>
            <div className="art-picker">
              {matches.map((id) => {
                const image = svgImage(WISH_ICONS[id]);
                return (
                  <button key={id} type="button" className="art-choice" onClick={() => {
                    onSelect(image);
                    dialog.current?.close();
                  }}>
                    <img src={tintCatalogIcon(image, accent)} width={24} height={24} alt="" />
                    <span>{id}</span>
                  </button>
                );
              })}
            </div>
          </>}
      </dialog>
    </>
  );
}

const PROMO_SLIDES = [
  "Мастер желаний",
  "Настройки проекта",
  "Обложка и правила",
  "Редактор чеков",
  "Предпросмотр книжки",
  "Печать и сохранение PDF",
];

function ProjectLanding({ onStart }: { onStart: () => void }) {
  const [slide, setSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => {
      setSlide((current) => (current + 1) % PROMO_SLIDES.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [autoplay]);
  const move = (offset: number) =>
    setSlide((current) => (current + offset + PROMO_SLIDES.length) % PROMO_SLIDES.length);

  return (
    <>
    <main className="project-landing">
      <header className="landing-header">
        <div className="brand">
          <span className="brand-mark"><Star size={19} fill="currentColor" aria-hidden="true" /></span>
          Мастер желаний
        </div>
      </header>
      <div className="landing-hero">
        <section className="landing-copy">
          <p className="eyebrow">ПОДАРОК С ХАРАКТЕРОМ</p>
          <h1>Маленькие чеки для больших радостей</h1>
          <p>Создайте чековую книжку для близкого человека. Придумайте желания, оформите карточки и распечатайте подарок или сохраните его в PDF.</p>
          <a className="primary-button landing-cta" href="#editor" onClick={onStart}>
            Создать проект <ArrowRight size={19} aria-hidden="true" />
          </a>
        </section>
        <section className="landing-slides" aria-label="Слайды о проекте">
          <figure>
            <div className="landing-slide-stack">
              {PROMO_SLIDES.map((title, index) => (
                <img key={title} src={`/promo-slide-${index + 1}.webp`} alt={title}
                  aria-hidden={slide !== index} className={slide === index ? "is-current" : undefined}
                  width={1280} height={720} decoding="async" />
              ))}
            </div>
            <figcaption aria-live={autoplay ? "off" : "polite"}>{PROMO_SLIDES[slide]} · {slide + 1} из {PROMO_SLIDES.length}</figcaption>
          </figure>
          <div className="landing-slide-controls">
            <button type="button" onClick={() => move(-1)} aria-label="Предыдущий слайд"><ArrowLeft size={18} /></button>
            <div className="landing-slide-dots" role="group" aria-label="Выбрать слайд">
              {PROMO_SLIDES.map((title, index) => (
                <button key={title} type="button" aria-label={title} aria-pressed={slide === index}
                  onClick={() => setSlide(index)}><span /></button>
              ))}
            </div>
            <button type="button" onClick={() => move(1)} aria-label="Следующий слайд"><ArrowRight size={18} /></button>
            <button type="button" onClick={() => setAutoplay((current) => !current)}
              aria-label={autoplay ? "Приостановить смену слайдов" : "Возобновить смену слайдов"}>
              <span aria-hidden="true">{autoplay ? "Ⅱ" : "▶"}</span>
            </button>
          </div>
        </section>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}

export default function Home() {
  const [book, setBook] = useState<Book>(INITIAL);
  const [step, setStep] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    const syncEditor = () => setEditorOpen(window.location.hash === "#editor");
    syncEditor();
    window.addEventListener("hashchange", syncEditor);
    return () => window.removeEventListener("hashchange", syncEditor);
  }, []);
  const [loaded, setLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(0);
  const [validation, setValidation] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { book?: Book; step?: number };
        if (parsed.book && typeof parsed.book.title === "string") {
          setBook({ ...INITIAL, ...parsed.book,
            completed: parsed.book.completed ?? Array.from(
              { length: Math.min(32, Math.max(0, (Number(parsed.step) || 0) - 1)) },
              (_, index) => index + 1,
            ),
            count: Math.min(30, Math.max(1, Number(parsed.book.count) || 13)) });
          setStep(Math.max(0, Number(parsed.step) || 0));
        }
      }
    } catch { /* A damaged draft simply starts fresh. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ book, step }));
  }, [book, step, loaded]);

  const finalStep = 3 + book.count;
  const currentStep = Math.min(step, finalStep);
  const completed = (book.completed ?? []).filter((page) => page < finalStep);
  const ready = completed.length === finalStep - 1;
  const isWishStep = currentStep >= 3 && currentStep < finalStep;
  const wishIndex = currentStep - 3;
  const wishAccent = book.accentColor ?? (PALETTES[(book.wishes[wishIndex] ?? makeWish(wishIndex)).palette] ?? PALETTES[0]).accent;
  const progress = Math.round((currentStep / finalStep) * 100);
  const previewItems = useMemo(() => ["cover", "rules", ...Array.from({ length: book.count }, () => "wish")] as ("cover" | "rules" | "wish")[], [book.count]);

  function update<K extends keyof Book>(key: K, value: Book[K]) {
    setBook((previous) => ({ ...previous, [key]: value }));
  }

  function updateCount(next: number) {
    const count = Math.min(30, Math.max(1, Math.trunc(next) || 1));
    setBook((previous) => ({
      ...previous,
      count,
      title: previous.title === countTitle(previous.count) ? countTitle(count) : previous.title,
    }));
  }

  function updateWish(index: number, patch: Partial<Wish>) {
    setBook((previous) => {
      const wishes = [...previous.wishes];
      wishes[index] = { ...(wishes[index] ?? makeWish(index)), ...patch };
      return { ...previous, wishes };
    });
  }

  function updateRule(index: number, text: string) {
    setBook((previous) => ({ ...previous, rules: previous.rules.map((rule, i) => i === index ? text : rule) }));
  }

  function moveNext() {
    if (currentStep === 0 && !book.title.trim()) {
      setValidation("Введите название проекта, чтобы продолжить.");
      return;
    }
    if ((isWishStep && !book.wishes[wishIndex]?.text.trim()) ||
        (currentStep === 2 && !book.rules.some((rule) => rule.trim()))) {
      setValidation("Заполните страницу, чтобы продолжить.");
      return;
    }
    if (currentStep > 0 && !completed.includes(currentStep)) {
      update("completed", [...completed, currentStep]);
    }
    if (currentStep === finalStep - 1) setSelectedPreview(0);
    setValidation("");
    setStep(Math.min(finalStep, currentStep + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goTo(next: number) {
    if (next > 0 && !book.title.trim()) {
      setValidation("Сначала укажите название проекта.");
      setStep(0);
      return;
    }
    if (next === finalStep) setSelectedPreview(0);
    setValidation("");
    setStep(Math.min(finalStep, Math.max(0, next)));
    setShowMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function printBook() {
    window.print();
  }

  const printFormat = getPrintFormat(book.printFormat);
  const paperSize = `${printFormat.width}mm ${printFormat.height}mm`;
  const sectionTitle = currentStep === 0 ? "Создать проект" : currentStep === 1 ? "Обложка" : currentStep === 2 ? "Правила" : isWishStep ? `Желание ${wishIndex + 1}` : "Готово к печати";

  if (!editorOpen) {
    return <ProjectLanding onStart={() => {
      setStep(0);
      setEditorOpen(true);
      window.scrollTo(0, 0);
    }} />;
  }

  return (
    <>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand"><span className="brand-mark"><Star size={19} fill="currentColor" strokeWidth={1.5} /></span><span>Мастер желаний</span></div>
          <div className="topbar-right"><span className="autosave"><span /> Черновик сохраняется автоматически</span><span className="topbar-divider" /><span className="topbar-format">{printFormat.label} · горизонтально</span></div>
          <button className="mobile-menu-button" type="button" onClick={() => setShowMenu(!showMenu)} aria-label="Открыть этапы"><Menu size={21} /></button>
        </header>

        <div className="workspace">
          <div className="sidebar-column">
          <aside className={`sidebar ${showMenu ? "sidebar--open" : ""}`}>
            <div className="sidebar-heading"><span>Ваш проект</span><button className="sidebar-close" type="button" onClick={() => setShowMenu(false)} aria-label="Закрыть"><X size={18} /></button></div>
            <div className="sidebar-project">{book.title || "Без названия"}<small>{book.count} {book.count === 1 ? "желание" : book.count >= 2 && book.count <= 4 ? "желания" : "желаний"}</small></div>
            <nav className="step-list" aria-label="Этапы создания">
              {[
                { number: 0, label: "Создать проект", Icon: Plus },
                { number: 1, label: "Обложка", Icon: BookOpen },
                { number: 2, label: "Правила", Icon: Sparkles },
              ].filter(({ number }) => number === 0 || completed.includes(number)).map(({ number, label, Icon }) => (
                <button key={label} type="button" onClick={() => goTo(number)} className={`step-link ${currentStep === number ? "is-current" : ""}`} aria-current={currentStep === number ? "step" : undefined}>
                  <span className="step-icon"><Icon size={17} /></span><span>{label}</span>{currentStep > number && <Check className="step-check" size={15} />}
                </button>
              ))}
              {completed.some((page) => page >= 3) && <div className="step-group-heading">ЖЕЛАНИЯ</div>}
              <div className="wish-step-list">
                {Array.from({ length: book.count }, (_, index) => completed.includes(index + 3) && (
                  <button key={index} type="button" onClick={() => goTo(3 + index)} className={`step-link wish-step-link ${currentStep === 3 + index ? "is-current" : ""}`} aria-current={currentStep === 3 + index ? "step" : undefined}>
                    <span className="step-index">{String(index + 1).padStart(2, "0")}</span><span className="step-name">{book.wishes[index]?.text?.trim() || `Желание ${index + 1}`}</span>{currentStep > 3 + index && <Check className="step-check" size={15} />}
                  </button>
                ))}
              </div>
              {ready && <button type="button" onClick={() => goTo(finalStep)} className={`step-link final-link ${currentStep === finalStep ? "is-current" : ""}`} aria-current={currentStep === finalStep ? "step" : undefined}>
                <span className="step-icon"><Printer size={17} /></span><span>Предпросмотр и печать</span>
              </button>}
            </nav>
          </aside>
          </div>

          <div className="editor-column">
          <main className="main-area">
            <div className="page-intro">
              <div><div className="eyebrow">СТУДИЯ ПЕЧАТНЫХ ПОДАРКОВ</div><h1>{sectionTitle}</h1><p>{currentStep === 0 ? "Укажите параметры проекта и оформление всей книжки." : currentStep === 1 ? "Настройте первую карточку — она задаст настроение всей книжке." : currentStep === 2 ? "Напишите правила, которые будут напечатаны на отдельной карточке." : isWishStep ? "Напишите желание и выберите оформление чека." : "Проверьте все карточки и отправьте книжку на печать."}</p></div>
              <div className="progress-ring" style={{ ["--progress" as string]: `${progress}%` }}><span>{progress}%</span></div>
            </div>

            <div className={`content-grid ${currentStep === finalStep ? "content-grid--final" : ""}`}>
              <section className="editor-panel">
                {currentStep === 0 && (
                  <div className="editor-inner">
                    <div className="panel-kicker"><span className="number-badge">01</span> НАЧАЛО</div>
                    <h2>Как назовём книжку?</h2>
                    <p className="panel-help">Название появится на обложке. Количество желаний определит число чеков.</p>
                    <label className="field"><span>Название проекта</span><input value={book.title} maxLength={48} onChange={(event) => update("title", event.target.value)} placeholder="Например, 13 желаний" autoComplete="off" /></label>
                    <label className="field"><span>Количество страниц с желаниями</span><div className="count-control"><button type="button" aria-label="Уменьшить количество" onClick={() => updateCount(book.count - 1)}>−</button><input type="number" min={1} max={30} value={book.count} onChange={(event) => updateCount(Number(event.target.value))} /><button type="button" aria-label="Увеличить количество" onClick={() => updateCount(book.count + 1)}>+</button></div><small>От 1 до 30 чеков. Обложка и правила добавятся отдельно.</small></label>
                    <label className="field"><span>Для кого подарок</span><input value={book.recipient} maxLength={32} onChange={(event) => update("recipient", event.target.value)} placeholder="Например, для Ромы" /></label>
                    <div className="date-grid"><label className="field"><span>Дата выдачи</span><input type="date" value={book.issued} onChange={(event) => update("issued", event.target.value)} /></label><label className="field"><span>Действует с</span><input type="date" value={book.validFrom} onChange={(event) => update("validFrom", event.target.value)} /></label><label className="field"><span>Действует до</span><input type="date" value={book.validUntil} onChange={(event) => update("validUntil", event.target.value)} /></label></div>
                    <div className="date-grid">
                      <label className="field">Шаблон
                        <select value={book.template ?? "classic"} onChange={(event) => update("template", event.target.value as Template)}>
                          <option value="classic">Праздничный</option><option value="frame">В рамке</option><option value="minimal">Минимализм</option><option value="ticket">Билет</option><option value="ribbon">Подарочная лента</option>
                        </select>
                      </label>
                      <label className="field">Фоновый рисунок
                        <select value={book.pattern ?? "confetti"} onChange={(event) => update("pattern", event.target.value as Pattern)}>
                          <option value="confetti">Конфетти</option><option value="dots">Горошек</option><option value="waves">Волны</option><option value="plain">Без рисунка</option>
                        </select>
                      </label>
                    </div>
                    <div className="date-grid">
                      {([
                        ["backgroundColor", "Фон", "#dff0ff"],
                        ["accentColor", "Акцент", "#cc483b"],
                        ["textColor", "Текст", "#253456"],
                      ] as const).map(([key, label, fallback]) => (
                        <label className="field" key={key}>{label}
                          <input type="color" value={book[key] ?? fallback} onChange={(event) => update(key, event.target.value)} />
                          {book[key] && <button type="button" className="text-button" onClick={() => update(key, undefined)}>Сбросить</button>}
                        </label>
                      ))}
                    </div>
                    <ImagePicker maxKb={500} label="Свой фон для всех страниц" image={book.backgroundImage}
                      onChange={(value) => update("backgroundImage", value)} />
                    <label className="field">Формат бумаги
                      <select value={book.printFormat && Object.hasOwn(PRINT_FORMATS, book.printFormat) ? book.printFormat : "10x15"}
                        onChange={(event) => update("printFormat", event.target.value as PrintFormat)}>
                        {Object.entries(PRINT_FORMATS).map(([key, format]) => (
                          <option key={key} value={key}>{format.label}</option>
                        ))}
                      </select>
                    </label>
                    <div className="info-chip"><Sparkles size={17} /> В конце можно просмотреть всё и распечатать в выбранном формате.</div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="editor-inner">
                    <div className="panel-kicker"><span className="number-badge">02</span> ОБЛОЖКА</div>
                    <h2>Первая страница</h2>
                    <p className="panel-help">Все изменения сразу видны на карточке справа.</p>
                    <label className="field"><span>Заголовок обложки</span><input value={book.coverTitle} maxLength={55} onChange={(event) => update("coverTitle", event.target.value)} placeholder="Чековая книжка желаний" /></label>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="editor-inner">
                    <div className="panel-kicker"><span className="number-badge">03</span> ПРАВИЛА</div>
                    <h2>Как пользоваться чеками</h2>
                    <p className="panel-help">Правила печатаются на отдельной карточке. Можно оставить от одного до пяти.</p>
                    <div className="rule-edit-list">{book.rules.map((rule, index) => <div className="rule-edit" key={index}><span>{index + 1}</span><textarea value={rule} maxLength={125} rows={2} aria-label={`Правило ${index + 1}`} onChange={(event) => updateRule(index, event.target.value)} /><button type="button" aria-label={`Удалить правило ${index + 1}`} disabled={book.rules.length === 1} onClick={() => update("rules", book.rules.filter((_, i) => i !== index))}><Trash2 size={16} /></button></div>)}</div>
                    {book.rules.length < 5 && <button className="text-button" type="button" onClick={() => update("rules", [...book.rules, ""])}><Plus size={17} /> Добавить правило</button>}
                  </div>
                )}

                {isWishStep && (
                  <div className="editor-inner">
                    <div className="panel-kicker"><span className="number-badge">{String(wishIndex + 1).padStart(2, "0")}</span> ЧЕК ИЗ {book.count}</div>
                    <h2>Что можно загадать?</h2>
                    <p className="panel-help">Текст повторится на отрывной части, чтобы даритель знал, какое желание исполнить.</p>
                    <label className="field"><span>Текст желания</span><textarea className="wish-textarea" rows={3} maxLength={100} value={book.wishes[wishIndex]?.text ?? ""} onChange={(event) => updateWish(wishIndex, { text: event.target.value })} placeholder="Например, поход в кино всей семьёй" /><small>{(book.wishes[wishIndex]?.text ?? "").length}/100 символов</small></label>
                    <div className="field">
                      <div className="icon-field-heading"><span>Иконка</span>
                        <WishIconPicker key={wishIndex} accent={wishAccent} onSelect={(image) => updateWish(wishIndex, { image, iconLayout: undefined })} />
                      </div>
                      <div className="art-picker">{ART_OPTIONS.map(({ key, name, Icon }) => <button key={key} type="button" className={`art-choice ${!book.wishes[wishIndex]?.image && (book.wishes[wishIndex]?.art ?? "sparkles") === key ? "is-active" : ""}`} onClick={() => updateWish(wishIndex, { art: key, image: undefined })} aria-pressed={!book.wishes[wishIndex]?.image && (book.wishes[wishIndex]?.art ?? "sparkles") === key}><Icon size={21} strokeWidth={1.7} color={wishAccent} /><span>{name}</span></button>)}</div></div>
                    <ImagePicker key={wishIndex} svgOnly label="Своя иконка (SVG)" image={book.wishes[wishIndex]?.image}
                      onChange={(image) => updateWish(wishIndex, { image, iconLayout: undefined })} />
                    {book.wishes[wishIndex]?.image && (
                      <div className="field">
                        <small>Перетащите иконку или потяните за её правый нижний угол.</small>
                        <button type="button" className="text-button"
                          onClick={() => updateWish(wishIndex, { iconLayout: undefined })}>
                          Сбросить размер и положение
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === finalStep && (
                  <div className="editor-inner final-editor">
                    <div className="panel-kicker"><span className="number-badge"><Check size={16} /></span> ФИНАЛ</div>
                    <h2>Книжка готова!</h2>
                    <p className="panel-help">Обложка, правила и {book.count} {book.count === 1 ? "чек" : book.count < 5 ? "чека" : "чеков"} собраны в один набор.</p>
                    <div className="summary-grid"><div><strong>{book.count + 2}</strong><span>страниц всего</span></div><div><strong>{printFormat.label}</strong><span>формат бумаги</span></div></div>
                    <button type="button" className="print-button" onClick={printBook}><Printer size={20} /> Печатать книжку</button>
                    <div className="print-hint"><Download size={18} /><p>В окне печати можно выбрать «Сохранить как PDF». Выберите бумагу {printFormat.label}, масштаб 100% и печать без полей, если её поддерживает принтер.</p></div>
                    <button className="text-button" type="button" onClick={() => goTo(0)}><ArrowLeft size={17} /> Изменить проект</button>
                  </div>
                )}

                {validation && <p className="validation editor-validation" role="alert">{validation}</p>}
                {currentStep !== finalStep && <div className="editor-actions"><button className="secondary-button" type="button" onClick={() => goTo(currentStep - 1)} disabled={currentStep === 0}><ArrowLeft size={18} /> Назад</button><button className="primary-button" type="button" onClick={moveNext}>{currentStep === 0 ? "Создать проект" : currentStep === finalStep - 1 ? "Предпросмотр" : "Далее"}<ArrowRight size={18} /></button></div>}
              </section>

              <section className="preview-panel">
                <div className="preview-heading"><div><span className="preview-dot" /> ЖИВОЙ ПРЕДПРОСМОТР</div><span>{printFormat.label}</span></div>
                {currentStep === finalStep ? (
                  <><div className="preview-carousel"><BookCard book={book} kind={previewItems[selectedPreview] ?? "cover"} wishIndex={Math.max(0, selectedPreview - 2)} /></div><div className="preview-selector"><span>Карточка {selectedPreview + 1} из {previewItems.length}</span><div><button type="button" onClick={() => setSelectedPreview(Math.max(0, selectedPreview - 1))} disabled={selectedPreview === 0} aria-label="Предыдущая карточка"><ArrowLeft size={17} /></button><button type="button" onClick={() => setSelectedPreview(Math.min(previewItems.length - 1, selectedPreview + 1))} disabled={selectedPreview === previewItems.length - 1} aria-label="Следующая карточка"><ArrowRight size={17} /></button></div></div><div className="page-strip">{previewItems.map((kind, index) => <button type="button" key={index} className={selectedPreview === index ? "is-active" : ""} onClick={() => setSelectedPreview(index)} title={index === 0 ? "Обложка" : index === 1 ? "Правила" : `Желание ${index - 1}`}>{index === 0 ? <BookOpen size={16} /> : index === 1 ? <Sparkles size={16} /> : index - 1}</button>)}</div></>
                ) : (
                  <><div className="live-preview-card"><BookCard book={book} kind={currentStep === 2 ? "rules" : isWishStep ? "wish" : "cover"} wishIndex={wishIndex} onIconChange={isWishStep ? (iconLayout) => updateWish(wishIndex, { iconLayout }) : undefined} /></div><div className="preview-caption"><span className="caption-icon"><Sparkles size={16} /></span><span>{currentStep === 0 ? "Так будет выглядеть обложка. На следующем шаге её можно настроить." : currentStep === 1 ? "Обложка будет первой страницей в наборе." : currentStep === 2 ? "Правила идут сразу после обложки." : "Справа отрывная часть чека, слева место для дырокола."}</span></div></>
                )}
              </section>
            </div>
            {currentStep === finalStep && <div className="all-pages"><h2>Все страницы <span>{previewItems.length}</span></h2><div className="all-pages-grid">{previewItems.map((kind, index) => <button type="button" className="page-thumb" key={index} onClick={() => { setSelectedPreview(index); window.scrollTo({ top: 0, behavior: "smooth" }); }}><BookCard book={book} kind={kind} wishIndex={Math.max(0, index - 2)} /><span>{index === 0 ? "Обложка" : index === 1 ? "Правила" : `Желание ${index - 1}`}</span><ChevronRight size={15} /></button>)}</div></div>}
          </main>
          <SiteFooter />
          </div>
        </div>
      </div>

      <style>{`@page { size: ${paperSize}; margin: 0; }
        @media print { :root { --paper-width: ${printFormat.width}mm; --paper-height: ${printFormat.height}mm; } }`}</style>
      <div className="print-root" aria-hidden="true">
        <div className="print-page"><BookCard book={book} kind="cover" /></div>
        <div className="print-page"><BookCard book={book} kind="rules" /></div>
        {Array.from({ length: book.count }, (_, index) => <div className="print-page" key={index}><BookCard book={book} kind="wish" wishIndex={index} /></div>)}
      </div>
    </>
  );
}
