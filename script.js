const loader = document.getElementById("loader");
const catalog = document.getElementById("catalog");
const currientYear = document.getElementById('currientYear')


currientYear.textContent = "город Владимир, 1999-" + new Date().getFullYear() + " ♥";


loader.style.display = "flex"; // показываем гифку
catalog.style.display = "none";

fetch("http://localhost:8000/api/books")
  .then(res => res.json())
  .then(data => {
    // спрятать прелоадер
    loader.style.display = "none";
    catalog.style.display = "grid"; 

    if (data.error) {
      console.error(data.error);
      return;
    }

    catalog.innerHTML = ""; // очистим перед рендером

    data.books.forEach(book => {
      const card = document.createElement("div");
      card.className = "book-card";

      card.innerHTML = `
        <div class="book-card">
    <img 
      src="${book.photoLink || "https://via.placeholder.com/150"}" 
      alt="Обложка книги: ${book.title}" 
      class="book-cover"
      onerror="this.onerror=null; this.src='book_placeholder.svg';"
    >
          <h3 class="book-title">${book.title}</h3>
          <p class="book-price">${book.price || "Цена не указана"}</p>
          ${
            book.buyLink
              ? `<a href="${book.buyLink}" target="_blank" class="buy-btn">Купить</a>`
              : `<span class="no-buy">Нет ссылки для покупки</span>`
          }
        </div>
      `;

      catalog.appendChild(card);
    });
  })
  .catch(err => {
    loader.style.display = "none";
    catalog.innerHTML = `<p>Ошибка загрузки данных</p>`;
    console.error("Ошибка запроса:", err);
  });
