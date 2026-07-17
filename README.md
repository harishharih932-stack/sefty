# Women Safety AI — Complete Project

## 🎉 What You Have

This is a **complete, ready-to-build Android APK** for Women Safety AI. Everything is included:

✅ **Frontend:** React app (Lovable) — UI, components, logic, Telegram integration  
✅ **Backend:** Kotlin native code — background volume button trigger, location sharing, SOS alerts  
✅ **Configuration:** Android manifests, build files, Capacitor setup all pre-configured  
✅ **Deployment:** GitHub Actions auto-builds APK and uploads to Releases  

---

## 📋 Prerequisites

- **Node.js 18+** (for npm)
- **Java 17+** (for Android build)
- **Android SDK** (API 34)
- **Git** (to push to GitHub)
- **Gradle 8.2.0** (auto-installed via Android SDK)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build for Android
```bash
npm run build
npx cap sync android
cd android
chmod +x gradlew
./gradlew assembleDebug
```

APK will be ready at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 3: Upload to GitHub & Deploy
```bash
git init
git add .
git commit -m "Initial: Women Safety AI complete project"
git remote add origin https://github.com/YOUR-USERNAME/women-safety-ai.git
git branch -M main
git push -u origin main

# Tag for auto-release
git tag v1.0.0
git push --tags
```

GitHub Action will automatically build and upload APK to Releases! 🎉

---

## 📁 Project Structure

```
women-safety-ai/
├── src/                               # React Frontend
│   ├── routes/
│   │   ├── index.tsx                 (Home - SOS button, location, contacts)
│   │   ├── onboarding.tsx            (Registration, Telegram setup)
│   │   └── settings.tsx              (Trigger toggles, emergency phrases)
│   ├── components/                   (SOS button, emergency modal, etc.)
│   ├── hooks/                        (Location, battery, network, voice)
│   └── lib/
│       ├── sos-context.tsx           (SOS logic & state)
│       ├── telegram.ts               (Telegram API integration)
│       └── storage.ts                (LocalStorage/SharedPreferences sync)
│
├── android/                          # Native Android Code
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/womensafety/ai/
│   │   │   │   ├── SOSAccessibilityService.kt    (Background volume button)
│   │   │   │   ├── SOSForegroundService.kt       (Location + Telegram alerts)
│   │   │   │   └── SOSCapacitorPlugin.kt         (Bridge to React)
│   │   │   ├── AndroidManifest.xml               (Permissions + services)
│   │   │   └── res/
│   │   │       ├── xml/accessibility_service_config.xml
│   │   │       └── values/strings.xml
│   │   └── build.gradle              (Dependencies)
│   ├── build.gradle
│   └── settings.gradle
│
├── .github/
│   └── workflows/
│       └── build-release-apk.yml     (Auto-builds APK on git tag)
│
├── capacitor.config.ts               (Capacitor bridge config)
├── package.json                      (React + Capacitor dependencies)
├── vite.config.ts                    (Frontend build config)
└── README.md                         (This file)
```

---

## 🔧 What's Already Done

### ✅ Frontend (Lovable)
- Complete React app with TanStack Router
- Onboarding: user registration, trusted contacts, Telegram setup
- Home screen: SOS button, live location, battery, network status
- Settings: toggle triggers, customize sensitivity, edit contacts
- Emergency triggers: voice detection ("bachao bachao"), shake detection, volume button
- Journey Guardian: travel time estimation, safety confirmations
- Telegram integration: sends alerts with location + photos
- Professional white UI with Tailwind + shadcn/ui components

### ✅ Native Android (Kotlin)
- **Accessibility Service:** Background volume button detection (works when phone locked)
- **Foreground Service:** Location tracking + Telegram alerts every 45 seconds
- **Plugin Bridge:** React calls native functions via Capacitor
- **Permissions:** All declared (camera, location, microphone, notifications)
- **Build System:** Gradle configured with all dependencies

### ✅ Deployment
- GitHub Actions workflow ready (auto-builds on `git tag v*`)
- APK uploads to GitHub Releases automatically
- Download link: `https://github.com/YOUR-USER/women-safety-ai/releases/latest/download/app-debug.apk`

---

## 🎯 Features Included

### Emergency Triggers
1. **Volume Button (Background)** — Press 3 times quickly → SOS (works when phone locked)
2. **Voice Trigger** — Say "help help help" or "bachao bachao" → SOS
3. **Shake Detection** — Shake phone rapidly → "Are you safe?" confirmation
4. **Manual SOS Button** — Tap red button → instant alert

