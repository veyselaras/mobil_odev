import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SayacEkrani() {
  // --- 1. AYARLAR (STATE) ---
  const [saniye, setSaniye] = useState(25 * 60); // 25 dakika (saniye cinsinden)
  const [aktifMi, setAktifMi] = useState(false); // Sayaç çalışıyor mu?
  const [kategori, setKategori] = useState("Ders Çalışma"); // Seçili kategori

  // Kategoriler Listesi
  const kategoriler = ["Ders Çalışma", "Kodlama", "Kitap Okuma", "Proje"];

  // --- 2. SAYAÇ MANTIĞI ---
  useEffect(() => {
    let interval: any = null;

    if (aktifMi) {
      // Eğer sayaç aktifse her 1 saniyede bir azalt
      interval = setInterval(() => {
        setSaniye((oncekiSaniye) => {
          if (oncekiSaniye <= 0) {
            clearInterval(interval);
            setAktifMi(false);
            Alert.alert("Süre Doldu!", "Tebrikler, odaklanma seansını tamamladın.");
            return 0;
          }
          return oncekiSaniye - 1;
        });
      }, 1000);
    } else {
      // Aktif değilse durdur
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [aktifMi]);

  // --- 3. YARDIMCI FONKSİYONLAR ---
  
  // Saniyeyi "25:00" formatına çeviren fonksiyon
  const sureyiFormatla = (toplamSaniye: number) => {
    const dk = Math.floor(toplamSaniye / 60);
    const sn = toplamSaniye % 60;
    return `${dk < 10 ? '0' + dk : dk}:${sn < 10 ? '0' + sn : sn}`;
  };

  const sayaciSifirla = () => {
    setAktifMi(false);
    setSaniye(25 * 60); // Tekrar 25 dakikaya döndür
  };

  // --- 4. GÖRÜNTÜ (TASARIM) ---
  return (
    <View style={styles.container}>
      <Text style={styles.baslik}>Odaklanma Takibi</Text>

      {/* Kategori Seçimi */}
      <View style={styles.kategoriKutusu}>
        <Text style={styles.altBaslik}>Kategori Seç:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {kategoriler.map((kat) => (
            <TouchableOpacity 
              key={kat} 
              style={[styles.kategoriBtn, kategori === kat && styles.seciliKategoriBtn]}
              onPress={() => setKategori(kat)}
            >
              <Text style={[styles.kategoriYazi, kategori === kat && styles.seciliKategoriYazi]}>
                {kat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Büyük Sayaç */}
      <View style={styles.sayacDaire}>
        <Text style={styles.sayacYazi}>{sureyiFormatla(saniye)}</Text>
        <Text style={styles.durumYazi}>{aktifMi ? "Odaklanılıyor..." : "Hazır"}</Text>
      </View>

      {/* Butonlar */}
      <View style={styles.butonKutusu}>
        <TouchableOpacity 
          style={[styles.btn, aktifMi ? styles.durdurBtn : styles.baslatBtn]} 
          onPress={() => setAktifMi(!aktifMi)}
        >
          <Text style={styles.btnYazi}>{aktifMi ? "DURAKLAT" : "BAŞLAT"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.sifirlaBtn]} onPress={sayaciSifirla}>
          <Text style={styles.btnYazi}>SIFIRLA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- 5. STİL DOSYASI (CSS GİBİ) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 50,
  },
  baslik: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  altBaslik: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  kategoriKutusu: {
    height: 60,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  kategoriBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
  },
  seciliKategoriBtn: {
    backgroundColor: 'tomato', // Seçilince renk değişsin
  },
  kategoriYazi: {
    color: '#333',
  },
  seciliKategoriYazi: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sayacDaire: {
    width: 250,
    height: 250,
    borderRadius: 125, // Tam daire yapmak için genişliğin yarısı
    borderWidth: 5,
    borderColor: 'tomato',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#fff5f5',
  },
  sayacYazi: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#333',
  },
  durumYazi: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  butonKutusu: {
    flexDirection: 'row',
    gap: 20,
  },
  btn: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  baslatBtn: {
    backgroundColor: '#28a745', // Yeşil
  },
  durdurBtn: {
    backgroundColor: '#dc3545', // Kırmızı
  },
  sifirlaBtn: {
    backgroundColor: '#6c757d', // Gri
  },
  btnYazi: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});