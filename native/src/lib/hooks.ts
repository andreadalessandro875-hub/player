import { useEffect, useState } from 'react';

/** Ora corrente aggiornata a intervalli, solo finché `active` è vero (per i conti alla rovescia). */
export function useNow(active: boolean, ms = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}

/** Opzioni comuni delle intestazioni con titolo grande e trasparenza in vetro. */
export const largeHeader = {
  headerLargeTitleEnabled: true,
  headerTransparent: true,
  headerShadowVisible: false,
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { color: '#FFFFFF' },
  headerLargeTitleStyle: { color: '#FFFFFF' },
  headerBlurEffect: 'systemChromeMaterialDark',
  contentStyle: { backgroundColor: '#000000' },
} as const;
