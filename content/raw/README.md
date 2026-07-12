# Ham İçerik Klasörü (`content/raw/`)

Bu klasör, siteye eklenecek içeriklerin **ham (işlenmemiş) metinlerini** tutar.
Amaç: uzun metinleri sohbete (Cursor chat) yapıştırmadan, doğrudan repoya
dosya olarak bırakmak. Böylece yapay zeka token'ları hızlı tükenmez — agent
metni **dosyadan okur**, siz yapıştırmazsınız.

## Klasör yapısı

```
content/raw/
  README.md                      <- bu dosya
  _templates/                    <- kopyalanacak örnek şablonlar
    mindmap.template.md
    summary.template.md
    keywords.template.md
  courses/                       <- TÜM dersler, müfredat grubuna göre
    01-ortak-universite-zorunlu/
      _index.md                  <- gruptaki derslerin listesi
      military-sciences.md       <- ders sayfası (ad = contentSlug)
      ...
    02-universite-secmeli/
    03-fakulte-zorunlu/
    04-uzmanlik-zorunlu/
    05-din-usulu-uzmanlik-zorunlu/
    06-uzmanlik-secmeli/
    07-genel-zorunlu/
```

- Her dersin **tek bir sayfası** vardır: `courses/<grup>/<contentSlug>.md`
- Dosya adı = `src/data/courses.ts` içindeki dersin `contentSlug` değeri.
- Her sayfada üç bölüm hazır gelir: **Zihin Şeması**, **Ders / Kitap Özeti**,
  **Kelime Kartları**.

## Nasıl doldurulur

1. İlgili ders sayfasını aç: `content/raw/courses/<grup>/<contentSlug>.md`
2. Ham metni doğru başlığın **altına** yapıştır.
3. Her hafta için `## Hafta X` alt başlığı kullan (örnek aşağıda).
4. Format örnekleri için `_templates/` klasörüne bak.

```markdown
## Zihin Şeması

### Hafta 1
- الأسبوع 1 | 1. Hafta
  - ...

### Hafta 2
- ...
```

## İçeriği siteye çekmek (agent'a talimat)

Metni sohbete yapıştırma; agent'a **dosyayı okumasını** söyle:

> `content/raw/courses/05-din-usulu-uzmanlik-zorunlu/hukm-shari-dalalat.md`
> dosyasındaki "Zihin Şeması > Hafta 2" bölümünü oku ve JSON'a çevir.

## Token tasarrufu kuralları

- ✅ Ham metni **dosyaya** yaz, chat'e değil.
- ✅ Bir seferde **tek hafta + tek modül** işlet.
- ✅ Agent'a "şu dosyanın şu bölümünü oku" de; içeriği sen kopyalama.
- ❌ Tüm dönemin içeriğini tek sohbette üretme.
- ❌ Her küçük düzeltmede koca metni tekrar gönderme.

## Yeni ders eklenince

`courses.ts`'e ders eklendiğinde iskeleyi güncellemek için:

```bash
node scripts/scaffold-raw-content.mjs
```

Script idempotenttir: mevcut (içi dolu) sayfaların üzerine yazmaz, sadece
eksik ders sayfalarını ekler.

## Modül durumu

| Modül | Bölüm başlığı | Site tarafı |
|-------|----------------|-------------|
| Zihin şeması | `## Zihin Şeması` | Hazır (`content/mindmaps/*.json`) |
| Ders/kitap özeti | `## Ders / Kitap Özeti` | İleride eklenecek |
| Kelime kartları | `## Kelime Kartları` | İleride eklenecek |

> Özet ve kelime kartlarının ham metinlerini şimdiden biriktirebilirsiniz;
> site tarafı hazır olduğunda aynı sayfalardan dönüştürülür.
