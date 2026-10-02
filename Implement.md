# Implement.md — Kelime Rotası

## Güncel uygulama durumu — 1 Ekim 2026

Mevcut renkler, tipografi, paneller ve gezinme korundu; yeni tercihler açılır panellere eklendi.

- Kaynak PDF uzlaştırıldı: **3.000 kayıt; A1 900, A2 800, B1 700, B2 600**. Eski ilerleme kimlikleri korunuyor; fark raporu `data/source-audit.json`.
- **900/900 A1 taslak ders kartı, 0 editoryal olarak incelenmiş kart**. Tüm A1 kaynak kimlikleri derslere bağlıdır; her kartta en-US IPA ve Türkçe yaklaşık okunuş, 825 kartta ayrıca kaynaklı en-GB IPA vardır. Dilbilimsel/editoryal insan incelemesi tamamlanmış değildir.
- EN-US varsayılan. Gerçek Chromium/Windows testinde **Microsoft David - English (United States)** normal ve yavaş oynatmada `completed` döndürdü. Bu, insan tarafından işitme veya telaffuz kalitesi değerlendirmesi değildir. Cihazda EN-GB sesi bulunmadı; başka aksana gizlice geçilmiyor.
- 1/5/10 görev, en fazla 5 yeni kelime, zamanı gelen tekrarlar, anlam/ters/yazma/dinleme/bağlam, ipucu, kişisel işaretler, EN/TR arama ve JSON yedeği çalışıyor.
- Seans ve ilerleme tek sürümlü kayıtta saklanıyor; yenileme, mola, bozuk/engelli depolama testleri geçti.
- Çevrimdışı ders yanıtı ve devam; bekleyen service-worker güncellemesi sonrası aynı seansı bitirme doğrulandı. Başka uygulamanın önbelleği silinmiyor.
- **40 JavaScript testi ve 11 Python testi geçti**. 900 kartta 4.500 alıştırma kontrolü, 1/5/10 ders E2E, article kartı, 320/390/768/1280px yerleşim ve klavye tercih testleri geçti. İlgili tarayıcı testlerinde hata yok; bağımlılık denetimi 0 açık.
- `npm run build` yalnız web varlıklarını `dist` klasörüne paketler. Dış yayın/alan adı/hesap işlemi yapılmadı.

**Açık kalanlar:** 900 A1 kartın bağımsız dilbilimsel/editoryal insan incelemesi, A2/B1/B2 zenginleştirmesi, onaylı HTTPS yayını ve P3 özellikleri. Aynı anda açık birden fazla sekmenin yazmaları henüz koordine edilmiyor. P0 içerik incelemesi ve P2 dış yayın kabulü bu nedenle tam kapanmış değildir. Aşağıdaki başlangıç tablosu tarihsel kayıttır; güncel kapsam bu bölüm ve işaretlenen kontrol listeleridir.

## 1. Ürün kararı

**ADHD dostu, telaffuz destekli İngilizce kelime öğrenme uygulaması.**

- Öncelik web: bağlantıyla erişilen, telefon ve bilgisayarda kullanılabilen bir ürün.
- PWA desteği korunacak; Android/iOS mağaza paketleri sonraki aşama, ilk sürüm şartı değil.
- Ana hedef kelimeyi tanımak, anlamını hatırlamak, yazmak ve sesini ayırt etmek. Gramer ayrı bir müfredat olmayacak; örnek cümleler bağlam sağlayacak.
- Arayüz ve açıklamalar Türkçe olacak.
- Oxford 3000 PDF'si kaynak liste; IPA, Türkçe anlam, yaklaşık okunuş, örnekler ve ses ayrı içerik katmanı olacak.
- Duolingo'dan kısa ders ve anlık geri bildirim ilkeleri alınabilir; marka, karakter ve arayüz birebir kopyalanmayacak.

Bu belge uygulama planıdır. Aşağıdaki açık görevler tamamlanmış özellik olarak sunulmamalıdır.

## 2. Başlangıç prototipi — tarihsel durum (uygulama öncesi)

Kod incelemesi: `src/app.js`, `src/learning-engine.js`. Kayıt sayıları önceki veri çıkarımı ve tarayıcı doğrulamasına dayanır; veri değiştiğinde yeniden ölçülecek.

