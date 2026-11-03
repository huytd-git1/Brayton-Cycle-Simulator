import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/simulationStore';
import { formatTemp } from '../../utils/units';

// Rotating rotor stage component
interface RotorStageProps {
  x: number;
  outerRadius: number;
  innerRadius: number;
  bladeCount: number;
  color: string;
  speedMultiplier: number;
  pitchAngle?: number;
  isHighlighted?: boolean;
}

const RotorStage: React.FC<RotorStageProps> = ({
  x,
  outerRadius,
  innerRadius,
  bladeCount,
  color,
  speedMultiplier,
  pitchAngle = 0.35,
  isHighlighted,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { isPlaying, animSpeed } = useSimulationStore();

  useFrame((_, delta) => {
    if (isPlaying && groupRef.current) {
      groupRef.current.rotation.x += delta * 7 * animSpeed * speedMultiplier;
    }
  });

  const blades = useMemo(() => {
    const list: { angle: number; length: number }[] = [];
    for (let i = 0; i < bladeCount; i++) {
      list.push({
        angle: (i / bladeCount) * Math.PI * 2,
        length: outerRadius - innerRadius,
      });
    }
    return list;
  }, [bladeCount, outerRadius, innerRadius]);

  const bladeGeom = useMemo(() => {
    const length = outerRadius - innerRadius;
    const geom = new THREE.BoxGeometry(0.08, length, 0.28);
    geom.translate(0, length / 2, 0);
    return geom;
  }, [outerRadius, innerRadius]);

  const bladeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isHighlighted ? '#38bdf8' : color,
      metalness: 0.85,
      roughness: 0.25,
      emissive: isHighlighted ? '#0284c7' : '#000000',
      emissiveIntensity: isHighlighted ? 0.6 : 0,
    });
  }, [color, isHighlighted]);

  return (
    <group position={[x, 0, 0]}>
      {/* Central Hub Disc */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[innerRadius, innerRadius, 0.2, 32]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Rotating Blades */}
      <group ref={groupRef}>
        {blades.map((b, idx) => (
          <group key={idx} rotation={[b.angle, 0, 0]}>
            <mesh
              geometry={bladeGeom}
              material={bladeMaterial}
              position={[0, innerRadius, 0]}
              rotation={[0, pitchAngle, 0]}
            />
          </group>
        ))}
      </group>
    </group>
  );
};

// Streamline Flow Particles
interface FlowParticlesProps {
  T1: number;
  T2: number;
  T3: number;
  T4: number;
}