### Automatic Actions on SOS
- ✅ Capture photo from camera
- ✅ Get live GPS location
- ✅ Send Telegram alert with Google Maps link
- ✅ Keep sharing location every 45 seconds until manually stopped
- ✅ Show emergency status UI
- ✅ Periodic "Are you safe?" confirmation prompts

### Smart Features
- **Journey Guardian:** Track travel, auto-alert if delayed/off-route
- **Low Battery Alert:** Notify contacts when battery drops below 15%
- **Network Loss Detection:** Save last location, resend when online
- **Fall Detection:** Accelerometer detects sudden drops, prompts confirmation

### User Setup
- **Onboarding:** Name, phone, 3 emergency contacts, Telegram token/chat ID
- **Permissions:** Camera, location, microphone, accessibility service
- **Telegram:** Users set up their own bot (simple setup included)
- **Data Security:** Everything stored locally (SharedPreferences + LocalStorage)

---

## ⚙️ Important Note: Accessibility Service

**Accessibility Service** is the key to background volume-button detection. When APK is installed:

1. **Normal permissions** (camera, location) → appear as popups automatically ✅
2. **Accessibility Service** → user must manually enable in Settings > Accessibility

Your onboarding screen has an "Enable Background Protection" button that opens the right settings page. User taps the toggle once — that's it. No way around this (Android security design).

---

## 🛠️ Build & Test Locally

### 1. Install Node dependencies
```bash
npm install
```

### 2. Build React frontend
```bash
npm run build
```

### 3. Sync with Android
```bash
npx cap sync android
```

### 4. Build APK
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

### 5. Install on phone/emulator
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 6. Test
- Open app on Android phone
- Complete onboarding
- Press volume button 3x → SOS should trigger
- Check Telegram for alerts

---

## 📤 Deploy to GitHub & Release

### First Time
```bash
git init
git add .
git commit -m "Initial: Women Safety AI"
git remote add origin https://github.com/YOUR-USERNAME/women-safety-ai.git
git branch -M main
git push -u origin main
```

### Create Release (Automatic APK Upload)
```bash
git tag v1.0.0
git push --tags
```

**GitHub Actions workflow will:**
1. Detect the tag
2. Build APK automatically
3. Create a GitHub Release
4. Upload APK to Releases

Download link: `https://github.com/YOUR-USERNAME/women-safety-ai/releases/latest/download/app-debug.apk`

---

## 🔗 Update Download Link in App

In `src/routes/index.tsx` (or wherever your download button is), set:

```javascript
const downloadURL = "https://github.com/YOUR-USERNAME/women-safety-ai/releases/latest/download/app-debug.apk";
```

Users click → APK downloads instantly!

---

## 🐛 Troubleshooting

### Gradle Build Fails
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

### Kotlin Compilation Error
- Check Java version: `java -version` → should be 17+
- Update SDK: Android Studio → Tools → SDK Manager

### APK Install Fails
```bash
# Check device
adb devices

# Uninstall old version
adb uninstall com.womensafety.ai

# Install fresh
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Permissions Not Working
- Check AndroidManifest.xml has all permissions listed
- On Android 12+, users need to enable in app settings manually for some permissions

---

## 📚 Architecture Overview

```
User Opens App
       ↓
Lovable React Frontend
├── Onboarding (setup)
├── Home (SOS button)
├── Settings (triggers)
└── Emergency Modal
       ↓
Capacitor Bridge (JavaScript ↔ Kotlin)
       ↓
Native Kotlin Layer
├── Accessibility Service (background, volume button)
├── Foreground Service (location + Telegram)
└── Plugin Layer (bridging calls)
       ↓
Android OS
├── Location API
├── Camera
├── Telegram Bot API
└── Notifications
```

---

## 📞 Support for Users

### Telegram Setup
Users need:
1. Create bot via BotFather (`/start` on @BotFather)
2. Get Token (looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
3. Start a chat with the bot
4. Get Chat ID from bot response

App handles the rest!

---

## 🚀 Next Steps

1. ✅ You have the complete code
2. **Push to GitHub** (follow deploy steps above)
3. **Build locally** (follow build steps)
4. **Test on Android phone**
5. **Tag v1.0.0** → GitHub Actions auto-releases APK
6. **Share download link** with users

---

## 📝 License

Women Safety AI — Emergency Safety App for Women. 

Use, modify, distribute freely. Prioritize user safety above all.

---

**Built with ❤️ for women's safety.**

Happy coding! 🚀
