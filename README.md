<div align="center">

# 🚼 BabyGuard 🔒

<img src="resources/icon-only.png" alt="BabyGuard Icon" width="80" height="80">

**Secure P2P Baby Monitor** — Un'app web che crea una connessione diretta peer-to-peer (WebRTC) tra
due dispositivi per monitorare un bambino senza server, registrazioni o iscrizioni.

[![Download APK](https://img.shields.io/badge/Download-APK-brightgreen?style=for-the-badge)](https://github.com/vxrich/BabyGuard/android/app/build/outputs/apk/debug/babyguard.apk)

</div>

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

## 📋 Requisiti di Sistema

### Per lo sviluppo:

- **Node.js** >= 22.12.0
- **npm** >= 9.0.0 o **pnpm** >= 8.0.0
- **Git** (opzionale, per clonare il repository)

### Per l'utilizzo come app web:

- Browser moderno con supporto WebRTC:
  - **Chrome/Edge** >= 90
  - **Firefox** >= 88
  - **Safari** >= 14 (iOS 14+)
- Connessione HTTPS o localhost (richiesto per WebRTC)
- Permessi per **Camera** e **Microfono**

### Per l'utilizzo come app Android:

- **Android** >= 7.0 (API level 24)
- Permessi Camera e Microfono abilitati

---

## 🚀 Avvio rapido

### Installazione e sviluppo locale:

```bash
# Clona il repository (se non l'hai già fatto)
git clone https://github.com/yourusername/BabyGuard.git
cd BabyGuard

# Installa le dipendenze
yarn

# Avvia il server di sviluppo
yarn dev

# Apri http://localhost:5173 nel browser
```

### Build per produzione:

```bash
# Crea la build di produzione
yarn build

# Anteprima della build
yarn preview
```

### Download e installazione APK Android:

1. **Scarica l'APK** dall'ultima
   [release](https://github.com/yourusername/BabyGuard/releases/latest)
   - Oppure clicca sul badge "Download APK" in alto
2. Sul tuo dispositivo Android:
   - Vai su **Impostazioni** > **Sicurezza**
   - Abilita **Origini sconosciute** o **Installa app sconosciute**
   - Apri il file APK scaricato
   - Segui le istruzioni di installazione
3. Dopo l'installazione, concedi i permessi per Camera e Microfono quando richiesto

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

## ⚠️ Disclaimer e Responsabilità

**IMPORTANTE - LEGGI ATTENTAMENTE PRIMA DELL'UTILIZZO**

### Utilizzo Responsabile

BabyGuard è uno strumento progettato per **monitorare bambini in modo sicuro e responsabile**.
L'utilizzo di questa applicazione è a **vostro rischio e pericolo**.

### Limitazioni e Avvertenze

1. **Non sostituisce la supervisione diretta**: Questa app è un **ausilio** per la supervisione, non
   un sostituto della presenza fisica e dell'attenzione diretta di un adulto responsabile.

2. **Responsabilità dell'utente**: L'utente è **completamente responsabile** per:
   - L'utilizzo appropriato dell'applicazione
   - La sicurezza e il benessere del bambino monitorato
   - La protezione dei dispositivi e delle credenziali di accesso
   - La conformità alle leggi locali riguardanti la privacy e la sorveglianza

3. **Nessuna garanzia**: L'applicazione viene fornita "così com'è", senza garanzie di alcun tipo,
   esplicite o implicite, incluse ma non limitate a:
   - Disponibilità continua del servizio
   - Assenza di interruzioni o errori
   - Sicurezza assoluta della connessione
   - Accuratezza delle funzionalità

4. **Utilizzo improprio**: È **vietato** utilizzare questa applicazione per:
   - Monitorare persone senza il loro consenso esplicito
   - Scopi illegali o non etici
   - Violare la privacy di terzi
   - Qualsiasi attività che violi le leggi locali o internazionali

5. **Limitazione di responsabilità**: Gli sviluppatori e i contributori di BabyGuard **non sono
   responsabili** per:
   - Danni diretti, indiretti, incidentali o consequenziali derivanti dall'uso dell'applicazione
   - Perdita di dati, interruzioni di servizio o malfunzionamenti
   - Incidenti o problemi di sicurezza derivanti dall'uso improprio
   - Violazioni della privacy causate da configurazioni errate o utilizzo non autorizzato

6. **Sicurezza della rete**: Sebbene l'app utilizzi connessioni P2P sicure, l'utente è responsabile
   di:
   - Utilizzare reti sicure e affidabili
   - Proteggere i dispositivi da accessi non autorizzati
   - Mantenere aggiornati i dispositivi e l'applicazione

### Consenso all'utilizzo

Utilizzando BabyGuard, l'utente **accetta e riconosce** di aver letto, compreso e accettato questo
disclaimer. Se non sei d'accordo con questi termini, **non utilizzare questa applicazione**.

**Per domande o dubbi sull'utilizzo responsabile, consulta un professionista qualificato prima
dell'installazione.**

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

Questo progetto è rilasciato sotto licenza **MIT**. Vedi il file `LICENSE` per i dettagli completi.

---

## 🤝 Contribuire

Siamo aperti a contributi! Per contribuire:

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feat/AmazingFeature`)
3. Committa le tue modifiche (`git commit -m 'chore: some AmazingFeature'`)
4. Pusha al branch (`git push origin feat/AmazingFeature`)
5. Apri una Pull Request

### Linee guida per i contributi:

- Mantieni lo stile di codice esistente (Prettier + ESLint configurati)
- Scrivi una descrizione chiara delle modifiche
- Aggiungi test se applicabile
- Aggiorna la documentazione se necessario

---

## 📞 Contatti / Supporto

- **Issues**: Per bug o richieste di funzionalità, apri un
  [issue](https://github.com/yourusername/BabyGuard/issues)
- **Discussions**: Per domande generali, usa le
  [Discussions](https://github.com/yourusername/BabyGuard/discussions)
- **Security**: Per segnalare vulnerabilità di sicurezza, contatta direttamente i maintainer

---

## 🙏 Ringraziamenti

Progetto originale: **Secure P2P Baby Monitor**

Sviluppato con ❤️ per la sicurezza e il benessere dei bambini.

---

<div align="center">

**⚠️ Ricorda: BabyGuard è un ausilio, non un sostituto della supervisione diretta di un adulto
responsabile.**

**Buon utilizzo responsabile! ✅**

</div>
