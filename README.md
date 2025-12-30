# BabyGuard 🚼🔒

**Secure P2P Baby Monitor** — Un'app web che crea una connessione diretta peer-to-peer (WebRTC) tra
due dispositivi per monitorare un bambino senza server, registrazioni o iscrizioni.

---

## ✨ Caratteristiche principali

- Connessione **P2P** diretta tramite PeerJS (WebRTC) — nessun server centrale per lo streaming dei
  dati.
- Accoppiamento sicuro via **QR code**: la camera mostra un QR contenente il Peer ID; il monitor lo
  scansiona per connettersi.
- Audio bidirezionale (talk-back): tieni premuto per parlare dal monitor verso la camera.
- Modalità **Eco** (schermo spento simulato), **Audio-only**, e indicatori di connessione.
- Funzionalità pensate per mobile: risveglio schermo (Wake Lock) e interfaccia touch-friendly.

---

## 🧭 Come funziona (breve)

1. Avvia l'app su due dispositivi (browser moderno su HTTPS o localhost).
2. Sul dispositivo che funge da **Camera**, consenti accesso a **camera + microfono**: verrà
   generato un QR contenente il Peer ID.
3. Sul dispositivo che funge da **Monitor**, scansiona il QR; il Monitor apre una chiamata WebRTC
   verso la Camera.
4. Lo stream video/audio passa direttamente tra i due dispositivi (STUN servers usati per la
   discovery; nessun server riceve lo stream).

---

## 🚀 Avvio rapido

Prerequisiti: Node >= 18, npm o pnpm.

Installazione e sviluppo:

```bash
npm install
npm run dev
# Apri http://localhost:5173
```

Build per produzione:

```bash
npm run build
npm run preview
```

---

## 📱 Esecuzione in Capacitor (opzionale)

Capacitor per impostazione predefinita carica le risorse web locali (il contenuto di `dist`). Questo
significa che l'app wrapper non punta a un URL remoto ma serve i file locali della build.

- Per iniziare (installare Capacitor CLI e core):

```bash
npm install
npm install --save-dev @capacitor/cli
npm install @capacitor/core
npx cap init "BabyGuard" com.secure.p2p.babyguard --web-dir=dist
```

- Copia le risorse web nella piattaforma nativa e aprila:

```bash
npm run build
npm run cap:copy
npm run cap:open:android
# oppure
npm run cap:open:ios
```

- Se vuoi che la WebView punti al server di sviluppo (live reload) durante lo sviluppo, imposta
  `server.url` nella `capacitor.config` o usa `npx cap copy` insieme a Vite dev server. Per una app
  destinata alla produzione, **non** impostare `server.url` e lascia che Capacitor serva i file da
  `dist`.

---

### Permessi (camera & microfono)

Per funzionare correttamente su dispositivi nativi, l'app richiede permessi **Camera** e
**Microphone**.

- **Android**: aggiungi nel file `android/app/src/main/AndroidManifest.xml` le seguenti righe (già
  aggiunte nel progetto):

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

- **iOS**: quando aggiungi la piattaforma iOS, assicurati di modificare il `Info.plist` e aggiungere
  le voci seguenti (sostituisci il testo con una descrizione appropriata):

```xml
<key>NSCameraUsageDescription</key>
<string>BabyGuard needs access to the camera to scan QR codes and stream video.</string>
<key>NSMicrophoneUsageDescription</key>
<string>BabyGuard needs access to the microphone for audio streaming.</string>
```

- **Runtime**: il codice dell'app ora chiama un helper che, su piattaforme native, prova a
  richiedere i permessi nativi prima di invocare `getUserMedia` per prevenire fallimenti su WebView
  native.

---

## ⚙️ Configurazione

- Configurazioni Peer e ICE (STUN/TURN) sono centralizzate in `src/types/index.ts` (`PEER_CONFIG`).
- Se hai bisogno di TURN (per reti NAT severe), aggiungi il tuo server TURN all'array `iceServers`.

Esempio:

```ts
export const PEER_CONFIG = {
  debug: 2,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      // Aggiungi qui un TURN se necessario
    ],
  },
};
```

---

## 📱 Uso

- Camera: consenti camera e microfono; condividi il QR generato.
- Monitor: consenti accesso alla fotocamera per scansionare il QR; tieni premuto il tasto "Hold to
  Talk" per parlare.

Note:

- Alcuni browser bloccano l'audio in autoplay: premi un tasto se l'audio remoto non parte
  automaticamente.
- L'app funziona meglio su versioni aggiornate di Chrome/Edge/Firefox/Safari mobile.

---

## 🔐 Privacy & Sicurezza

- I dati (video/audio) vengono trasmessi **direttamente** tra i due peer via WebRTC.
- Vengono usati solo server STUN per la discovery ICE; **nessun server centrale memorizza** lo
  stream.
- Se hai esigenze di resilienza in reti restrittive, configura un server TURN (potrebbe passare lo
  stream attraverso il provider TURN).
- Non forzare l'uso su reti non fidate senza valutare le implicazioni di rete.

---

## 🧩 Struttura del progetto (principale)

- `src/` — codice frontend React + Typescript
  - `features/CameraMode.tsx` — logica del dispositivo Camera
  - `features/MonitorMode.tsx` — logica del dispositivo Monitor + scanner QR
  - `services/ScannerService.ts` — decodifica QR (jsQR)
  - `utils/wakeLock.ts` — gestione Wake Lock
- `index.html`, `vite.config.ts`, `package.json` — configurazione progetto

---

## 🛠️ Contribuire

- Apri un issue per bug o feature.
- PR benvenute: mantieni lo stile di codice (Prettier + ESLint configurati) e scrivi una breve
  descrizione delle modifiche.

---

## 📄 Licenza

Nessuna licenza specificata (consiglio: aggiungi `MIT` se vuoi rendere il progetto open source).

---

## Contatti / Crediti

Progetto originale: **Secure P2P Baby Monitor**.

Per domande o suggerimenti apri un issue o invia una PR.

---

Buon testing! ✅
