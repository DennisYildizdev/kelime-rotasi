# A2/B1/B2 içerik yazım sözleşmesi

Bu sözleşme `AUTHORING.md` (A1) ile aynı kuralları A2/B1/B2 için tekrarlar.
Önce `AUTHORING.md` ve `docs/content-notes.md` dosyalarını oku.

## Çalışma alanın

Tek dosya: `content-work/batches/<batch>.json` (örn. `a2-01.json`).
Girdi: `content-work/inputs/<batch>.json` — 100 kayıt, kanıt adaylarıyla birlikte.

**Sadece kendi batch dosyana yaz.** Başka batch'e, `data/` klasörüne,
`src/`, `tests/`, `scripts/` veya `scripts/a1_content.py` dosyasına dokunma.
Kaynak kimliklerini, başlıkları veya seviyeleri değiştirme.

## Çıktı biçimi

Tam olarak 100 kayıtlık JSON ARRAY. Her kayıt şu alanlara sahip olmalı:

Zorunlu:
- `sourceId` — girdideki `sourceId` ile **birebir aynı**
- `headword` — girdideki `headword` ile **birebir aynı** (parantezli
  homograf yazımı korunur: `bear (animal)`)
- `displayWord` — öğretilecek normal biçim. Parantezli homograflarda yalnızca
  kelimeyi yaz (`bear (animal)` → `bear`), `mine (belongs to me)` → `mine`.
  Çok kelimeli ifadelerde tam ifadeyi koru (`per cent`, `used to`).
- `speechText` — `displayWord` ile aynı olmalı (seslendirilecek metin)
- `translation` — **tek** bir ilgili anlam ve takım (POS) için kısa, modern
  Türkçe. Eş anlamlı sözlük dökümü değil. `dictionaryCandidates` içindeki
  `translations` ve `sense` alanlarını oku; ilk sonucu körlemesine seçme.
  Aynı kelimenin farklı kayıtları (homograflar) farklı anlamı öğretir.
- `example` — özgün, doğal, basit İngilizce cümle. `displayWord` cümlede
  **kelime sınırıyla tam olarak** geçmeli. Sözlük alıntısı değil; sadece
  çekim değil. Genelde 4–10 kelime. Her kartın kendine özgün olması zorunlu —
  900 A1 kartının örneklerini ve diğer batch'leri tekrar etme.
- `exampleTr` — o cümlenin sadık, doğal Türkçe çevirisi
- `ipaUS` — `ipaCandidates["en-US"]` içinden **gerçek bir aday** seç,
  `/.../` biçiminde. Varyantlar `/a/, /b/` şeklinde ayrılır; **tek** olanı seç.
  Aday yoksa `ipaUS` boş bırakma — `needsExternal` alanına bak, o durumda
  parent harici kanıtı sağlar.
- `approxUS` — seçilen IPA'ya uyan, elle yazılmış **Türkçe okunuş** ipucu.
  Bu alan **Türkçe alfabeyle** yazılır; IPA sembolü veya İngilizce harf
  kombinasyonu içermez. Otomatik harf eşlemesesi yapma, her kelimeyi kendin
  yorumla. Tire isteğe bağlı.

  YAPILACAK (onaylı A1 standardı):
    always → `ool-veyz`, about → `ı-baut`, water → `voo-tır`,
    think → `thingk`, afternoon → `ef-tır-nuun`

  YAPILMAYACAK (bunlar reddedilir):
    ✗ `ə-Bİ-li-ti`   (IPA `ə`, `ɪ`; Türkçe I/İ değil)
    ✗ `EY-bəl`       (İngilizce `ey`, IPA `ə`)
    ✗ `AK-sə-dənt`   (IPA `ə`)
    ✗ `ad-VAN-tıdʒ`  (IPA `ʒ`)

  Ses ipuçları: /æ/ → Türkçe e ile a arası, /ə/ → kısa ı, /w/ → v değil u,
  /ŋ/ → ayrı g değil n, /θ/ ve /ð/ → dil ucu, /ʃ/ → ş, /ʒ/ → c,
  /tʃ/ → ç, /dʒ/ → c, /ɹ/ → Türkçe r'den farklı. Zor seslerde `contentNote` ile
  açıkla.
- `topicTags` — 1–3 etiket, şu listeden: `daily-life people family food home
  travel school work time numbers nature body clothes feelings actions
  descriptions communication function-words technology culture sport places money`
- `selectedSense` — hedeflenen anlamı belirten kısa İngilizce açıklama
- `translationEvidence` — seçtiğin `dictionaryCandidates` kaydının `entry`
  değeri (örn. `eng/achieve__Verb__1`)
- `ipaEvidenceUS` — `ipa-dict/en_US:<lookupLemma>`

İsteğe bağlı (verirsen kalite artar):
- `ipaUK` + `approxUK` + `ipaEvidenceUK` — `ipaCandidates["en-GB"]` doluysa
  doldur (`approxUK` de Türkçe harflerle yazılır), boşsa **üçünü de boş
  bırak** (`ipaEvidenceUK: "unavailable"`). en-GB yoksa en-US'tan kopyalama,
  uydurma.
- `contentNote` — kelimeye özgü öğrenme yardımı (zor ses, düzensiz çekim,
  ayırt edici anlam). Asla "insan tarafından incelendi" deme.
- `acceptedAnswers` — yazma alıştırmasında kabul edilecek ek biçimler

## Kesin kurallar

1. Kaynak `sourceId` / `headword` / seviye **değiştirilmez**. Girdideki
   `displayWordHint` sadece bir öneridir.
2. `needsExternal` listesi boş olmayan kayıtlarda eksik alanı uydurma —
   alanı boş bırak ve `contentNote` ile belirt; parent harici kanıtı
   tamamlar.
3. Aynı örnek cümle batch içinde **ve** diğer batch'lerde tekrar etmez.
4. Her içerik `draft` taslaktır; editoryal olarak incelenmiş sayılmaz.
5. Bu içerikler insan onayı, konuşmacı kaydı veya telaffuz puanlaması değildir.

## Bitirmeden önce

- Batch dosyanın tam olarak 100 kayıt olduğunu Python ile say.
- Her `sourceId`nin girdiyle birebir eşleştiğini doğrula.
- Her `ipaUS`in kendi `ipaCandidates["en-US"]` içinde gerçekten bulunduğunu doğrula.
- Her `example`in `displayWord`ü kelime sınırlarıyla içerdiğini doğrula.
- Örnek cümlelerin batch içinde tekrar etmediğini doğrula.
- `content-work/reviews/<batch>-review.md` dosyasına gerçekten yaptığın
  kontrolleri ve çözülmeyen sorunları yaz.

Raporun sonunda şunları belirt: dosya yolu, gerçek kayıt sayısı, çözülmeyen
sorunlar. "Hepsi insan tarafından doğrulandı" gibi bir iddia kurma.