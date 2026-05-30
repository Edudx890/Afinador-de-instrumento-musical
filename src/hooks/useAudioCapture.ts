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
   * Inicia a captura de áudio pelo microfone
   * Solicita permissão se necessário. A leitura real de PCM será implementada
   * na task de áudio com uma biblioteca compatível com development build/EAS.
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

    isActiveRef.current = true;

    setState(prev => ({
      ...prev,
      isListening: true,
      hasPermission: true,
      frequency: 0,
      error: 'Captura de frequencia ainda sera implementada na task de audio.',
    }));
  }, [requestPermission]);

  /**
   * Para a captura de áudio e limpa os recursos
   */
  const stopListening = useCallback(() => {
    isActiveRef.current = false;

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
