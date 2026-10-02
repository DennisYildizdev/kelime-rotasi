const READY = 'Ders paketi çevrimdışı hazır. Sesin çevrimdışı çalışması cihazdaki seslere bağlıdır.';
const WAITING = 'Yeni sürüm hazır. Kaydedilen ders korunur; güncellemek için bu siteye ait sekmeleri kapatıp yeniden aç.';

export async function registerPwa({nav, status, secure}) {
  const show = text => { if (status) status.textContent = text; };
  if (!secure || !nav?.serviceWorker) {
    show('Çevrimdışı paket bu tarayıcıda kullanılamıyor. Derslere çevrimiçi devam edebilirsin.');
    return null;
  }
  show('Çevrimdışı ders paketi hazırlanıyor…');
  try {
    const registration = await nav.serviceWorker.register('./sw.js', {updateViaCache: 'none'});
    const report = () => show(registration.waiting ? WAITING : READY);
    if (registration.waiting) report();
    const track = worker => {
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') show(nav.serviceWorker.controller ? WAITING : READY);
        if (worker.state === 'redundant') show('Çevrimdışı paket yüklenemedi. Bağlantını kontrol edip yeniden aç.');
      });
    };
    track(registration.installing);
    registration.addEventListener('updatefound', () => track(registration.installing));
    nav.serviceWorker.ready.then(report).catch(() => show('Çevrimdışı paket henüz hazır değil.'));
    return registration;
  } catch {
    show('Çevrimdışı paket yüklenemedi; çevrimiçi dersler kullanılabilir.');
    return null;
  }
}

if (typeof document !== 'undefined') {
  registerPwa({nav: navigator, status: document.querySelector('#pwaStatus'), secure: window.isSecureContext});
}
