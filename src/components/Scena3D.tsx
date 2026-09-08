import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { BoxGeometry, EdgesGeometry, MathUtils, Plane, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Element, Prostorija } from '../types/elementi';
import type { Kutija } from '../lib/generisi';

/** Milimetri → jedinice scene: 1 jedinica = 1 metar. */
const R = 0.001;
const FOV = 45;

export type Pogled = 'kosi' | 'odozgo';

export interface ElementUProstoru {
  element: Element;
  kutije: { k: Kutija; boja: string }[];
}

/* ── Ploče ──────────────────────────────────────────────── */

function Ivice({ mere, boja }: { mere: [number, number, number]; boja: string }) {
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
  k,
  boja,
  izabran,
  onPocetakVuce,
  onIzbor,
}: {
  k: Kutija;
  boja: string;
  izabran: boolean;
  onPocetakVuce: (e: ThreeEvent<PointerEvent>) => void;
  onIzbor: () => void;
}) {
  const mere: [number, number, number] = [k.sx * R, k.sy * R, k.sz * R];
  return (
    <mesh
      position={[(k.x + k.sx / 2) * R, (k.y + k.sy / 2) * R, (k.z + k.sz / 2) * R]}
      onPointerDown={(e) => {
        e.stopPropagation();
        // OrbitControls sluša isti pointerdown na platnu i počeo bi da vrti
        // scenu dok vučeš element. Njegov slušalac je dodat posle našeg, pa
        // ga ovim zaustavljamo pre nego što krene.
        e.nativeEvent.stopImmediatePropagation();
        onIzbor();
        onPocetakVuce(e);
      }}
    >
      <boxGeometry args={mere} />
      <meshStandardMaterial
        color={izabran ? '#eaff00' : boja}
        roughness={0.7}
        metalness={0.04}
      />
      <Ivice mere={mere} boja={izabran ? '#ffffff' : '#0a0a0a'} />
    </mesh>
  );
}

/* ── Prostorija ─────────────────────────────────────────── */

function Soba({ prostorija }: { prostorija: Prostorija }) {
  const s = prostorija.sirina * R;
  const d = prostorija.duzina * R;
  const v = prostorija.visina * R;
  const debljina = 0.04;

  return (
    <group>
      {/* pod */}
      <mesh position={[s / 2, -0.005, d / 2]} receiveShadow>
        <boxGeometry args={[s, 0.01, d]} />
        <meshStandardMaterial color="#1c1c1c" roughness={1} />
      </mesh>

      {/* mreža na podu, korak 1 m */}
      <gridHelper
        args={[Math.max(s, d), Math.max(s, d), '#2e2e2e', '#232323']}
        position={[s / 2, 0.002, d / 2]}
      />

      {/* zadnji zid (z = 0) i levi zid (x = 0) — dva su dovoljna da se vidi unutra */}
      <mesh position={[s / 2, v / 2, -debljina / 2]}>
        <boxGeometry args={[s, v, debljina]} />
        <meshStandardMaterial color="#151515" roughness={1} />
      </mesh>
      <mesh position={[-debljina / 2, v / 2, d / 2]}>
        <boxGeometry args={[debljina, v, d]} />
        <meshStandardMaterial color="#131313" roughness={1} />
      </mesh>
    </group>
  );
}

/* ── Kamera i kontrole ──────────────────────────────────── */

const SMER_KOSI = new Vector3(0.75, 0.72, 1).normalize();
/**
 * Tlocrt je strm kosi pogled, a ne pogled pravo naniže.
 *
 * Kamera koja gleda tačno dole ima pogled paralelan sa „gore" vektorom, pa
 * orijentacija ispadne nasumična — vučeš desno, element ode levo. Popravka
 * preko camera.up ne pomaže: OrbitControls svoju osnovu napravi pri
 * kreiranju i ne gleda kasnije izmene. Ovako je jednoznačno: desno je +X,
 * naniže po ekranu je ka posmatraču, a usput se vidi i visina elemenata.
 */
const SMER_ODOZGO = new Vector3(0, 0.94, 0.34).normalize();

