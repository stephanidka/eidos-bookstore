import puppeteer from "puppeteer";
import fs from "fs";

async function main() {
  const url = "https://www.alib.ru/bsnewbook.php4?bs=eidos&new=7";

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--ignore-certificate-errors"],
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });

  const books = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll("p").forEach((p) => {
      const bold = p.querySelector("b");
      if (!bold) return; // только блоки с <b>, где название книги

      const title = bold.innerText.trim();

      const text = p.innerText.replace(/\s+/g, " ");
      const priceMatch = text.match(/Цена:\s*([\d\s]+руб)/i);
      const price = priceMatch ? priceMatch[1] : "";

      const conditionMatch = text.match(/Состояние:\s*([^]+?)(Смотрите|$)/i);
      const condition = conditionMatch ? conditionMatch[1].trim() : "";

      const parts = text.split("Состояние:");
      const description = parts[0]
        .replace(title, "")
        .replace(/Цена:.*руб\./, "")
        .trim();

      const photos = [];
      p.querySelectorAll("a").forEach((a) => {
        if (a.textContent.includes("книга") || a.textContent.includes("титул")) {
          photos.push({ type: a.textContent.trim(), url: a.href });
        }
      });

      items.push({ title, price, description, condition, photos });
    });
    return items;
  });

  await browser.close();

  fs.writeFileSync("latest_books.json", JSON.stringify(books, null, 2), "utf-8");
  console.log(`Сохранено книг: ${books.length}`);
}

main().catch(console.error);
