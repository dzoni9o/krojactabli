import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { BoxGeometry, EdgesGeometry, MathUtils, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Gabarit, PostavljenDeo } from '../lib/sklop';

/** Milimetri → jedinice scene. Kamera i kontrole vole male brojeve. */
const R = 0.01;
const FOV = 40;
/** Smer iz kog se korpus vidi: malo s desna, odozgo, spreda. */
const SMER = new Vector3(1, 0.78, 1.4).normalize();

function Ivice({
  mere,
  boja,
}: {
  mere: [number, number, number];
  boja: string;
}) {
  const geometrija = useMemo(() => {
    const kutija = new BoxGeometry(...mere);
    const ivice = new EdgesGeometry(kutija);
    kutija.dispose();
    return ivice;
  }, [mere]);

  useEffect(() => () => geometrija.dispose(), [geometrija]);

  return (
    <lineSegments geometry={geometrija}>
      <lineBasicMaterial color={boja} />
    </lineSegments>
  );
}

function Ploca({
  postavljen,
  izabran,
  onKlik,
}: {
  postavljen: PostavljenDeo;
  izabran: boolean;
  onKlik: () => void;
}) {
  const { kutija, boja } = postavljen;
  const mere: [number, number, number] = [kutija.sx * R, kutija.sy * R, kutija.sz * R];

  return (
    <mesh
      position={[
        (kutija.x + kutija.sx / 2) * R,
        (kutija.y + kutija.sy / 2) * R,
        (kutija.z + kutija.sz / 2) * R,
      ]}
      onClick={(e) => {
        e.stopPropagation();
        onKlik();
      }}
    >
      <boxGeometry args={mere} />
      <meshStandardMaterial color={izabran ? '#eaff00' : boja} roughness={0.72} metalness={0.05} />
      <Ivice mere={mere} boja={izabran ? '#ffffff' : '#0a0a0a'} />
    </mesh>
  );
}

function Gabaritnica({ gabarit }: { gabarit: Gabarit }) {
  const mere: [number, number, number] = [
    gabarit.sirina * R,
    gabarit.visina * R,
    gabarit.dubina * R,
  ];
  return (
    <group
      position={[(gabarit.sirina / 2) * R, (gabarit.visina / 2) * R, (gabarit.dubina / 2) * R]}
    >
      <Ivice mere={mere} boja="#3a3a3a" />
    </group>
  );
}

/** Rastojanje sa kog ceo gabarit staje u kadar, i za uske ekrane. */
function rastojanje(gabarit: Gabarit, odnosStrana: number): number {
  const poluprecnik =
    (Math.hypot(gabarit.sirina, gabarit.visina, gabarit.dubina) / 2) * R;
  const uspravniFov = MathUtils.degToRad(FOV);
  const vodoravniFov = 2 * Math.atan(Math.tan(uspravniFov / 2) * odnosStrana);
  const najuzi = Math.min(uspravniFov, vodoravniFov);
  return (poluprecnik / Math.sin(najuzi / 2)) * 1.15;
}

function Kontrole({ gabarit, centriranje }: { gabarit: Gabarit; centriranje: number }) {
  const { camera, gl, size } = useThree();
  const kontrole = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const k = new OrbitControls(camera, gl.domElement);
    k.enableDamping = true;
    k.dampingFactor = 0.12;
    kontrole.current = k;
    return () => {
      k.dispose();
      kontrole.current = null;
    };
  }, [camera, gl]);

  useEffect(() => {
    const k = kontrole.current;
    if (!k) return;
    const cilj = new Vector3(
      (gabarit.sirina / 2) * R,
      (gabarit.visina / 2) * R,
      (gabarit.dubina / 2) * R,
    );
    const d = rastojanje(gabarit, size.width / Math.max(size.height, 1));
    k.target.copy(cilj);
    k.minDistance = d * 0.25;
    k.maxDistance = d * 5;
    camera.position.copy(cilj).addScaledVector(SMER, d);
    camera.updateProjectionMatrix();
    k.update();
    // Namerno bez `size` u zavisnostima — promena visine tastature na telefonu
    // ne sme da vrati kameru na početak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centriranje, camera]);

  useFrame(() => kontrole.current?.update());
  return null;
}

export function Sklop3D({
  gabarit,
  delovi,
  izabranId,
  centriranje,
  onIzbor,
}: {
  gabarit: Gabarit;
  delovi: PostavljenDeo[];
  izabranId: string | null;
  /** Promena ove vrednosti vraća kameru u početni kadar. */
  centriranje: number;
  onIzbor: (id: string | null) => void;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.01, far: 300 }}
      onPointerMissed={() => onIzbor(null)}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
    >
      <color attach="background" args={['#101010']} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[6, 10, 8]} intensity={2.1} />
      <directionalLight position={[-7, 4, -6]} intensity={0.7} />

      <Gabaritnica gabarit={gabarit} />

      {delovi.map((p) => (
        <Ploca
          key={p.deo.id}
          postavljen={p}
          izabran={p.deo.id === izabranId}
          onKlik={() => onIzbor(p.deo.id)}
        />
      ))}

      <Kontrole gabarit={gabarit} centriranje={centriranje} />
    </Canvas>
  );
}
