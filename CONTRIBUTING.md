# 🤝 Contributing to Call of Doody

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)

---

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior
- Be respectful and considerate
- Provide constructive feedback
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other unprofessional conduct

---

## Getting Started

### 1. Fork the Repository
Click the "Fork" button on GitHub to create your own copy.

### 2. Clone Your Fork
```bash
git clone https://github.com/YOUR-USERNAME/call-of-doody.git
cd call-of-doody
```

### 3. Add Upstream Remote
```bash
git remote add upstream https://github.com/ORIGINAL-OWNER/call-of-doody.git
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

---

## Development Workflow

### Branch Naming Convention

**Feature branches:**
```
feature/map-filters
feature/user-authentication
feature/review-submission
```

**Bug fixes:**
```
fix/marker-crash
fix/location-permission
```

**Documentation:**
```
docs/update-readme
docs/api-documentation
```

**Refactoring:**
```
refactor/map-screen
refactor/data-model
```

### Workflow Steps

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git merge upstream/main
   ```

2. **Make your changes**
   - Write clear, focused commits
   - Test your changes thoroughly
   - Update documentation if needed

3. **Run tests** (when implemented)
   ```bash
   npm test
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Use the PR template
   - Link related issues
   - Request reviews

---

## Coding Standards

### JavaScript/React Native Style

**Use functional components with hooks:**
```javascript
// ✅ Good
export default function MyScreen({ navigation }) {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Effect logic
  }, []);
  
  return <View>...</View>;
}

// ❌ Avoid
class MyScreen extends Component {
  // Class components
}
```

**Destructure props and state:**
```javascript
// ✅ Good
const { name, rating } = restroom;

// ❌ Avoid
const name = restroom.name;
const rating = restroom.rating;
```

**Use meaningful variable names:**
```javascript
// ✅ Good
const nearbyRestrooms = filterByDistance(restrooms, userLocation);

// ❌ Avoid
const data = func(x, y);
```

### File Organization

**Screen components:** `src/screens/ScreenName.js`
- PascalCase naming
- One screen per file
- Export as default

**Reusable components:** `src/components/ComponentName.js`
- PascalCase naming
- Single responsibility
- Export as default

**Utilities:** `src/utils/utilityName.js`
- camelCase naming
- Pure functions when possible

### Styling

**Use StyleSheet.create:**
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});
```

**Group related styles together:**
```javascript
// Container styles
container: { ... },
header: { ... },
body: { ... },
footer: { ... },

// Text styles
title: { ... },
subtitle: { ... },
bodyText: { ... },

// Button styles
button: { ... },
buttonText: { ... },
```

### Comments and Documentation

**Comment complex logic:**
```javascript
// Calculate distance using Haversine formula
const distance = haversineDistance(userLat, userLng, restroomLat, restroomLng);
```

**Document functions with JSDoc (when complexity warrants it):**
```javascript
/**
 * Filters restrooms by distance from user location
 * @param {Array} restrooms - Array of restroom objects
 * @param {Object} location - User's current location {lat, lng}
 * @param {number} maxDistance - Maximum distance in kilometers
 * @returns {Array} Filtered array of nearby restrooms
 */
function filterByDistance(restrooms, location, maxDistance) {
  // Implementation
}
```

---

## Commit Guidelines

### Commit Message Format

```
type(scope): brief description

Detailed explanation of what changed and why.

Closes #123
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(map): add filter by cleanliness rating

Added dropdown filter to MapScreen allowing users to filter
restrooms by minimum cleanliness score (1-5 stars).

Closes #42
```

```bash
fix(location): handle permission denial gracefully

App now shows default location (NYC) when user denies
location permission instead of crashing.

Fixes #38
```

```bash
docs(readme): update installation instructions

Added troubleshooting section for common setup errors.
```

---

## Pull Request Process

### Before Submitting

1. ✅ Code follows style guidelines
2. ✅ All tests pass (when implemented)
3. ✅ Documentation updated if needed
4. ✅ Commits are clean and well-described
5. ✅ Branch is up to date with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How were these changes tested?

## Screenshots (if applicable)
Before/after screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Review Process

1. **Submit PR** with clear description
2. **Automated checks** run (when set up)
3. **Code review** by maintainers
4. **Address feedback** with new commits
5. **Approval and merge** by maintainer

### After PR is Merged

1. Delete your feature branch
   ```bash
   git branch -d feature/your-feature-name
   ```

2. Update your local main
   ```bash
   git checkout main
   git pull upstream main
   ```

---

## Issue Reporting

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Device/platform info

**Template:**
```markdown
**Bug Description**
Clear description of what's wrong

**Steps to Reproduce**
1. Go to '...'
2. Tap on '...'
3. See error

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- Device: iPhone 14 Pro
- OS: iOS 17.2
- App Version: 1.0.0
```

### Feature Requests

Include:
- Problem being solved
- Proposed solution
- Alternatives considered
- Additional context

---

## Development Best Practices

### Testing Your Changes

**Manual Testing Checklist:**
- [ ] Works on iOS simulator
- [ ] Works on Android emulator
- [ ] Works in web browser
- [ ] No console errors
- [ ] UI looks correct on different screen sizes
- [ ] Navigation works as expected

### Performance Considerations

- Avoid unnecessary re-renders
- Use `useMemo` and `useCallback` for expensive operations
- Optimize images and assets
- Test on lower-end devices

### Accessibility

- Use semantic elements
- Provide meaningful labels
- Ensure sufficient color contrast
- Test with screen readers (when possible)

---

## Questions?

If you have questions:
1. Check existing documentation
2. Search closed issues
3. Open a new issue with "Question:" prefix
4. Join our community discussions

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project website (when available)

---

**Thank you for contributing to Call of Doody!** 🚽
