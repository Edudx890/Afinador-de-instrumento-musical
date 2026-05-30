/**
 * useAudioCapture.ts - Hook personalizado para captura de áudio
 * 
 * Gerencia o ciclo de vida do microfone e do processamento de áudio:
 * - Solicita permissão de microfone ao usuário
 * - Inicia/para a captura de áudio
 * - Retorna a frequência detectada em tempo real
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AudioRecord from 'react-native-audio-record';
import { Buffer } from 'buffer';
import { detectPitch } from '../utils/noteDetection';

// Configurações de captura de áudio
const AUDIO_CONFIG = {
  sampleRate: 44100,    // Taxa de amostragem padrão (Hz)
  channels: 1,          // Mono (suficiente para detecção de pitch)
  bitsPerSample: 16,    // Qualidade de 16 bits
  wavFile: 'tuner.wav', // Arquivo temporário
};

// Taxa de atualização da detecção (ms)
const UPDATE_INTERVAL = 150;

interface AudioCaptureState {
  frequency: number;      // Frequência detectada em Hz
  isListening: boolean;   // Microfone ativo
  hasPermission: boolean; // Permissão concedida
  error: string | null;   // Mensagem de erro
}

interface UseAudioCaptureReturn extends AudioCaptureState {
  startListening: () => Promise<void>;
  stopListening: () => void;
}

export function useAudioCapture(): UseAudioCaptureReturn {
  const [state, setState] = useState<AudioCaptureState>({
    frequency: 0,
    isListening: false,
    hasPermission: false,
    error: null,
  });

  // Referências para controle do processamento
  const isActiveRef = useRef(false);
  const updateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioBufferRef = useRef<number[]>([]);

  /**
   * Solicita permissão de acesso ao microfone
   * No Android, usa a API de permissões em tempo de execução
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Permissão de Microfone',
            message: 'O Afinador precisa acessar o microfone para detectar as notas musicais.',
            buttonNeutral: 'Perguntar depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Permitir',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Erro ao solicitar permissão:', err);
        return false;
      }
    }
    // iOS solicita permissão automaticamente ao iniciar captura
    return true;
  }, []);

  /**
   * Processa o buffer de áudio recebido e detecta a frequência
   * Converte dados PCM de 16 bits para Float32 normalizado (-1 a +1)
   */
  const processAudioData = useCallback((data: string) => {
    if (!isActiveRef.current) return;

    try {
      // Decodifica dados base64 para buffer de bytes
      const bytes = Buffer.from(data, 'base64');
      const samples = new Float32Array(bytes.length / 2);

      // Converte PCM 16-bit para Float32 normalizado
      for (let i = 0; i < samples.length; i++) {
        const sample = bytes.readInt16LE(i * 2);
        samples[i] = sample / 32768.0; // Normaliza para [-1, 1]
      }

      // Aplica janela de Hanning para reduzir vazamento espectral
      const windowedSamples = applyHanningWindow(samples);

      // Detecta a frequência fundamental usando autocorrelação
      const detectedFreq = detectPitch(windowedSamples, AUDIO_CONFIG.sampleRate);

      setState(prev => ({
        ...prev,
        frequency: detectedFreq,
      }));
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
    }
  }, []);

  /**
   * Aplica janela de Hanning ao buffer de amostras
   * Suaviza as bordas do buffer para melhorar a detecção de frequência
   */
  const applyHanningWindow = (samples: Float32Array): Float32Array => {
    const windowed = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      // Fórmula da janela de Hanning
      const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (samples.length - 1)));
      windowed[i] = samples[i] * windowValue;
    }
    return windowed;
  };

  /**
   * Inicia a captura de áudio pelo microfone
   * Solicita permissão se necessário e configura o stream de áudio
   */
  const startListening = useCallback(async () => {
    // Verifica permissão
    const permitted = await requestPermission();
    if (!permitted) {
      setState(prev => ({
        ...prev,
        error: 'Permissão de microfone negada. Habilite nas configurações do dispositivo.',
        hasPermission: false,
      }));
      Alert.alert(
        'Permissão Negada',
        'O aplicativo precisa de acesso ao microfone para funcionar.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Inicializa o módulo de gravação com as configurações definidas
      AudioRecord.init(AUDIO_CONFIG);

      // Registra o callback para receber dados de áudio em tempo real
      AudioRecord.on('data', processAudioData);

      // Inicia a gravação
      AudioRecord.start();
      isActiveRef.current = true;

      setState(prev => ({
        ...prev,
        isListening: true,
        hasPermission: true,
        error: null,
      }));
    } catch (error) {
      console.error('Erro ao iniciar captura de áudio:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao acessar o microfone. Tente novamente.',
        isListening: false,
      }));
    }
  }, [requestPermission, processAudioData]);

  /**
   * Para a captura de áudio e limpa os recursos
   */
  const stopListening = useCallback(() => {
    isActiveRef.current = false;
    
    try {
      AudioRecord.stop();
    } catch (error) {
      console.error('Erro ao parar captura:', error);
    }

    // Limpa o timer de atualização se existir
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
      updateTimerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isListening: false,
      frequency: 0,
    }));
  }, []);

  // Limpa recursos ao desmontar o componente
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
  };
}
