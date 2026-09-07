import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Jezik } from '../i18n';

export type Ekran = 'delovi' | 'raspored' | 'sklop' | 'materijali';

interface UiState {
  ekran: Ekran;
  jezik: Jezik;
  /** Deo koji se trenutno uređuje u donjoj fioci; null = zatvoreno. */
  deoUIzmeni: string | null;

  postaviEkran: (e: Ekran) => void;
  postaviJezik: (j: Jezik) => void;
  otvoriDeo: (id: string | null) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      ekran: 'delovi',
      jezik: 'sr',
      deoUIzmeni: null,
      postaviEkran: (ekran) => set({ ekran }),
      postaviJezik: (jezik) => set({ jezik }),
      otvoriDeo: (deoUIzmeni) => set({ deoUIzmeni }),
    }),
    { name: 'krojac-tabli/ui', version: 1, partialize: (s) => ({ jezik: s.jezik, ekran: s.ekran }) },
  ),
);
