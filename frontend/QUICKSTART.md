# SignSense Frontend - Quick Reference

## Installation & Setup (5 minutes)

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Copy MediaPipe model from backend
cp ../backend/ml_models/hand_landmarker.task ./public/models/

# 4. Start development server
npm run dev

# Frontend runs at: http://localhost:5173
# Make sure backend is also running on http://localhost:8000
```

## Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Type check
npm run lint

# Run tests
npm run test
```

## Project Structure at a Glance

```
frontend/
├── src/
│   ├── api/              Backend API calls
│   ├── components/       Reusable UI components
│   ├── hooks/           Custom React hooks
│   ├── pages/           Page components (8 pages)
│   ├── stores/          Zustand state
│   ├── types/           TypeScript types
│   ├── utils/           Utility functions
│   ├── App.tsx          Main app with routing
│   ├── main.tsx         Entry point
│   └── index.css        Global styles
├── public/
│   ├── manifest.json    PWA manifest
│   ├── icons/          SVG icons
│   └── models/         MediaPipe models (needs hand_landmarker.task)
└── Configuration files (vite, tailwind, tsconfig, etc.)
```

## Key Features Implemented

### ✅ Real-Time ASL Recognition
- Live MediaPipe hand detection (runs in browser)
- Letter mode: single-frame (21, 3) predictions
- Word mode: 30-frame (30, 21, 3) predictions
- Confidence scores with visualization
- Recent predictions history

### ✅ 8 Full Pages
1. **SplashPage** - Initialization & auth check
2. **LoginPage** - Sign in form with validation
3. **RegisterPage** - Register with password strength indicator
4. **DashboardPage** - Mode selection + recent activity
5. **RecognitionPage** - Live camera with hand skeleton overlay
6. **HistoryPage** - Session history with filtering
7. **ProfilePage** - User profile management
8. **AdminPage** - Admin dashboard (admin-only)

### ✅ Authentication
- JWT tokens (access + refresh)
- Automatic token refresh on 401
- Session persistence
- Secure logout

### ✅ Progressive Web App
- Service worker with Workbox
- Offline support
- Installable (Add to Home Screen)
- Fast loading

### ✅ Accessibility (WCAG 2.1 AA)
- 48px minimum touch targets
- 16px minimum font size
- Screen reader support
- Focus management
- Color + text indicators

### ✅ Code Quality
- TypeScript strict mode
- Zero `any` types
- Proper error handling
- Complete cleanup in hooks
- Accessible components

## Important Files

| File | Purpose |
|------|---------|
| `src/api/client.ts` | Axios with 401 interceptor |
| `src/hooks/useHandLandmarker.ts` | MediaPipe integration |
| `src/stores/authStore.ts` | Auth state |
| `src/stores/cameraStore.ts` | Camera state |
| `src/pages/RecognitionPage.tsx` | Main camera page |
| `tailwind.config.ts` | Design system tokens |
| `vite.config.ts` | PWA & build configuration |

## Troubleshooting

### Camera Not Working
```
- Check browser permissions (Allow camera)
- Ensure HTTPS for production
- Check browser console for errors
- Try different browser
```

### API Calls Failing
```
- Verify backend is running (localhost:8000)
- Check Network tab in DevTools
- Verify CORS headers
- Check .env VITE_API_BASE_URL
```

### MediaPipe Model Not Found
```
- Ensure hand_landmarker.task is in public/models/
- Check Network tab for 404s
- Verify file was copied correctly: cp ../backend/ml_models/hand_landmarker.task ./public/models/
```

### Build Errors
```
- Delete node_modules and reinstall: rm -rf node_modules && npm install
- Clear cache: rm -rf .vite
- Check TypeScript: npm run lint
```

## Environment Variables

File: `.env`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=SignSense
VITE_MEDIAPIPE_WASM_URL=https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm
```

## Testing User Flow

1. **Register**: Create new account with strong password
2. **Dashboard**: See mode selection and recent activity
3. **Recognition - Letter**: Point hand at camera, get A-Z predictions
4. **Recognition - Word**: Hold hand for ~1 second, get phrase predictions
5. **History**: View all past predictions
6. **Profile**: Update profile or logout

## Design System

### Colors (Tailwind)
- Background: `#0C1A12` (dark green)
- Accent: `#4ADE80` (bright green)
- Cream: `#FAF3E0` (text)
- Status: Red `#F87171`, Yellow `#FBBF24`

### Typography
- Headings: DM Serif Display
- Body: DM Sans
- Code: DM Mono

### Components
- GlassCard (cards with backdrop blur)
- PrimaryButton (accent green)
- InputField (with validation)
- Badge (labels)
- StatusPill (live indicator)
- And 3 more...

## For Production

```bash
# 1. Build
npm run build

# 2. Output is in dist/ folder

# 3. Deploy dist/ to:
# - Netlify (recommended, auto HTTPS)
# - Vercel
# - AWS S3 + CloudFront
# - Any static host

# Requirements:
# - HTTPS enabled
# - CORS headers on backend
# - Service worker caching working
```

## Tech Stack

React 18 • TypeScript • Vite • Tailwind CSS • Zustand • TanStack Query • MediaPipe • Axios • Framer Motion

## Documentation

- **Full Docs**: See [README.md](./README.md)
- **Implementation Details**: See [IMPLEMENTATION.md](./IMPLEMENTATION.md)
- **API Reference**: See backend `/api/docs`

## Support

If errors occur, check:
1. Browser console (F12 → Console)
2. Network tab (F12 → Network)
3. Application tab (F12 → Application → localStorage, Service Workers)
4. Terminal output where `npm run dev` is running

---

**Ready to run!** 🚀
