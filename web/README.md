# VoxLedger (Next.js)

## Run on localhost
```bash
npm install
cp .env.local.example .env.local     # set NEXT_PUBLIC_API_BASE to the backend that has POST /voice
npm run dev                           # http://localhost:3000   (landing)  and  /app  (the app)
```

## Android APK (Capacitor, from the static export)
```bash
npm run build                         # creates ./out  (next.config.js has output: 'export')
npx cap add android                   # first time only
npm run cap:sync                      # build + copy ./out into the Android project
npm run cap:open                      # opens Android Studio -> Build > Build APK(s)
```
Android WebView has no Web Speech API, so the APK relies on `/voice` (Bhashini, then Sarvam on the server).
Add this to android/app/src/main/AndroidManifest.xml if the mic does not start:
`<uses-permission android:name="android.permission.RECORD_AUDIO" />`
`<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />`
The backend must allow CORS from `https://localhost` (the Capacitor origin) and your Vercel domain.

## Vercel preview
Push to GitHub, import the repo in Vercel (framework: Next.js), add env var NEXT_PUBLIC_API_BASE.
Every branch / pull request gets its own preview URL.

## /voice contract expected from the backend
POST multipart/form-data: `audio` (webm), `lang` (en-IN | hi-IN | pa-IN)  ->  200 `{ "text": "..." }`
