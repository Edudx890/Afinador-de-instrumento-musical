/*
 * useAudioCapture.ts - Hook personalizado para captura de áudio
 *
 * Esta versão implementa a estratégia de áudio com um módulo nativo
 * (`react-native-audio-record`) para receber blocos de PCM em tempo real.
 *
 * Observação importante:
 * - Esta abordagem requer um build EAS personalizado / development build
 *   ou APK EAS, pois o Expo Go padrão não suporta módulos nativos não incluídos.
 * - O hook faz a permissão de microfone e processa os dados PCM para pitch.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import AudioRecord from 'react-native-audio-record';
import { Buffer } from 'buffer';
import { detectPitch } from '../utils/noteDetection';

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

const AUDIO_OPTIONS = {
  sampleRate: 44100,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 6,
  wavFile: 'recording.wav',
  bufferSize: 4096,
};

const base64ToFloat32Array = (base64: string): Float32Array => {
  const buffer = Buffer.from(base64, 'base64');
  const sampleCount = buffer.length / 2;
  const float32 = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i += 1) {
    const int16 = buffer.readInt16LE(i * 2);
    float32[i] = int16 / 32768;
  }

  return float32;
};

export function useAudioCapture(): UseAudioCaptureReturn {
  const [state, setState] = useState<AudioCaptureState>({
    frequency: 0,
    isListening: false,
    hasPermission: false,
    error: null,
  });

  const isActiveRef = useRef(false);
  const initializedRef = useRef(false);
  const frequencyRef = useRef(0);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Permissão de Microfone',
            message: 'O Afinador precisa acessar o microfone para detectar as notas do violão.',
            buttonNeutral: 'Perguntar depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Permitir',
          }
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Erro ao solicitar permissão:', error);
        return false;
      }
    }

    return true;
  }, []);

  const handleAudioData = useCallback((data: string) => {
    if (!isActiveRef.current) return;

    try {
      const floatData = base64ToFloat32Array(data);
      const pitch = detectPitch(floatData, AUDIO_OPTIONS.sampleRate);

      if (pitch > 0) {
        const smoothed = frequencyRef.current
          ? frequencyRef.current * 0.7 + pitch * 0.3
          : pitch;

        frequencyRef.current = smoothed;
        setState(prev => ({
          ...prev,
          frequency: Math.round(smoothed * 100) / 100,
          error: null,
        }));
      }
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
    }
  }, []);

  const initAudioRecord = useCallback(() => {
    if (initializedRef.current) return;
    AudioRecord.init(AUDIO_OPTIONS);
    AudioRecord.on('data', handleAudioData);
    initializedRef.current = true;
  }, [handleAudioData]);

  const startListening = useCallback(async () => {
    if (isActiveRef.current) return;

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

    initAudioRecord();
    isActiveRef.current = true;
    frequencyRef.current = 0;

    try {
      await AudioRecord.start();
      setState(prev => ({
        ...prev,
        isListening: true,
        hasPermission: true,
        frequency: 0,
        error: null,
      }));
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      isActiveRef.current = false;
      setState(prev => ({
        ...prev,
        isListening: false,
        frequency: 0,
        error: 'Não foi possível iniciar o microfone.',
      }));
    }
  }, [initAudioRecord, requestPermission]);

  const stopListening = useCallback(() => {
    if (!isActiveRef.current) {
      setState(prev => ({
        ...prev,
        isListening: false,
        frequency: 0,
      }));
      return;
    }

    isActiveRef.current = false;
    frequencyRef.current = 0;

    AudioRecord.stop().catch(error => {
      console.warn('Erro ao parar gravação:', error);
    });

    setState(prev => ({
      ...prev,
      isListening: false,
      frequency: 0,
    }));
  }, []);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      AudioRecord.stop().catch(() => null);
    };
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
  };
}
