# Page Transitions Implementation

## Overview

This document describes the smooth page transition system implemented to fix janky SSR loading and improve user experience during route changes in the IntroHub TanStack Start application.

## Problem

After deployment, page transitions were janky due to:

- SSR content not loading smoothly
- No visual feedback during route changes
- Abrupt content swaps causing layout shifts
- Poor perceived performance

## Solution

A comprehensive page transition system with multiple layers:

### 1. CSS Animations (`src/assets/styles/others/_page-transitions.css`)

**Features:**

- View Transition API support for modern browsers
- Fallback animations for older browsers
- Smooth fade and slide animations
- Loading skeleton shimmer effects
- Progress bar animations
- Reduced motion support for accessibility

**Key Animations:**

- `fade-in` / `fade-out`: Smooth opacity transitions
- `slide-in-from-right` / `slide-out-to-left`: Directional transitions
- `shimmer`: Loading skeleton effect
- `progress-bar`: Top progress indicator

### 2. Router Configuration (`src/router.tsx`)

**Enhanced Settings:**

```typescript
{
  defaultPreload: 'intent',           // Preload on hover/focus
  defaultPreloadDelay: 100,           // 100ms delay before preload
  scrollRestoration: true,            // Restore scroll position
  defaultPendingMs: 150,              // Wait 150ms before showing pending
  defaultPendingMinMs: 300,           // Keep pending for min 300ms
}
```

**Benefits:**

- Prevents flash of loading state for fast transitions
- Ensures smooth minimum transition duration
- Preloads routes on user intent (hover/focus)

### 3. Route Transition Component (`src/components/shared/RouteTransition.tsx`)

**Components:**

#### `RouteTransition`

- Monitors router loading state
- Shows progress bar at top of page
- Optional full-page overlay for slower loads
- 150ms delay to prevent flash on fast transitions

#### `PageTransitionWrapper`

- Wraps page content with transition classes
- Applies `content-reveal` animation

**Usage:**

```tsx
// Already integrated in __root.tsx
<RouteTransition />
```

### 4. View Transitions API Utilities (`src/utils/view-transitions.ts`)

**Functions:**

#### `supportsViewTransitions()`

Checks if browser supports the View Transitions API.

#### `withViewTransition(callback)`

Executes callback with view transition if supported, otherwise runs normally.

```typescript
await withViewTransition(async () => {
  // Your navigation or state change code
})
```

#### `setViewTransitionName(element, name)`

Applies view transition name to element for targeted transitions.

#### `preparePageTransition()`

Prepares document for smooth page transitions.

### 5. Page Wrapper Component (`src/components/shared/PageWrapper.tsx`)

**Purpose:**

- Wraps page content with transition container
- Manages view transitions on route changes
- Subscribes to router events

**Usage:**

```tsx
import { PageWrapper } from '@/components/shared/common'

function MyPage() {
  return <PageWrapper>{/* Your page content */}</PageWrapper>
}
```

## Browser Support

### Modern Browsers (View Transitions API)

- Chrome 111+
- Edge 111+
- Opera 97+
- Safari 18+ (iOS 18+)

**Features:**

- Native smooth transitions
- Hardware-accelerated
- Automatic cross-fade between states

### Fallback (All Browsers)

- CSS-based fade and slide animations
- Progress bar indicator
- Loading overlay
- Full compatibility with older browsers

## Performance Optimizations

1. **Delayed Loading Indicators**
   - 150ms delay prevents flash on fast transitions
   - Only shows loader if transition takes longer

2. **Minimum Transition Duration**
   - 300ms minimum ensures smooth visual feedback
   - Prevents jarring instant transitions

3. **Intent-based Preloading**
   - Routes preload on hover/focus
   - 100ms delay prevents unnecessary preloads
   - Improves perceived performance

4. **Reduced Motion Support**
   - Respects `prefers-reduced-motion` media query
   - Minimal animations for accessibility
   - Maintains functionality without motion

## Implementation Details

### Root Integration

The `RouteTransition` component is integrated at the root level:

```tsx
// src/routes/__root.tsx
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Theme>
          <RouteTransition />
          <Layout>{children}</Layout>
        </Theme>
      </body>
    </html>
  )
}
```

### CSS Import Chain

```
app.css
  └─> others/index.css
        └─> _page-transitions.css
```

All transition styles are automatically included in the application.

## Customization

### Adjusting Transition Duration

Edit `src/assets/styles/others/_page-transitions.css`:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s; /* Change this value */
}
```

### Changing Progress Bar Color

```css
.route-progress-bar {
  background: linear-gradient(
    to right,
    #your-color-1,
    #your-color-2,
    #your-color-3
  );
}
```

### Adjusting Pending Delays

Edit `src/router.tsx`:

```typescript
{
  defaultPendingMs: 150,      // Delay before showing loader
  defaultPendingMinMs: 300,   // Minimum loader display time
}
```

## Testing

### Manual Testing Checklist

- [ ] Navigate between pages - transitions should be smooth
- [ ] Fast navigation - no loading flash
- [ ] Slow navigation - progress bar appears
- [ ] Hover over links - routes preload
- [ ] Browser back/forward - scroll position restores
- [ ] Mobile devices - transitions work smoothly
- [ ] Reduced motion - animations are minimal

### Performance Testing

1. Open Chrome DevTools
2. Go to Network tab
3. Throttle to "Slow 3G"
4. Navigate between pages
5. Verify smooth transitions even on slow connections

## Troubleshooting

### Issue: Transitions are too slow

**Solution:** Reduce `animation-duration` in CSS or `defaultPendingMinMs` in router config.

### Issue: Loading flash on fast transitions

**Solution:** Increase `defaultPendingMs` delay in router config.

### Issue: Transitions not working

**Solution:**

1. Check browser console for errors
2. Verify CSS is imported correctly
3. Ensure `RouteTransition` is in root component

### Issue: Layout shifts during transitions

**Solution:** Use `transition-container` class which sets `min-height: 100vh`.

## Future Enhancements

Potential improvements:

1. Per-route transition customization
2. Directional transitions (forward/back)
3. Shared element transitions
4. Custom transition timing per route
5. Transition analytics/monitoring

## References

- [TanStack Router - Pending Component](https://tanstack.com/router/latest/docs/framework/react/guide/pending-component)
- [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [Prefers Reduced Motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [TanStack Router - Preloading](https://tanstack.com/router/latest/docs/framework/react/guide/preloading)