| Alan | Mevcut durum | Eksik / yapılacak |
| --- | --- | --- |
| Kaynak liste | Önceki çıkarımda 2.996 kayıt; A1: 896, A2: 800, B1: 700, B2: 600 | PDF ile satır/sütun bazında uzlaştırma; eksiksizlik doğrulanmadı |
| Etkileşimli içerik | 47 eşleşen A1 kartı; anlam, IPA, örnek cümle | Diğer kelimelerin zenginleştirilmesi ve içerik incelemesi |
| Yaklaşık Türkçe okunuş | Kullanıcı tarafından format onaylandı | Veri alanı ve ekran gösterimi henüz yok |
| Alıştırma | İngilizce → Türkçe çoktan seçmeli | Ters yön, yazma, dinleme, boşluk doldurma |
| Mikro ders | 1 / 5 / 10 kelime seçimi | 10 soruluk derste en fazla 5 yeni kelime; kalanı tekrar |
| Tekrar | Yanıta göre `dueAt` ve doğru cevap serisi hesaplanıyor | Ders seçimi bu tarihleri kullanmıyor; gerçek tekrar kuyruğu gerekli |
| Kaydetme | Yanıtlanan kelimelerin ilerlemesi localStorage'a yazılıyor | Tam seans konumu saklanmıyor; kaldığı yerden devam eksik |
| Ses | Tarayıcı TTS; `en-GB` isteği | Ses bulunamama geri bildirimi, doğrulanmış aksan eşleştirmesi, isteğe bağlı ABD sesi |
| IPA | Kısmi sembol tablosu ve örnek kelime dinleme | Tam alfabe değil; açıklamalar dilbilimsel inceleme gerektiriyor |
| PWA | Manifest ve service worker mevcut | Çevrimdışı kullanım, güncelleme ve kurulum ayrı ayrı test edilmeli |
| Test | Önceki çalışmada 10 birim testi ve mobil temel akış geçti | Tam ders bitirme, devam, tekrar ve çevrimdışı kabul testleri |

Önemli: Kaynakta “a, an” bulunurken içerikteki `a` anahtarı gibi eşleşme sorunları vardır. Metin veya dizi sırasına bağlı kimliklere güvenilmemelidir. Mevcut dosyalar doğrulanmış bir sözlük veri seti olarak değerlendirilmemelidir.

## 3. Kelime kartının hedef biçimi

Kullanıcının onayladığı sunum örneği:

```text
always
Anlam: her zaman
IPA: /ˈɔːlweɪz/
Türkçe yaklaşık okunuş: ool-veyz
Tür: zarf · Seviye: A1

She always smiles.
O her zaman gülümser.

[Dinle] [Yavaş dinle]
```

### Gösterim kuralları

- “Türkçe yaklaşık okunuş” etiketi açıkça yazılacak; IPA'nın yerine geçmeyecek.
- `ool-veyz` biçimindeki tireler okuma desteğidir; kesin fonetik hece sınırı olarak sunulmayacak.
- Türkçede birebir karşılığı olmayan seslerde kısa açıklama bulunacak. Otomatik harf değiştirme tek başına yeterli içerik üretimi sayılmayacak.
- IPA ve yaklaşık okunuş ayrı ayrı gizlenebilecek; kullanıcı tercihleri saklanacak.
- İngiliz/Amerikan transkripsiyonları varsa ayrı etiketlenecek; gösterilen transkripsiyon ile ses seçimi tutarlı olacak.
- Test sorusunda cevabı açığa çıkaran anlam, çeviri veya örnek cümle cevap öncesinde gösterilmeyecek.
- Türkçe okunuş yardımcı ipucudur; tek başına ustalık veya doğru telaffuz kanıtı sayılmayacak.

## 4. Öğrenme döngüsü

1. Enerji modu seç veya kaydedilmiş derse devam et.
2. Önce zamanı gelen tekrarları, ardından uygun sayıda yeni kelimeyi seç.
3. Yeni kelimeyi kısa bir tanıtım kartında göster.
4. Bir ekranda tek soru sor; otomatik geri sayım başlatma.
5. Yanıttan sonra kısa geri bildirim, doğru anlam ve örnek sun.
6. Kelime ilerlemesi ile seans konumunu birlikte kaydet.
7. Kullanıcı devam edebilir, mola verebilir veya ceza olmadan çıkabilir.
8. Bitişte çalışılanları göster; tek doğru cevabı “kalıcı öğrenildi” olarak etiketleme.

### Enerji modları

| Mod | Hedef | Kural |
| --- | --- | --- |
| Mini başlangıç | 1 kelime / kısa görev | Tam bir çalışma olarak kaydedilir |
| Odak dersi | 5 görev | En fazla 5 yeni kelime |
| Meydan okuma | 10 görev | En fazla 5 yeni kelime; kalanlar tekrar veya farklı alıştırma |
| Enerjim düşük | Kolay tekrarlar | Yeni kelime zorunluluğu yok; sonraki aşama |

