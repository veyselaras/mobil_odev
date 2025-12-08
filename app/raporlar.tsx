import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { herseyiSil, OdakVerisi, verileriGetir } from '../utils/storage';

const ekranGenisligi = Dimensions.get("window").width;

// Zaman Filtresi Seçenekleri
type ZamanAraligi = 'Bugün' | 'Bu Hafta' | 'Bu Ay';

export default function RaporlarEkrani() {
  const [hamVeriler, setHamVeriler] = useState<OdakVerisi[]>([]); // Veritabanından gelen tüm veri
  const [gosterilenVeriler, setGosterilenVeriler] = useState<OdakVerisi[]>([]); // Ekranda süzülen veri
  const [seciliFiltre, setSeciliFiltre] = useState<ZamanAraligi>('Bugün'); // Varsayılan: Bugün
  const [yukleniyor, setYukleniyor] = useState(false);

  // --- 1. VERİLERİ YÜKLEME ---
  useFocusEffect(
    useCallback(() => {
      verileriYukle();
    }, [])
  );

  const verileriYukle = async () => {
    setYukleniyor(true);
    const gelen = await verileriGetir();
    setHamVeriler(gelen);
    // Veriler yüklenince hemen mevcut filtreye göre süz
    verileriSuz(gelen, seciliFiltre);
    setYukleniyor(false);
  };

  // --- 2. FİLTRELEME MANTIĞI (SİHİRLİ KISIM) ---
  const verileriSuz = (veriler: OdakVerisi[], filtre: ZamanAraligi) => {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0); // Bugünün başlangıcı (Gece 00:00)

    const suzulen = veriler.filter(veri => {
      // Kayıt yaparken ID olarak Date.now() kullanmıştık.
      // Bunu tekrar tarihe çeviriyoruz. En güvenli yöntem budur.
      const kayitTarihi = new Date(parseInt(veri.id)); 
      kayitTarihi.setHours(0, 0, 0, 0);

      if (filtre === 'Bugün') {
        // Tarih bugüne eşitse
        return kayitTarihi.getTime() === bugun.getTime();
      } 
      else if (filtre === 'Bu Hafta') {
        // Son 7 gün
        const birHaftaOnce = new Date(bugun);
        birHaftaOnce.setDate(bugun.getDate() - 7);
        return kayitTarihi >= birHaftaOnce;
      } 
      else { 
        // Bu Ay (Son 30 gün)
        const birAyOnce = new Date(bugun);
        birAyOnce.setDate(bugun.getDate() - 30);
        return kayitTarihi >= birAyOnce;
      }
    });

    setGosterilenVeriler(suzulen);
  };

  // Kullanıcı butona basınca burası çalışır
  const filtreDegistir = (yeniFiltre: ZamanAraligi) => {
    setSeciliFiltre(yeniFiltre);
    verileriSuz(hamVeriler, yeniFiltre);
  };

  // --- 3. TEMİZLEME ---
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

  // --- 4. İSTATİSTİK HESAPLAMALARI (Sadece 'gosterilenVeriler' kullanılır) ---
  const toplamSure = Math.ceil(gosterilenVeriler.reduce((toplam, veri) => toplam + veri.suredk, 0));
  const toplamDagilma = gosterilenVeriler.reduce((toplam, veri) => toplam + veri.dagilma, 0);
  const toplamSeans = gosterilenVeriler.length;

  // Pasta Grafik (Kategori Dağılımı)
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

  // Çubuk Grafik (Zaman Grafiği)
  const sonKayitlar = gosterilenVeriler.slice(0, 7).reverse(); // Son 7 kayıt (Haftalık bakarken taşmasın diye)
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

      {/* FİLTRE BUTONLARI (YENİ) */}
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

      {/* ÖZET KARTLARI */}
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

      {/* GRAFİKLER */}
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
      
      {/* SIFIRLAMA BUTONU */}
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
  // FİLTRE STİLLERİ
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
  // KART STİLLERİ
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