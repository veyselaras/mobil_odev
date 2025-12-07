import AsyncStorage from '@react-native-async-storage/async-storage';

// Kaydedilecek Verinin Tipi (Şablonu)
export interface OdakVerisi {
  id: string;
  tarih: string;     // Örn: "2023-12-05"
  suredk: number;    // Örn: 25
  kategori: string;  // Örn: "Ders Çalışma"
  dagilma: number;   // Örn: 2
}

// 1. VERİ KAYDETME FONKSİYONU
export const veriyiKaydet = async (yeniVeri: OdakVerisi) => {
  try {
    // Önce eski verileri çekelim
    const mevcutVeriler = await verileriGetir();
    
    // Yeni veriyi listenin en başına ekleyelim
    const guncelListe = [yeniVeri, ...mevcutVeriler];

    // Telefonun hafızasına JSON olarak kaydedelim
    await AsyncStorage.setItem('odak_gecmisi', JSON.stringify(guncelListe));
    console.log("Veri başarıyla kaydedildi!");
  } catch (error) {
    console.log("Kaydetme Hatası:", error);
  }
};

// 2. VERİLERİ OKUMA FONKSİYONU (Raporlar sayfası için lazım olacak)
export const verileriGetir = async (): Promise<OdakVerisi[]> => {
  try {
    const jsonVeri = await AsyncStorage.getItem('odak_gecmisi');
    return jsonVeri != null ? JSON.parse(jsonVeri) : [];
  } catch (error) {
    console.log("Okuma Hatası:", error);
    return [];
  }
};

// 3. TEMİZLEME FONKSİYONU (Test ederken işine yarar)
export const herseyiSil = async () => {
  try {
    await AsyncStorage.removeItem('odak_gecmisi');
  } catch (e) {
    // hata yok
  }
};