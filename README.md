# İlim Kapısı

Üniversite İslami ilimler dersleri için modern çalışma portalı. Next.js 15, TypeScript ve Tailwind CSS ile geliştirilmektedir.

## Kurulum

```bash
cd ilim-kapisi
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Proje yapısı

```
ilim-kapisi/
├── content/          # JSON içerik dosyaları
├── src/
│   ├── app/          # Next.js App Router sayfaları
│   ├── components/   # UI ve layout bileşenleri
│   └── lib/          # Tipler ve yardımcı fonksiyonlar
```

## Renk paleti

- Primary: `#064e3b`
- Accent: `#fcd34d`

## Faz durumu

- [x] Faz 1: İskelet (layout, ana sayfa, kategori kartları)
- [ ] Faz 2: Routing ve veri katmanı
- [ ] Faz 3: İçerik migrasyonu
- [ ] Faz 4: Kelime antrenörü
- [ ] Faz 5: Akıllı okuyucu
- [ ] Faz 6: Deploy
