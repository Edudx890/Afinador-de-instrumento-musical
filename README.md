# 🎸 Afinador de Violão — React Native

Aplicativo mobile para afinar violão em tempo real usando o microfone do dispositivo.

**Integrantes:** Moreno Jones e Eduardo Amaral

---

## 📋 Pré-requisitos

- Node.js 18+
- React Native CLI
- Android Studio + Android SDK
- JDK 17
- Dispositivo Android (API 21+) ou Emulador com microfone

---

## 🚀 Como Rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Instalar pods (iOS — opcional)

```bash
cd ios && pod install && cd ..
```

### 3. Linkar bibliotecas nativas (React Native < 0.60)

```bash
npx react-native link
```

Para React Native 0.60+, o autolink já cuida disso automaticamente.

### 4. Adicionar permissão no AndroidManifest.xml

Já incluída em `android/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### 5. Adicionar sons de referência (opcional)

Coloque os arquivos `.mp3` em:
```
android/app/src/main/res/raw/
```

Nomes esperados:
| Arquivo         | Nota  | Frequência |
|-----------------|-------|------------|
| `ref_e2.mp3`    | Mi ²  | 82.41 Hz   |
| `ref_a2.mp3`    | Lá ²  | 110.00 Hz  |
| `ref_d3.mp3`    | Ré ³  | 146.83 Hz  |
| `ref_g3.mp3`    | Sol ³ | 196.00 Hz  |
| `ref_b3.mp3`    | Si ³  | 246.94 Hz  |
| `ref_e4.mp3`    | Mi ⁴  | 329.63 Hz  |

> Você pode gerar esses arquivos com Audacity, GarageBand ou qualquer sintetizador online.

### 6. Rodar no Android

```bash
# Inicia o Metro bundler
npx react-native start

# Em outro terminal, instala no dispositivo
npx react-native run-android
```

---

## 📁 Estrutura do Projeto

```
AfinadorViolao/
├── App.tsx                          # Componente raiz
├── package.json                     # Dependências
├── tsconfig.json                    # Configuração TypeScript
├── babel.config.js                  # Configuração Babel
├── metro.config.js                  # Configuração Metro
├── android/
│   ├── AndroidManifest.xml          # Permissões Android
│   └── app/src/main/res/raw/        # Sons de referência (.mp3)
└── src/
    ├── components/
    │   ├── TunerScreen.tsx          # Tela principal
    │   ├── TunerGauge.tsx           # Medidor visual (ponteiro)
    │   ├── GuitarStringSelector.tsx # Seletor de cordas
    │   └── ReferenceSounds.tsx      # Sons de referência
    ├── hooks/
    │   └── useAudioCapture.ts       # Hook de captura de áudio
    └── utils/
        └── noteDetection.ts         # Detecção de frequência e notas
```

---

## 🎵 Cordas do Violão (Afinação Padrão)

| Corda | Nota | Frequência |
|-------|------|-----------|
| 6ª (mais grossa) | E2 | 82.41 Hz |
| 5ª | A2 | 110.00 Hz |
| 4ª | D3 | 146.83 Hz |
| 3ª | G3 | 196.00 Hz |
| 2ª | B3 | 246.94 Hz |
| 1ª (mais fina) | E4 | 329.63 Hz |

---

## 🔧 Bibliotecas Utilizadas

| Biblioteca | Versão | Uso |
|------------|--------|-----|
| react-native | 0.73.4 | Framework base |
| react-native-audio-record | 0.2.2 | Captura de áudio PCM |
| react-native-sound | 0.11.2 | Reprodução de sons |
| react-native-svg | 14.1.0 | Medidor visual SVG |

---

## 📐 Algoritmo de Detecção

O app usa **autocorrelação** para detectar a frequência fundamental:

1. Captura buffer de áudio PCM (44100 Hz, mono, 16 bits)
2. Aplica **janela de Hanning** para reduzir vazamento espectral
3. Calcula **autocorrelação** para encontrar o período do sinal
4. Converte período → frequência (Hz)
5. Mapeia frequência → nota musical usando a fórmula:
   ```
   n = 12 × log₂(f / 440) + 69  (número MIDI)
   cents = 1200 × log₂(f_real / f_ideal)
   ```
6. Classifica: |cents| ≤ 8 → **afinado** | cents < 0 → **grave** | cents > 0 → **agudo**

---

## ⚠️ Solução de Problemas

**Microfone não funciona no emulador:**
- Certifique-se de que o emulador tem microfone configurado
- Use um dispositivo físico para melhor resultado

**Erro de permissão:**
- Vá em Configurações → Apps → AfinadorViolao → Permissões → Microfone

**Metro bundler não inicia:**
```bash
npx react-native start --reset-cache
```