/** Kutija koju kamera treba da uhvati: nameštaj ako ga ima, inače cela soba. */
function okvirKadra(prostorija: Prostorija, elementi: ElementUProstoru[]) {
  const kutije = elementi.flatMap((e) => e.kutije.map((x) => x.k));
  if (kutije.length === 0) {
    return {
      x: prostorija.sirina / 2,
      y: prostorija.visina / 3,
      z: prostorija.duzina / 2,
      sirina: prostorija.sirina,
      visina: prostorija.visina,
      dubina: prostorija.duzina,
    };
  }

  let x1 = Infinity, y1 = Infinity, z1 = Infinity;
  let x2 = -Infinity, y2 = -Infinity, z2 = -Infinity;
  for (const k of kutije) {
    x1 = Math.min(x1, k.x); y1 = Math.min(y1, k.y); z1 = Math.min(z1, k.z);
    x2 = Math.max(x2, k.x + k.sx); y2 = Math.max(y2, k.y + k.sy); z2 = Math.max(z2, k.z + k.sz);
  }
  // Malo vazduha okolo, da se vidi i pod oko nameštaja.
  const vazduh = 500;
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
    z: (z1 + z2) / 2,
    sirina: x2 - x1 + 2 * vazduh,
    visina: Math.max(y2 - y1, 600) + vazduh,
    dubina: z2 - z1 + 2 * vazduh,
  };
}

