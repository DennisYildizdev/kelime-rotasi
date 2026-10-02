# Kelime Rotası — AI Proje Devir Notu

## Ana proje klasörü

```text
C:\Users\PC\Oxford-Focus
```

Diğer AI aracında çalışma alanı olarak bu klasörü aç. Başka bilgisayara taşındığında aşağıdaki mutlak yolları yeni proje konumuna göre güncelle.

## Önce okunacak dosyalar

```text
C:\Users\PC\Oxford-Focus\README.md
C:\Users\PC\Oxford-Focus\Implement.md
C:\Users\PC\Oxford-Focus\package.json
C:\Users\PC\Oxford-Focus\docs\content-notes.md
```

## Kod ve veriler

Aşağıdaki yollar ana proje klasörüne göredir.

| Yol | İçerik |
|---|---|
| `src\` | Uygulama, öğrenme motoru, ses ve depolama |
| `index.html` | Ana sayfa |
| `styles.css` | Görsel tasarım |
| `sw.js` | Çevrimdışı/PWA service worker |
| `data\` | Kaynak kelime listesi, A1 ders kartları ve IPA verileri |
| `tests\` | Birim ve tarayıcı testleri |
| `scripts\` | Veri doğrulama ve build araçları |
| `content-work\` | İçerik yazım kuralları, gruplar, kaynaklar ve inceleme notları |
| `content-work\AUTHORING.md` | İçerik yazım sözleşmesi |
| `content-work\batches\` | A1 içerik grupları |
| `content-work\reviews\` | İçerik üretim/inceleme notları |
| `docs\content-notes.md` | İçerik ve telaffuz sınırları |
| `licenses\` | Üçüncü taraf lisansları |
| `THIRD-PARTY-NOTICES.md` | Kaynak atıfları ve lisans bildirimleri |
| `dist\` | Oluşturulmuş yayın dosyaları |

## Son doğrulanan teslim durumu

Bu bölüm önceki geliştirme tesliminin kaydıdır; yeni AI mevcut dosyaları ve testleri yeniden doğrulamalıdır.

- Uygulama: Türkçe arayüzlü, ADHD dostu İngilizce kelime öğrenme web/PWA uygulaması.
- Kaynak envanteri: 3000 kayıt — A1 900, A2 800, B1 700, B2 600.
- A1: 900 kart derslerde kullanılabilir.
- A2/B1/B2: zenginleştirilmiş ders içerikleri henüz hazırlanmadı.
- A1 kartları: Türkçe anlam, İngilizce örnek, Türkçe örnek çevirisi, en-US IPA ve Türkçe yaklaşık okunuş.
- 825 kartta ayrıca kaynaklı en-GB IPA var; eksik UK verisi US verisiyle doldurulmuyor.
- en-US seslendirme tarayıcı/cihaz sesleriyle çalışıyor. Sesin çevrimdışı kullanılabilirliği cihaza bağlı.
- İçerikler AI destekli taslak; bağımsız insan editoryal onayı yapılmadı.
- Son teslimde 40 JavaScript testi, 11 Python testi ve 4500 alıştırma kontrolü geçti.
- Ders, devam etme, çevrimdışı kullanım ve PWA güncelleme testleri geçti.
- Dış yayın yapılmadı.

## Korunacak gereksinimler

- Mevcut görsel tasarımı koru.
- IPA, açıkça etiketlenmiş Türkçe yaklaşık okunuş ve en-US seslendirmeyi koru.
- Kelime öğrenme odağını ve düşük bilişsel yüklü mikro ders yaklaşımını koru.
- Kaynak kelime kimliklerini ve kullanıcı ilerlemesini bozma.
- `kr-state-v2` ve eski `kr-progress` verilerini sessizce silme.
- Taslak içeriği insan tarafından onaylanmış olarak sunma.
- Lisans ve kaynak atıflarını yayın paketinden çıkarma.
- Yeni görev verilmeden kapsamı kendiliğinden genişletme veya dış yayın yapma.

## Başka bilgisayara taşıma

Ana proje klasörünü aktar:

```text
C:\Users\PC\Oxford-Focus
```

`node_modules` klasörünü taşımak zorunlu değildir. Hedef bilgisayarda proje klasöründe bağımlılıkları yeniden kur:

```bash
npm ci
```

Gerekli çalışma ortamı ve tarayıcı kurulumu için `README.md` dosyasını oku. Öğrenme ilerlemesi tarayıcı profilinde tutulur; proje klasörünü kopyalamak ilerlemeyi otomatik taşımaz. İlerlemeyi taşımak için uygulamanın dışa/içe aktarma özelliğini kullan.

## Yayın paketi

```text
C:\Users\PC\Oxford-Focus\Kelime-Rotasi-web.zip
```

Bu ZIP geliştirme projesinin tamamı değildir. Yalnızca yayın varlıklarını içerir; testler, içerik çalışma dosyaları ve geliştirme araçları pakette bulunmaz. Geliştirmeye devam edecek AI'ye yalnızca bu ZIP'i değil, ana proje klasörünü ver.

## Diğer AI'ye verilecek başlangıç mesajı

```text
Proje: C:\Users\PC\Oxford-Focus
Uygulama adı: Kelime Rotası

Önce AI-DEVIR.md, README.md, Implement.md, package.json ve
 docs/content-notes.md dosyalarını oku.

Türkçe arayüzlü, ADHD dostu İngilizce kelime öğrenme web/PWA uygulaması.
Mevcut görsel tasarımı koru. IPA, Türkçe yaklaşık okunuş ve en-US
seslendirme desteğini bozma. Kaynak kelime kimliklerini ve kullanıcı
ilerlemesini koru.

Son doğrulanan durum: 3000 kaynak kayıt; A1'in 900 kartı derslerde
kullanılabilir. A2/B1/B2 zenginleştirilmiş ders içerikleri henüz yok.
A1 içerikleri AI destekli taslak; insan editoryal onayı yapılmadı.
Dış yayın yapılmadı.

İçerik geliştirme bağlamı content-work klasöründe.
Önce mevcut dosyaları ve test sonuçlarını doğrula; ardından vereceğim
yeni görev doğrultusunda ilerle.
```