Süreler tahmin olarak gösterilebilir; süre bitince dersi kilitleme veya puan kesme olmayacak.

## 5. ADHD odaklı tasarım şartları

- Tek ekranda tek ana görev ve belirgin birincil buton.
- Varsayılan olarak can kaybı, seri kaybetme, lig baskısı ve zorunlu sayaç yok.
- Sakin görünüm ile hareket azaltma; ses bağımsız kapatılabilir.
- Başlangıca ulaşmak için uzun tanıtım ekranı veya çok sayıda karar gerektirme.
- Ders sırasında alt gezinme gizli; geri bildirim ve Devam et butonu örtülmez.
- Dokunma hedefleri en az 44px; görünür klavye odağı ve okunaklı kontrast.
- Sayfa yenileme veya sekmeyi kapatma sonrasında tam seans noktasından devam.
- Bildirimler ancak açık kullanıcı tercihiyle; suçlayıcı metin yok.
- ADHD destekleri kullanılabilirlik tercihidir; tedavi veya klinik etki iddiası yok.

## 6. Veri modeli ve içerik kalitesi

### Kaynak / içerik / kullanıcı verisini ayır

- `data/words.json`: PDF'den gelen kaynak kayıtları; ham metni koru.
- `data/enrichment.json`: önerilen yeni dosya; anlam, IPA, Türkçe okunuş, örnekler, inceleme durumu.
- `data/ipa.json`: önerilen yeni dosya; sembol açıklamaları ve örnekleri.
- Kullanıcı verisi: ilerleme, etkin seans ve tercihler; içerik dosyalarına yazılmaz.

### Hedef alanlar

```text
Word
  id                       sabit, yeniden çıkarımda değişmeyen kimlik
  headword                 kaynak başlık
  senses[]                 anlam / sözcük türü / seviyeyi ayrı tut
  source.page              kaynak sayfa
  source.raw               değiştirilmemiş kaynak metni

Enrichment
  wordId / senseId          kaynak kayda bağlantı
  translationTr            bağlama uygun anlam
  acceptedAnswers[]        yazma alıştırmasında geçerli karşılıklar
  pronunciation.uk.ipa
  pronunciation.uk.approxTr
  pronunciation.us.ipa     varsa
  pronunciation.us.approxTr varsa
  pronunciation.*.audio    varsa; sesin türü ve kaynağı ile
  example.en / example.tr
  topicTags[]
  provenance[]             kaynak, kapsam, kullanım koşulu notu
  reviewStatus             draft | reviewed | rejected
  contentVersion

WordProgress
  wordId / senseId
  attempts / correctCount / consecutiveCorrect
  dueAt / lastSeenAt / lastResult
  hintUsed / markedDifficult
  status                   new | learning | review

ActiveSession
  schemaVersion / contentVersion
  sessionId / mode / level
  questionIds / currentIndex
  selectedAnswer / answered
  score / completed / updatedAt
```

### Doğrulama kapısı

- Çok anlamlı kelimeleri yalnızca küçük harfe çevrilmiş başlığa göre birleştirme.
- Bir kayıtta farklı sözcük türleri farklı CEFR seviyeleri taşıyabilir; ilk seviyeyi tüm anlamlara uygulama.
- PDF'deki taşan satırları, numaralı eş yazımlıları, “a, an” gibi birleşik başlıkları ve dipnotları denetle.
- Eksik alanları olan kayıtlar aranabilir ama ilgili alıştırmaya alınmaz.
- Model tarafından üretilen içerik inceleme öncesi `draft` kalır.
- IPA, yaklaşık okunuş, anlam ve örnek cümle birlikte kontrol edilir.
- Kamuya açmadan önce içerik kaynakları ve marka kullanımı ayrıca incelenir; izin varsayılmaz.

## 7. Alıştırmaların uygulama sırası

1. **Kelime → anlam:** mevcut akışı sağlamlaştır; eş anlamlı çeldiricilerin birden fazla doğru cevap üretmesini engelle.
2. **Anlam → kelime:** çoktan seçmeli, ardından yazma; kabul edilen yanıt listesi kullan.
3. **Dinle → kelime:** tekrar dinleme ve yavaş ses; ses yoksa açıklamalı görsel alternatif.
4. **Eksik harf / yazım:** ipucu kullanılabilir; ipucuyla doğru cevap bağımsız hatırlamayla aynı değerlendirilmez.
5. **Cümlede boşluk:** gramer sınavı yerine hedef kelimeyi bağlamda tanıma.
6. **IPA / minimal çift:** isteğe bağlı ses farkı alıştırmaları.
7. **Yaklaşık okunuştan tanıma:** isteğe bağlı yardımcı mod; temel değerlendirme değil.