function Kontrole({
  prostorija,
  elementi,
  pogled,
  centriranje,
  vuce,
}: {
  prostorija: Prostorija;
  elementi: ElementUProstoru[];
  pogled: Pogled;
  centriranje: number;
  vuce: boolean;
}) {
  const { camera, gl, size } = useThree();
  const kontrole = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const k = new OrbitControls(camera, gl.domElement);
    k.enableDamping = true;
    k.dampingFactor = 0.14;
    k.maxPolarAngle = Math.PI / 2.02; // ne dozvoli da odeš ispod poda
    kontrole.current = k;
    return () => {
      k.dispose();
      kontrole.current = null;
    };
  }, [camera, gl]);

  // Dok se element vuče, okretanje scene mora da stane.
  useEffect(() => {
    if (kontrole.current) kontrole.current.enabled = !vuce;
  }, [vuce]);

  useEffect(() => {
    const k = kontrole.current;
    if (!k) return;
    const odozgo = pogled === 'odozgo';
    const okvir = okvirKadra(prostorija, elementi);
    const cilj = new Vector3(okvir.x * R, (odozgo ? 0 : okvir.y) * R, okvir.z * R);
    // Tlocrt kadrira pod; kosi pogled mora da uhvati i visinu.
    const poluprecnik = odozgo
      ? (Math.hypot(okvir.sirina, okvir.dubina) / 2) * R
      : (Math.hypot(okvir.sirina, okvir.visina, okvir.dubina) / 2) * R;
    const uspravni = MathUtils.degToRad(FOV);
    const vodoravni = 2 * Math.atan(Math.tan(uspravni / 2) * (size.width / Math.max(size.height, 1)));
    // Uklapanje po opisanoj sferi ostavlja dosta praznog oko sobe; ovim se
    // kadar zategne da soba popuni ekran, a i dalje stane cela.
    const popunjenost = odozgo ? 0.9 : 0.75;
    const d = (poluprecnik / Math.sin(Math.min(uspravni, vodoravni) / 2)) * popunjenost;

    k.target.copy(cilj);
    k.minDistance = d * 0.15;
    k.maxDistance = d * 4;
    camera.position.copy(cilj).addScaledVector(odozgo ? SMER_ODOZGO : SMER_KOSI, d);
    camera.updateProjectionMatrix();
    k.update();
    // Namerno bez `elementi`: kadar se ne sme pomerati na svaku izmenu, samo
    // na promenu pogleda ili na dugme za centriranje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centriranje, pogled, camera, prostorija.sirina, prostorija.duzina, prostorija.visina]);

  useFrame(() => kontrole.current?.update());
  return null;
}

/* ── Podloga za vučenje ─────────────────────────────────── */

/**
 * Nevidljiva ravan preko cele scene. Dok vučeš element, prst retko ostaje
 * na samoj ploči — pokret se hvata ovde, na podu, i pretvara u poziciju.
 */
function PodlogaZaVucenje({
  prostorija,
  aktivna,
  onPokret,
  onKraj,
}: {
  prostorija: Prostorija;
  aktivna: boolean;
  onPokret: (x: number, z: number) => void;
  onKraj: () => void;
}) {
  const s = prostorija.sirina * R;
  const d = prostorija.duzina * R;
  const veliko = Math.max(s, d) * 6;

  return (
    <mesh
      position={[s / 2, 0, d / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
      onPointerMove={(e) => {
        if (!aktivna) return;
        e.stopPropagation();
        onPokret(e.point.x / R, e.point.z / R);
      }}
      onPointerUp={() => aktivna && onKraj()}
    >
      <planeGeometry args={[veliko, veliko]} />
    </mesh>
  );
}

/* ── Scena ──────────────────────────────────────────────── */

export function Scena3D({
  prostorija,
  elementi,
  izabranId,
  pogled,
  centriranje,
  onIzbor,
  onPomeri,
  onKrajPomeranja,
}: {
  prostorija: Prostorija;
  elementi: ElementUProstoru[];
  izabranId: string | null;
  pogled: Pogled;
  centriranje: number;
  onIzbor: (id: string | null) => void;
  /** Zove se u toku vučenja, sa željenom pozicijom u mm. */
  onPomeri: (id: string, x: number, z: number) => void;
  onKrajPomeranja: () => void;
}) {
  const [vuceId, postaviVuceId] = useState<string | null>(null);
  const pomeraj = useRef({ dx: 0, dz: 0 });
  const ravanPoda = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);

  const pocetakVuce = useCallback(
    (element: Element) => (e: ThreeEvent<PointerEvent>) => {
      const tacka = new Vector3();
      if (!e.ray.intersectPlane(ravanPoda, tacka)) return;
      pomeraj.current = { dx: element.x - tacka.x / R, dz: element.z - tacka.z / R };
      postaviVuceId(element.id);
    },
    [ravanPoda],
  );

  const pokret = useCallback(
    (x: number, z: number) => {
      if (!vuceId) return;
      onPomeri(vuceId, x + pomeraj.current.dx, z + pomeraj.current.dz);
    },
    [vuceId, onPomeri],
  );

  const kraj = useCallback(() => {
    postaviVuceId(null);
    onKrajPomeranja();
  }, [onKrajPomeranja]);

  // Prst može da se digne izvan platna — bez ovoga bi element ostao „zalepljen".
  useEffect(() => {
    if (!vuceId) return;
    const gore = () => kraj();
    window.addEventListener('pointerup', gore);
    window.addEventListener('pointercancel', gore);
    return () => {
      window.removeEventListener('pointerup', gore);
      window.removeEventListener('pointercancel', gore);
    };
  }, [vuceId, kraj]);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.05, far: 200 }}
      onPointerMissed={() => onIzbor(null)}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
    >
      <color attach="background" args={['#0e0e0e']} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} />
      <directionalLight position={[-6, 5, -4]} intensity={0.6} />

      <Soba prostorija={prostorija} />

      <PodlogaZaVucenje
        prostorija={prostorija}
        aktivna={vuceId !== null}
        onPokret={pokret}
        onKraj={kraj}
      />

      {elementi.map(({ element, kutije }) =>
        kutije.map(({ k, boja }, i) => (
          <Ploca
            key={`${element.id}-${i}`}
            k={k}
            boja={boja}
            izabran={element.id === izabranId}
            onIzbor={() => onIzbor(element.id)}
            onPocetakVuce={pocetakVuce(element)}
          />
        )),
      )}

      <Kontrole
        prostorija={prostorija}
        elementi={elementi}
        pogled={pogled}
        centriranje={centriranje}
        vuce={vuceId !== null}
      />
    </Canvas>
  );
}
