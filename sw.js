const CACHE = "azkar-v4";
const SHELL = ["./", "index.html", "css/style.css", "js/data.js", "js/app.js", "manifest.json", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];

// استجابات إعادة التوجيه لا يمكن استخدامها في التنقل بين الصفحات، لذا نعيد بناء نسخة نظيفة
const clean = async res => {
  if (!res.redirected) return res;
  return new Response(await res.blob(), { status: 200, statusText: "OK", headers: res.headers });
};

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(SHELL.map(async url => {
      try {
        const res = await fetch(new Request(url, { cache: "reload" }));
        if (res.ok) await cache.put(url, await clean(res));
      } catch (_) {}
    }));
  })());
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // أي فتح للتطبيق (مهما كان الرابط) يُخدم من الصفحة المحفوظة
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match("index.html")) || (await cache.match("./")) || fetch(req);
    })());
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req))
  );
});