const FlowParticles: React.FC<FlowParticlesProps> = ({ T1, T2, T3, T4 }) => {
  const count = 350;
  const { isPlaying, animSpeed } = useSimulationStore();
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, speeds, phases, initialY, initialZ] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const ph = new Float32Array(count);
    const yArr = new Float32Array(count);
    const zArr = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 0.3 + Math.random() * 1.3;
      const angle = Math.random() * Math.PI * 2;
      const x = -6.5 + Math.random() * 13.0; // from inlet -6.5 to exhaust 6.5
      pos[i * 3] = x;
      pos[i * 3 + 1] = Math.cos(angle) * radius;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      yArr[i] = Math.cos(angle);
      zArr[i] = Math.sin(angle);
      spd[i] = 2.0 + Math.random() * 2.5;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return [pos, spd, ph, yArr, zArr];
  }, [count]);

  const colors = useMemo(() => {
    return new Float32Array(count * 3);
  }, [count]);

  // Interpolate color by thermodynamic temperature
  const colorCold = useMemo(() => new THREE.Color('#38bdf8'), []); // Sky blue
  const colorComp = useMemo(() => new THREE.Color('#06b6d4'), []); // Cyan
  const colorComb = useMemo(() => new THREE.Color('#f97316'), []); // Orange
  const colorTurb = useMemo(() => new THREE.Color('#ef4444'), []); // Red/Orange
  const colorExh = useMemo(() => new THREE.Color('#eab308'), []); // Yellow

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const colAttr = pointsRef.current.geometry.attributes.color;

    const array = posAttr.array as Float32Array;
    const colArray = colAttr.array as Float32Array;

    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      if (isPlaying) {
        array[i * 3] += speeds[i] * delta * animSpeed * 1.8;
        if (array[i * 3] > 6.2) {
          array[i * 3] = -6.5;
        }
      }

      const x = array[i * 3];
      // Radius profile matching engine internal gas path
      let maxR = 1.4;
      if (x < -4.0) {
        // Inlet diffuser
        maxR = 1.7 - (x + 6.5) * 0.1;
      } else if (x >= -4.0 && x < -1.2) {
        // Compressor convergence
        maxR = 1.5 - ((x + 4.0) / 2.8) * 0.45;
      } else if (x >= -1.2 && x < 1.4) {
        // Combustor
        maxR = 1.35;
      } else if (x >= 1.4 && x < 3.8) {
        // Turbine expansion
        maxR = 1.1 + ((x - 1.4) / 2.4) * 0.35;
      } else {
        // Nozzle exhaust cone
        maxR = 1.45 - ((x - 3.8) / 2.4) * 0.3;
      }

      const currentR = 0.25 + (Math.sin(phases[i] + x) * 0.5 + 0.5) * (maxR - 0.3);
      array[i * 3 + 1] = initialY[i] * currentR;
      array[i * 3 + 2] = initialZ[i] * currentR;

      // Color mapping based on temperature profile along engine
      if (x < -4.0) {
        // Inlet (T1)
        tempColor.copy(colorCold);
      } else if (x >= -4.0 && x < -1.2) {
        // Compressor (T1 -> T2)
        const factor = (x + 4.0) / 2.8;
        tempColor.lerpColors(colorCold, colorComp, factor);
      } else if (x >= -1.2 && x < 0.2) {
        // Combustor entry heating
        const factor = (x + 1.2) / 1.4;
        tempColor.lerpColors(colorComp, colorComb, factor);
      } else if (x >= 0.2 && x < 1.4) {
        // Peak combustion (T3)
        tempColor.lerpColors(colorComb, colorTurb, (x - 0.2) / 1.2);
      } else if (x >= 1.4 && x < 3.8) {
        // Turbine expansion (T3 -> T4)
        const factor = (x - 1.4) / 2.4;
        tempColor.lerpColors(colorTurb, colorComb, factor);
      } else {
        // Exhaust nozzle (T4)
        const factor = (x - 3.8) / 2.4;
        tempColor.lerpColors(colorComb, colorExh, factor);
      }

      colArray[i * 3] = tempColor.r;
      colArray[i * 3 + 1] = tempColor.g;
      colArray[i * 3 + 2] = tempColor.b;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.88}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Cutaway outer housing showing interior
