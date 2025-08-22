<?php
header("Content-Type: application/json; charset=utf-8");

// Продавец (по умолчанию 'eidos')
$bs = $_GET['bs'] ?? 'eidos';

// URL alib.ru
$url = "http://alib.ru/bzonetb.php4?bs=" . urlencode($bs);

// Контекст с User-Agent, чтобы сайт «видел» обычный браузер
$options = [
    "http" => [
        "header" => implode("\r\n", [
            "User-Agent: Mozilla/5.0",
            "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language: ru-RU,ru;q=0.9",
            "Connection: keep-alive"
        ]),
        "follow_location" => 1,  // разрешаем редиректы
        "timeout" => 10
    ]
];
$context = stream_context_create($options);

// Получаем HTML
$html = @file_get_contents($url, false, $context);

// Если не удалось получить
if ($html === false) {
    echo json_encode(["error" => "Не удалось получить данные с alib.ru"]);
    exit;
}

// Возвращаем HTML как JSON
echo json_encode([
    "html" => $html
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
