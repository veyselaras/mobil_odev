import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { OdakVerisi, verileriGetir } from '../utils/storage';

const ekranGenisligi = Dimensions.get("window").width;

export default function RaporlarEkrani() {
  const [veriler, setVeriler] = useState<OdakVerisi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  // --- 1. VERİLERİ YÜKLEME ---
  useFocusEffect(
    useCallback(() => {
      verileriYukle();
    }, [])
  );

  const verileriYukle = async () => {
    setYukleniyor(true);
    const gelenVeriler = await verileriGetir();
    setVeriler(gelenVeriler);
    setYukleniyor(false);
  };

  // --- 2. İSTATİSTİK HESAPLAMALARI ---
  
  // A. Toplam İstatistikler (Math.ceil ile yukarı yuvarlıyoruz)
  const toplamSure = Math.ceil(veriler.reduce((toplam, veri) => toplam + veri.suredk, 0));
  const toplamDagilma = veriler.reduce((toplam, veri) => toplam + veri.dagilma, 0);
  
  // Bugünün verisi
  const bugunTarih = new Date().toLocaleDateString();
  const bugunSureHam = veriler
    .filter(v => v.tarih === bugunTarih)
    .reduce((t, v) => t + v.suredk, 0);
  
  const bugunSure = Math.ceil(bugunSureHam); // Virgülü temizle

  // B. Pasta Grafik Verisi (Kategorilere Göre)
  const kategoriGruplari: any = {};
  veriler.forEach(veri => {
    if (!kategoriGruplari[veri.kategori]) kategoriGruplari[veri.kategori] = 0;
    kategoriGruplari[veri.kategori] += veri.suredk;
  });

  const pastaGrafikVerisi = Object.keys(kategoriGruplari).map((kat, index) => ({
    name: kat,
    population: Math.ceil(kategoriGruplari[kat]), // Grafikteki virgülü temizle
    color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'][index % 4], 
    legendFontColor: "#7F7F7F",
    legendFontSize: 12
  }));

  // C. Çubuk Grafik Verisi (Son Veriler)
  const sonKayitlar = veriler.slice(0, 5).reverse(); 
  const cubukGrafikVerisi = {
    labels: sonKayitlar.map(v => v.kategori.substring(0, 3)), 
    datasets: [{ 
        // BURASI ÖNEMLİ: Her bir çubuk verisini yuvarlıyoruz
        data: sonKayitlar.map(v => Math.ceil(v.suredk)) 
    }]
  };

  // --- 3. GÖRÜNTÜ ---
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={verileriYukle} />}
    >
      <Text style={styles.baslik}>İstatistikler</Text>

      {/* ÖZET KARTLARI */}
      <View style={styles.kartSatiri}>
        <View style={styles.kart}>
          <Text style={styles.kartSayi}>{bugunSure} dk</Text>
          <Text style={styles.kartEtiket}>Bugün</Text>
        </View>
        <View style={styles.kart}>
          <Text style={styles.kartSayi}>{toplamSure} dk</Text>
          <Text style={styles.kartEtiket}>Toplam</Text>
        </View>
        <View style={[styles.kart, { backgroundColor: '#ffebee' }]}>
          <Text style={[styles.kartSayi, { color: 'red' }]}>{toplamDagilma}</Text>
          <Text style={styles.kartEtiket}>Dağılma</Text>
        </View>
      </View>

      {/* GRAFİK 1: KATEGORİ DAĞILIMI (PASTA) */}
      <Text style={styles.grafikBaslik}>Kategori Dağılımı</Text>
      {pastaGrafikVerisi.length > 0 ? (
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
      ) : (
        <Text style={styles.bosUyari}>Henüz veri yok.</Text>
      )}

      {/* GRAFİK 2: SON SEANSLAR (ÇUBUK) */}
      <Text style={styles.grafikBaslik}>Son Seanslar (Süre)</Text>
      {sonKayitlar.length > 0 ? (
        <BarChart
          data={cubukGrafikVerisi}
          width={ekranGenisligi - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=" dk" // Yanına dk ekledik
          chartConfig={{
            ...chartConfig,
            decimalPlaces: 0, // DİKKAT: Burası virgülden sonra 0 basamak olsun demek
          }}
          verticalLabelRotation={0}
          style={{ borderRadius: 16, marginVertical: 10 }}
        />
      ) : (
        <Text style={styles.bosUyari}>Grafik için kayıt yapmalısınız.</Text>
      )}
      
      <View style={{ height: 50 }} /> 
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2, 
  decimalPlaces: 0, // Global olarak virgülleri kapattık
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  baslik: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 30,
    color: '#333',
  },
  kartSatiri: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  kart: {
    width: '30%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kartSayi: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'tomato',
    marginBottom: 5,
  },
  kartEtiket: {
    fontSize: 12,
    color: '#666',
  },
  grafikBaslik: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
    color: '#444',
  },
  bosUyari: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
    fontStyle: 'italic',
  }
});