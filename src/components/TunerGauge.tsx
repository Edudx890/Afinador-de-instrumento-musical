/**
 * TunerGauge.tsx - Componente visual do medidor de afinação
 * 
 * Exibe um ponteiro animado que indica:
 * - Centro: nota afinada (verde)
 * - Esquerda: nota grave (vermelho)
 * - Direita: nota aguda (vermelho)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';

interface TunerGaugeProps {
  cents: number;    // Desvio em cents (-50 a +50)
  status: 'afinado' | 'grave' | 'agudo' | 'silencio';
}

// Dimensões do medidor
const GAUGE_WIDTH = 280;
const GAUGE_HEIGHT = 160;
const CENTER_X = GAUGE_WIDTH / 2;
const CENTER_Y = GAUGE_HEIGHT - 20;
const RADIUS = 120;

/**
 * Converte o desvio em cents para ângulo do ponteiro
 * -50 cents = -60° (totalmente à esquerda)
 *  0 cents  =   0° (centro, afinado)
 * +50 cents = +60° (totalmente à direita)
 */
function centsToAngle(cents: number): number {
  return (cents / 50) * 60;
}

/**
 * Calcula as coordenadas X,Y da ponta do ponteiro
 * baseado no ângulo em graus
 */
function getPointerCoords(angleDeg: number, length: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER_X + length * Math.cos(angleRad),
    y: CENTER_Y + length * Math.sin(angleRad),
  };
}

export default function TunerGauge({ cents, status }: TunerGaugeProps) {
  // Valor animado para suavizar o movimento do ponteiro
  const animatedAngle = useRef(new Animated.Value(0)).current;
  const currentAngle = useRef(0);

  // Determina a cor do ponteiro baseado no status de afinação
  const pointerColor = status === 'afinado' ? '#00E676' :
                       status === 'silencio' ? '#546E7A' : '#FF5252';

  // Anima o ponteiro quando os cents mudam
  useEffect(() => {
    const targetAngle = centsToAngle(cents);
    
    Animated.spring(animatedAngle, {
      toValue: targetAngle,
      tension: 40,
      friction: 8,
      useNativeDriver: false, // SVG não suporta native driver
    }).start();
    
    currentAngle.current = targetAngle;
  }, [cents, animatedAngle]);

  // Gera as marcações do medidor (de -50 a +50 cents)
  const renderTicks = () => {
    const ticks = [];
    
    for (let i = -5; i <= 5; i++) {
      const angleDeg = (i / 5) * 60;
      const isCenter = i === 0;
      const isMajor = i % 1 === 0;
      
      const innerRadius = isCenter ? RADIUS - 25 : RADIUS - 15;
      const outerRadius = RADIUS;
      
      const start = getPointerCoords(angleDeg, innerRadius);
      const end = getPointerCoords(angleDeg, outerRadius);
      
      ticks.push(
        <Line
          key={i}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={isCenter ? '#00E676' : '#546E7A'}
          strokeWidth={isCenter ? 3 : 1.5}
        />
      );
    }
    return ticks;
  };

  // Ponta do ponteiro calculada a partir do ângulo animado
  const pointerAngle = centsToAngle(cents);
  const pointerTip = getPointerCoords(pointerAngle, RADIUS - 10);
  const pointerBase1 = getPointerCoords(pointerAngle + 5, 20);
  const pointerBase2 = getPointerCoords(pointerAngle - 5, 20);

  return (
    <View style={styles.container}>
      <Svg width={GAUGE_WIDTH} height={GAUGE_HEIGHT}>
        {/* Arco do medidor - fundo */}
        <Path
          d={`M ${CENTER_X - RADIUS} ${CENTER_Y} 
              A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER_X + RADIUS} ${CENTER_Y}`}
          fill="none"
          stroke="#1E3A5F"
          strokeWidth={20}
          strokeLinecap="round"
        />

        {/* Zona verde central (afinado) */}
        <Path
          d={`M ${getPointerCoords(-10, RADIUS).x} ${getPointerCoords(-10, RADIUS).y} 
              A ${RADIUS} ${RADIUS} 0 0 1 ${getPointerCoords(10, RADIUS).x} ${getPointerCoords(10, RADIUS).y}`}
          fill="none"
          stroke="#004D2C"
          strokeWidth={20}
          strokeLinecap="butt"
        />

        {/* Marcações de escala */}
        {renderTicks()}

        {/* Labels de escala */}
        <SvgText
          x={getPointerCoords(-60, RADIUS + 15).x}
          y={getPointerCoords(-60, RADIUS + 15).y}
          fill="#546E7A"
          fontSize="11"
          textAnchor="middle">
          -50
        </SvgText>
        <SvgText
          x={CENTER_X}
          y={CENTER_Y - RADIUS - 12}
          fill="#00E676"
          fontSize="11"
          textAnchor="middle">
          0
        </SvgText>
        <SvgText
          x={getPointerCoords(60, RADIUS + 15).x}
          y={getPointerCoords(60, RADIUS + 15).y}
          fill="#546E7A"
          fontSize="11"
          textAnchor="middle">
          +50
        </SvgText>

        {/* Ponteiro do medidor */}
        <Path
          d={`M ${pointerBase1.x} ${pointerBase1.y} 
              L ${pointerTip.x} ${pointerTip.y} 
              L ${pointerBase2.x} ${pointerBase2.y} Z`}
          fill={pointerColor}
          opacity={status === 'silencio' ? 0.3 : 1}
        />

        {/* Pivô central do ponteiro */}
        <Circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={8}
          fill={pointerColor}
          opacity={status === 'silencio' ? 0.3 : 1}
        />

        {/* Label de cents */}
        <SvgText
          x={CENTER_X}
          y={CENTER_Y + 35}
          fill={pointerColor}
          fontSize="13"
          fontWeight="bold"
          textAnchor="middle">
          {status === 'silencio' ? '--' : `${cents > 0 ? '+' : ''}${cents} cents`}
        </SvgText>
      </Svg>

      {/* Indicadores de GRAVE / AFINADO / AGUDO */}
      <View style={styles.labelsRow}>
        <Text style={[styles.statusLabel, status === 'grave' && styles.activeLabel]}>
          ▼ GRAVE
        </Text>
        <Text style={[styles.statusLabel, styles.centerLabel, status === 'afinado' && styles.activeCenterLabel]}>
          ● AFINADO
        </Text>
        <Text style={[styles.statusLabel, status === 'agudo' && styles.activeLabel]}>
          AGUDO ▲
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: GAUGE_WIDTH,
    marginTop: 8,
    paddingHorizontal: 10,
  },
  statusLabel: {
    color: '#546E7A',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: '#FF5252',
  },
  centerLabel: {
    color: '#546E7A',
  },
  activeCenterLabel: {
    color: '#00E676',
  },
});
