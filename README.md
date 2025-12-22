# BabyGuard 🚼🔒

**Secure P2P Baby Monitor** — Un'app web che crea una connessione diretta peer-to-peer (WebRTC) tra due dispositivi per monitorare un bambino senza server, registrazioni o iscrizioni.

---

## ✨ Caratteristiche principali

- Connessione **P2P** diretta tramite PeerJS (WebRTC) — nessun server centrale per lo streaming dei dati.
- Accoppiamento sicuro via **QR code**: la camera mostra un QR contenente il Peer ID; il monitor lo scansiona per connettersi.
- Audio bidirezionale (talk-back): tieni premuto per parlare dal monitor verso la camera.
- Modalità **Eco** (schermo spento simulato), **Audio-only**, e indicatori di connessione.
- Funzionalità pensate per mobile: risveglio schermo (Wake Lock) e interfaccia touch-friendly.

---

## 🧭 Come funziona (breve)

1. Avvia l'app su due dispositivi (browser moderno su HTTPS o localhost).
2. Sul dispositivo che funge da **Camera**, consenti accesso a **camera + microfono**: verrà generato un QR contenente il Peer ID.
3. Sul dispositivo che funge da **Monitor**, scansiona il QR; il Monitor apre una chiamata WebRTC verso la Camera.
4. Lo stream video/audio passa direttamente tra i due dispositivi (STUN servers usati per la discovery; nessun server riceve lo stream).

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
- Monitor: consenti accesso alla fotocamera per scansionare il QR; tieni premuto il tasto "Hold to Talk" per parlare.

Note:
- Alcuni browser bloccano l'audio in autoplay: premi un tasto se l'audio remoto non parte automaticamente.
- L'app funziona meglio su versioni aggiornate di Chrome/Edge/Firefox/Safari mobile.

---

## 🔐 Privacy & Sicurezza

- I dati (video/audio) vengono trasmessi **direttamente** tra i due peer via WebRTC.
- Vengono usati solo server STUN per la discovery ICE; **nessun server centrale memorizza** lo stream.
- Se hai esigenze di resilienza in reti restrittive, configura un server TURN (potrebbe passare lo stream attraverso il provider TURN).
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
- PR benvenute: mantieni lo stile di codice (Prettier + ESLint configurati) e scrivi una breve descrizione delle modifiche.

---

## 📄 Licenza

Nessuna licenza specificata (consiglio: aggiungi `MIT` se vuoi rendere il progetto open source).

---

## Contatti / Crediti

Progetto originale: **Secure P2P Baby Monitor**.

Per domande o suggerimenti apri un issue o invia una PR.

---

Buon testing! ✅
