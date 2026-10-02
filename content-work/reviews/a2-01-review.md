# a2-01-review.md — batch a2-01 (100 kayıt)

Kapsam: yalnızca `content-work/batches/a2-01.json` yazıldı. Başka batch'e,
`data/`, `src/`, `tests/`, `scripts/` dosyalarına dokunulmadı. Doğrulama
betikleri Hermes scratch dizininde çalıştırıldı.

## Otomatik kontroller (Python, hepsi gerçekten çalıştırıldı)

| # | Kontrol | Sonuç |
|---|---------|-------|
| 1 | Dosya tam 100 kayıtlık JSON ARRAY | ✅ 100 |
| 2 | `sourceId` listesi girdiyle birebir aynı ve aynı sırada | ✅ 0 fark |
| 3 | `headword` girdiyle birebir aynı | ✅ 0 fark |
| 4 | 13 zorunlu alanın tamamı her kayıtta var | ✅ 0 eksik |
| 5 | `speechText == displayWord` | ✅ 100/100 |
| 6 | `ipaUS` kendi `ipaCandidates['en-US']` adayları arasında (virgülle bölünmüş varyantlar tam eşleşme) | ✅ 97 kayıt gerçek aday; 3 kayıt needsExternal (aşağıda) |
| 7 | `ipaUK` kendi `en-GB` adayı ya da boş + `unavailable` | ✅ 94 gerçek aday, 6 boş (en-GB adayı yok) |
| 8 | `example`, `displayWord`'ü kelime sınırlarıyla içeriyor (regex `(?<!\w)…(?!\w)`, büyük/küçük harf duyarsız) | ✅ 100/100 |
| 9 | Örnek cümlelerin batch içinde tekrarı | ✅ 0 tekrar |
| 10 | Örnek cümlelerin 900 A1 kartıyla tekrarı | ✅ 0 çakışma |
| 11 | Örnek cümlelerin mevcut diğer A2 batch'leriyle (a2-02, a2-04, a2-05, a2-07) tekrarı | ✅ 0 çakışma; `displayWord` çakışması da 0 |
| 12 | `topicTags` izinli listeden, 1–3 adet | ✅ 100/100 |
| 13 | `translationEvidence` = seçilen `dictionaryCandidates.entry` ya da gerçekten çekilmiş sözlük URL'i | ✅ 97 lexentry, 3 URL (aşağıda) |
| 14 | `ipaEvidenceUS` / `ipaEvidenceUK` biçimi | ✅ hepsi `ipa-dict/en_…:<lookupLemma>` veya `unavailable` |
| 15 | `ipaUS` boş olan kayıtlar **tam olarak** `needsExternal` boş olmayanlar | ✅ 3/3 birebir |
| 16 | `ipaUS` dolu olan her kayıtta `approxUS` dolu | ✅ 100/100 |
| 17 | Örnek cümle uzunluğu 4–10 kelime | ✅ hepsi aralıkta |
| 18 | `approxUS` ile `displayWord` birebir aynı (otomatik harf eşlemesi şüphesi) | ✅ 0 eşleşme |

Toplam hata: **0**.

Ek kontrol: `approxUS` hece sayısı ile seçilen IPA'daki ses grubu sayısı
karşılaştırıldı; 14 kayıtta fark var. Bunların 14'ü de İngilizcede tek
vowel grubu yazılan ama Türkçe okunuşta iki heceye ayrılan sesler
(`/ɝ/` → "ə-r", `/eɪ/` → "ey", `/ɪə/` → "i-ə", `/ɔː/` → "o"). Bu bir hata
değil, ama `approxUS` yazılırken bu sesler bilinçli olarak ayrıldı.

## needsExternal olan 3 kayıt — telaffuz uydurulmadı

Girdide `needsExternal: ["no-en-US-IPA-candidate"]` bulunan, telaffuz adayı
hiç olmayan kayıtlar:

- `according-to-65` (according to)
- `all-right-90` (all right)
- `any-more-242` (any more)

Bu üçünde `ipaUS`, `approxUS`, `ipaUK`, `approxUK` boş bırakıldı,
`ipaEvidenceUS` / `ipaEvidenceUK` = `"unavailable"` yazıldı ve `contentNote`
içinde `needsExternal` gerekçesi açıkça belirtildi. Harici sözlük kanıtını
parent sağlayacak. Diğer alanlar (çeviri, örnek, konu etiketi) eksiksiz yazıldı.

## Sözlük kanıtı düzeltilen 3 kayıt

Girdideki `dictionaryCandidates` ile öğretilmesi gereken anlam çeliştiği için
`translationEvidence` olarak gerçekten çekilmiş sözlük sayfası kullanıldı:

- **`act-101`** — girdi yalnızca *isim* anlamları veriyordu (perde, yasa),
  ama kaynak `act v. A2, n. B1` diyor. Fiil anlamı öğretildi.
  Kanıt: `https://www.oxfordlearnersdictionaries.com/definition/english/act`
- **`brilliant-310`** — girdi yalnızca *isim* anlamı veriyordu (pırlanta),
  ama kaynak `brilliant adj. A2` diyor. Sıfat anlamı öğretildi.
  Kanıt: `https://www.oxfordlearnersdictionaries.com/definition/english/brilliant`
- **`behaviour-273`** — girdideki aday kaydın `entry` değeri `None` (boş)
  olduğu için lexentry kanıtı kullanılamadı. Yerel sözlük veritabanında
  (`content-work/references/en-tr.sqlite3`) aynı kelimenin Amerikan
  yazımı `behavior` için "davranış | tutum" kaydı bulundu; tanım ayrıca
  Oxford Learners sayfasıyla doğrulandı.
  Kanıt: `https://www.oxfordlearnersdictionaries.com/definition/english/behaviour`