const CutawayCasing: React.FC<{ isCombustorActive?: boolean }> = ({ isCombustorActive }) => {
  return (
    <group>
      {/* Intake Cowl (Cutaway 270 deg) */}
      <mesh position={[-5.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry
          args={[1.65, 1.85, 2.2, 36, 1, true, 0, Math.PI * 1.45]}
        />
        <meshStandardMaterial
          color="#334155"
          metalness={0.7}
          roughness={0.3}
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Compressor Casing (Cutaway) */}
      <mesh position={[-2.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry
          args={[1.4, 1.65, 3.2, 36, 1, true, 0, Math.PI * 1.45]}
        />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.8}
          roughness={0.25}
          side={THREE.DoubleSide}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Combustor Casing Outer Ring */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry
          args={[1.45, 1.45, 2.2, 36, 1, true, 0, Math.PI * 1.45]}
        />
        <meshStandardMaterial
          color={isCombustorActive ? '#ea580c' : '#475569'}
          emissive={isCombustorActive ? '#c2410c' : '#000000'}
          emissiveIntensity={isCombustorActive ? 0.6 : 0.05}
          metalness={0.85}
          roughness={0.25}
          side={THREE.DoubleSide}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Turbine Casing */}
      <mesh position={[2.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry
          args={[1.55, 1.45, 2.8, 36, 1, true, 0, Math.PI * 1.45]}
        />
        <meshStandardMaterial
          color="#334155"
          metalness={0.8}
          roughness={0.25}
          side={THREE.DoubleSide}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Exhaust Nozzle */}
      <mesh position={[4.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry
          args={[1.35, 1.55, 1.6, 36, 1, true, 0, Math.PI * 1.45]}
        />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.75}
          roughness={0.3}
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
};

// Main 3D Engine Assembly
export const Engine3DScene: React.FC = () => {
  const {
    mode,
    selectedProcess,
    idealResult,
    realResult,
    turbojetResult,
    tempUnit,
  } = useSimulationStore();

  const isIdeal = mode === 'IDEAL';
  const isReal = mode === 'REAL';
  const isTurbojet = mode === 'TURBOJET';

  // Station readings
  const T1 = isTurbojet ? turbojetResult.performance.Tt2 : idealResult.states[0].T;
  const P1 = isTurbojet ? turbojetResult.performance.Pt2 : idealResult.states[0].P;

  const T2 = isIdeal
    ? idealResult.states[1].T
    : isReal
    ? realResult.states[1].T
    : turbojetResult.performance.Tt3;
  const P2 = isIdeal
    ? idealResult.states[1].P
    : isReal
    ? realResult.states[1].P
    : turbojetResult.performance.Pt3;

  const T3 = isIdeal
    ? idealResult.states[2].T
    : isReal
    ? realResult.states[2].T
    : turbojetResult.performance.Tt4;
  const P3 = isIdeal
    ? idealResult.states[2].P
    : isReal
    ? realResult.states[2].P
    : turbojetResult.performance.Pt4;

  const T4 = isIdeal
    ? idealResult.states[3].T
    : isReal
    ? realResult.states[3].T
    : turbojetResult.performance.Tt5;
  const P4 = isIdeal
    ? idealResult.states[3].P
    : isReal
    ? realResult.states[3].P
    : turbojetResult.performance.Pt5;

  const V9 = isTurbojet ? turbojetResult.performance.V_exit : 0;
  const Fnet = isTurbojet ? turbojetResult.performance.F_net : 0;

  // Active highlights
  const isCompHighlighted = selectedProcess === 1;
  const isCombHighlighted = selectedProcess === 2;
  const isTurbHighlighted = selectedProcess === 3;
  const isExhHighlighted = selectedProcess === 4;

  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 2.5, 9.5], fov: 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} />
        <directionalLight position={[-10, -5, -10]} intensity={0.4} />
        <pointLight
          position={[0.1, 0, 0]}
          color="#ea580c"
          intensity={isCombHighlighted ? 4.5 : 2.5}
          distance={6}
        />

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={22}
          minDistance={3.5}
        />

        <group position={[0, -0.2, 0]}>
          {/* Central High-Speed Drive Shaft */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 11.2, 32]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.95}
              roughness={0.15}
            />
          </mesh>

          {/* Front Nose Cone (Inlet Spinner) */}
          <mesh position={[-6.2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.55, 1.4, 32]} />
            <meshStandardMaterial
              color="#0ea5e9"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Rear Exhaust Tailcone */}
          <mesh position={[5.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.45, 1.8, 32]} />
            <meshStandardMaterial
              color="#eab308"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>

          {/* 6 Compressor Stages (Axial blades decreasing in diameter, increasing hub) */}
          <RotorStage
            x={-3.8}
            outerRadius={1.5}
            innerRadius={0.45}
            bladeCount={20}
            color="#38bdf8"
            speedMultiplier={1.0}
            isHighlighted={isCompHighlighted}
          />
          <RotorStage
            x={-3.3}
            outerRadius={1.42}
            innerRadius={0.5}
            bladeCount={22}
            color="#38bdf8"
            speedMultiplier={1.0}
            isHighlighted={isCompHighlighted}
          />
          <RotorStage
            x={-2.8}
            outerRadius={1.34}
            innerRadius={0.55}
            bladeCount={24}
            color="#0ea5e9"
            speedMultiplier={1.0}
            isHighlighted={isCompHighlighted}
          />
          <RotorStage
            x={-2.3}
            outerRadius={1.26}
            innerRadius={0.6}
            bladeCount={26}
            color="#0ea5e9"
            speedMultiplier={1.0}
            isHighlighted={isCompHighlighted}
          />
          <RotorStage
            x={-1.8}
            outerRadius={1.18}
            innerRadius={0.65}
            bladeCount={28}
            color="#06b6d4"
            speedMultiplier={1.0}
            isHighlighted={isCompHighlighted}
          />
          <RotorStage
            x={-1.3}
            outerRadius={1.1}
            innerRadius={0.7}
            bladeCount={30}
            color="#06b6d4"
            speedMultiplier={1.0}
            isHighlighted={isCompHighlighted}
          />

          {/* Annular Combustor Chamber */}
          <group position={[0.1, 0, 0]}>
            {/* Swirler Injectors & Flame Ring */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.95, 0.22, 16, 48]} />
              <meshStandardMaterial
                color={isCombHighlighted ? '#ff4500' : '#f97316'}
                emissive="#ff2200"
                emissiveIntensity={isCombHighlighted ? 1.5 : 0.8}
                wireframe={false}
              />
            </mesh>
            {/* Inner combustor liner */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.72, 0.72, 1.8, 32, 1, true]} />
              <meshStandardMaterial
                color="#78350f"
                metalness={0.7}
                roughness={0.4}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* 3 Turbine Stages (Expanding blade diameter) */}
          <RotorStage
            x={1.7}
            outerRadius={1.22}
            innerRadius={0.68}
            bladeCount={28}
            color="#dc2626"
            speedMultiplier={1.0}
            pitchAngle={-0.45}
            isHighlighted={isTurbHighlighted}
          />
          <RotorStage
            x={2.3}
            outerRadius={1.34}
            innerRadius={0.62}
            bladeCount={26}
            color="#ea580c"
            speedMultiplier={1.0}
            pitchAngle={-0.45}
            isHighlighted={isTurbHighlighted}
          />
          <RotorStage
            x={2.9}
            outerRadius={1.46}
            innerRadius={0.55}
            bladeCount={24}
            color="#f59e0b"
            speedMultiplier={1.0}
            pitchAngle={-0.45}
            isHighlighted={isTurbHighlighted}
          />

          {/* Outer Cutaway Housing */}
          <CutawayCasing isCombustorActive={isCombHighlighted} />

          {/* Thermodynamic Streamline Particles */}
          <FlowParticles T1={T1} T2={T2} T3={T3} T4={T4} />

          {/* Ideal Closed-Cycle Heat Rejection Loop (Visible in Mode A/B or when process 4 selected) */}
          {(isIdeal || isReal || isExhHighlighted) && (
            <group position={[0, -2.4, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, 9.5, 16]} />
                <meshStandardMaterial
                  color={isExhHighlighted ? '#38bdf8' : '#334155'}
                  emissive={isExhHighlighted ? '#0284c7' : '#000000'}
                  emissiveIntensity={isExhHighlighted ? 0.8 : 0}
                  transparent
                  opacity={isExhHighlighted ? 0.9 : 0.45}
                />
              </mesh>
              <Text
                position={[0, -0.4, 0]}
                fontSize={0.24}
                color={isExhHighlighted ? '#38bdf8' : '#64748b'}
                anchorX="center"
                anchorY="middle"
              >
                {isTurbojet
                  ? 'Luồng khí xả ra môi trường (Open Atmospheric Exhaust)'
                  : 'Đường thải nhiệt tương đương chu trình kín 4 → 1 (Heat Rejection)'}
              </Text>
            </group>
          )}

          {/* 3D Station HUD Markers in Scene */}
          {/* Station 1: Compressor Inlet */}
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <group position={[-4.5, 2.2, 0]}>
              <mesh>
                <boxGeometry args={[1.8, 0.9, 0.05]} />
                <meshStandardMaterial color="#0f172a" transparent opacity={0.85} />
              </mesh>
              <Text
                position={[0, 0.22, 0.04]}
                fontSize={0.22}
                color="#38bdf8"
                anchorX="center"
                anchorY="middle"
              >
                Cửa vào (1)
              </Text>
              <Text
                position={[0, -0.15, 0.04]}
                fontSize={0.18}
                color="#e2e8f0"
                anchorX="center"
                anchorY="middle"
              >
                {`P1=${P1.toFixed(0)} kPa | ${formatTemp(T1, tempUnit, 0)}`}
              </Text>
            </group>
          </Float>

          {/* Station 2: Compressor Outlet */}
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <group position={[-1.2, 2.2, 0]}>
              <mesh>
                <boxGeometry args={[1.8, 0.9, 0.05]} />
                <meshStandardMaterial color="#0f172a" transparent opacity={0.85} />
              </mesh>
              <Text
                position={[0, 0.22, 0.04]}
                fontSize={0.22}
                color="#06b6d4"
                anchorX="center"
                anchorY="middle"
              >
                Sau nén (2)
              </Text>
              <Text
                position={[0, -0.15, 0.04]}
                fontSize={0.18}
                color="#e2e8f0"
                anchorX="center"
                anchorY="middle"
              >
                {`P2=${P2.toFixed(0)} kPa | ${formatTemp(T2, tempUnit, 0)}`}
              </Text>
            </group>
          </Float>

          {/* Station 3: Combustor Outlet / Turbine Inlet */}
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <group position={[1.3, 2.2, 0]}>
              <mesh>
                <boxGeometry args={[1.9, 0.9, 0.05]} />
                <meshStandardMaterial color="#0f172a" transparent opacity={0.85} />
              </mesh>
              <Text
                position={[0, 0.22, 0.04]}
                fontSize={0.22}
                color="#f97316"
                anchorX="center"
                anchorY="middle"
              >
                Vào Tuabin (3)
              </Text>
              <Text
                position={[0, -0.15, 0.04]}
                fontSize={0.18}
                color="#e2e8f0"
                anchorX="center"
                anchorY="middle"
              >
                {`P3=${P3.toFixed(0)} kPa | ${formatTemp(T3, tempUnit, 0)}`}
              </Text>
            </group>
          </Float>

          {/* Station 4: Turbine Outlet / Nozzle */}
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <group position={[4.5, 2.2, 0]}>
              <mesh>
                <boxGeometry args={[1.9, 0.9, 0.05]} />
                <meshStandardMaterial color="#0f172a" transparent opacity={0.85} />
              </mesh>
              <Text
                position={[0, 0.22, 0.04]}
                fontSize={0.22}
                color="#eab308"
                anchorX="center"
                anchorY="middle"
              >
                {isTurbojet ? 'Loa phụt (9)' : 'Ra Tuabin (4)'}
              </Text>
              <Text
                position={[0, -0.15, 0.04]}
                fontSize={0.18}
                color="#e2e8f0"
                anchorX="center"
                anchorY="middle"
              >
                {isTurbojet
                  ? `V=${V9.toFixed(0)} m/s | F=${(Fnet / 1000).toFixed(1)} kN`
                  : `P4=${P4.toFixed(0)} kPa | ${formatTemp(T4, tempUnit, 0)}`}
              </Text>
            </group>
          </Float>
        </group>
      </Canvas>

      {/* Floating HUD controls on top right of 3D canvas */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700/80 rounded-xl p-1.5 shadow-xl">
        <button
          onClick={resetCamera}
          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Đặt lại góc nhìn camera"
        >
          Đặt lại góc nhìn
        </button>
      </div>

      {/* Interactive process highlight pill selector at bottom */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-2xl px-3 py-1.5 shadow-2xl max-w-[95%] overflow-x-auto">
        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap mr-1">
          Điểm sáng quá trình:
        </span>
        <button
          onClick={() => useSimulationStore.getState().setSelectedProcess(0)}
          className={`px-2.5 py-1 rounded-xl text-xs font-medium transition whitespace-nowrap ${
            selectedProcess === 0
              ? 'bg-cyan-600 text-white font-semibold'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          Toàn bộ động cơ
        </button>
        <button
          onClick={() => useSimulationStore.getState().setSelectedProcess(1)}
          className={`px-2.5 py-1 rounded-xl text-xs font-medium transition whitespace-nowrap flex items-center gap-1 ${
            selectedProcess === 1
              ? 'bg-sky-500 text-white font-semibold shadow-md shadow-sky-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-sky-400"></span>
          1 → 2: Máy nén (Compressor)
        </button>
        <button
          onClick={() => useSimulationStore.getState().setSelectedProcess(2)}
          className={`px-2.5 py-1 rounded-xl text-xs font-medium transition whitespace-nowrap flex items-center gap-1 ${
            selectedProcess === 2
              ? 'bg-orange-500 text-white font-semibold shadow-md shadow-orange-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-orange-400"></span>
          2 → 3: Buồng đốt (Combustor)
        </button>
        <button
          onClick={() => useSimulationStore.getState().setSelectedProcess(3)}
          className={`px-2.5 py-1 rounded-xl text-xs font-medium transition whitespace-nowrap flex items-center gap-1 ${
            selectedProcess === 3
              ? 'bg-red-500 text-white font-semibold shadow-md shadow-red-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-red-400"></span>
          3 → 4: Tuabin (Turbine)
        </button>
        <button
          onClick={() => useSimulationStore.getState().setSelectedProcess(4)}
          className={`px-2.5 py-1 rounded-xl text-xs font-medium transition whitespace-nowrap flex items-center gap-1 ${
            selectedProcess === 4
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
          4 → 1: Thải nhiệt / Phụt xả (Exhaust)
        </button>
      </div>
    </div>
  );
};

