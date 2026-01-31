# 🛠️ Setup Guide - Call of Doody

Complete step-by-step instructions to get the project running on your machine.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js v18+** installed ([Download](https://nodejs.org/))
- [ ] **npm** (comes with Node.js)
- [ ] **Code editor** (VS Code recommended)
- [ ] **Git** for version control
- [ ] **Terminal/Command Line** access

### Optional (for native development)
- [ ] **Xcode** (Mac only, for iOS development)
- [ ] **Android Studio** (for Android development)
- [ ] **Expo Go** app on your phone (for physical device testing)

---

## Step-by-Step Installation

### 1. Verify Node.js Installation

```bash
node --version
# Should show v18.x.x or higher

npm --version
# Should show 9.x.x or higher
```

**If Node.js is not installed:**
- Visit https://nodejs.org/
- Download the LTS (Long Term Support) version
- Run the installer
- Restart your terminal after installation

---

### 2. Clone or Download the Project

**Option A: Using Git**
```bash
git clone https://github.com/yourusername/call-of-doody.git
cd call-of-doody
```

**Option B: Download ZIP**
- Download the project ZIP from GitHub
- Extract it to your desired location
- Open terminal in that directory

---

### 3. Install Project Dependencies

```bash
npm install
```

This installs all dependencies listed in `package.json`. It may take 1-2 minutes.

**What gets installed:**
- React Native core libraries
- Expo SDK and tools
- React Navigation packages
- Maps and location services
- All other dependencies

---

### 4. Install Expo-Specific Dependencies

```bash
npx expo install react-native-screens react-native-safe-area-context react-native-maps expo-location
```

These are platform-specific packages that need Expo's custom installation process.

---

### 5. Start the Development Server

```bash
npx expo start
```

You should see:
- Metro bundler starting
- QR code in terminal
- Development menu with options

---

### 6. Run the App

**Web Browser (Easiest)**
```bash
# In the terminal where Expo is running, press:
w
```
Your default browser opens with the app.

**iOS Simulator (Mac only)**
```bash
# Press:
i
```
Requires Xcode to be installed.

**Android Emulator**
```bash
# Press:
a
```
Requires Android Studio and an emulator to be set up.

**Physical Device**
1. Install **Expo Go** from App Store or Play Store
2. Scan the QR code shown in terminal
3. App loads on your device

---

## Troubleshooting Common Issues

### Issue: "Cannot find module 'node:fs'"
**Solution:** Your Node.js version is too old.
```bash
# Update Node.js to v18 or newer
# Download from https://nodejs.org/
```

### Issue: "EACCES: permission denied"
**Solution:** Don't use `sudo` with npm. If needed:
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Issue: "Port 8081 is already in use"
**Solution:** Another process is using the port.
```bash
# Kill the process
npx expo start --clear
# Or use a different port
npx expo start --port 8082
```

### Issue: Metro bundler stuck at "Building JavaScript bundle"
**Solution:** Clear the cache.
```bash
# Stop Expo (Ctrl+C)
npx expo start --clear
```

### Issue: Map not showing on web
**Solution:** Maps have limited support on web. Test on iOS/Android simulator or physical device for best experience.

### Issue: Location permissions not working
**Solution:** 
- **Web**: Browser may block location. Click the location icon in address bar to allow.
- **iOS/Android**: Grant location permissions when prompted.

---

## Project Structure After Setup

```
call-of-doody/
├── node_modules/          # Dependencies (auto-generated, don't edit)
├── src/
│   ├── screens/
│   │   ├── MapScreen.js
│   │   └── RestroomDetailScreen.js
│   ├── components/        # (empty, for future components)
│   └── data/
│       └── mockData.js
├── assets/                # Images, fonts
├── App.js                 # Main entry point
├── app.json              # Expo config
├── package.json          # Dependencies list
├── package-lock.json     # Locked versions
└── README.md             # Project documentation
```

---

## Configuration Files Explained

### package.json
Lists all project dependencies and scripts.

**Important sections:**
```json
{
  "dependencies": {
    "expo": "~52.x.x",
    "react-native": "x.x.x",
    "@react-navigation/native": "^6.x.x",
    "react-native-maps": "x.x.x"
  },
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

### app.json
Expo configuration for app metadata, permissions, etc.

**Key settings:**
- `name`: App display name
- `slug`: URL-friendly identifier
- `orientation`: Screen orientation lock
- `permissions`: Required device permissions (location, etc.)

---

## Verifying Installation

After setup, you should:

1. ✅ See a map with toilet emoji markers
2. ✅ See 5 restroom locations in NYC area
3. ✅ Be able to tap a marker and see details
4. ✅ Navigate back to map from detail screen
5. ✅ See your current location (blue dot) on map

**If all these work, your setup is complete!** 🎉

---

## Next Steps for Developers

1. **Explore the code**
   - Start with `App.js` to understand navigation
   - Check `MapScreen.js` for map implementation
   - Review `mockData.js` to understand data structure

2. **Make a small change**
   - Try changing the header color in `App.js`
   - Add a new mock restroom in `mockData.js`
   - Modify the map marker icon in `MapScreen.js`

3. **Set up version control**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

4. **Create a branch for your feature**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Workflow

### Daily Development
```bash
# 1. Pull latest changes
git pull origin main

# 2. Start Expo
npx expo start

# 3. Make changes to code
# Files auto-reload in most cases

# 4. Force reload if needed
# Press 'r' in terminal or shake device
```

### Adding New Dependencies
```bash
# For regular npm packages
npm install package-name

# For Expo-compatible packages
npx expo install package-name
```

### Clearing Cache (when things go wrong)
```bash
npx expo start --clear
```

---

## Testing on Different Platforms

### Web
- Fastest for UI development
- Limited native features (maps, location)
- Good for layout and logic testing

### iOS Simulator (Mac only)
- Full native features
- Best for testing iOS-specific behavior
- Requires Xcode installation

### Android Emulator
- Full native features
- Test Android-specific behavior
- Requires Android Studio setup

### Physical Device
- Most accurate testing
- Real-world performance
- Test actual GPS, sensors, etc.

---

## Getting Help

### Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

### Project-Specific Help
- Open an issue on GitHub
- Check existing issues for solutions
- Reach out to project maintainers

---

## Ready to Contribute?

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Code style
- Branch naming
- Pull request process
- Testing requirements

---

**Happy Coding! 🚀**