## Sözlük çevirisi hatalı olduğu için düzeltilen kartlar

- **`asleep-187`** — sözlük çevirisi "sevişmek". Aynı lexentry'nin anlamı
  `in a state of sleep`; doğru karşılık **uykuda** kullanıldı. Gerekçe
  `contentNote` içinde.
- **`ah-34`** — sözlük çevirisi "dair". Aynı lexentry `an expression`
  (bir ifade/ünlem) anlamını veriyor; kart **ah, vay** olarak öğretildi.
- **`appearance-43`** — sözlükteki tek anlam ("görünme, zuhur") daha seçici.
  A2 için öğretilebilir ve daha yaygın olan **dış görünüş** anlamı seçildi;
  aynı lexentry kanıt olarak gösterildi, sapma `contentNote`'ta belirtildi.
- **`anybody-238`** — sözlük anlamları ("biri", "bir") belirsiz zamir
  kullanımını karşılamıyor; A2'de soru/olumsuz cümledeki **bir kimse**
  anlamı öğretildi.
- **`billion-357`** — sözlükte hem "milyar" (1.000.000.000) hem "trilyon"
  (uzun ölçek) var. Amerikan varsayılanı **milyar** alındı, İngiliz ölçeği
  `contentNote`'ta uyarı olarak yazıldı.

## Otomatik kontrollerin ilk turunda bulunan ve düzeltilen hatalar

Doğrulama ilk çalıştırmada başarısız oldu; bulunanlar:

1. **2 kayıtta `ipaUS` uydurulmuştu** — `alone-102` ve `along-106` için
   `/əˈloʊn/`, `/əˈlɔŋ/` yazılmıştı; gerçek adaylar `/əˈɫoʊn/` ve
   `/əˈɫɔŋ/` (koyu l). Düzeltildi.
2. **5 kayıtta `ipaUK` uydurulmuştu** — `adventure-189`, `architecture-95`,
   `author-40`, `behaviour-273`, `belt-305` için gerçek adaylarda olmayan
   son heceler (`/ə/`, `/e/`) kullanılmıştı. Hepsi gerçek adaylarla
   değiştirildi (`/ɐ/`, `/ɛ/`).
3. **8 kayıtta örnek cümlede hedef sözcük çekimliydi** (affects, appeared,
   behaves, belongs, beans, biscuits, burns, background). Sözleşme
   "sadece çekim olmasın" dediği için cümleler hedef sözcüğün **temel
   biçimini** içleyecek şekilde yeniden yazıldı.
4. **2 örnek 11 kelimeydi** (`assistant-211`, `blank-405`) — 10 kelime sınırına
   çekildi.
5. `approxUS`/`approxUK` alanlarında tutarsız kanıt değeri
   (`"needs-external"` yerine sözleşmedeki `"unavailable"`) düzeltildi.

## Elle yapılan gözden geçirme

100 kaydın tamamı ekrana dökülüp tek tek okundu. Bu turda düzeltilenler:

- 17 kartta `translation` eşanlamlı sözlük dökümü gibiydi (ör. "pano, tahta",
  "dip, alt kısım", "kaynatmak, haşlamak"); sözleşmenin "tek anlam" kuralına
  göre tek anlama indirildi.
- `background-88`: anlam "geçmiş" olarak netleştirildi, `topicTags`
  `work` → `people` yapıldı (geçmiş, kişiye ilişkin).
- `awful-76`: seçilen IPA `/ˈɔfəɫ/` ile `approxUS` "OF-əl" uyuşmuyordu
  (/ɔ/ ≈ "o"); "OL-fəl" yapıldı.
- `appear-39`: örnek cümlenin anlamıyla `selectedSense` uyumsuzdu;
  ikisi de "görünmek / ortaya çıkmak" ekseninde hizalandı.
- `bean-204`: çekimli "beans" ile geçen cümle, "bu fasulye çorbası lezzetli"
  gibi Türkçeye tuhaf çevrilen bir cümleydi; "fasulyeli sandviç" cümlesine
  çevrildi.

## Çözülmeyen sorunlar / parent'a bırakılan işler

1. **3 kayıtta telaffuz eksik.** `according-to-65`, `all-right-90`,
   `any-more-242` için harici kanıt parent tarafından sağlanmalı. Seslendirme
   bu üç kartta boş kalacak.
2. **3 kayıtta URL kanıtı.** `act-101`, `behaviour-273`, `brilliant-310`
   `translationEvidence` alanında URL taşıyor (sözleşme bunu açıkça izin
   veriyor). Parent bu üçünün lexentry kanıtını isterse üretilmiş bir
   lexentry **yok** — yalnızca gerçekten açılmış sözlük sayfası var.
3. **approxUS/approxUK yaklaşıktır.** Bunlar fonetik otorite değildir;
   sözleşmenin kendi ifadesiyle yaklaşık okunuş ipucudur. Konuşmacı
   kaydıyla doğrulanmamıştır.
4. **Çeviri seçimi editoryal inceleme gerektirir.** Aynı kelimenin sözlükte
   birden fazla A2 anlamı olan kartlarda (ör. `appearance`, `background`,
   `affect`, `accept`) seçim gerekçesi `contentNote`'ta yazılı ama bu seçimler
   insan gözüyle onaylanmadı.
5. **Bu içerik taslaktır.** İnsan onayı, konuşmacı kaydı veya telaffuz
   puanlaması değildir. Burada yalnızca yukarıdaki otomatik kontroller ve
   elle gözden geçirme yapıldı.
