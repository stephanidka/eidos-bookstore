// server.js
import express from "express";
import puppeteer from "puppeteer";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
const PORT = 8000;

app.use(express.static(".."));

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Эндпоинт API
app.get("/api/books", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--ignore-certificate-errors"]
    });
    const page = await browser.newPage();
    await page.goto("https://www.alib.ru/bsnewbook.php4?bs=eidos&new=7", {
      waitUntil: "domcontentloaded",
      timeout: 0
    });
  

    // Вытаскиваем книги
    const books = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("p"));
      return items.map(p => {
        const title = p.querySelector("b")?.innerText.trim() || "Без названия";

        const priceMatch = p.innerText.match(/Цена:\s*([\d\s]+ руб\.)/i);
        const price = priceMatch ? priceMatch[1] : "Без цены";

        const buyLink = Array.from(p.querySelectorAll("a"))
          .find(a => a.innerText.includes("Купить"))?.href || "";

        const photoHref = Array.from(p.querySelectorAll("a"))
          .find(a => a.href.includes("foto.php4"))?.href || "";

        return { title, price, buyLink, photoHref };
      }).filter(book => book.title !== "Без названия");
    });

    await browser.close();

    // Теперь для каждой книги качаем настоящую фотку

const booksWithPhotos = await Promise.all(
  books.map((book, idx) => (async () => {
    let photoLink = "";
    if (book.photoHref) {
      try {
        // Задержка перед запросом — чем больше N, тем медленнее (мс)
        await delay(idx * 500); // <-- тут можно поменять 500 на 300/400/1000 и т.д.

        const photoPage = await fetch(book.photoHref);
        const photoHtml = await photoPage.text();
        const $ = cheerio.load(photoHtml);

        // сохраняем лог как было
        console.log("=== FOTO PAGE HTML ===");
        console.log(photoHtml.slice(0, 500)); // первые 500 символов

        // Ищем редирект <meta http-equiv="Refresh">
        const meta = $("meta[http-equiv='Refresh']").attr("content");
        if (meta) {
          const match = meta.match(/URL=(.+)$/i);
          if (match) {
            photoLink = match[1].trim();
          }
        }
      } catch (e) {
        console.error("Не смогли вытащить фотку:", e.message);
      }
    }
    return { ...book, photoLink };
  })())
);


    res.json({ books: booksWithPhotos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при получении данных" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
