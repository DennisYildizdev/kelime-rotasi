# Kelime Rotası

Türkçe arayüzlü, kelime odaklı, ADHD dostu web/PWA prototipi. Mevcut açık krem/yeşil tasarım korunmuştur.

## Lisans

Kaynak kod MIT lisansı altındadır; telif sahibi **DennisYildizdev** (`LICENSE`). Bu lisans kod dosyalarını kapsar, kelime envanteri ve üçüncü taraf IPA/çeviri içeriğini kapsamaz — bunlar `THIRD-PARTY-NOTICES.md` ve `licenses/` altındaki kendi lisanslarıyla dağıtılır. Zenginleştirilmiş kartlar AI destekli taslaktır (`reviewStatus: draft`); alanların dolu olması insan editoryal incelemesi iddiası değildir.

## Çalıştırma

Windows'ta `Baslat.bat` dosyasını açın veya proje klasöründe `npm run dev` çalıştırın. Adres: `http://127.0.0.1:4173`. Python gereklidir; HTML dosyasını doğrudan file:// ile açmayın.

Eski sürüm görünüyorsa uygulamaya ait bütün sekmeleri kapatıp yeniden açın. Güncelleme ders sırasında zorla etkinleşmez. İlerlemeyi İlerleme → İlerleme yedeği bölümünden JSON olarak dışa aktarabilirsiniz. Tarayıcı/site verilerini temizlemek ilerlemeyi silebilir; güncelleme için bunu yapmanız gerekmez.

## Doğrulanmış kapsam

- Kaynak PDF ile uzlaştırılmış **3.000 kayıt**: A1 900, A2 800, B1 700, B2 600. `data/source-audit.json` fark raporu; eski ilerleme kimlikleri korunur.
- **900/900 A1 taslak ders kartı, 0 editoryal olarak incelenmiş kart**. Her A1 kartında Türkçe anlam, özgün basit örnek, en-US IPA, Türkçe yaklaşık okunuş ve seslendirme bulunur; 825 kartta ayrıca kaynaklı en-GB IPA vardır. `always → ool-veyz`. A2/B1/B2 henüz yalnızca kaynak envanteridir.
- EN-US varsayılan ses; gerçek en-US ses nesnesi seçilir. Normal/yavaş dinleme ve isteğe bağlı en-GB seçimi. Ses yoksa açıklamalı metin alternatifi; başka aksana sessiz geçiş yoktur.
- 1/5/10 görev; 10 görevde en fazla 5 yeni kelime. Zamanı gelen tekrarlar önde; gelecekteki tekrarlar gereksiz seçilmez.
- Anlam, ters yön, yazma/ipucu, dinleme ve bağlam alıştırmaları. İsteğe bağlı kelime tanıtımı.
- Seans konumu, yanıt, puan, yazma taslağı ve ipucu kaydı; mola sonrası tam devam.
- Bilinen/öğrenilen/zor işaretleri, İngilizce/Türkçe arama, konu/seviye filtreleri ve sayfalama.
- IPA/yaklaşık okunuş görünürlüğü, aksan ve sakin görünüm tercihleri.
- Sürümlü JSON içe/dışa aktarma; engelli/bozuk depolamada görünür uyarı.
- Çevrimdışı metin dersleri; dersin üstüne zorla etkinleşmeyen service-worker güncellemesi.

## Doğrulama

Geliştirme bağımlılıkları: `npm ci`; tarayıcı kurulumu: `npx playwright install chromium`.

```bash
npm test
npm run test:python
npm run test:a1
npm run test:pdf
npm run validate:content
npm run test:e2e
npm run test:pwa
npm run test:layout
npm run test:speech:real
npm audit --audit-level=high
npm run build
```

`test:e2e`, `test:layout`, `test:speech:real` için yerel sunucuyu çalıştırın. `test:pwa` kendi yalnızca loopback sunucusunu açar. PDF araçları için `requirements-tools.txt` gereklidir; uygulamanın çalışması için PDF bağımlılığı gerekmez.

Son doğrulama: 40 JavaScript testi ve 11 Python testi geçti. Ayrıca 900 A1 kart üzerinde 4.500 alıştırma türü kontrolü; 1/5/10 ders bitirme, mola/devam, arama/işaret, yedek, article kartı, ses hatası/iptal; çevrimdışı yanıt ve sürüm güncellemesi sonrası aynı seansı bitirme geçti. 320/390/768/1280px Chromium kontrollerinde yatay taşma ve ders gezinme çakışması yok. Bağımlılık denetimi 0 açık döndürdü.

Gerçek Windows/Chromium ses testi, **Microsoft David - English (United States)** ile iki hızda `completed` döndürdü; sentetik test sesi kullanılmadı. Bu sonuç fiziksel hoparlörü bir insanın dinlediği veya telaffuz kalitesinin onaylandığı anlamına gelmez. Bu cihazda EN-GB sesi bulunmadı. Farklı cihazların sesleri değişir; çevrimdışı ses garanti değildir.

## Yayın paketi

`npm run build`, yalnızca web varlıklarını `dist` klasörüne kopyalar; içerik/kod değişince service-worker sürümünü içerik özetiyle değiştirir. Yayınlayıcıya proje klasörü yerine `dist` içeriğini verin. `Kelime-Rotasi-web.zip` bu içeriğin ZIP paketidir. Kaynak PDF, testler, notlar, node_modules ve geliştirme araçları pakete dahil değildir.

Dış yayın yapılmadı. HTTPS adresi/alan adı veya hesap işlemi için ayrıca kullanıcı onayı gerekir. İçerik ve marka kullanım koşulları kamuya açılmadan önce incelenmelidir.

## Sınırlar

Bu bir insan tarafından incelenmiş sözlük değildir. A1 kaynak envanterinin tamamı derslere açıktır; 900 kartın bağımsız dilbilimsel/editoryal insan kontrolü ile A2/B1/B2 içerikleri, bulut eşitleme ve P3 özellikleri açıktır. IPA tablosu 19 satırlık kısmi yardımcı tablodur. Türkçe yaklaşık okunuş IPA'nın yerine geçmez. Mikrofon veya otomatik telaffuz puanlaması yoktur.

Veriler bu tarayıcı profilinde tutulur. Aynı anda birden fazla sekmede yapılan değişiklikler henüz koordine edilmez; tek etkin sekme kullanın. Kaynak/ilerleme eşleme ve içerik sürümleri farklı kavramlardır; uyumsuz kayıtlar sessizce silinmez.

Ayrıntılar: `Implement.md`, `docs/content-notes.md`.
