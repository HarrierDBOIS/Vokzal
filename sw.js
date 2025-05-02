self.addEventListener('install', event => {
    console.log('Service Worker установлен');
});

self.addEventListener('fetch', event => {
    // Заглушка, без кэширования
});
