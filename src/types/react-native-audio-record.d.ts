declare module 'react-native-audio-record' {
  export interface AudioRecordOptions {
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
    audioSource?: number;
    wavFile?: string;
    bufferSize?: number;
  }

  export interface AudioRecordStatic {
    init(options: AudioRecordOptions): void;
    start(): Promise<void>;
    stop(): Promise<string>;
    on(event: 'data', callback: (data: string) => void): void;
  }

  const AudioRecord: AudioRecordStatic;
  export default AudioRecord;
}
