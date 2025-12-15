# 🎯 Odaklanma Takip Uygulaması (Focus Tracker)

Bu proje, React Native ve Expo kullanılarak geliştirilmiş, kullanıcıların odaklanma sürelerini yönetmelerine, istatistik tutmalarına ve dikkat dağınıklıklarını takip etmelerine yardımcı olan bir mobil uygulamadır.

## 📱 Özellikler

### 1. Zamanlayıcı ve Odaklanma (Ana Ekran)
* **Esnek Süre Ayarı:** Slider (Kaydırma çubuğu) ile 1 dakikadan 120 dakikaya kadar hassas süre ayarı.
* **Kategori Yönetimi:** "Ders Çalışma", "Kodlama", "Kitap Okuma" gibi kategoriler seçebilme.
* **Görsel Sayaç:** Daire şeklinde ilerleyen, kalan süreyi ve durumu gösteren sayaç.
* **Ses ve Titreşim:** Süre bittiğinde kullanıcıyı uyaran sesli bildirim ve titreşim desteği.
* **Ekran Uyanık Kalma:** Sayaç çalışırken ekranın kapanmasını engelleyen `KeepAwake` entegrasyonu.

### 2. Dikkat Dağınıklığı Takibi (App State)
* Kullanıcı sayaç çalışırken uygulamadan çıkarsa (arka plana atarsa), uygulama bunu **"Dikkat Dağınıklığı"** olarak algılar.
* Her çıkış yapıldığında sayaç otomatik durur ve kullanıcıya uyarı verir.
* Seans sonunda toplam kaç kez dikkatin dağıldığı raporlanır.

### 3. Veri Kaydı ve Raporlar (İstatistik Ekranı)
* **Kalıcı Hafıza:** Tüm veriler `AsyncStorage` kullanılarak telefon hafızasına kaydedilir. Uygulama kapatılsa bile veriler silinmez.
* **Filtreleme:** Veriler "Bugün", "Bu Hafta" ve "Bu Ay" olarak filtrelenebilir.
* **Grafikler:**
    * **Pasta Grafik:** Odaklanma sürelerinin kategorilere göre dağılımı.
    * **Çubuk Grafik:** Son seansların süre bazlı karşılaştırması.
* **Günlük Hedef Sistemi:** Kullanıcı kendine günlük bir hedef (örn: 120 dk) belirleyebilir. İlerleme çubuğu ile hedefe ne kadar kaldığını takip edebilir.

## 🛠️ Kullanılan Teknolojiler ve Kütüphaneler

* **React Native & Expo:** Proje altyapısı.
* **TypeScript:** Tip güvenliği ve hatasız kodlama için.
* **AsyncStorage:** Verilerin kalıcı olarak saklanması için.
* **React Native Chart Kit:** İstatistiksel grafikler için.
* **Expo AV & Vibration:** Ses ve titreşim geri bildirimleri için.
* **Expo Keep Awake:** Odaklanma sırasında ekranın açık kalması için.
* **React Native Community Slider:** Süre seçimi için.

## 🚀 Kurulum ve Çalıştırma

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

1.  **Projeyi İndirin:**
    ```bash
    git clone <repo-url>
    cd <proje-adi>
    ```

2.  **Paketleri Yükleyin:**
    ```bash
    npm install
    ```

3.  **Uygulamayı Başlatın:**
    ```bash
    npx expo start -c
    ```

4.  **Test Edin:**
    Expo Go uygulamasını telefonunuza indirin ve terminalde çıkan QR kodu okutun.

## 📷 Ekran Görüntüleri

| Sayaç Ekranı | Raporlar Ekranı |
| :---: | :---: |
| *(Buraya uygulamanın ekran görüntüsünü ekleyebilirsiniz)* | *(Buraya raporlar ekran görüntüsünü ekleyebilirsiniz)* |

---
**Geliştirici:** [Adın Soyadın]
**Ders:** Mobil Programlama
