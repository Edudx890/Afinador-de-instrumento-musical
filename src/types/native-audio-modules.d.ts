declare module 'react-native-audio-record' {
  interface AudioRecordOptions {
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
    wavFile?: string;
  }

  interface AudioRecordModule {
    init(options: AudioRecordOptions): void;
    on(event: 'data', callback: (data: string) => void): void;
    start(): void;
    stop(): void;
  }

  const AudioRecord: AudioRecordModule;
  export default AudioRecord;
}

declare module 'react-native-sound' {
  type SoundCallback = (error?: Error | null) => void;
  type PlayCallback = (success: boolean) => void;

  class Sound {
    static MAIN_BUNDLE: string;
    static setCategory(category: string): void;

    constructor(filename: string, basePath: string, callback?: SoundCallback);

    setVolume(value: number): void;
    play(callback?: PlayCallback): void;
    stop(): void;
    release(): void;
  }

  export default Sound;
}
