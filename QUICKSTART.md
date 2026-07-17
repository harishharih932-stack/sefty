# ⚡ Quick Start — 3 Steps

## Step 1: Install & Build (5 minutes)
```bash
npm install
npm run build
npx cap sync android
```

## Step 2: Create APK (10-15 minutes)
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

APK ready at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Step 3: Push to GitHub & Auto-Release (2 minutes)
```bash
git init
git add .
git commit -m "Initial: Women Safety AI"
git remote add origin https://github.com/YOUR-USERNAME/women-safety-ai.git
git branch -M main
git push -u origin main

# Auto-build on tag
git tag v1.0.0
git push --tags
```

✅ Done! APK auto-builds and uploads to GitHub Releases!

**Download link:** `https://github.com/YOUR-USERNAME/women-safety-ai/releases/latest/download/app-debug.apk`

---

## Test on Phone
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## What's Ready

✅ React frontend (UI, Telegram, voice, shake, location)  
✅ Kotlin backend (background volume trigger, GPS sharing)  
✅ Android build files (Gradle, manifest, permissions)  
✅ GitHub Actions (auto-releases APK)  

Everything included. Just build & ship! 🚀
