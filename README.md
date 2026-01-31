# 🚽 Call of Doody

A React Native mobile application to help travelers and business professionals find public restrooms with crowd-sourced ratings, reviews, and detailed amenity information.

## 📱 Project Overview

**Call of Doody** addresses a common pain point for people traveling in unfamiliar cities - finding clean, accessible public restrooms. The app uses location services and community-driven data to provide real-time information about nearby facilities.

### Target Users
- Vacationers exploring new cities
- Business travelers and sales professionals
- Parents with young children
- People with accessibility needs

### Key Features (Current & Planned)
- ✅ Interactive map showing nearby restrooms
- ✅ Detailed facility information (cleanliness, amenities, accessibility)
- ✅ User ratings and reviews
- ⏳ Add new restroom locations
- ⏳ Gamification with points system
- ⏳ Filter and search functionality
- ⏳ User profiles and achievements

---

## 🏗️ Technical Architecture

### Framework & Routing
- **React Native**: Cross-platform mobile development (iOS, Android, Web)
- **Expo SDK**: Managed workflow for faster development and easier deployment
- **React Navigation**: Component-based navigation (NOT Expo Router)
  - Native Stack Navigator for screen transitions
  - Bottom Tabs Navigator (planned for future implementation)

### Navigation Architecture
This project uses **React Navigation** with a stack-based navigation pattern:
- `MapScreen` → Initial screen showing map with restroom markers
- `RestroomDetailScreen` → Detail view when user taps a marker
- Future screens will be added to the navigation stack as needed

**Important**: This is NOT using Expo Router (file-based routing). All navigation is handled through React Navigation components.

### Core Dependencies

#### Navigation & UI
```json
"@react-navigation/native": "^6.x",
"@react-navigation/native-stack": "^6.x",
"react-native-screens": "latest",
"react-native-safe-area-context": "latest"
```

#### Maps & Location
```json
"react-native-maps": "latest",
"expo-location": "latest"
```

#### Why These Choices?
- **React Navigation over Expo Router**: More control over navigation flow, widely adopted, better for complex navigation patterns
- **react-native-maps**: Industry standard for maps in React Native, supports Google Maps and Apple Maps
- **expo-location**: Simplified API for getting device location with permission handling

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer) - [Download here](https://nodejs.org/)
- npm (comes with Node.js)
- iOS Simulator (Mac only) or Android Studio for emulator
- OR use Expo Go app on your phone

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/call-of-doody.git
cd call-of-doody
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npx expo start
```

4. **Run the app**
- Press `w` to open in web browser (easiest for testing)
- Press `i` to open iOS Simulator (Mac only)
- Press `a` to open Android Emulator
- Scan QR code with Expo Go app on your phone

---

## 📂 Project Structure

```
CallOfDoody/
├── App.js                          # Main app entry point with navigation setup
├── src/
│   ├── screens/                    # All screen components
│   │   ├── MapScreen.js           # Map view with restroom markers
│   │   └── RestroomDetailScreen.js # Detailed restroom information
│   ├── components/                 # Reusable UI components (future)
│   └── data/
│       └── mockData.js            # Mock restroom data for development
├── assets/                         # Images, fonts, etc.
├── package.json                    # Dependencies and scripts
└── app.json                        # Expo configuration
```

### File Descriptions

**App.js**
- Sets up NavigationContainer (required for React Navigation)
- Configures Stack Navigator with screen components
- Defines global navigation styling (header colors, fonts)

**MapScreen.js**
- Requests and handles location permissions
- Displays interactive map centered on user's location
- Renders custom markers for each restroom
- Handles marker press events to navigate to detail screen

**RestroomDetailScreen.js**
- Displays comprehensive restroom information
- Shows ratings, cleanliness scores, amenities
- Renders mock reviews (will be replaced with real data)
- Provides buttons for directions and writing reviews

**mockData.js**
- Contains 5 sample restroom locations in NYC
- Used for development and testing
- Will be replaced with Firebase/backend integration

---

## 🗺️ Data Model

### Restroom Object Structure
```javascript
{
  id: string,              // Unique identifier
  name: string,            // Restroom name/location
  latitude: number,        // GPS coordinate
  longitude: number,       // GPS coordinate
  rating: number,          // Overall rating (0-5)
  cleanliness: number,     // Cleanliness score (1-5)
  amenities: string[],     // Array of available features
  gender: string,          // 'unisex' | 'separate'
  reviews: number,         // Total review count
  address: string          // Full address
}
```

### Amenity Types
- `toilets` - Standard toilet stalls
- `urinals` - Men's urinals
- `accessible` - Wheelchair accessible
- `changing_table` - Baby changing station
- `family` - Family/companion restroom
- `sinks` - Handwashing facilities

---

## 🎯 Development Roadmap

### Phase 1: MVP (Current)
- [x] Project setup with Expo
- [x] Basic navigation structure
- [x] Map view with location services
- [x] Restroom detail screen
- [x] Mock data for testing

### Phase 2: Core Features
- [ ] Add new restroom form
- [ ] Review submission functionality
- [ ] User profile screen
- [ ] Points/gamification system
- [ ] Filter and search

### Phase 3: Backend Integration
- [ ] Firebase setup (Authentication, Firestore, Storage)
- [ ] User authentication (email/Google/Apple)
- [ ] Real-time data sync
- [ ] Image upload for restroom photos
- [ ] Push notifications

### Phase 4: Enhanced Features
- [ ] Offline mode with cached data
- [ ] Directions integration (Google Maps/Apple Maps)
- [ ] Report inappropriate content
- [ ] Achievements and leaderboards
- [ ] Social features (following, sharing)

---

## 🔧 Development Notes

### Current Limitations
- Using mock data (no backend yet)
- No user authentication
- Reviews are hardcoded
- No data persistence
- Limited to web/simulator testing

### Known Issues
- Map requires Google Maps API key for production
- Location permissions must be granted for full functionality
- Web version has limited map features compared to native

### Testing
Currently testing with mock data of 5 NYC restroom locations:
1. Central Park Public Restroom
2. Starbucks - 5th Ave
3. Grand Central Terminal
4. Bryant Park Restroom
5. Times Square Visitor Center

---

## 🤝 Contributing

### Setup for Contributors
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Follow the existing code style
4. Test on both iOS and Android if possible
5. Submit a pull request

### Code Style
- Use functional components with hooks
- Follow existing file structure
- Comment complex logic
- Use meaningful variable names
- Keep components focused and single-purpose

---

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

---

## 👥 Team

- **Project Lead**: [Your Name]
- **Development**: [Team Members]

---

## 📧 Contact

Questions or suggestions? Open an issue or reach out to [your-email@example.com]

---

## 🙏 Acknowledgments

- Expo team for the excellent development framework
- React Navigation for robust navigation solutions
- The React Native community for valuable resources and support

---

**Built with ❤️ and React Native**
