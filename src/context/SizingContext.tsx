"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FitPreference } from '@/lib/sizing/sizing-engine';

interface SizingState {
  heightCm: number;
  weightKg: number;
  fitPreference: FitPreference;
  hasSavedProfile: boolean;
  setMeasurements: (height: number, weight: number, fit: FitPreference) => void;
  clearMeasurements: () => void;
}

const STORAGE_KEY = 'kakos_user_sizing_profile_v1';

const SizingContext = createContext<SizingState | undefined>(undefined);

export function SizingProvider({ children }: { children: React.ReactNode }) {
  const [heightCm, setHeightCm] = useState<number>(180);
  const [weightKg, setWeightKg] = useState<number>(78);
  const [fitPreference, setFitPreference] = useState<FitPreference>('regular');
  const [hasSavedProfile, setHasSavedProfile] = useState<boolean>(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.heightCm && parsed.weightKg) {
          setHeightCm(Number(parsed.heightCm));
          setWeightKg(Number(parsed.weightKg));
          setFitPreference(parsed.fitPreference || 'regular');
          setHasSavedProfile(true);
        }
      }
    } catch (e) {
      console.error('Error loading sizing profile from localStorage', e);
    }
  }, []);

  const setMeasurements = (h: number, w: number, f: FitPreference) => {
    setHeightCm(h);
    setWeightKg(w);
    setFitPreference(f);
    setHasSavedProfile(true);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ heightCm: h, weightKg: w, fitPreference: f, updatedAt: new Date().toISOString() })
      );
    } catch (e) {
      console.error('Error saving sizing profile to localStorage', e);
    }
  };

  const clearMeasurements = () => {
    setHasSavedProfile(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  return (
    <SizingContext.Provider
      value={{
        heightCm,
        weightKg,
        fitPreference,
        hasSavedProfile,
        setMeasurements,
        clearMeasurements,
      }}
    >
      {children}
    </SizingContext.Provider>
  );
}

export function useSizing() {
  const context = useContext(SizingContext);
  if (!context) {
    throw new Error('useSizing must be used within a SizingProvider');
  }
  return context;
}
