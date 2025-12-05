import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Üstteki varsayılan başlığı gizler
        tabBarActiveTintColor: 'tomato', // Seçili menü rengi
        tabBarInactiveTintColor: 'gray', // Pasif menü rengi
      }}
    >
      {/* 1. Ekran: Ana Sayfa (Sayaç) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Zamanlayıcı',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="timer-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 2. Ekran: Raporlar */}
      <Tabs.Screen
        name="raporlar" // Dosya adı 'raporlar.tsx' olmalı
        options={{
          title: 'Raporlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}