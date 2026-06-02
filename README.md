# Afinador de Violão

Aplicativo mobile acadêmico para afinar violão em Android. O MVP usa React Native, Expo e TypeScript, com tela única de afinador, permissão de microfone, detecção de frequência e indicação visual de afinação.

Integrantes: Moreno Jones e Eduardo Amaral

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- EAS Build para gerar APK Android

## Requisitos

- Node.js 18 ou superior
- npm
- Conta Expo para build EAS
- Android físico para testar o microfone
- Android Studio/JDK apenas se for testar build nativo localmente

No Arch Linux, instale Node/npm via seu gerenciador de pacotes ou ferramenta de versionamento de Node. No Windows, use Node LTS e execute os comandos em PowerShell, CMD ou terminal integrado do VS Code.

## Instalação

```bash
npm install
```

## Rodar durante o desenvolvimento

```bash
npm start
```

Ou diretamente:

```bash
npx expo start
```

Importante: a detecção real de áudio usa `react-native-audio-record`, que é um módulo nativo. Por isso, o Expo Go não é suficiente para validar a captura de áudio PCM. Para testar o MVP completo, use um APK gerado pelo EAS ou um development build.

## Validação TypeScript

```bash
npm run typecheck
```

## APK Android

O projeto já possui perfil `preview` configurado em `eas.json` para gerar APK:

```bash
npm run build:android:apk
```

Comando equivalente:

```bash
npx eas-cli@latest build -p android --profile preview
```

Antes do primeiro build, pode ser necessário autenticar:

```bash
npx eas-cli@latest login
```

## Testar APK no Android físico

Use este fluxo para validar o MVP completo, incluindo microfone real:

1. Gere o APK preview:

   ```bash
   npm run build:android:apk
   ```

2. Aguarde o EAS finalizar o build.

3. Abra no telefone Android o link ou QR code exibido pelo EAS.

4. Baixe o arquivo `.apk`.

5. Se o Android bloquear a instalação, habilite a permissão de instalar apps desconhecidos para o navegador ou gerenciador de arquivos usado no download.

6. Instale o APK e abra o aplicativo.

7. Permita o acesso ao microfone quando o app solicitar.

8. Toque uma corda do violão e confira:
   - frequência detectada em Hz;
   - corda alvo ou mais próxima;
   - diferença em cents;
   - status visual: grave, afinada ou aguda.

Alternativa com `adb`, caso o APK tenha sido baixado no computador:

```bash
adb devices
adb install caminho/do/app.apk
```

Se já existir uma versão anterior instalada e o Android recusar a instalação:

```bash
adb install -r caminho/do/app.apk
```

Observação: o Expo Go não valida a captura real de áudio deste projeto, porque o microfone PCM usa `react-native-audio-record`, que é um módulo nativo.

## Funcionalidades do MVP

- Tela única de afinador
- Botão para iniciar/parar escuta do microfone
- Solicitação de permissão de microfone no Android
- Frequência detectada em Hz
- Corda do violão alvo ou mais próxima
- Diferença em cents
- Status visual: grave, afinada ou aguda
- Perfil EAS para gerar APK instalável

## Cordas padrão do violão

| Corda | Nota | Frequência |
| --- | --- | --- |
| 6ª | E2 | 82.41 Hz |
| 5ª | A2 | 110.00 Hz |
| 4ª | D3 | 146.83 Hz |
| 3ª | G3 | 196.00 Hz |
| 2ª | B3 | 246.94 Hz |
| 1ª | E4 | 329.63 Hz |

## Estrutura

```text
.
├── App.tsx
├── app.json
├── eas.json
├── index.ts
├── package.json
├── src
│   ├── components
│   │   ├── GuitarStringSelector.tsx
│   │   ├── ReferenceSounds.tsx
│   │   ├── TunerGauge.tsx
│   │   └── TunerScreen.tsx
│   ├── hooks
│   │   └── useAudioCapture.ts
│   ├── types
│   │   └── react-native-audio-record.d.ts
│   └── utils
│       └── noteDetection.ts
└── tsconfig.json
```

## Observações técnicas

- A permissão de microfone é declarada em `app.json`.
- O cálculo de cents compara a frequência detectada com a corda selecionada ou com a corda mais próxima.
- O módulo `react-native-audio-record` exige build nativo. Se o app abrir em um build sem esse módulo, a interface deve carregar, mas a captura real de áudio exibirá uma mensagem de indisponibilidade.
- A New Architecture está desativada em `app.json` para reduzir risco de incompatibilidade com o módulo nativo de áudio usado no MVP.
- O projeto não mantém uma pasta Android nativa completa no repositório. A configuração principal do Expo fica em `app.json` e `eas.json`.

## Comandos úteis

```bash
npm install
npm start
npm run typecheck
npx expo-doctor
npm run build:android:apk
```
