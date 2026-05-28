/**
 * TunerScreen.tsx - Tela principal do afinador
 * 
 * Componente central que integra todos os outros:
 * - Captura de áudio em tempo real
 * - Exibição da nota detectada
 * - Medidor visual de afinação (ponteiro)
 * - Seletor de cordas do violão
 * - Sons de referência
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { frequencyToNote, findNearestGuitarString, NoteInfo } from '../utils/noteDetection';
import TunerGauge from './TunerGauge';
import GuitarStringSelector from './GuitarStringSelector';
import ReferenceSounds from './ReferenceSounds';

export default function TunerScreen() {
  // Hook de captura de áudio
  const { frequency, isListening, error, startListening, stopListening } = useAudioCapture();

  // Corda selecionada manualmente (null = automático)
  const [selectedString, setSelectedString] = useState<number | null>(null);

  // Histórico das últimas notas detectadas (para suavizar exibição)
  const [noteHistory, setNoteHistory] = useState<NoteInfo[]>([]);

  // Animação de pulso para o display de nota
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  /**
   * Processa a frequência detectada e atualiza o histórico de notas
   * Mantém as últimas 5 detecções para suavizar a exibição
   */
  useEffect(() => {
    const noteInfo = frequencyToNote(frequency);
    
    if (noteInfo) {
      setNoteHistory(prev => {
        const updated = [...prev, noteInfo].slice(-5);
        return updated;
      });
    }
  }, [frequency]);

  /**
   * Calcula a nota atual usando média ponderada do histórico
   * Notas mais recentes têm maior peso
   */
  const currentNote = useMemo((): NoteInfo => {
    if (noteHistory.length === 0 || !isListening) {
      return {
        note: '--',
        octave: 0,
        frequency: 0,
        cents: 0,
        status: 'silencio',
      };
    }

    const recent = noteHistory[noteHistory.length - 1];
    
    // Suavização: usa média dos últimos 3 valores de cents
    const recentCents = noteHistory.slice(-3).map(n => n.cents);
    const avgCents = Math.round(
      recentCents.reduce((a, b) => a + b, 0) / recentCents.length
    );

    return { ...recent, cents: avgCents };
  }, [noteHistory, isListening]);

  /**
   * Anima o display de nota quando uma nova nota é detectada
   */
  useEffect(() => {
    if (currentNote.status !== 'silencio') {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentNote.note, pulseAnim]);

  /**
   * Alterna entre escutar e parar de escutar
   */
  const toggleListening = () => {
    if (isListening) {
      stopListening();
      setNoteHistory([]);
    } else {
      startListening();
    }
  };

  // Cor do display conforme o status de afinação
  const statusColor = {
    afinado: '#00E676',
    grave: '#FF5252',
    agudo: '#FF5252',
    silencio: '#546E7A',
  }[currentNote.status];

  // Frequência exibida: usa a ideal se corda selecionada, senão a detectada
  const displayFrequency = isListening && frequency > 0
    ? `${Math.round(frequency)} Hz`
    : '-- Hz';

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎸 Afinador</Text>
        <Text style={styles.headerSubtitle}>Violão</Text>
      </View>

      {/* Display principal da nota detectada */}
      <Animated.View style={[styles.noteDisplay, { transform: [{ scale: pulseAnim }] }]}>
        {/* Nome da nota em destaque */}
        <Text style={[styles.noteName, { color: statusColor }]}>
          {currentNote.note}
        </Text>

        {/* Oitava e frequência detectada */}
        <View style={styles.noteDetails}>
          {currentNote.status !== 'silencio' && (
            <Text style={styles.octaveText}>
              Oitava {currentNote.octave}
            </Text>
          )}
          <Text style={styles.frequencyText}>{displayFrequency}</Text>
        </View>

        {/* Mensagem de status */}
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {currentNote.status === 'afinado' && '✓ AFINADO'}
            {currentNote.status === 'grave' && '↓ GRAVE'}
            {currentNote.status === 'agudo' && '↑ AGUDO'}
            {currentNote.status === 'silencio' && isListening ? '~ OUVINDO...' : ''}
            {currentNote.status === 'silencio' && !isListening ? '○ PARADO' : ''}
          </Text>
        </View>
      </Animated.View>

      {/* Medidor visual de ponteiro */}
      <TunerGauge
        cents={currentNote.cents}
        status={currentNote.status}
      />

      {/* Botão principal de ligar/desligar o microfone */}
      <TouchableOpacity
        style={[styles.micButton, isListening && styles.micButtonActive]}
        onPress={toggleListening}
        activeOpacity={0.8}>
        <Text style={styles.micIcon}>{isListening ? '⏹' : '🎤'}</Text>
        <Text style={styles.micButtonText}>
          {isListening ? 'Parar' : 'Iniciar Afinação'}
        </Text>
      </TouchableOpacity>

      {/* Mensagem de erro (se houver) */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      {/* Separador */}
      <View style={styles.divider} />

      {/* Seletor de corda */}
      <GuitarStringSelector
        selectedString={selectedString}
        onSelectString={setSelectedString}
      />

      {/* Separador */}
      <View style={styles.divider} />

      {/* Sons de referência */}
      <ReferenceSounds selectedString={selectedString} />

      {/* Dica de uso */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>
          💡 Dica: Toque a corda do violão e aguarde o ponteiro estabilizar.
          {'\n'}Verde = afinado. Vermelho = ajuste necessário.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  container: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#546E7A',
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  noteDisplay: {
    alignItems: 'center',
    backgroundColor: '#132336',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 48,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    minWidth: 200,
  },
  noteName: {
    fontSize: 88,
    fontWeight: 'bold',
    lineHeight: 96,
    letterSpacing: -2,
  },
  noteDetails: {
    alignItems: 'center',
    marginTop: 4,
  },
  octaveText: {
    color: '#546E7A',
    fontSize: 13,
  },
  frequencyText: {
    color: '#78909C',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 12,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginVertical: 16,
    gap: 10,
    elevation: 4,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  micButtonActive: {
    backgroundColor: '#B71C1C',
    shadowColor: '#B71C1C',
  },
  micIcon: {
    fontSize: 20,
  },
  micButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorContainer: {
    backgroundColor: '#4A1010',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#B71C1C',
  },
  errorText: {
    color: '#EF9A9A',
    fontSize: 13,
    textAlign: 'center',
  },
  divider: {
    width: '90%',
    height: 1,
    backgroundColor: '#1E3A5F',
    marginVertical: 4,
  },
  tipContainer: {
    backgroundColor: '#0A1929',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1565C0',
  },
  tipText: {
    color: '#78909C',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
