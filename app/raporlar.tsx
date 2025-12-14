import { Ionicons } from '@expo/vector-icons'; // İkon için
import AsyncStorage from '@react-native-async-storage/async-storage'; // Hedefi kaydetmek için
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
	Alert,
	Dimensions,
	Modal,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { herseyiSil, OdakVerisi, verileriGetir } from '../utils/storage';

const ekranGenisligi = Dimensions.get("window").width;
type ZamanAraligi = 'Bugün' | 'Bu Hafta' | 'Bu Ay';

export default function RaporlarEkrani() {
  const [hamVeriler, setHamVeriler] = useState<OdakVerisi[]>([]);
  const [gosterilenVeriler, setGosterilenVeriler] = useState<OdakVerisi[]>([]);
  const [seciliFiltre, setSeciliFiltre] = useState<ZamanAraligi>('Bugün');
  const [yukleniyor, setYukleniyor] = useState(false);

  // --- HEDEF AYARLARI (YENİ) ---
  const [gunlukHedef, setGunlukHedef] = useState(120); // Varsayılan 120 dk
  const [hedefModalAcik, setHedefModalAcik] = useState(false);
  const [yeniHedefInput, setYeniHedefInput] = useState("120");

  // --- 1. AÇILIŞTA VERİLERİ VE HEDEFİ YÜKLE ---
  useFocusEffect(
    useCallback(() => {
      verileriYukle();
      hedefiYukle(); // Hedefi hafızadan çek
    }, [])
  );

  const hedefiYukle = async () => {
    try {
      const kayitliHedef = await AsyncStorage.getItem('kullanici_hedefi');
      if (kayitliHedef !== null) {
        setGunlukHedef(parseInt(kayitliHedef));
        setYeniHedefInput(kayitliHedef);
      }
    } catch (e) {
      console.log("Hedef yüklenemedi");
    }
  };

  const verileriYukle = async () => {
    setYukleniyor(true);
    const gelen = await verileriGetir();
    setHamVeriler(gelen);
    verileriSuz(gelen, seciliFiltre);
    setYukleniyor(false);
  };

  // --- 2. HEDEFİ KAYDETME FONKSİYONU ---
  const hedefiKaydet = async () => {
    const deger = parseInt(yeniHedefInput);
    if (isNaN(deger) || deger <= 0) {
      Alert.alert("Hata", "Lütfen geçerli bir dakika giriniz.");
      return;
    }
    
    setGunlukHedef(deger);
    await AsyncStorage.setItem('kullanici_hedefi', deger.toString());
    setHedefModalAcik(false);
    Alert.alert("Başarılı", `Günlük hedefiniz ${deger} dakika olarak güncellendi! 🎯`);
  };

  const hazirHedefSec = (dk: number) => {
    setYeniHedefInput(dk.toString());
  };

  // --- 3. FİLTRELEME ---
  const verileriSuz = (veriler: OdakVerisi[], filtre: ZamanAraligi) => {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0); 

    const suzulen = veriler.filter(veri => {
      const kayitTarihi = new Date(parseInt(veri.id)); 
      kayitTarihi.setHours(0, 0, 0, 0);

      if (filtre === 'Bugün') return kayitTarihi.getTime() === bugun.getTime();
      else if (filtre === 'Bu Hafta') {
        const birHaftaOnce = new Date(bugun);
        birHaftaOnce.setDate(bugun.getDate() - 7);
        return kayitTarihi >= birHaftaOnce;
      } 
      else { 
        const birAyOnce = new Date(bugun);
        birAyOnce.setDate(bugun.getDate() - 30);
        return kayitTarihi >= birAyOnce;
      }
    });
    setGosterilenVeriler(suzulen);
  };

  const filtreDegistir = (yeniFiltre: ZamanAraligi) => {
    setSeciliFiltre(yeniFiltre);
    verileriSuz(hamVeriler, yeniFiltre);
  };

  const verileriTemizle = async () => {
    Alert.alert(
      "Verileri Sil",
      "Tüm kayıtlar silinecek. Emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Evet, Sil", 
          style: 'destructive',
          onPress: async () => {
            await herseyiSil();
            setHamVeriler([]);
            setGosterilenVeriler([]);
            Alert.alert("Başarılı", "Veritabanı sıfırlandı.");
          }
        }
      ]
    );
  };

  // --- 4. İSTATİSTİKLER ---
  const toplamSure = Math.ceil(gosterilenVeriler.reduce((toplam, veri) => toplam + veri.suredk, 0));
  const toplamDagilma = gosterilenVeriler.reduce((toplam, veri) => toplam + veri.dagilma, 0);
  const toplamSeans = gosterilenVeriler.length;

  // Hedef Hesaplama
  const bugunTarih = new Date().toLocaleDateString();
  const bugunYapilanToplam = Math.ceil(hamVeriler
    .filter(v => v.tarih === bugunTarih)
    .reduce((t, v) => t + v.suredk, 0));
  
  const hedefYuzdesi = Math.min((bugunYapilanToplam / gunlukHedef) * 100, 100);
  const hedefRengi = hedefYuzdesi >= 100 ? '#4CAF50' : 'tomato'; 

  // Grafikler
  const kategoriGruplari: any = {};
  gosterilenVeriler.forEach(veri => {
    if (!kategoriGruplari[veri.kategori]) kategoriGruplari[veri.kategori] = 0;
    kategoriGruplari[veri.kategori] += veri.suredk;
  });

  const pastaGrafikVerisi = Object.keys(kategoriGruplari).map((kat, index) => ({
    name: kat,
    population: Math.ceil(kategoriGruplari[kat]),
    color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index % 5], 
    legendFontColor: "#7F7F7F",
    legendFontSize: 12
  }));

  const sonKayitlar = gosterilenVeriler.slice(0, 7).reverse(); 
  const cubukGrafikVerisi = {
    labels: sonKayitlar.map(v => v.kategori.substring(0, 3)), 
    datasets: [{ data: sonKayitlar.map(v => Math.ceil(v.suredk)) }]
  };

  // --- 5. GÖRÜNTÜ ---
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={verileriYukle} />}
    >
      <Text style={styles.baslik}>Raporlar</Text>

      {/* --- HEDEF KARTI --- */}
      <View style={styles.hedefKarti}>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 5}}>
            <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                <Text style={styles.hedefBaslik}>🔥 Günlük Hedef ({gunlukHedef} dk)</Text>
                
                {/* DÜZENLEME BUTONU */}
                <TouchableOpacity onPress={() => setHedefModalAcik(true)}>
                    <Ionicons name="pencil-sharp" size={18} color="#666" />
                </TouchableOpacity>
            </View>
            <Text style={[styles.hedefYuzde, {color: hedefRengi}]}>%{Math.floor(hedefYuzdesi)}</Text>
        </View>
        
        <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${hedefYuzdesi}%`, backgroundColor: hedefRengi }]} />
        </View>
        
        <Text style={styles.hedefAltYazi}>
            {hedefYuzdesi >= 100 
                ? "Tebrikler! Günlük hedefini tamamladın! 🏆" 
                : `${Math.max(0, gunlukHedef - bugunYapilanToplam)} dakika daha çalışmalısın.`}
        </Text>
      </View>

      {/* --- HEDEF DÜZENLEME MODALI (YENİ) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={hedefModalAcik}
        onRequestClose={() => setHedefModalAcik(false)}
      >
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            <Text style={styles.modalBaslik}>Hedefi Düzenle 🎯</Text>
            <Text style={styles.modalAciklama}>Günlük kaç dakika odaklanmak istersin?</Text>
            
            <TextInput 
                style={styles.input}
                keyboardType="numeric"
                value={yeniHedefInput}
                onChangeText={setYeniHedefInput}
                placeholder="Örn: 120"
            />

            {/* Hazır Butonlar */}
            <View style={styles.hazirButonlar}>
                <TouchableOpacity style={styles.hazirBtn} onPress={() => hazirHedefSec(60)}><Text>1 Saat</Text></TouchableOpacity>
                <TouchableOpacity style={styles.hazirBtn} onPress={() => hazirHedefSec(120)}><Text>2 Saat</Text></TouchableOpacity>
                <TouchableOpacity style={styles.hazirBtn} onPress={() => hazirHedefSec(180)}><Text>3 Saat</Text></TouchableOpacity>
            </View>

            <View style={styles.modalButonlar}>
                <TouchableOpacity style={[styles.modalBtn, styles.iptalBtn]} onPress={() => setHedefModalAcik(false)}>
                    <Text style={styles.iptalYazi}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.kaydetBtn]} onPress={hedefiKaydet}>
                    <Text style={styles.kaydetYazi}>Kaydet</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- FİLTRELER VE GRAFİKLER (AYNI) --- */}
      <View style={styles.filtreKutusu}>
        {['Bugün', 'Bu Hafta', 'Bu Ay'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtreBtn, seciliFiltre === f && styles.aktifFiltreBtn]}
            onPress={() => filtreDegistir(f as ZamanAraligi)}
          >
            <Text style={[styles.filtreYazi, seciliFiltre === f && styles.aktifFiltreYazi]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.altBaslik}>{seciliFiltre} İstatistikleri</Text>
      <View style={styles.kartSatiri}>
        <View style={styles.kart}>
          <Text style={styles.kartSayi}>{toplamSure} dk</Text>
          <Text style={styles.kartEtiket}>Odaklanma</Text>
        </View>
        <View style={styles.kart}>
          <Text style={styles.kartSayi}>{toplamSeans}</Text>
          <Text style={styles.kartEtiket}>Seans</Text>
        </View>
        <View style={[styles.kart, { backgroundColor: '#ffebee' }]}>
          <Text style={[styles.kartSayi, { color: 'red' }]}>{toplamDagilma}</Text>
          <Text style={styles.kartEtiket}>Dağılma</Text>
        </View>
      </View>

      {toplamSeans > 0 ? (
        <>
          <Text style={styles.grafikBaslik}>Kategori Dağılımı ({seciliFiltre})</Text>
          <PieChart
            data={pastaGrafikVerisi}
            width={ekranGenisligi - 40}
            height={220}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />

          <Text style={styles.grafikBaslik}>Son Seanslar</Text>
          <BarChart
            data={cubukGrafikVerisi}
            width={ekranGenisligi - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" dk"
            fromZero={true} 
            showValuesOnTopOfBars={true}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            style={{ borderRadius: 16, marginVertical: 10 }}
          />
        </>
      ) : (
        <View style={styles.bosKutu}>
          <Text style={styles.bosYazi}>
            {seciliFiltre} için henüz bir veri yok. {"\n"}
            Hadi biraz odaklanalım! 🚀
          </Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.temizleBtn} onPress={verileriTemizle}>
        <Text style={styles.temizleBtnYazi}>🗑️ Tüm Verileri Sil</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} /> 
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`, 
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2, 
  barPercentage: 0.7,
  decimalPlaces: 0, 
  fillShadowGradient: 'tomato', 
  fillShadowGradientOpacity: 1,
};

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff', padding: 20,
  },
  baslik: {
    fontSize: 28, fontWeight: 'bold', marginBottom: 20, marginTop: 30, color: '#333',
  },
  hedefKarti: {
    backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 25,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderWidth: 1, borderColor: '#f0f0f0'
  },
  hedefBaslik: {
    fontSize: 16, fontWeight: 'bold', color: '#444'
  },
  hedefYuzde: {
    fontSize: 16, fontWeight: 'bold'
  },
  progressBarBackground: {
    height: 12, backgroundColor: '#eee', borderRadius: 6, width: '100%', overflow: 'hidden', marginBottom: 8
  },
  progressBarFill: {
    height: '100%', borderRadius: 6
  },
  hedefAltYazi: {
    fontSize: 12, color: '#888', fontStyle: 'italic'
  },
  // --- MODAL STİLLERİ ---
  modalArkaPlan: {
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalKutu: {
    width: 300, backgroundColor: "white", borderRadius: 20, padding: 20, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5
  },
  modalBaslik: {
    fontSize: 20, fontWeight: "bold", marginBottom: 10, color: '#333'
  },
  modalAciklama: {
    fontSize: 14, color: '#666', marginBottom: 15
  },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, width: '100%', padding: 10, fontSize: 18, textAlign: 'center', marginBottom: 15
  },
  hazirButonlar: {
    flexDirection: 'row', gap: 10, marginBottom: 20
  },
  hazirBtn: {
    backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8
  },
  modalButonlar: {
    flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 10
  },
  modalBtn: {
    flex: 1, padding: 12, borderRadius: 10, alignItems: 'center'
  },
  iptalBtn: {
    backgroundColor: '#eee'
  },
  kaydetBtn: {
    backgroundColor: 'tomato'
  },
  iptalYazi: {
    color: '#333', fontWeight: 'bold'
  },
  kaydetYazi: {
    color: '#fff', fontWeight: 'bold'
  },
  // --- DİĞER STİLLER ---
  filtreKutusu: {
    flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 10, padding: 4, marginBottom: 20,
  },
  filtreBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8,
  },
  aktifFiltreBtn: {
    backgroundColor: '#fff', 
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2,
  },
  filtreYazi: {
    color: '#777', fontWeight: '600', fontSize: 14,
  },
  aktifFiltreYazi: {
    color: 'tomato', fontWeight: 'bold',
  },
  altBaslik: {
    fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 10,
  },
  kartSatiri: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30,
  },
  kart: {
    width: '30%', backgroundColor: '#f8f9fa', padding: 10, borderRadius: 10, alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  kartSayi: {
    fontSize: 20, fontWeight: 'bold', color: 'tomato', marginBottom: 5,
  },
  kartEtiket: {
    fontSize: 12, color: '#666',
  },
  grafikBaslik: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10, color: '#444',
  },
  bosKutu: {
    padding: 30, alignItems: 'center', justifyContent: 'center',
  },
  bosYazi: {
    textAlign: 'center', color: '#999', fontSize: 16, lineHeight: 24,
  },
  temizleBtn: {
    marginTop: 30, backgroundColor: '#ffebee', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ffcdd2', marginBottom: 30
  },
  temizleBtnYazi: {
    color: '#d32f2f', fontWeight: 'bold', fontSize: 16
  }
});