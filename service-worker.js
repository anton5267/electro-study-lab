const NAV_FALLBACK = "./index.html";
const ORIGIN = self.location.origin;
const PRE_CACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/main.css",
  "./assets/js/app.js",
  "./assets/js/modules/content.js",
  "./assets/js/modules/assessment-state.js",
  "./assets/js/modules/checklist-state.js",
  "./assets/js/modules/checklist-control.js",
  "./assets/js/modules/flashcard-state.js",
  "./assets/js/modules/practice-state.js",
  "./assets/js/modules/practice-control.js",
  "./assets/js/modules/quiz-control.js",
  "./assets/js/modules/theory-control.js",
  "./assets/js/modules/jump-control.js",
  "./assets/js/modules/keyboard-control.js",
  "./assets/js/modules/nav-control.js",
  "./assets/js/modules/language-control.js",
  "./assets/js/modules/topic-control.js",
  "./assets/js/modules/exam-intro-control.js",
  "./assets/js/modules/exam-control.js",
  "./assets/js/modules/exam-preferences.js",
  "./assets/js/modules/exam-runtime.js",
  "./assets/js/modules/exam-session.js",
  "./assets/js/modules/quiz-session.js",
  "./assets/js/modules/progress-state.js",
  "./assets/js/modules/review-planner.js",
  "./assets/js/modules/progress-metrics.js",
  "./assets/js/modules/runtime.js",
  "./assets/js/modules/study-helpers.js",
  "./assets/js/modules/storage.js",
  "./assets/js/modules/view-plan.js",
  "./assets/js/modules/templates.js",
  "./assets/js/modules/validation.js",
  "./assets/js/modules/utils.js",
  "./assets/data/study-pack-template.json",
  "./assets/icons/icon-192.svg",
  "./assets/icons/icon-512.svg"
];
const CACHE_NAME = `electro-study-lab-${cacheVer(PRE_CACHE_ASSETS)}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));

    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== ORIGIN) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  if (isRuntimeCacheable(request)) {
    event.respondWith(handleAssetRequest(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isRuntimeCacheable(request) {
  if (request.destination === "script" || request.destination === "style") {
    return true;
  }

  if (request.destination === "image" || request.destination === "font" || request.destination === "manifest") {
    return true;
  }

  return request.url.endsWith(".json");
}

async function handleNavigationRequest(event) {
  try {
    const preload = await event.preloadResponse;
    if (preload) {
      return preload;
    }

    const networkResponse = await fetch(event.request);
    if (isCacheableNavigationResponse(networkResponse)) {
      await putInCache(NAV_FALLBACK, networkResponse);
    }
    return networkResponse;
  } catch (error) {
    const cachedPage = await caches.match(event.request, { ignoreSearch: true });
    if (cachedPage) {
      return cachedPage;
    }

    const fallback = await caches.match(NAV_FALLBACK);
    if (fallback) {
      return fallback;
    }

    return Response.error();
  }
}

async function handleAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    fetch(request)
      .then((response) => putInCache(request, response))
      .catch(() => {});
    return cached;
  }

  const networkResponse = await fetch(request);
  await putInCache(request, networkResponse);
  return networkResponse;
}

async function putInCache(request, response) {
  if (!response || !response.ok) {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

function isCacheableNavigationResponse(response) {
  if (!response?.ok) {
    return false;
  }

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/html");
}

function cacheVer(assets) {
  const input = Array.isArray(assets) ? assets.join("|") : "";
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}
