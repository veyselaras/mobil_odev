import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { veriyiKaydet } from '../utils/storage';

export default function SayacEkrani() {
  const [hedefSure, setHedefSure] = useState(25 * 60); 
  const [saniye, setSaniye] = useState(25 * 60); 
  const [aktifMi, setAktifMi] = useState(false); 
  const [kategori, setKategori] = useState("Ders Çalışma"); 
  const [dagilmaSayisi, setDagilmaSayisi] = useState(0);

  const appState = useRef(AppState.currentState);
  const kategoriler = ["Ders Çalışma", "Kodlama", "Kitap Okuma", "Proje"];
  const sureSecenekleri = [0.1, 25, 45, 60];

  // --- SAYAÇ MANTIĞI ---
  useEffect(() => {
    let interval: any = null;
    if (aktifMi) {
      interval = setInterval(() => {
        setSaniye((mevcut) => mevcut - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [aktifMi]);

  // --- BİTİŞ KONTROLÜ (DÜZELTİLEN KISIM) ---
  useEffect(() => {
    if (saniye === 0 && aktifMi) {
      setAktifMi(false);
      setSaniye(hedefSure); // Başa sar

      // --- 1. VERİLERİ KAYDET ---
      const yeniKayit = {
        id: Date.now().toString(),
        tarih: new Date().toLocaleDateString(),
        suredk: hedefSure / 60,
        kategori: kategori,
        dagilma: dagilmaSayisi // O anki dağılma sayısını kaydet
      };

      veriyiKaydet(yeniKayit); 
      
      // --- 2. DAĞILMA SAYISINI SIFIRLA (BUG ÇÖZÜMÜ) ---
      setDagilmaSayisi(0); // <--- İşte eksik olan kod burasıydı!
      // ------------------------------------------------

      if (Platform.OS === 'web') {
        window.alert("TEBRİKLER! Seans kaydedildi.");
      } else {
        Alert.alert(
          "Harika Gidiyorsun! 👏",
          "Seans başarıyla kaydedildi. 5 dakika ara verebilirsin.",
          [{ text: "Tamam, Devam Et" }]
        );
      }
    }
  }, [saniye, aktifMi, hedefSure]); 

  // --- DİKKAT DAĞINIKLIĞI ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/active/) && (nextAppState === 'background' || nextAppState === 'inactive')) {
        if (aktifMi) {
          setAktifMi(false);
          setDagilmaSayisi(prev => prev + 1);
          Alert.alert("Dikkat Dağıldı!", "Uygulamadan çıktığınız için sayaç durduruldu.");
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [aktifMi]);

  // --- YARDIMCI FONKSİYONLAR ---
  const sureyiDegistir = (dakika: number) => {
    if (aktifMi) {
      Alert.alert("Hata", "Sayaç çalışırken süreyi değiştiremezsin.");
      return;
    }
    const yeniSaniye = dakika * 60;
    setHedefSure(yeniSaniye); 
    setSaniye(yeniSaniye);    
    setDagilmaSayisi(0);      
  };

  const sureyiFormatla = (toplamSaniye: number) => {
    const dk = Math.floor(toplamSaniye / 60);
    const sn = toplamSaniye % 60;
    return `${dk < 10 ? '0' + dk : dk}:${sn < 10 ? '0' + sn : sn}`;
  };

  const sayaciSifirla = () => {
    setAktifMi(false);
    setSaniye(hedefSure); 
    setDagilmaSayisi(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.baslik}>Odaklanma Takibi</Text>

      {/* Kategori Seçimi */}
      <View style={styles.secimSatiri}>
        <Text style={styles.altBaslik}>Kategori:</Text>
        <View style={{ height: 50 }}> 
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          >
            {kategoriler.map((kat) => (
              <TouchableOpacity 
                key={kat} 
                style={[styles.miniBtn, kategori === kat && styles.seciliMiniBtn]}
                onPress={() => setKategori(kat)}
              >
                <Text style={[styles.miniBtnYazi, kategori === kat && styles.seciliMiniBtnYazi]}>
                  {kat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Süre Seçimi */}
      <View style={styles.secimSatiri}>
        <Text style={styles.altBaslik}>Süre (dk):</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}> 
          {sureSecenekleri.map((dk) => (
            <TouchableOpacity 
              key={dk} 
              style={[styles.miniBtn, hedefSure === dk * 60 && styles.seciliMiniBtn]}
              onPress={() => sureyiDegistir(dk)}
            >
              <Text style={[styles.miniBtnYazi, hedefSure === dk * 60 && styles.seciliMiniBtnYazi]}>
                {dk}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Büyük Sayaç */}
      <View style={styles.sayacDaire}>
        <Text style={styles.sayacYazi}>{sureyiFormatla(saniye)}</Text>
        <Text style={styles.durumYazi}>{aktifMi ? "Odaklanılıyor..." : "Hazır"}</Text>
      </View>

      {/* İstatistik */}
      <View style={{ marginBottom: 20 }}>
         <Text style={{ fontSize: 16, color: '#dc3545', fontWeight: 'bold' }}>
            Dikkat Dağılma Sayısı: {dagilmaSayisi}
         </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingTop: 60,
  },
  baslik: {
    fontSize: 28, fontWeight: 'bold', marginBottom: 30, color: '#333',
  },
  secimSatiri: {
    width: '100%', marginBottom: 20,
  },
  altBaslik: {
    fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '600', textAlign: 'center',
  },
  miniBtn: {
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f5f5f5', borderRadius: 20, marginHorizontal: 5, borderWidth: 1, borderColor: '#e0e0e0', minWidth: 50, alignItems: 'center',
  },
  seciliMiniBtn: {
    backgroundColor: 'tomato', borderColor: 'tomato'
  },
  miniBtnYazi: {
    color: '#555', fontSize: 14, fontWeight: '500'
  },
  seciliMiniBtnYazi: {
    color: '#fff', fontWeight: 'bold',
  },
  sayacDaire: {
    width: 240, height: 240, borderRadius: 120, borderWidth: 4, borderColor: 'tomato', justifyContent: 'center', alignItems: 'center', marginBottom: 25, backgroundColor: '#fffafa', marginTop: 10
  },
  sayacYazi: {
    fontSize: 56, fontWeight: 'bold', color: '#333', fontVariant: ['tabular-nums'], 
  },
  durumYazi: {
    fontSize: 16, color: '#888', marginTop: 5,
  },
  butonKutusu: {
    flexDirection: 'row', gap: 20,
  },
  btn: {
    paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, minWidth: 130, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  baslatBtn: { backgroundColor: '#28a745' },
  durdurBtn: { backgroundColor: '#dc3545' },
  sifirlaBtn: { backgroundColor: '#6c757d' },
  btnYazi: {
    color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1,
  }
});