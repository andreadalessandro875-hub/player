import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toast } from '../components/Toast';
import { toast } from '../lib/actions';
import { loadGym } from '../lib/gym';
import { importInbox, loadLibrary } from '../lib/library';
import { initPlayer } from '../lib/player';
import { colors } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: colors.accent, background: colors.bg, card: colors.bg, text: colors.text, border: colors.line },
};

// I file audio lasciati nella cartella "Loop" (app File o PC) entrano nella libreria da soli.
async function importInboxQuietly() {
  const n = await importInbox();
  if (n) toast(n === 1 ? '1 brano aggiunto dalla cartella Loop' : `${n} brani aggiunti dalla cartella Loop`);
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await loadLibrary();
      await loadGym();
      try { await initPlayer(); } catch { /* audio non disponibile */ }
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
      importInboxQuietly();
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', st => { if (st === 'active') importInboxQuietly(); });
    return () => sub.remove();
  }, [ready]);

  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="player" options={{ presentation: 'modal' }} />
          <Stack.Screen name="pick/[id]" options={{ presentation: 'modal' }} />
        </Stack>
        <Toast />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
