# Changelog

All notable changes to the Call of Doody project will be documented in this file.

## [Unreleased]

### Added - v0.4.0 (2026-01-31)

#### Airbnb-Style Filter System
A complete filtering system inspired by Airbnb's design patterns for finding the perfect restroom.

**Filter Button (Top Right):**
- White circular button with hamburger icon (☰)
- Positioned next to the search bar
- Red badge dot appears when any filters are active
- Matches existing design language with shadows

**Slide-Up Filter Modal:**
- Full-screen modal with smooth spring animation
- Rounded top corners (20px) for iOS-native feel
- Close X button in header
- Sections separated by subtle dividers

**Filter Categories:**

1. **Access Type**
   - Pill-style selectors: All, Public Only, Private Only
   - Brown (#5D4037) selected state

2. **Amenities** (Multi-select)
   - ♿️ Accessible
   - 👶 Changing Table
   - 👨‍👩‍👧 Family Room
   - 🚽 Multiple Stalls
   - 🧻 Paper Towels
   - 💨 Hand Dryer
   - Checkmark indicator on selected items

3. **Minimum Cleanliness**
   - Pills with sublabels: Any, 3+ (Clean), 4+ (Very Clean), 5 (Spotless ✨)

4. **Distance from You** (Only shows if location available)
   - Any, < 1 mile, < 5 miles, < 10 miles

**Bottom Action Bar:**
- "Clear all" link (underlined text)
- "Show X restrooms" button (brown, full-width)
- Real-time count updates as filters change

**Active Filter Chips:**
- Horizontal scrolling chips below search bar
- Shows active filter labels
- Tap chip to remove that filter
- Compact, non-intrusive design

**Distance Calculations:**
- Haversine formula for accurate distance
- Displays "X.X mi away" on restroom detail card
- Smart formatting (feet for < 0.1 mi, decimal for < 10 mi)

**No Results State:**
- Clean card overlay: "No restrooms match your filters"
- "Clear filters" link for quick reset

#### New Utility: Distance Calculations
**File:** `src/utils/distance.js`

```javascript
import { calculateDistance, formatDistance, addDistanceToRestrooms, sortByDistance } from '../utils/distance';

// Calculate distance between two points (returns miles)
calculateDistance(lat1, lon1, lat2, lon2);

// Format for display: "500 ft", "1.5 mi", "12 mi"
formatDistance(miles);

// Add distance property to all restrooms
addDistanceToRestrooms(restrooms, userLocation);

// Sort restrooms closest first
sortByDistance(restrooms);
```

#### New Component: FilterModal
**File:** `src/components/FilterModal.js`

```javascript
import FilterModal, { AMENITY_OPTIONS, CLEANLINESS_OPTIONS, DISTANCE_OPTIONS } from '../components/FilterModal';

<FilterModal
  visible={showFilterModal}
  onClose={() => setShowFilterModal(false)}
  filters={filters}
  onFiltersChange={setFilters}
  resultCount={filteredRestrooms.length}
  hasUserLocation={!!userLocation}
  onClearAll={clearAllFilters}
/>
```

**Exported Constants:**
- `AMENITY_OPTIONS` - Array of amenity filter options
- `CLEANLINESS_OPTIONS` - Array with min values for filtering
- `DISTANCE_OPTIONS` - Array with max values for filtering

#### Performance Optimizations
- Client-side filtering with `useMemo` for instant updates
- `useCallback` for filter manipulation functions
- No re-fetching on filter changes
- Debounced distance calculations

---

### Added - v0.2.0 (2026-01-30)

#### Premium iOS-Style Bottom Sheet Modal
- **NEW**: Created `RestroomBottomSheet.js` component with award-winning design
- Smooth slide-up animation with spring physics (iOS-native feel)
- Backdrop fade effect for depth and focus
- Swipeable handle bar for intuitive dismissal
- Replaced full-screen navigation with modal overlay (better UX)

#### Enhanced Restroom Details Card
**Visual Design:**
- Hero image display with overlay badge
- Clean, modern typography with proper hierarchy
- Refined color palette (grays, blues, greens)
- Subtle shadows and elevation for depth
- Generous white space and padding

**Information Display:**
- ✅ Public/Private badge on hero image
- ✅ 5-star rating system with half-stars
- ✅ Gender facilities icon badge
- ✅ Cleanliness bar visualization (1-5 scale)
- ✅ Amenity cards with icons and labels
- ✅ Recent reviews with timestamps
- ✅ Full address and location name

**New Amenities Supported:**
- Paper Towels (🧻)
- Hand Dryer (💨)
- All existing amenities with better icons

**Action Buttons:**
- Primary: "Get Directions" (blue, elevated)
- Secondary: "Write Review" (outlined)
- Responsive touch feedback

#### Updated Data Model
**New Fields in `mockData.js`:**
```javascript
{
  isPrivate: boolean,     // Public vs Private facility
  imageUrl: string,       // Hero image URL
  gender: string,         // 'male', 'female', 'unisex', 'separate'
  // Extended amenities array
}
```

**Sample Images Added:**
- Using Unsplash placeholder images
- Real images can be uploaded to Firebase Storage later

#### MapScreen Improvements
- Uses bottom sheet instead of screen navigation
- Tap marker → sheet slides up instantly
- Tap backdrop or swipe down → sheet dismisses
- No navigation stack confusion
- Stays on map context

#### Design Philosophy
Following iOS Human Interface Guidelines:
- Native spring animations (tension: 65, friction: 10)
- Rounded corners (16-24px radius)
- System font weights (400, 500, 600, 700)
- Proper touch targets (44px minimum)
- Subtle shadows for hierarchy
- Clean, uncluttered layout

### Technical Details

**Animation Implementation:**
- `Animated.spring` for slide-up effect
- `Animated.timing` for backdrop fade
- `useNativeDriver: true` for 60fps performance
- Parallel animations for smooth composite effect

**Component Structure:**
```
RestroomBottomSheet
├── Modal (React Native)
├── Backdrop (touch to dismiss)
└── Animated Container
    ├── Handle Bar
    └── ScrollView
        ├── Hero Image + Badge
        ├── Title Section
        ├── Rating & Gender Row
        ├── Cleanliness Section
        ├── Amenities Grid
        ├── Reviews
        └── Action Buttons
```

**Performance Optimizations:**
- Lazy rendering (modal only renders when visible)
- Native driver for animations
- Memoized star rendering
- Optimized scroll performance

---

## [0.1.0] - 2026-01-30 - Initial Release

### Added
- Initial project setup with Expo (blank template)
- React Navigation stack navigator
- Interactive map with user location
- Restroom markers (toilet emoji)
- Basic restroom detail screen (deprecated in v0.2.0)
- Mock data with 5 NYC restroom locations
- Location permissions handling
- Comprehensive documentation (README, SETUP, ARCHITECTURE, CONTRIBUTING)

### Features
- Map view with current location
- 5 sample restroom locations
- Basic navigation between screens
- Rating and cleanliness display
- Amenity listing

---

## Roadmap

### v0.3.0 - User Submissions (Next)
- [ ] Add new restroom form
- [ ] Photo upload capability
- [ ] Form validation
- [ ] Points system integration

### v0.4.0 - Review System
- [ ] Write review functionality
- [ ] Star rating input
- [ ] Comment submission
- [ ] Review moderation

### v0.5.0 - Backend Integration
- [ ] Firebase setup
- [ ] User authentication
- [ ] Real-time data sync
- [ ] Cloud storage for images

### v1.0.0 - Production Ready
- [ ] Complete testing suite
- [ ] Performance optimization
- [ ] Offline mode
- [ ] App Store submission

---

## Breaking Changes
- **v0.2.0**: Removed full-screen `RestroomDetailScreen` in favor of bottom sheet modal
  - Update: MapScreen no longer uses React Navigation for details
  - Migration: Remove `RestroomDetailScreen` from navigation stack if customized

---

## Notes for Developers

### Bottom Sheet Usage
```javascript
import RestroomBottomSheet from '../components/RestroomBottomSheet';

const [modalVisible, setModalVisible] = useState(false);
const [selectedRestroom, setSelectedRestroom] = useState(null);

<RestroomBottomSheet
  visible={modalVisible}
  restroom={selectedRestroom}
  onClose={() => setModalVisible(false)}
/>
```

### Data Model Updates
Ensure all restroom objects include:
- `isPrivate` (boolean)
- `imageUrl` (string, can be null)
- `gender` ('male' | 'female' | 'unisex' | 'separate')

---

**Version Format:** [Major.Minor.Patch]
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes
