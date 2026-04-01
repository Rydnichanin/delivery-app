self.addEventListener("install", (event) => {
  console.log("Service Worker установлен");
});

self.addEventListener("fetch", (event) => {
  // Для кеширования можно добавить логику
});
