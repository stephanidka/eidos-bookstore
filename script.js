fetch('http://localhost:8000/api/books')
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.error(data.error);
      return;
    }

    const catalog = document.getElementById('catalog');
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
  .catch(err => console.error("Ошибка запроса:", err));
