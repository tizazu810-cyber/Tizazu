/*
  ቅዱስ ሩፋኤል ዕድር — Service Worker (አማራጭ ተጨማሪ ፋይል)

  ይህ ፋይል ለ edir_app.html ተጓዳኝ ሆኖ በተመሳሳይ አቃፊ (ፎልደር) ውስጥ ከተሰቀለ፦
    1. መተግበሪያውን ኦፍላይን (ያለ ኢንተርኔት) ክፍት ማድረግ ያስችላል
    2. በChrome/Edge ላይ "Install" ጥያቄው በበለጠ አስተማማኝነት እንዲታይ ያደርጋል

  ካልተሰቀለ ምንም አይጎዳም — edir_app.html ራሱ ይህን ፋይል ለማግኘት ይሞክራል፣ ካላገኘው
  ዝም ብሎ ችላ ብሎ ይቀጥላል (ምንም ስህተት አያሳይም)። ያለ እሱም የ📲Install ቁልፍ እና
  🔄 ራስ-ሰር ዝማኔ ማወቂያ ስርዓት (in edir_app.html) ራሳቸውን ችለው ይሰራሉ።

  ስትራቴጂ፦ "Network-first" ለ HTML ገጹ ራሱ — ማለት ኢንተርኔት ባለ ጊዜ ሁሌም አዲሱን
  (የቅርብ ጊዜውን) ስሪት ይጫናል፤ ካሽ (cache) የሚያገለግለው ኢንተርኔት ጠፍቶ ኦፍላይን ሲሆኑ
  ብቻ እንደ መጠባበቂያ ነው። ይህ ማለት "stale cache" ችግር (አሮጌ ስሪት ተጣብቆ የመቅረት
  ችግር) በንድፍ ደረጃ አይፈጠርም።
*/

const CACHE_NAME = "edir-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests; let everything else pass straight through.
  if (req.method !== "GET") return;

  const isNavigation = req.mode === "navigate" || req.destination === "document";

  if (isNavigation) {
    // Network-first: always try to get the freshest HTML when online (this
    // is what makes "auto-update" reliable — no stale cached shell). Falls
    // back to the last successfully cached copy only when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Everything else (mostly nothing, since fonts/images are inlined as data
  // URIs in edir_app.html): cache-first, falling back to network.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
