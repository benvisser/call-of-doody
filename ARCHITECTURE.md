# 🏛️ Architecture Documentation - Call of Doody

Technical architecture, design decisions, and development patterns.

---

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Navigation Architecture](#navigation-architecture)
3. [Component Structure](#component-structure)
4. [Data Flow](#data-flow)
5. [State Management](#state-management)
6. [Future Architecture Plans](#future-architecture-plans)

---

## Technology Stack

### Core Framework
**React Native (via Expo)**

**Why React Native?**
- Write once, deploy to iOS, Android, and Web
- Large ecosystem and community support
- Hot reloading for fast development
- Native performance with JavaScript productivity

**Why Expo?**
- Managed workflow simplifies native dependencies
- Built-in tools for common features (camera, location, maps)
- Easy over-the-air updates
- Simplified build and deployment process
- Can eject to bare workflow if needed

### Navigation: React Navigation (NOT Expo Router)

**Decision: React Navigation over Expo Router**

We chose React Navigation for this project because:

✅ **More Control**: Programmatic navigation, custom transitions, navigation guards
✅ **Battle-Tested**: Industry standard with years of production use
✅ **Better Documentation**: Extensive docs and community examples
✅ **Complex Navigation**: Better support for nested navigators, modals, drawer navigation
✅ **Team Familiarity**: Most React Native developers know React Navigation

**Trade-offs:**
- More boilerplate code than Expo Router
- Not file-based routing (manually define routes)
- Slightly larger bundle size

**Navigation Stack:**
```javascript
NavigationContainer
  └── Stack.Navigator
      ├── MapScreen (initial)
      ├── RestroomDetailScreen
      └── [Future screens added here]
```

### Maps: react-native-maps

**Why react-native-maps?**
- Industry standard for React Native mapping
- Supports both Google Maps (Android/Web) and Apple Maps (iOS)
- Active maintenance and community
- Rich feature set (markers, overlays, gestures)

**Alternative Considered:**
- Mapbox: More customization, but requires API key and has usage costs

### Location Services: expo-location

**Why expo-location?**
- Simplified permission handling
- Cross-platform API consistency
- Well-integrated with Expo ecosystem
- Background location support for future features

---

## Navigation Architecture

### Current Implementation

**Stack Navigator Pattern**

```
┌─────────────────────────────────────┐
│     NavigationContainer             │
│  (Manages navigation state)         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Stack.Navigator             │ │
│  │                               │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │ MapScreen (Home)        │ │ │
│  │  │ - Shows map             │ │ │
│  │  │ - Lists restrooms       │ │ │
│  │  │ - Handles location      │ │ │
│  │  └─────────────────────────┘ │ │
│  │            ↓ Navigate           │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │ RestroomDetailScreen    │ │ │
│  │  │ - Shows details         │ │ │
│  │  │ - Displays reviews      │ │ │
│  │  │ - Action buttons        │ │ │
│  │  └─────────────────────────┘ │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Navigation Flow

```javascript
// App.js - Navigation Setup
<NavigationContainer>
  <Stack.Navigator initialRouteName="Map">
    <Stack.Screen name="Map" component={MapScreen} />
    <Stack.Screen name="RestroomDetail" component={RestroomDetailScreen} />
  </Stack.Navigator>
</NavigationContainer>

// MapScreen.js - Navigate to detail
navigation.navigate('RestroomDetail', { restroom });

// RestroomDetailScreen.js - Access params
const { restroom } = route.params;
```

### Future Navigation Structure

```
NavigationContainer
  └── Tab.Navigator (Bottom tabs)
      ├── MapStack
      │   ├── MapScreen
      │   └── RestroomDetailScreen
      ├── AddStack
      │   └── AddRestroomScreen
      ├── SearchStack
      │   └── SearchScreen
      └── ProfileStack
          ├── ProfileScreen
          └── SettingsScreen
```

---

## Component Structure

### Screen Components

**MapScreen.js**
```
MapScreen
├── Location Request (useEffect)
├── MapView
│   ├── User Location Marker
│   └── Restroom Markers (map over data)
└── Legend Container
```

**Key Responsibilities:**
- Request and manage location permissions
- Fetch and display current location
- Render map with custom markers
- Handle marker press → navigate to detail

**State:**
- `location`: Current user coordinates
- `loading`: Permission/location loading state

**RestroomDetailScreen.js**
```
RestroomDetailScreen
├── Header (name, address)
├── Rating Section
├── Cleanliness Bar
├── Amenities Grid
├── Gender/Facilities Info
├── Action Buttons
└── Reviews List
```

**Key Responsibilities:**
- Display comprehensive restroom info
- Render dynamic amenities
- Show rating visualizations
- Provide action buttons (future: actual functionality)

**Data Source:**
- Receives `restroom` object via `route.params`

### Component Patterns

**Functional Components with Hooks**
```javascript
export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    getCurrentLocation();
  }, []);
  
  // Component logic...
}
```

**No Class Components**
- All components use modern functional syntax
- Hooks for state and lifecycle management
- Cleaner, more maintainable code

---

## Data Flow

### Current Data Architecture

```
mockData.js (Static Data)
      ↓
  MapScreen (Imports)
      ↓
  Renders Markers
      ↓
  User Taps Marker
      ↓
  Navigate with Data
      ↓
  RestroomDetailScreen
      ↓
  Display Details
```

### Data Structure

**Restroom Object Schema:**
```javascript
{
  id: string,              // Unique identifier
  name: string,            // Display name
  latitude: number,        // GPS coordinate
  longitude: number,       // GPS coordinate
  rating: number,          // 0-5, can be decimal
  cleanliness: number,     // 1-5, integer
  amenities: string[],     // Array of amenity types
  gender: string,          // 'unisex' | 'separate'
  reviews: number,         // Total review count
  address: string          // Full street address
}
```

**Amenity Types (Standardized):**
- `toilets`: Standard toilet stalls
- `urinals`: Men's urinals
- `accessible`: Wheelchair accessible
- `changing_table`: Baby changing station
- `family`: Family/companion restroom
- `sinks`: Handwashing facilities

### Future Data Flow (with Backend)

```
Firebase Firestore
      ↓
  API Service Layer
      ↓
  Redux/Context Store
      ↓
  Component Consumes
      ↓
  User Action
      ↓
  Update Store
      ↓
  Sync to Firebase
```

---

## State Management

### Current: Local Component State

**MapScreen:**
```javascript
const [location, setLocation] = useState(null);
const [loading, setLoading] = useState(true);
```

**RestroomDetailScreen:**
- No local state (receives data via props)

### Why No Global State Yet?

Current app is simple enough that:
- Data flows one direction (parent → child)
- No shared state between sibling components
- Mock data doesn't change

### Future State Management: Context API or Redux

**When to implement:**
- User authentication (logged-in user state)
- Real-time data updates
- Shared filters/search state
- Offline data caching

**Recommended Approach:**
```
React Context for:
- User authentication state
- Theme/preferences
- Simple app-wide settings

Redux Toolkit for:
- Complex data management
- Restroom listings
- Reviews and ratings
- Caching strategy
```

---

## API & Services Architecture

### Future Backend Integration

**Firebase Services:**
```
Firebase Auth
├── Email/Password
├── Google Sign-In
└── Apple Sign-In

Firestore Database
├── /restrooms (collection)
│   ├── {restroomId} (document)
│   │   ├── basic info
│   │   ├── ratings
│   │   └── amenities
│   └── /reviews (subcollection)
│       └── {reviewId}
├── /users (collection)
│   └── {userId}
│       ├── profile
│       ├── points
│       └── submissions
└── /reports (collection)

Firebase Storage
└── /restroom-images
    └── {restroomId}
        └── {imageId}.jpg
```

**API Service Layer:**
```javascript
// services/restroomService.js
export const fetchNearbyRestrooms = async (lat, lng, radius) => {
  // Firestore geoqueries
};

export const addRestroom = async (restroomData) => {
  // Add to Firestore, award points
};

export const submitReview = async (restroomId, reviewData) => {
  // Add review, update aggregate ratings
};
```

---

## Performance Considerations

### Current Optimizations

**Map Performance:**
- Limited markers shown at once (proximity-based)
- Custom marker components (not images)
- Memoization for marker rendering (future)

**Location Updates:**
- Single location fetch on mount
- Debounced location updates (future)

### Future Optimizations

**Data Fetching:**
- Pagination for reviews
- Incremental loading of restrooms
- Cached API responses

**Images:**
- Lazy loading
- Thumbnail generation
- CDN delivery

**Offline Support:**
- AsyncStorage for cached data
- Queue API calls when offline
- Sync when connection restored

---

## Security Considerations

### Current (Mock Data)
- No authentication
- No data validation
- Client-side only

### Future (Production)

**Authentication:**
- Firebase Auth for user management
- JWT tokens for API requests
- Secure session handling

**Data Validation:**
- Firestore Security Rules
- Backend validation functions
- Input sanitization

**Privacy:**
- User location not stored permanently
- Review anonymization options
- Report/moderation system

---

## Testing Strategy

### Current: Manual Testing
- Visual inspection in browser/simulator
- User flow testing

### Future Testing Pyramid

**Unit Tests** (Jest)
- Utility functions
- Data transformations
- Component logic

**Integration Tests** (React Native Testing Library)
- Component interactions
- Navigation flows
- API service calls

**E2E Tests** (Detox)
- Complete user journeys
- Critical paths (search, add, review)
- Cross-platform validation

---

## Deployment Architecture

### Current: Development Only
```
Local Machine
  ↓
Expo Dev Server
  ↓
Browser/Simulator
```

### Future: Production

**Build Process:**
```
Source Code
  ↓
Expo Build Service (EAS)
  ↓
iOS .ipa / Android .apk
  ↓
App Store / Play Store
```

**CI/CD Pipeline:**
```
GitHub Push
  ↓
GitHub Actions
  ├── Run Tests
  ├── Build App
  └── Deploy to Stores
```

**Over-the-Air Updates:**
- Expo OTA updates for JS changes
- No store review needed for minor updates

---

## Design Patterns Used

### Container/Presentational Pattern
- **Screens** = Container components (logic + data)
- **Components** = Presentational (UI only, reusable)

### Composition over Inheritance
- Small, focused components
- Compose complex UIs from simple pieces

### Declarative UI
- React's declarative paradigm
- State → UI rendering

---

## Development Principles

1. **Keep It Simple**: Start with simplest solution
2. **Iterate Quickly**: Working feature beats perfect code
3. **Type Safety**: Add TypeScript when complexity grows
4. **Test Important Paths**: Focus testing on critical features
5. **Document Decisions**: Why we chose X over Y

---

## Questions & Answers

**Q: Why React Navigation instead of Expo Router?**
A: More control, better for complex navigation, team familiarity.

**Q: When will we add Redux?**
A: When implementing real backend with user auth and complex state.

**Q: Why Expo managed workflow?**
A: Faster development, can eject later if needed.

**Q: Will we support offline mode?**
A: Yes, Phase 3 includes offline caching.

---

**Architecture Version:** 1.0  
**Last Updated:** January 2026  
**Next Review:** After Phase 2 completion
