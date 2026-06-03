# Arquitetura E Implementacao

## Objetivo

Este projeto entrega um afinador de violão em formato MVP para Android, com foco em:

- tela única simples;
- captura de microfone;
- processamento de pitch;
- feedback visual de afinação;
- geração de APK via EAS.

O desenho da solução prioriza clareza de separação entre interface, captura de áudio e regras de domínio.

## Stack E Modelo De Build

- Expo SDK 54 como base do projeto.
- React Native 0.81 para UI.
- TypeScript para tipagem e manutenção.
- `react-native-audio-record` para PCM bruto no Android.
- EAS Build para gerar APK instalável.

O app está em modo Expo managed, mas com módulo nativo de áudio. Isso significa que:

- a UI e o fluxo principal continuam organizados como app Expo;
- a captura real de áudio depende de build nativo;
- Expo Go não valida o fluxo completo de microfone;
- o APK preview é o caminho correto para teste funcional.

## Camadas Do Projeto

### Apresentacao

Arquivos principais:

- [`App.tsx`](../App.tsx)
- [`src/components/TunerScreen.tsx`](../src/components/TunerScreen.tsx)
- [`src/components/TunerGauge.tsx`](../src/components/TunerGauge.tsx)
- [`src/components/GuitarStringSelector.tsx`](../src/components/GuitarStringSelector.tsx)

Responsabilidade:

- montar a tela;
- mostrar a frequência detectada;
- mostrar a corda alvo;
- exibir cents e status;
- permitir iniciar e parar a escuta;
- manter o layout limpo para apresentação.

### Captura De Audio

Arquivo principal:

- [`src/hooks/useAudioCapture.ts`](../src/hooks/useAudioCapture.ts)

Responsabilidade:

- solicitar permissão de microfone no Android;
- inicializar o módulo nativo `react-native-audio-record`;
- receber buffers PCM em base64;
- converter os dados para `Float32Array`;
- encaminhar o buffer para o detector de pitch;
- atualizar o estado da UI com frequência, erro e status de escuta.

### Dominio Musical

Arquivo principal:

- [`src/utils/noteDetection.ts`](../src/utils/noteDetection.ts)

Responsabilidade:

- manter as frequências padrão das cordas;
- calcular cents;
- escolher a corda mais próxima;
- transformar frequência detectada em resultado de afinação;
- detectar pitch com algoritmo YIN.

### Configuracao De App E Build

Arquivos principais:

- [`app.json`](../app.json)
- [`eas.json`](../eas.json)
- [`package.json`](../package.json)

Responsabilidade:

- definir pacote Android;
- declarar permissão `RECORD_AUDIO`;
- desligar New Architecture para compatibilidade com o módulo nativo antigo;
- configurar o perfil `preview` para APK;
- expor scripts de desenvolvimento e build.

## Fluxo De Execucao

1. O usuário toca em iniciar.
2. `useAudioCapture` solicita permissão de microfone.
3. Se o build tiver o módulo nativo disponível, o hook inicializa `react-native-audio-record`.
4. O módulo emite blocos PCM em base64.
5. O hook converte o buffer para `Float32Array`.
6. `detectPitch` encontra a frequência fundamental.
7. `getTuningResult` compara a frequência com a corda escolhida ou a mais próxima.
8. A UI atualiza Hz, cents, corda e status.

## Detalhe Da Detecao

O algoritmo atual usa YIN com faixa limitada ao violão:

- cerca de 70 Hz a 400 Hz;
- redução de ruído por RMS;
- escolha de ponto com menor diferença acumulada;
- interpolação simples para melhorar a precisão.

Essa escolha foi mais estável do que a autocorrelação anterior, que estava retornando `0` até em sinais sintéticos válidos.

## Decisoes De Implementacao

- Manter a lógica musical em função pura, sem acoplamento com UI.
- Deixar a UI responsável só por renderização e interação.
- Guardar o módulo nativo atrás de uma checagem de `NativeModules` para não quebrar builds sem áudio nativo.
- Desativar New Architecture para reduzir risco de incompatibilidade com o pacote de áudio.
- Remover elementos decorativos desnecessários para o app ficar mais sério na apresentação.

## Estrutura Atual

- `App.tsx` registra a raiz do app.
- `src/components` concentra UI.
- `src/hooks` concentra ciclo de vida do microfone.
- `src/utils` concentra a lógica musical.
- `src/types` guarda tipos auxiliares do módulo nativo.

## Limitacoes Conhecidas

- `react-native-audio-record` exige APK ou development build.
- Expo Go não valida a captura real de áudio.
- O app ainda depende de teste em Android físico para confirmar comportamento final com microfone.
- O projeto ainda não inclui reprodução real dos sons de referência.

## Proximos Passos Tecnicos

- validar o APK em Android físico;
- observar frequência, cents e estabilidade visual;
- ajustar limiares de pitch se algum instrumento reagir melhor com parâmetros diferentes;
- manter README e documentação alinhados com a implementação real.
