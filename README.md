# delivery-app

## Запуск локально

```bash
npm install
npm run dev
```

Открой: `http://localhost:5173`

## Деплой на GitHub Pages

1. Запушь изменения в ветку `main`.
2. В GitHub: **Settings → Pages**.
3. В поле **Source** выбери **GitHub Actions**.
4. Дождись выполнения workflow `Deploy to GitHub Pages`.
5. Сайт будет доступен по адресу:
   `https://rydnichanin.github.io/delivery-app/`

> Важно: для GitHub Pages у Vite задан `base: '/delivery-app/'`, поэтому просто открытие `https://rydnichanin.github.io/delivery-app` без завершающего `/` может дать некорректную загрузку части ассетов.
