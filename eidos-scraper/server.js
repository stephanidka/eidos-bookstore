import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";

const app = express();
const PORT = 8000;
const BOOKS_FILE = "./books.json";
const CACHE_TTL = 30 * 60 * 1000; // 30 минут
const photoCache = {};

app.use(cors());
app.use(express.static(".."));

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== работа с JSON =====

function loadBooksFromFile() {
  if (!fs.existsSync(BOOKS_FILE)) {
    console.log("books.json не найден");
    return null;
  }

  try {
    const stats = fs.statSync(BOOKS_FILE);
    const age = Date.now() - stats.mtimeMs;

    if (age > CACHE_TTL) {
      fs.unlinkSync(BOOKS_FILE);
      console.log("books.json устарел (старше 30 минут), удаляем");
      return null;
    }

    const data = fs.readFileSync(BOOKS_FILE, "utf-8");
    const books = JSON.parse(data);

    if (!Array.isArray(books) || books.length === 0) {
      console.log("books.json пустой");
      return null;
    }

    console.log(`Загружено ${books.length} книг из books.json`);
    return books;
  } catch (e) {
    console.log("Ошибка чтения books.json");
    return null;
  }
}
function saveBooksToFile(books) {
  fs.writeFileSync(
    BOOKS_FILE,
    JSON.stringify(books, null, 2),
    "utf-8"
  );
  console.log(`Сохранили ${books.length} книг в books.json`);
}

// ==== скрейпер =====

async function scrapeBooks() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--ignore-certificate-errors"],
    ignoreHTTPSErrors: true
  });

  const page = await browser.newPage();
  await page.goto(
    "https://www.alib.ru/bsnewbook.php4?bs=eidos&new=7",
    { waitUntil: "domcontentloaded", timeout: 0 }
  );

  console.log("Подключились к alib, читаем книги");

  const books = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("p"))
      .map(p => {
        const titleEl = p.querySelector("b");
        if (!titleEl) return null;

        const title = titleEl.innerText.trim();

        const priceMatch = p.innerText.match(/Цена:\s*([\d\s]+ руб\.)/i);
        const price = priceMatch ? priceMatch[1] : "";

        const buyLink = Array.from(p.querySelectorAll("a"))
          .find(a => a.innerText.includes("Купить"))?.href || "";

        const photoHref = Array.from(p.querySelectorAll("a"))
          .find(a => a.href.includes("foto.php4"))?.href || "";

        return { title, price, buyLink, photoHref };
      })
      .filter(Boolean);
  });

  await browser.close();
  console.log(`Нашли ${books.length} книг`);

  return books;
}

// ===== API =====

app.get("/api/books", async (req, res) => {
  try {
    // 1. сначала пробуем взять из джейсона
    const cachedBooks = loadBooksFromFile();
    if (cachedBooks) {
      return res.json({ books: cachedBooks });
    }

    // 2. если нет — парсим
    console.log("Кеша нет, идем на alib");
    const books = await scrapeBooks();

    // 3. сохраняем в json
    saveBooksToFile(books);

    res.json({ books });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка парсинга" });
  }
});

// асинхронная подгрузка фоток
app.get("/api/photo", async (req, res) => {
  const { url } = req.query;

  res.setHeader("Cache-Control", "public, max-age=86400"); //кэш фоток в браузере

  if (!url) {
    console.log("Фотка: нет url");
    return res.json({ photoLink: "" });
  }

   // 1. Проверяем кэш
   if (photoCache[url]) {
    console.log("Фото из кэша");
    return res.json({ photoLink: photoCache[url] });
  }

  try {
    console.log("Ищем фото на сайте");

    const resp = await fetch(url);
    const html = await resp.text();

    const $ = cheerio.load(html);
    const meta = $("meta[http-equiv='Refresh']").attr("content");

    if (meta) {
      const match = meta.match(/URL=(.+)$/i);
      if (match) {
        const photoLink = match[1].trim();

        // 2. Сохраняем в кэш
        photoCache[url] = photoLink;

        return res.json({ photoLink });
      }
    }

    res.json({ photoLink: "" });
  } catch (e) {
    res.json({ photoLink: "" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
