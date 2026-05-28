/**
 * ReferenceSounds.tsx - Componente de sons de referência
 * 
 * Permite ao usuário ouvir a nota de referência de cada corda
 * para comparar com o som do instrumento e facilitar a afinação.
 * Os sons são gerados sinteticamente usando tom puro (oscilador).
 */

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Sound from 'react-native-sound';
import { GUITAR_STRINGS } from '../utils/noteDetection';

// Habilita reprodução em modo silencioso (iOS)
Sound.setCategory('Playback');

interface ReferenceSoundsProps {
  selectedString: number | null;
}

export default function ReferenceSounds({ selectedString }: ReferenceSoundsProps) {
  // Índice da corda atualmente tocando (-1 = nenhuma)
  const [playingString, setPlayingString] = useState<number | null>(null);
  const soundRef = useRef<Sound | null>(null);

  /**
   * Toca o arquivo de som de referência correspondente à corda
   * Os arquivos devem estar em: android/app/src/main/res/raw/
   * Nomeados como: string_e2.mp3, string_a2.mp3, etc.
   */
  const playReference = (stringNum: number) => {
    // Se já está tocando a mesma corda, para
    if (playingString === stringNum) {
      stopSound();
      return;
    }

    // Para o som anterior se houver
    stopSound();

    // Mapeia o número da corda para o nome do arquivo
    const fileMap: Record<number, string> = {
      6: 'ref_e2',  // Mi grave (82.41 Hz)
      5: 'ref_a2',  // Lá      (110.00 Hz)
      4: 'ref_d3',  // Ré      (146.83 Hz)
      3: 'ref_g3',  // Sol     (196.00 Hz)
      2: 'ref_b3',  // Si      (246.94 Hz)
      1: 'ref_e4',  // Mi agudo (329.63 Hz)
    };

    const fileName = fileMap[stringNum];

    try {
      // Carrega e toca o som de referência
      const sound = new Sound(`${fileName}.mp3`, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          // Caso o arquivo não exista, avisa o usuário
          Alert.alert(
            'Som Indisponível',
            `Arquivo de referência não encontrado.\nAddione "${fileName}.mp3" em android/app/src/main/res/raw/`,
            [{ text: 'OK' }]
          );
          setPlayingString(null);
          return;
        }

        sound.setVolume(0.8);
        sound.play((success) => {
          if (!success) {
            console.log('Erro ao reproduzir som');
          }
          setPlayingString(null);
          soundRef.current = null;
        });

        soundRef.current = sound;
        setPlayingString(stringNum);
      });
    } catch (error) {
      console.error('Erro ao carregar som:', error);
      setPlayingString(null);
    }
  };

  /**
   * Para a reprodução do som atual e libera recursos
   */
  const stopSound = () => {
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
      soundRef.current = null;
    }
    setPlayingString(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sons de Referência</Text>
      <Text style={styles.subtitle}>Toque para ouvir a nota da corda</Text>

      <View style={styles.buttonsRow}>
        {GUITAR_STRINGS.map((guitarString) => {
          const isPlaying = playingString === guitarString.string;
          const isHighlighted = selectedString === guitarString.string;

          return (
            <TouchableOpacity
              key={guitarString.string}
              style={[
                styles.refButton,
                isPlaying && styles.playingButton,
                isHighlighted && !isPlaying && styles.highlightedButton,
              ]}
              onPress={() => playReference(guitarString.string)}
              activeOpacity={0.7}>

              {/* Ícone de play/stop */}
              <Text style={styles.playIcon}>
                {isPlaying ? '■' : '▶'}
              </Text>

              {/* Nome da nota */}
              <Text style={[styles.noteLabel, isPlaying && styles.playingText]}>
                {guitarString.note}{guitarString.octave}
              </Text>

              {/* Indicador de tocando */}
              {isPlaying && (
                <View style={styles.playingIndicator} />
              )}
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
  playingButton: {
    backgroundColor: '#0D3B6E',
    borderColor: '#1976D2',
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
  playingText: {
    color: '#FFFFFF',
  },
  playingIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#42A5F5',
  },
});
