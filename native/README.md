# Loop (app iOS nativa)

Versione nativa di Loop Player, scritta in React Native con Expo (SDK 58).

## Cosa fa
- **Libreria**: titolo grande e ricerca native di iOS, copertine e tag letti dai file (MP3/M4A),
  scorri a sinistra per eliminare, tieni premuto per il menu (aggiungi a playlist, elimina).
- **Player**: si apre come scheda nativa (trascina in giù per chiuderla), sfondo con la copertina sfocata,
  loop brano / tutti / spento, casuale, loop di una sezione A–B, timer di spegnimento.
- **Riproduzione nativa**: la coda usa il lettore di sistema (AVQueuePlayer). Passaggio al brano successivo,
  loop e comandi della schermata di blocco funzionano anche a schermo spento.
- **Barra in basso nativa** (Liquid Glass su iOS 26) con il mini player come accessorio, come in Musica.
- **Playlist**: crea, rinomina, elimina, aggiungi brani con le spunte, riordina dal menu di ogni brano.
- **Palestra**: scheda a rotazione (Upper 1, Lower 1, Upper 2, Lower 2), serie da spuntare, peso per esercizio,
  timer di recupero nel mini player con suono e vibrazione alla fine. La scheda è in `src/lib/gym.ts`.
- **Aggiungi brani**:
  - *Sincronizza una cartella*: scegli la cartella "Loop Player" su Google Drive (o iCloud) dall'app File;
    importa solo i brani nuovi. Niente chiavi Google da configurare.
  - *Importa file*: uno o più brani dall'app File.
  - *Cartella Loop*: tutto ciò che copi in "Sul mio iPhone › Loop" (app File) o dal PC con l'app
    Dispositivi Apple entra nella libreria da solo all'apertura.

## Struttura
```
src/app/            schermate (Expo Router)
  (tabs)/           Libreria, Playlist, Palestra, Aggiungi
  player.tsx        player a schermo intero
  pick/[id].tsx     scelta dei brani per una playlist
src/lib/            logica: libreria, tag, player, palestra, azioni
src/components/     componenti dell'interfaccia
.github/workflows/  compilazione dell'IPA su GitHub
```

## Provarla subito con Expo Go (facoltativo)
Installa **Expo Go** dall'App Store, poi dal PC (stessa rete Wi‑Fi):
```
npm install
npx expo start
```
Inquadra il QR con la fotocamera dell'iPhone. Serve solo per provare: alcune funzioni native
(schermata di blocco, riproduzione in background) sono complete solo nell'app installata.

## Installarla sull'iPhone gratis (Apple ID normale)
1. **Compila l'IPA su GitHub**: nel repository apri *Actions › Build iOS (IPA non firmata) › Run workflow*.
   Dopo 15–25 minuti scarica l'artefatto **Loop-ipa** (è uno zip con dentro `Loop.ipa`).
   In alternativa pubblica un tag (`git tag ios-v1.0.0 && git push --tags`): l'IPA viene allegata alla release.
2. **Installa Sideloadly** sul PC (sideloadly.io). Su Windows servono anche iTunes e iCloud
   scaricati dal sito Apple (non dal Microsoft Store), come indicato da Sideloadly.
3. Collega l'iPhone via cavo, trascina `Loop.ipa` in Sideloadly, inserisci il tuo Apple ID e premi *Start*.
4. Sull'iPhone:
   - *Impostazioni › Privacy e sicurezza › Modalità sviluppatore*: attivala (l'iPhone si riavvia).
   - *Impostazioni › Generali › VPN e gestione dispositivi*: autorizza il tuo Apple ID.
5. **Ogni 7 giorni** la firma gratuita scade: ripeti il punto 3 con la stessa IPA. Reinstallando sopra
   l'app esistente brani, playlist e pesi restano. Con AltStore il rinnovo può avvenire da solo via Wi‑Fi.

Limiti dell'Apple ID gratuito: massimo 3 app installate così e 10 identificativi app a settimana.

## Aggiornare l'app
Il codice sta nella cartella `native/` del repository `player`. Modifica, fai commit e push, poi pubblica un tag
(`git tag ios-v1.0.1 && git push --tags`) oppure avvia il workflow a mano, e reinstalla la nuova IPA con Sideloadly.

## Comandi utili
```
npx tsc --noEmit                 # controllo dei tipi
npx expo-doctor                  # controllo di dipendenze e configurazione
npx expo export --platform ios   # verifica che il codice si impacchetti
```
