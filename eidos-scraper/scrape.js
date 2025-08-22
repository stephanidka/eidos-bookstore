const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // User-Agent как у обычного браузера
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

  // Открываем страницу
  await page.goto('https://www.alib.ru/bs.php4?bs=eidos', { waitUntil: 'networkidle2' });

  // Простейший пример: вытаскиваем текст из body
  const sellerName = await page.evaluate(() => {
    return document.body.innerText.slice(0, 200); // первые 200 символов для проверки
  });

  console.log('Текст со страницы:', sellerName);

  await browser.close();
})();
