// Background push notifications (new website orders) — hand-written, not
// built by a bundler, matching sw.js's existing convention. Registered at
// scope "/" (see register-push-notifications.tsx) so it covers both /admin
// and /pos, unlike sw.js which is deliberately scoped to /pos only for
// offline caching. The two coexist fine: this file never handles `fetch`,
// only `push`/`notificationclick`, and FCM routes a push to whichever
// registration `getToken()` was called against, not by URL-scope matching.
//
// Firebase project config below is public (safe to commit, matches
// next.config's NEXT_PUBLIC_FIREBASE_* values) — but unlike those, it can't
// be templated from env vars since this file is served as a static asset,
// not compiled. Keep in sync if the Firebase project config ever changes.
importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyATqFdRUcQQ80vhG7qgF22bCH6eHlXNEXY",
  authDomain: "ohmyk1tty.firebaseapp.com",
  projectId: "ohmyk1tty",
  storageBucket: "ohmyk1tty.firebasestorage.app",
  messagingSenderId: "570285616938",
  appId: "1:570285616938:web:a9a1781c4c08814b61f853"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Oh My Kitty";
  const body = payload.notification?.body ?? "";
  const url = payload.data?.url ?? "/admin/notifications";

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    data: { url }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/admin/notifications";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = clientsList.find((client) => new URL(client.url).pathname === url);

      if (existing) {
        await existing.focus();
        return;
      }

      await self.clients.openWindow(url);
    })()
  );
});
