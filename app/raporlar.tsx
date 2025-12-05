import { StyleSheet, Text, View } from 'react-native';

export default function RaporlarEkrani() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Burası Raporlar Ekranı Olacak</Text>
      <Text>Grafikler buraya gelecek.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  }
});