Mikrofon kaydı ve otomatik telaffuz puanlama sonraki araştırma aşamasıdır. TTS veya konuşma tanımayı telaffuz değerlendirmesi yapılmış gibi sunma.

## 8. Öncelikli uygulama planı

### P0 — Mevcut prototipi güvenilir hale getir

- [x] PDF çıkarımını satır/sütun ve kayıt bazında uzlaştır; fark raporu üret.
- [x] Kaynak kayıtlar için sabit kimlik ve mevcut ilerlemeyi koruyan geçiş eşlemesi oluştur.
- [x] `ENRICHED` verisini uygulama kodundan ayır; içerik doğrulayıcısı ekle.
- [ ] İlk etkileşimli kartlara gözden geçirilmiş `approxTr` alanı ekle; `always → ool-veyz` kabul örneğini uygula.
- [x] IPA ve yaklaşık okunuş görünürlük ayarlarını kaydet.
- [x] `dueAt` değerlerini gerçek tekrar kuyruğuna bağla; zamanı gelmeyen kolay kelimeleri gereksiz tekrar ettirme.
- [x] Ders sırası, cevap durumu ve puanı kaydet; Devam et / Yeni ders ayrımını oluştur.
- [x] Bozuk veya erişilemeyen localStorage durumunda uygulamayı çökertme; kullanıcıya kaydetme durumunu göster.
- [x] TTS desteklenmiyor, ses yüklenemiyor ve aksan bulunamıyor durumlarını görünür yap.
- [x] “Tamamlandı”, “çalışıldı” ve “öğrenildi” ifadelerini gerçek ölçümlerle eşleştir.

**P0 kabulü:** Mini ve odak dersleri baştan sona tamamlanır; tekrar seçimi tarihi kullanır; kapatıp açınca aynı soruya dönülür; Türkçe yaklaşık okunuş çalışır.

### P1 — Kelime odaklı A1 sürümü

- [x] Uzlaştırılmış A1 envanterini aşamalı olarak anlam + IPA + yaklaşık okunuş + örneklerle tamamla.
- [x] İngilizce → Türkçe, Türkçe → İngilizce ve yazma alıştırmalarını tamamla.
- [x] Dinleme ve boşluk doldurma modlarını ekle.
- [x] Bilinen / öğrenilen / zor işaretleri ile konu filtrelerini ekle.
- [x] Aramada İngilizce ve Türkçe sorguları destekle; sonuç sayısını ve sayfalamayı açık göster.
- [x] İncelenmiş kart sayısını toplam kaynak sayısından ayrı göster.

**P1 kabulü:** Aktif A1 kartlarının zorunlu alanları doğrulanır; tamamlanmamış seviyeler hazır gibi sunulmaz; her aktif alıştırma türünün tam akışı test edilir.

### P2 — Paylaşılabilir web / PWA

- [ ] Kullanıcı onayıyla bir yayın hedefi seç; HTTPS üzerinden dağıt.
- [x] Service worker sürümleme ve güvenli güncelleme akışı oluştur; eski veri/yeni kod uyuşmazlığını ele al.
- [x] İlk yüklemeden sonra ağ kesildiğinde temel derslerin çalışmasını test et.
- [x] Çevrimdışı ses kullanılabilirliğini ayrıca belirt; tüm TTS seslerinin çevrimdışı olduğunu varsayma.
- [x] İçerik paketlerinin yükleme durumunu göster.
- [x] İlerlemeyi JSON olarak dışa/içe aktar; içe aktarmada şema ve içerik sürümünü doğrula.
- [x] Küçük telefon, tablet ve masaüstünde gerçek tarayıcı kontrolleri yap.
- [x] İlk kullanımda üyelik zorunluluğu koyma; bulut eşitleme sonraki aşama.

**P2 kabulü:** Paylaşılan adres doğrulanır; ders/ilerleme güncellemeden sonra korunur; çevrimdışı kapsam açık ve testlidir.

### P3 — Genişletme

- [ ] A2 → B1 → B2 içerik paketleri.
- [ ] İncelenmiş İngiliz/Amerikan telaffuz ayrımı.
- [ ] İsteğe bağlı hesap ve cihazlar arası eşitleme.
- [ ] Kullanıcı kontrollü tekrar hatırlatmaları.
- [ ] Enerjim düşük modu ve isteğe bağlı ödüller.
- [ ] Mikrofon kaydı; açık izin, silme seçeneği ve gizlilik tasarımı.
- [ ] Talep doğrulanırsa mobil mağaza paketleri; web sürümünü bekletmez.

