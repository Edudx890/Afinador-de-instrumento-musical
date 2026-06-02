/**
 * GuitarStringSelector.tsx - Componente de seleção de corda do violão
 * 
 * Exibe as 6 cordas do violão e permite ao usuário selecionar
 * qual corda deseja afinar, mostrando a frequência alvo de cada uma.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GUITAR_STRINGS } from '../utils/noteDetection';

interface GuitarStringSelectorProps {
  selectedString: number | null;  // Índice da corda selecionada (1-6)
  onSelectString: (stringNumber: number | null) => void;
}

export default function GuitarStringSelector({
  selectedString,
  onSelectString,
}: GuitarStringSelectorProps) {
  
  /**
   * Alterna seleção: se a corda já está selecionada, deseleciona (modo automático)
   * Caso contrário, seleciona a corda clicada
   */
  const handlePress = (stringNumber: number) => {
    if (selectedString === stringNumber) {
      onSelectString(null); // Volta para modo automático
    } else {
      onSelectString(stringNumber);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecione a Corda</Text>
      <Text style={styles.subtitle}>Toque para fixar ou deixe em automático</Text>

      <View style={styles.stringsContainer}>
        {GUITAR_STRINGS.map((guitarString) => {
          const isSelected = selectedString === guitarString.string;
          
          return (
            <TouchableOpacity
              key={guitarString.string}
              style={[styles.stringButton, isSelected && styles.selectedButton]}
              onPress={() => handlePress(guitarString.string)}
              activeOpacity={0.7}>
              
              {/* Número da corda */}
              <Text style={[styles.stringNumber, isSelected && styles.selectedText]}>
                {guitarString.string}ª
              </Text>
              
              {/* Nome da nota */}
              <Text style={[styles.noteName, isSelected && styles.selectedNoteText]}>
                {guitarString.note}
              </Text>
              
              {/* Frequência ideal */}
              <Text style={[styles.frequency, isSelected && styles.selectedFreqText]}>
                {guitarString.frequency.toFixed(0)}Hz
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Indicador do modo atual */}
      <View style={styles.modeIndicator}>
        <View style={[styles.modeDot, selectedString === null && styles.modeDotActive]} />
        <Text style={[styles.modeText, selectedString === null && styles.modeTextActive]}>
          {selectedString === null ? 'Detecção automática' : `Corda ${selectedString}ª fixada`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: '#B0BEC5',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subtitle: {
    color: '#546E7A',
    fontSize: 11,
    marginBottom: 16,
  },
  stringsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  stringButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 64,
    borderWidth: 1.5,
    borderColor: '#2A4A6F',
  },
  selectedButton: {
    backgroundColor: '#1565C0',
    borderColor: '#42A5F5',
    shadowColor: '#42A5F5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  stringNumber: {
    color: '#546E7A',
    fontSize: 10,
    fontWeight: '500',
  },
  noteName: {
    color: '#90CAF9',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  selectedNoteText: {
    color: '#FFFFFF',
  },
  frequency: {
    color: '#546E7A',
    fontSize: 10,
  },
  selectedText: {
    color: '#90CAF9',
  },
  selectedFreqText: {
    color: '#42A5F5',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#546E7A',
    marginRight: 6,
  },
  modeDotActive: {
    backgroundColor: '#00E676',
  },
  modeText: {
    color: '#546E7A',
    fontSize: 12,
  },
  modeTextActive: {
    color: '#00E676',
  },
});
