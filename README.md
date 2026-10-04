# Loop Player

Web app (PWA) per ascoltare i tuoi brani in loop, anche a schermo spento. HTML/JS puro, nessuna build.

## Funzioni
- Libreria locale (IndexedDB) con ricerca; scorri a sinistra su un brano per eliminarlo (o usa *Modifica*)
- Titolo, artista e copertina letti dai tag dei file (MP3 ID3, M4A); sfondo del player col colore della copertina
- Player a scheda in stile iOS: trascinalo in giù per chiuderlo, scorri la copertina per cambiare brano
- Loop brano singolo / tutti / spento, riproduzione casuale, loop di una sezione A–B
- Timer di spegnimento (15 min – 1 ora e mezza)
- Trascina in giù la Libreria per sincronizzare con Drive
- Riprende l'ultimo brano e la posizione alla riapertura
- Controlli sul Lock Screen e Control Center (Media Session API)
- Importazione manuale dei file dal telefono
- Sincronizzazione con una cartella di Google Drive (scarica solo i brani nuovi)
- Funziona offline una volta installata

## Provarla in locale
```
node loop-player/dev-server.js 8080
```
Apri http://localhost:8080. L'importazione manuale funziona subito.

## Pubblicarla (gratis, serve HTTPS)
Carica la cartella `loop-player` su GitHub Pages, Netlify o Cloudflare Pages. Poi su iPhone:
Safari → apri l'indirizzo → Condividi → **Aggiungi a Home**. Apri l'app dall'icona sulla Home.

Per aggiornare l'app: ripubblica i file e cambia `VERSION` in `sw.js`.

## Sincronizzazione con Google Drive
1. Vai su https://console.cloud.google.com e crea un progetto.
2. *API e servizi → Libreria*: abilita **Google Drive API**.
3. *Schermata consenso OAuth*: tipo **Esterno**, aggiungi il tuo account Google come utente di test.
4. *Credenziali → Crea credenziali → ID client OAuth*: tipo **Applicazione web**.
   In *Origini JavaScript autorizzate* inserisci l'indirizzo dove pubblichi l'app
   (es. `https://tuonome.github.io`) e, per i test, `http://localhost:8080`.
5. Copia il Client ID in `config.js` (`GOOGLE_CLIENT_ID`).
6. Su Google Drive crea una cartella chiamata **Loop Player** (o cambia `DRIVE_FOLDER_NAME`)
   e copiaci i brani dal PC (anche con Google Drive per desktop).
7. Nell'app: *Sincronizza → Sincronizza ora*.

L'app chiede solo l'accesso in **sola lettura** (`drive.readonly`).

## Limiti noti
- L'accesso Google dura circa 1 ora: dopo, la sincronizzazione chiede di nuovo il consenso con un tocco.
  *Sincronizza all'apertura* parte da sola solo se l'accesso è ancora valido.
- I brani cancellati da Drive non vengono rimossi dall'app (rimuovili con *Modifica*).
- Titolo e artista vengono dal nome del file: usa il formato `Artista - Titolo.mp3`.
- Il loop A–B ha una precisione di circa 0,25 s. Tra un giro e l'altro del loop di un singolo brano
  può esserci un'impercettibile pausa, dipende dal formato (MP3 più marcata di M4A/WAV).
- Da verificare su iPhone reale: riproduzione ininterrotta con schermo spento per 30–60 minuti
  e passaggio automatico al brano successivo in background.
