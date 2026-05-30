/**
 * ReferenceSounds.tsx - Componente de sons de referência
 * 
 * Permite ao usuário ouvir a nota de referência de cada corda
 * para comparar com o som do instrumento e facilitar a afinação.
 * Os sons são gerados sinteticamente usando tom puro (oscilador).
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { GUITAR_STRINGS } from '../utils/noteDetection';

interface ReferenceSoundsProps {
  selectedString: number | null;
}

export default function ReferenceSounds({ selectedString }: ReferenceSoundsProps) {
  const playReference = (stringNum: number) => {
    const guitarString = GUITAR_STRINGS.find(item => item.string === stringNum);
    Alert.alert(
      'Som de referencia',
      `A reproducao da nota ${guitarString?.note}${guitarString?.octave} sera definida depois da base Expo, para evitar modulo nativo fora do Expo Go.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sons de Referência</Text>
      <Text style={styles.subtitle}>Toque para ouvir a nota da corda</Text>

      <View style={styles.buttonsRow}>
        {GUITAR_STRINGS.map((guitarString) => {
          const isHighlighted = selectedString === guitarString.string;

          return (
            <TouchableOpacity
              key={guitarString.string}
              style={[
                styles.refButton,
                isHighlighted && styles.highlightedButton,
              ]}
              onPress={() => playReference(guitarString.string)}
              activeOpacity={0.7}>

              {/* Ícone de play/stop */}
              <Text style={styles.playIcon}>
                ▶
              </Text>

              {/* Nome da nota */}
              <Text style={styles.noteLabel}>
                {guitarString.note}{guitarString.octave}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E3A5F',
  },
  title: {
    color: '#B0BEC5',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subtitle: {
    color: '#546E7A',
    fontSize: 11,
    marginBottom: 14,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  refButton: {
    backgroundColor: '#132336',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 52,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    position: 'relative',
  },
  highlightedButton: {
    borderColor: '#42A5F5',
  },
  playIcon: {
    color: '#42A5F5',
    fontSize: 10,
    marginBottom: 3,
  },
  noteLabel: {
    color: '#90CAF9',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
