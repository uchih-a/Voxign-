# SignSense Frontend

A production-grade React Progressive Web App for real-time ASL (American Sign Language) recognition using MediaPipe.

## Quick Start

### Prerequisites

- Node.js 18+
- Yarn or npm

### Installation

```bash
# Install dependencies
npm install

# Copy the MediaPipe hand landmark model from backend
cp ../backend/ml_models/hand_landmarker.task ./public/models/

# Create .env file (already has defaults)
cp .env.example .env
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # Backend API calls
│   ├── components/       # Reusable React components
│   │   ├── ui/          # Base UI components
│   │   ├── camera/      # Camera-specific components
│   │   ├── layout/      # Layout components
│   │   └── admin/       # Admin-specific components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── stores/          # Zustand state stores
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/
│   ├── manifest.json    # PWA manifest
│   ├── icons/          # PWA icons
│   └── models/         # MediaPipe model files
├── vite.config.ts      # Vite configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Key Features

### Real-Time ASL Recognition

- **Letter Mode**: Recognize individual letters A-Z
- **Word Mode**: Recognize 30-frame sequences of common phrases
- Uses MediaPipe HandLandmarker for on-device hand detection
- Runs entirely in the browser (no cloud dependency)

### Progressive Web App

- **Offline Support**: Works offline after first load
- **Installable**: Add to home screen on mobile
- **Fast**: Cached assets and optimized builds

### Authentication

- JWT token-based authentication
- Automatic token refresh
- Secure token storage (access token in memory, refresh token in localStorage)

### Accessibility

- WCAG 2.1 Level AA compliant
- Screen reader support
- Keyboard navigation
- Focus management
- Color + text for all indicators

### Performance

- TypeScript strict mode
- Zero `any` types
- Optimized re-renders
- Code splitting with Vite
- Service worker caching

## Tech Stack

| Layer              | Technology                    |
|-------------------|-------------------------------|
| Framework         | React 18 + TypeScript         |
| Build Tool        | Vite 5                        |
| Routing           | React Router v6               |
| State Management  | Zustand + TanStack Query v5   |
| Styling           | Tailwind CSS v3               |
| Animations        | Framer Motion                 |
| Forms             | React Hook Form + Zod         |
| Hand Detection    | MediaPipe HandLandmarker      |
| HTTP Client       | Axios                         |
| Icons             | Lucide React                  |

## Configuration

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=SignSense
VITE_MEDIAPIPE_WASM_URL=https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm
```

### Tailwind Custom Colors

The app uses custom color tokens defined in `tailwind.config.ts`:

- **Background**: `#0C1A12` (deep forest black-green)
- **Accent**: `#4ADE80` (primary green)
- **Cream**: `#FAF3E0` (primary text)
- **Status**: Error, warning, success colors

## API Integration

### Available Endpoints

The frontend connects to these backend endpoints:

| Method | Endpoint                        | Purpose                        |
|--------|---------------------------------|--------------------------------|
| POST   | /auth/login                     | Login                          |
| POST   | /auth/register                  | Register                       |
| POST   | /auth/refresh                   | Refresh token                  |
| GET    | /users/me                       | Get profile                    |
| POST   | /inference/letter               | Predict letter                 |
| POST   | /inference/word                 | Predict word                   |
| GET    | /inference/history              | Get session history            |

### Inference Format

**Letter Endpoint:**
```json
{ "landmarks": [[x,y,z], ...(21 items)] }
```

**Word Endpoint:**
```json
{ "sequence": [[[x,y,z],...], ...(30 frames)] }
```

## Development

### Code Quality

```bash
# Type check
npm run lint

# Run tests
npm run test
```

### Browser DevTools

- Use Redux DevTools extension (works with Zustand)
- Check Network tab for API calls
- Use React DevTools extension

### Common Tasks

#### Adding a New Page

1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation link if needed

#### Adding a New Feature

1. Create API call in `src/api/`
2. Create Zustand store if needed in `src/stores/`
3. Create hook in `src/hooks/`
4. Create components in `src/components/`

## Deployment

### For Production

```bash
# Build
npm run build

# Output goes to dist/

# The dist/ folder can be deployed to:
# - Netlify (recommended)
# - Vercel
# - GitHub Pages
# - AWS S3 + CloudFront
# - Any static host
```

### PWA Considerations

- Service worker is automatically registered
- Update manifest.json before deployment
- Ensure icons are present in public/icons/
- Test on real devices for PWA functionality

## Troubleshooting

### Camera Not Starting

- Check browser permissions
- Ensure HTTPS in production (required for camera access)
- Check `console.error` for specific error

### MediaPipe Model Not Loading

- Verify `hand_landmarker.task` exists in `public/models/`
- Check network tab for 404s
- Verify WASM URL in environment variables

### API Calls Failing

- Ensure backend is running on correct port
- Check VITE_API_BASE_URL environment variable
- Verify CORS headers from backend

## Contributing

This is a single-developer project. Contributions welcome via pull request.

## Accessibility Notice

This app is built specifically for the Deaf and Hard-of-Hearing community. All accessibility features are mandatory and thoroughly tested.

## License

Refer to repository root LICENSE file
