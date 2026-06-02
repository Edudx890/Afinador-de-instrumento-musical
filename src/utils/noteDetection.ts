/**
 * noteDetection.ts - Utilitário de detecção de notas musicais
 * 
 * Contém a lógica principal para:
 * - Mapear frequências para notas musicais (baseado no padrão A4 = 440Hz)
 * - Calcular o desvio em cents (unidade de afinação)
 * - Determinar se a nota está afinada, grave ou aguda
 */

// Tabela de notas padrão com suas frequências ideais (Hz)
export interface NoteInfo {
  note: string;       // Nome da nota (ex: "A", "E", "D")
  octave: number;     // Oitava da nota
  frequency: number;  // Frequência ideal em Hz
  cents: number;      // Desvio em cents (-50 a +50)
  status: 'afinado' | 'grave' | 'agudo' | 'silencio';
}

export interface GuitarString {
  string: number;
  note: string;
  octave: number;
  frequency: number;
}

export interface TuningResult {
  guitarString: GuitarString | null;
  detectedFrequency: number;
  targetFrequency: number;
  cents: number;
  status: NoteInfo['status'];
}

// Lista de notas musicais na escala cromática
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Notas do violão (cordas em afinação padrão: E2, A2, D3, G3, B3, E4)
export const GUITAR_STRINGS: GuitarString[] = [
  { string: 6, note: 'E', octave: 2, frequency: 82.41 },
  { string: 5, note: 'A', octave: 2, frequency: 110.00 },
  { string: 4, note: 'D', octave: 3, frequency: 146.83 },
  { string: 3, note: 'G', octave: 3, frequency: 196.00 },
  { string: 2, note: 'B', octave: 3, frequency: 246.94 },
  { string: 1, note: 'E', octave: 4, frequency: 329.63 },
];

/**
 * Converte frequência em Hz para nota musical
 * Usa o sistema temperado igual com A4 = 440Hz como referência
 * 
 * @param frequency - Frequência detectada em Hz
 * @returns Informações da nota mais próxima ou null se inválido
 */
export function frequencyToNote(frequency: number): NoteInfo | null {
  // Valida a frequência (faixa auditiva relevante para instrumentos)
  if (!frequency || frequency < 20 || frequency > 5000) {
    return {
      note: '--',
      octave: 0,
      frequency: 0,
      cents: 0,
      status: 'silencio',
    };
  }

  // Calcula o número de semitons a partir do A4 (440Hz)
  // Fórmula: n = 12 * log2(f / 440) + 49
  const semitonesFromA4 = 12 * Math.log2(frequency / 440);
  
  // Número MIDI da nota (A4 = 69)
  const midiNote = Math.round(semitonesFromA4) + 69;
  
  // Índice da nota na escala cromática (0 = C, 11 = B)
  const noteIndex = ((midiNote % 12) + 12) % 12;
  
  // Oitava da nota
  const octave = Math.floor(midiNote / 12) - 1;
  
  // Frequência ideal da nota detectada
  const idealFrequency = 440 * Math.pow(2, (midiNote - 69) / 12);
  
  // Calcula o desvio em cents (1 semitom = 100 cents)
  // Positivo = agudo, Negativo = grave
  const cents = Math.round(1200 * Math.log2(frequency / idealFrequency));

  // Define o status de afinação (tolerância de ±8 cents)
  let status: NoteInfo['status'];
  if (Math.abs(cents) <= 8) {
    status = 'afinado';
  } else if (cents < 0) {
    status = 'grave';
  } else {
    status = 'agudo';
  }

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    frequency: Math.round(idealFrequency * 100) / 100,
    cents: Math.max(-50, Math.min(50, cents)), // Limita entre -50 e +50
    status,
  };
}

/**
 * Encontra a corda do violão mais próxima da frequência detectada
 * 
 * @param frequency - Frequência detectada em Hz
 * @returns Dados da corda mais próxima
 */
export function findNearestGuitarString(frequency: number) {
  if (!frequency || frequency < 20) return null;

  let nearestString = GUITAR_STRINGS[0];
  let minDiff = Math.abs(getCentsDifference(frequency, nearestString.frequency));

  GUITAR_STRINGS.forEach(guitarString => {
    const diff = Math.abs(getCentsDifference(frequency, guitarString.frequency));

    if (diff < minDiff) {
      minDiff = diff;
      nearestString = guitarString;
    }
  });

  return nearestString;
}

export function getCentsDifference(frequency: number, targetFrequency: number): number {
  if (!frequency || !targetFrequency) return 0;
  return Math.round(1200 * Math.log2(frequency / targetFrequency));
}

export function getTuningResult(
  frequency: number,
  selectedString: number | null = null
): TuningResult {
  if (!frequency || frequency < 20) {
    const targetString = selectedString
      ? GUITAR_STRINGS.find(item => item.string === selectedString) ?? null
      : null;

    return {
      guitarString: targetString,
      detectedFrequency: 0,
      targetFrequency: targetString?.frequency ?? 0,
      cents: 0,
      status: 'silencio',
    };
  }

  const targetString = selectedString
    ? GUITAR_STRINGS.find(item => item.string === selectedString) ?? null
    : findNearestGuitarString(frequency);

  if (!targetString) {
    return {
      guitarString: null,
      detectedFrequency: frequency,
      targetFrequency: 0,
      cents: 0,
      status: 'silencio',
    };
  }

  const rawCents = getCentsDifference(frequency, targetString.frequency);
  const status: NoteInfo['status'] =
    Math.abs(rawCents) <= 8 ? 'afinado' : rawCents < 0 ? 'grave' : 'agudo';

  return {
    guitarString: targetString,
    detectedFrequency: frequency,
    targetFrequency: targetString.frequency,
    cents: Math.max(-50, Math.min(50, rawCents)),
    status,
  };
}

/**
 * Algoritmo de autocorrelação para detecção de pitch
 * Mais robusto que FFT simples para sons harmônicos como instrumentos de corda
 * 
 * @param buffer - Buffer de áudio PCM
 * @param sampleRate - Taxa de amostragem em Hz
 * @returns Frequência fundamental detectada em Hz
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  
  // Calcula a autocorrelação para cada lag possível
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  let foundGoodCorrelation = false;
  
  // Calcula RMS (volume do sinal) para filtrar silêncio
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // Se o sinal for muito fraco, retorna 0 (silêncio)
  if (rms < 0.01) return 0;

  let lastCorrelation = 1;
  
  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;

    // Calcula correlação para o offset atual
    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs((buffer[i]) - (buffer[i + offset]));
    }
    
    correlation = 1 - (correlation / MAX_SAMPLES);
    
    // Procura o primeiro pico de correlação (frequência fundamental)
    if (correlation > 0.9 && correlation > lastCorrelation) {
      foundGoodCorrelation = true;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    } else if (foundGoodCorrelation) {
      // Refinamento por interpolação parabólica para maior precisão
      const shift = (correlation - lastCorrelation) / (bestCorrelation - lastCorrelation);
      return sampleRate / (bestOffset + (8 * shift));
    }
    
    lastCorrelation = correlation;
  }

  // Retorna a frequência se encontrou boa correlação
  if (bestCorrelation > 0.01) {
    return sampleRate / bestOffset;
  }
  
  return 0;
}
