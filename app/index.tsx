import { Audio } from 'expo-av'; // SES KÜTÜPHANESİ EKLENDİ
import { useKeepAwake } from 'expo-keep-awake';
import React, { useEffect, useRef, useState } from 'react';
import {
	Alert,
	AppState,
	Modal,
	ScrollView, StyleSheet, Text, TouchableOpacity,
	Vibration,
	View
} from 'react-native';
import { veriyiKaydet } from '../utils/storage';

export default function SayacEkrani() {
  useKeepAwake(); 

  const [hedefSure, setHedefSure] = useState(25 * 60); 
  const [saniye, setSaniye] = useState(25 * 60); 
  const [aktifMi, setAktifMi] = useState(false); 
  const [kategori, setKategori] = useState("Ders Çalışma"); 
  const [dagilmaSayisi, setDagilmaSayisi] = useState(0);
  const [modalAcik, setModalAcik] = useState(false);
  
  // SES NESNESİ (Referans olarak tutuyoruz)
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const appState = useRef(AppState.currentState);
  const kategoriler = ["Ders Çalışma", "Kodlama", "Kitap Okuma", "Proje"];
  const sureSecenekleri = [0.1, 25, 45, 60];

  // --- SES ÇALMA FONKSİYONU ---
  async function sesCal() {
    try {
      console.log('Ses yükleniyor...');
      // İnternetten basit bir bildirim sesi çekiyoruz
      const { sound } = await Audio.Sound.createAsync(
         { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' }
      );
      setSound(sound);

      console.log('Ses çalınıyor...');
      await sound.playAsync(); 
    } catch (error) {
      console.log("Ses çalma hatası:", error);
    }
  }

  // Ses nesnesini temizlemek için (Performans)
  useEffect(() => {
    return sound
      ? () => {
          console.log('Ses temizleniyor...');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

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

  // --- BİTİŞ KONTROLÜ ---
  useEffect(() => {
    if (saniye === 0 && aktifMi) {
      setAktifMi(false);
      
      // 1. Titreşim
      Vibration.vibrate(1000);
      
      // 2. SESİ ÇAL (YENİ)
      sesCal();

      // 3. Modalı Aç
      setModalAcik(true);
    }
  }, [saniye, aktifMi]); 

  const seansiBitirVeKaydet = () => {
    const yeniKayit = {
      id: Date.now().toString(),
      tarih: new Date().toLocaleDateString(),
      suredk: hedefSure / 60,
      kategori: kategori,
      dagilma: dagilmaSayisi
    };
    veriyiKaydet(yeniKayit);

    setModalAcik(false); 
    setSaniye(hedefSure); 
    setDagilmaSayisi(0);  
  };

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

      {/* MODAL PENCERESİ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalAcik}
        onRequestClose={() => seansiBitirVeKaydet()}
      >
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            <Text style={styles.modalBaslik}>🎉 Seans Tamamlandı!</Text>
            
            <View style={styles.ozetSatir}>
              <Text style={styles.ozetEtiket}>Kategori:</Text>
              <Text style={styles.ozetDeger}>{kategori}</Text>
            </View>

            <View style={styles.ozetSatir}>
              <Text style={styles.ozetEtiket}>Odaklanma Süresi:</Text>
              <Text style={styles.ozetDeger}>{hedefSure / 60} dk</Text>
            </View>

            <View style={styles.ozetSatir}>
              <Text style={styles.ozetEtiket}>Dikkat Dağılma:</Text>
              <Text style={[styles.ozetDeger, { color: dagilmaSayisi > 0 ? 'red' : 'green' }]}>
                {dagilmaSayisi} kere
              </Text>
            </View>

            <TouchableOpacity style={styles.modalButon} onPress={seansiBitirVeKaydet}>
              <Text style={styles.modalButonYazi}>Kaydet ve Bitir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  modalArkaPlan: {
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalKutu: {
    width: 300, backgroundColor: "white", borderRadius: 20, padding: 25, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5
  },
  modalBaslik: {
    fontSize: 22, fontWeight: "bold", marginBottom: 20, color: '#28a745'
  },
  ozetSatir: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5
  },
  ozetEtiket: {
    fontSize: 16, color: '#555', fontWeight: '600'
  },
  ozetDeger: {
    fontSize: 16, color: '#333', fontWeight: 'bold'
  },
  modalButon: {
    backgroundColor: "tomato", borderRadius: 10, padding: 12, elevation: 2, marginTop: 15, width: '100%', alignItems: 'center'
  },
  modalButonYazi: {
    color: "white", fontWeight: "bold", fontSize: 16
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