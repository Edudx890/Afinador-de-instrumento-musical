/**
 * App.tsx - Componente raiz da aplicação
 * Configura a navegação e o tema global do app
 */

import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import TunerScreen from './src/components/TunerScreen';

export default function App() {
  return (
    <View style={styles.container}>
      {/* Barra de status com fundo escuro */}
      <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
      <TunerScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
});
