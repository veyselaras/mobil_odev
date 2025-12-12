import Slider from '@react-native-community/slider'; // YENİ EKLENEN
import { Audio } from 'expo-av';
import { useKeepAwake } from 'expo-keep-awake';
import React, { useEffect, useRef, useState } from 'react';
import {
	AppState, Modal,
	ScrollView, StyleSheet, Text, TouchableOpacity,
	Vibration,
	View
} from 'react-native';
import { veriyiKaydet } from '../utils/storage';

export default function SayacEkrani() {
  useKeepAwake(); 

  // Slider için varsayılan değer (dk cinsinden)
  const [secilenDakika, setSecilenDakika] = useState(25); 

  const [hedefSure, setHedefSure] = useState(25 * 60); 
  const [saniye, setSaniye] = useState(25 * 60); 
  const [aktifMi, setAktifMi] = useState(false); 
  const [kategori, setKategori] = useState("Ders Çalışma"); 
  const [dagilmaSayisi, setDagilmaSayisi] = useState(0);
  const [modalAcik, setModalAcik] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const appState = useRef(AppState.currentState);
  const kategoriler = ["Ders Çalışma", "Kodlama", "Kitap Okuma", "Proje"];

  // --- SES FONKSİYONLARI ---
  async function sesCal() {
    try {
      const { sound } = await Audio.Sound.createAsync(
         { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' }
      );
      setSound(sound);
      await sound.playAsync(); 
    } catch (error) {
      console.log("Ses hatası:", error);
    }
  }

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // --- SLIDER DEĞİŞİMİ ---
  const sliderDegisti = (deger: number) => {
    if (aktifMi) return; // Sayaç çalışırken değiştirmesin
    
    // Slider bize 25.44 gibi küsuratlı verebilir, tam sayı yapıyoruz
    const tamSayiDakika = Math.floor(deger);
    
    setSecilenDakika(tamSayiDakika); // Ekranda görünen sayı (dk)
    setHedefSure(tamSayiDakika * 60); // Arka plandaki hedef (sn)
    setSaniye(tamSayiDakika * 60);    // Anlık sayaç (sn)
    setDagilmaSayisi(0);
  };

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
      Vibration.vibrate(1000);
      sesCal();
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
          // Alert.alert("Dikkat!", "Uygulamadan çıktınız."); // İstersen açabilirsin
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [aktifMi]);

  // --- YARDIMCI ---
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

      {/* MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalAcik}
        onRequestClose={() => seansiBitirVeKaydet()}
      >
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            <Text style={styles.modalBaslik}>🎉 Seans Tamamlandı!</Text>
            <Text style={styles.ozetDeger}>{kategori} - {Math.floor(hedefSure / 60)} dk</Text>
            <TouchableOpacity style={styles.modalButon} onPress={seansiBitirVeKaydet}>
              <Text style={styles.modalButonYazi}>Kaydet ve Bitir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* KATEGORİ SEÇİMİ */}
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

      {/* --- YENİ: SLIDER İLE SÜRE AYARLAMA --- */}
      <View style={styles.sliderKutusu}>
        <Text style={styles.altBaslik}>Süre Ayarla: <Text style={{ color: 'tomato', fontWeight: 'bold' }}>{secilenDakika} dk</Text></Text>
        
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={1}      // En az 1 dakika
          maximumValue={120}    // En fazla 120 dakika
          step={1}              // 1'er 1'er artsın
          value={secilenDakika} // Şu anki değer
          onValueChange={sliderDegisti} // Kaydırınca çalışacak fonksiyon
          minimumTrackTintColor="tomato" // Sol taraf rengi
          maximumTrackTintColor="#d3d3d3" // Sağ taraf rengi
          thumbTintColor="tomato" // Yuvarlak başlık rengi
          disabled={aktifMi} // Sayaç çalışırken kilitlensin
        />
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: '#999' }}>1 dk</Text>
            <Text style={{ fontSize: 12, color: '#999' }}>120 dk</Text>
        </View>
      </View>

      {/* BÜYÜK SAYAÇ */}
      <View style={styles.sayacDaire}>
        <Text style={styles.sayacYazi}>{sureyiFormatla(saniye)}</Text>
        <Text style={styles.durumYazi}>{aktifMi ? "Odaklanılıyor..." : "Hazır"}</Text>
      </View>

      <View style={{ marginBottom: 20 }}>
         <Text style={{ fontSize: 16, color: '#dc3545', fontWeight: 'bold' }}>
            Dikkat Dağılma: {dagilmaSayisi}
         </Text>
      </View>

      {/* BUTONLAR */}
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
    flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20
  },
  baslik: {
    fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333',
  },
  // SLIDER STİLİ
  sliderKutusu: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 15,
    marginBottom: 30, // Sayaç ile arayı açtık
    borderWidth: 1,
    borderColor: '#eee'
  },
  modalArkaPlan: {
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalKutu: {
    width: 300, backgroundColor: "white", borderRadius: 20, padding: 25, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5
  },
  modalBaslik: {
    fontSize: 22, fontWeight: "bold", marginBottom: 10, color: '#28a745'
  },
  ozetDeger: {
    fontSize: 18, color: '#333', marginBottom: 20
  },
  modalButon: {
    backgroundColor: "tomato", borderRadius: 10, padding: 12, elevation: 2, width: '100%', alignItems: 'center'
  },
  modalButonYazi: {
    color: "white", fontWeight: "bold", fontSize: 16
  },
  secimSatiri: {
    width: '100%', marginBottom: 20,
  },
  altBaslik: {
    fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '600',
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