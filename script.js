fetch('/api/books.php?bs=eidos')
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.error(data.error);
      return;
    }

    // пока просто выводим HTML в консоль
    console.log(data.html);

    // позже: будем парсить и вставлять карточки в #catalog
  })
  .catch(err => console.error("Ошибка запроса:", err));