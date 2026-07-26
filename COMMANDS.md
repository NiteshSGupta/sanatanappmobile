# React Native / Expo CLI Commands Reference

This file lists the essential commands to install dependencies, run, build, and troubleshoot this React Native application built with **Expo v56**.

---

## 🛠️ Project Setup & Installation

Before running the project, make sure you install the required dependencies.

```bash
# Install package dependencies
npm install
```

---

## 🚀 Running the App (Development)

The Metro bundler serves your application and compiles it dynamically as you edit code.

### 1. Start Metro Bundler
Starts the Metro dev server.
```bash
npm start
# OR
npm run start
# OR
npx expo start
```
*Tip: Once the server starts, you can use keyboard shortcuts in the terminal (e.g., press `a` for Android, `i` for iOS, `w` for Web, `r` to reload, or `d` to open developer tools).*

### 2. Run on Android Emulator/Device
Builds and runs the Android app on a running emulator or a connected physical USB device.
```bash
npm run android
# OR
npx expo run:android
```

### 3. Run on iOS Simulator/Device
Builds and runs the iOS app on an active iOS simulator.
```bash
npm run ios
# OR
npx expo run:ios
```

### 4. Run on Web
Launches the web version of the application in your browser.
```bash
npm run web
# OR
npx expo start --web
```

---

## 🧼 Clearing Cache & Troubleshooting

If you encounter unexpected bundle errors or caching issues, use these commands to clean the environment:

```bash
# Start Metro bundler with cache cleared (Recommended for weird errors)
npx expo start --clear
# OR
npm start -- --clear

# Reset the Expo Router template project to blank (moves starter code to app-example)
npm run reset-project
```

---

## 📝 Code Quality & Linting

```bash
# Run ESLint to analyze static code
npm run lint
# OR
npx expo lint
```

---

## 🏗️ Local Native Prebuilding

If you need to generate or regenerate the `/android` and `/ios` directories to work with native code locally:

```bash
# Generate the iOS and Android native folders based on app.json
npx expo prebuild

# Generate native folders and clean old builds first
npx expo prebuild --clean
```

---

## 📦 EAS Cloud Build (Expo Application Services)

Since `eas.json` is configured, you can build your app in the cloud using EAS. Make sure you have EAS CLI installed: `npm install -g eas-cli`

### Android Builds
```bash
# Build Android APK for testing (Preview profile)
eas build --platform android --profile preview

# Build Android App Bundle (.aab) for Google Play Store (Production profile)
eas build --platform android --profile production
```

### iOS Builds
```bash
# Build iOS build for internal testing (Preview profile)
eas build --platform ios --profile preview

# Build iOS build for App Store submission (Production profile)
eas build --platform ios --profile production
```

### Build for Both Platforms
```bash
eas build --platform all
```