## 9. Teknik uygulama sınırları

- İlk aşamada mevcut HTML/CSS/JavaScript yapısını koru; sırf yeniden yazmak için framework ekleme.
- `src/learning-engine.js`: DOM'dan bağımsız soru seçimi, değerlendirme ve tekrar kuralları.
- `src/app.js`: ekran ve olay bağlama; büyüdükçe ayrı görünüm modüllerine böl.
- Önerilen `src/storage.js`: sürümlü kayıt, hata toleransı ve geçişler.
- Önerilen `src/content.js`: kaynak ile zenginleştirme birleştirme ve uygun kart seçimi.
- `scripts/`: çıkarım, uzlaştırma ve içerik doğrulama araçları.
- `tests/`: birim, veri doğrulama ve tarayıcı akış testleri.
- Kullanıcı verisini silen geçiş veya yayımlama için ayrı onay al.
- API anahtarlarını ön yüz dosyalarına koyma. Uzak ses/AI servisi eklenirse veri aktarımını açıkla.

## 10. Test ve teslim kapısı

Her davranış değişikliğinde önce başarısız testi çalıştır, ardından uygulamayı yaz ve testi yeniden çalıştır.

### Birim / içerik testleri

- [x] Çok anlamlı kayıtlar ve PDF'de bölünen satırlar korunuyor.
- [x] Kayıt sayıları otomatik ölçülüyor; açıklanamayan fark raporlanıyor.
- [x] Tekrar kuyruğu saati test edilebilir biçimde alıyor ve zamanı gelenleri öne çıkarıyor.
- [x] Boş havuz, yetersiz seçenek, bozuk kayıt ve içerik sürümü değişimi yönetiliyor.
- [x] Yanıt normalleştirme Türkçe karakterleri keyfi biçimde silmiyor.
- [x] Aynı cevaba çift tıklama puanı veya tekrar aralığını iki kez artırmıyor.
- [x] Yardımcı okunuş eksikse boş veya uydurma metin yerine açık durum gösteriliyor.

### Tarayıcı kabul senaryoları

- [x] 1, 5 ve 10 görevlik dersler sonuç ekranına kadar tamamlanır.
- [x] Yanlış cevap, doğru cevap ve ipucu akışları denenir.
- [x] Ders ortasında çıkış + sayfa yenileme + devam: sıra ve puan korunur.
- [x] `always` kartında `ool-veyz` gösterilir; ayarla gizlenip yeniden açılır.
- [ ] IPA, yaklaşık okunuş ve ses kontrolleri klavyeyle kullanılabilir.
- [x] Ses yokken metin alıştırmaları devam eder.
- [x] Mobilde alt gezinme ders düğmelerini örtmez; yatay taşma yoktur.
- [x] Tekrar zamanı gelen kelime tekrar dersinde görünür.
- [x] Ağ kesilmesi ve uygulama güncellemesi kaydedilmiş ilerlemeyi bozmaz.
- [x] Konsol ve sayfa hataları testi başarısız kılar.

### Mevcut çalıştırma komutları

Proje dizininde:

```bash
npm install
npm run dev
```

Ayrı terminalde, yerel sunucu çalışırken:

```bash
npm test
npm run test:e2e
npm audit --audit-level=high
```

Güncel komutlar README ve package.json içinde. Bu geliştirme turunda birim/PDF/E2E/PWA/yerleşim/gerçek ses testleri, build ve bağımlılık denetimi çalıştırıldı. Doğrulama kapsamı belgenin başında açıklanmıştır.

## 11. İlk geliştirme dilimi

**İlk somut iş: mevcut A1 kartlarına Türkçe yaklaşık okunuş desteği.**

1. İçeriği `app.js` dışına taşı; mevcut eşleşme ve kayıt sayısını koruyan test yaz.
2. `approxTr` alanı, kaynak/inceleme durumu ve görünürlük tercihini ekle.
3. `always` için kullanıcı onaylı `ool-veyz` gösterimini uygula.
4. Diğer aktif kartları tek tek inceleyerek tamamla; eksik olanı hazır gösterme.
5. Ders ve kelime kütüphanesinde etiketi göster; ekranı kalabalıklaştırmadan gizlenebilir yap.
6. Mobil tarayıcı testinde görünürlük, kalıcılık ve yerleşimi doğrula.

**Bitti tanımı:** İstenen görünüm gerçek uygulamada çalışır, testler geçer, doğrulanmış içerik kapsamı açıkça raporlanır. Sadece bu planın yazılması uygulamanın tamamlandığı anlamına gelmez.
