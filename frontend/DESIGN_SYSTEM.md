# OutBid Frontend - Design System & Component Library

## Overview

This document describes the complete design system, component architecture, and styling patterns for the OutBid frontend. Built with **Next.js 16**, **Tailwind CSS 4**, **React 19**, and **TypeScript**, the frontend delivers a modern, accessible, dark-themed competitive gaming interface.

---

## Design Philosophy

### Core Principles

1. **Dark-First Design**: Reduces eye strain in competitive gaming scenarios
2. **Server-Authoritative Feedback**: UI always reflects server truth via real-time updates
3. **Rapid Feedback Loops**: Animations and transitions provide immediate visual confirmation
4. **Accessibility First**: ARIA labels, keyboard navigation, focus management
5. **Mobile-First Responsive**: Scales beautifully from phone to desktop

### Color Palette

```
Primary: #6366f1 (Indigo) - CTAs, highlights, active states
Secondary: #ec4899 (Pink) - Alerts, bids, urgency
Success: #10b981 (Emerald) - Wins, confirmations
Danger: #ef4444 (Red) - Losses, errors
Warning: #f59e0b (Amber) - Pending, attention
Info: #3b82f6 (Blue) - Information

Backgrounds:
- Dark: #0f172a (slate-950)
- Primary: #1e293b (slate-800)
- Secondary: #334155 (slate-700)

Text:
- Primary: #f8fafc (slate-50)
- Secondary: #cbd5e1 (slate-300)
- Muted: #64748b (slate-500)
```

### Typography

- **Font Family**: System stack (`-apple-system, BlinkMacSystemFont, "Segoe UI"`)
- **Monospace**: JetBrains Mono (for bid amounts, IDs, timestamps)
- **Weights**: 300 (light), 400 (normal), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
- **Sizes**: 12px (xs), 14px (sm), 16px (base), 18px (lg), 20px (xl), 24px (2xl), 32px (3xl), 40px (4xl)

### Spacing Scale (8px base)

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
3xl: 48px
4xl: 64px
```

---

## Component Architecture

### Atomic Design System

Components are organized into three layers:

```
src/components/
├── ui/                   # Atoms: Buttons, Inputs, Cards
├── game/                 # Molecules: BidSlider, Timer, Leaderboard
├── lobby/                # Organisms: RoomCard, CreateRoomForm
├── wallet/               # Organisms: DepositForm, TransactionHistory
└── layout/               # Layouts: MainLayout, Page structures
```

---

## UI Components (Atoms)

### Button

```tsx
import { Button } from '@/components/ui'

// Variants: primary | secondary | danger | ghost
// Sizes: sm | md | lg

<Button variant="primary" size="lg" isLoading={false}>
  Place Bid
</Button>
```

**Props:**
- `variant`: Visual style (default: `primary`)
- `size`: Padding and font size (default: `md`)
- `isLoading`: Shows spinner (default: `false`)
- `icon`: ReactNode displayed before text
- `disabled`: Disables interaction
- `children`: Button text content

**Styling Notes:**
- Primary: Gradient from indigo → pink
- Includes focus outline for accessibility
- Full width on mobile, auto width on desktop
- Active state darkens background

---

### Input

```tsx
import { Input } from '@/components/ui'

<Input
  label="Entry Fee"
  type="number"
  placeholder="10.00"
  error={validationError}
  helpText="Minimum $1.00"
/>
```

**Props:**
- `label`: Form label text
- `type`: HTML input type (default: `text`)
- `error`: Error message (displays in red)
- `helpText`: Helpful text below input
- `icon`: Left or right icon
- `iconPosition`: `left` or `right` (default: `right`)
- `isLoading`: Shows spinner in right icon

**Styling Notes:**
- Dark background with slate border
- Indigo focus border and ring
- Full width by default
- Includes required asterisk if `required` prop set

---

### Card

```tsx
import { Card } from '@/components/ui'

<Card
  title="Match Results"
  description="Final standings"
  isHighlighted={isWinning}
  onClick={handleClick}
>
  <p>Content goes here</p>
</Card>
```

**Props:**
- `title`: Card header text
- `description`: Subtitle under title
- `footer`: Sticky footer content
- `isClickable`: Makes card interactive
- `isHighlighted`: Indigo border and glow (for wins/actives)
- `onClick`: Click handler

**Styling Notes:**
- Dark background with slate border
- Optional header with divider
- Optional footer with top border
- Hover effect when clickable

---

### Badge

```tsx
import { Badge } from '@/components/ui'

// Variants: primary | success | danger | warning | info
// Sizes: sm | md | lg

<Badge variant="success">Win</Badge>
```

**Styling Notes:**
- Colored background with matching text
- Rounded pill shape
- Sized for inline labels

---

### Modal

```tsx
import { Modal } from '@/components/ui'

<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Confirm Action"
  footer={<button>Confirm</button>}
>
  <p>Modal content</p>
</Modal>
```

**Features:**
- Automatic focus management
- ESC key closes modal
- Click backdrop to close (optional)
- Scrollable body if content overflows
- Max height 90vh

---

### Select

```tsx
import { Select } from '@/components/ui'

<Select
  label="Payment Method"
  options={[
    { value: 'stripe', label: '💳 Credit Card' },
    { value: 'mpesa', label: '📱 M-Pesa' },
  ]}
/>
```

---

### Checkbox

```tsx
import { Checkbox } from '@/components/ui'

<Checkbox
  label="I agree to terms"
  name="terms"
  required
/>
```

---

### Spinner

```tsx
import { Spinner } from '@/components/ui'

// Sizes: sm | md | lg
// Variants: primary | secondary

<Spinner size="lg" variant="primary" />
```

---

## Game Components (Molecules)

### BidSlider

Real-time bid input with visual feedback.

```tsx
import { BidSlider } from '@/components/game'

<BidSlider
  minBid={100}        // $1.00
  maxBid={999999}     // $9,999.99
  currentHighBid={5000}
  onBidSubmit={(amount) => submitBid(amount)}
  isLoading={submitting}
/>
```

**Features:**
- Gradient fill track
- Real-time value display (in dollars)
- Validates against min/max and current high bid
- Disable after bid placed
- Visual urgency indicators

---

### ScoreCard

Display player score with bid status.

```tsx
import { ScoreCard } from '@/components/game'

<ScoreCard
  playerName="ProBidder"
  score={12500}
  bid={5000}
  isCurrentPlayer
  isWinning
  bidRevealed
/>
```

**Features:**
- Animated score counter
- Current player highlight (indigo)
- Winning status (emerald)
- Bid visibility based on phase

---

### Timer

Countdown with visual urgency.

```tsx
import { Timer } from '@/components/game'

<Timer
  durationMs={30000}
  onExpire={() => nextPhase()}
  size="lg"
  label="Time to Bid"
/>
```

**Features:**
- MM:SS format
- Color changes: Green (>50%) → Yellow (25-50%) → Red (<25%)
- Progress bar beneath
- Smooth 100ms updates

---

### RevealAnimation

Bid reveal with flip animation.

```tsx
import { RevealAnimation } from '@/components/game'

<RevealAnimation
  isRevealed={showBid}
  hiddenText="?"
  revealedValue={5000}
  revealedLabel="Winning Bid"
/>
```

**Features:**
- Card flip CSS animation
- Gradient reveal background
- Number formatting

---

### Leaderboard

Ranked player list.

```tsx
import { Leaderboard } from '@/components/game'

<Leaderboard
  entries={[...]}
  currentUserId="user-123"
  variant="detailed"  // or "compact"
/>
```

**Features:**
- Medal icons (🥇🥈🥉)
- Win rate percentages
- Match count
- Highlight current user

---

## Page Components (Organisms)

### RoomCard

```tsx
import { RoomCard } from '@/components/lobby'

<RoomCard
  roomId="room-001"
  creatorName="ProBidder"
  entryFee={1000}
  playerCount={1}
  maxPlayers={2}
  status="waiting"
  onJoin={() => joinRoom()}
  onView={() => watchRoom()}
/>
```

---

### CreateRoomForm

```tsx
import { CreateRoomForm } from '@/components/lobby'

<CreateRoomForm
  minEntryFee={100}
  maxEntryFee={9999999}
  onSubmit={(fee) => createMatch(fee)}
/>
```

---

### WalletBalance

```tsx
import { WalletBalance } from '@/components/wallet'

<WalletBalance
  availableBalance={25300}
  escrowHold={5000}
  totalBalance={30300}
/>
```

---

### DepositForm

Multi-provider deposit form.

```tsx
import { DepositForm } from '@/components/wallet'

<DepositForm
  onSubmit={(amount, provider) => deposit(amount, provider)}
  minDeposit={100}
  maxDeposit={9999999}
/>
```

**Providers:**
- Stripe (💳 Credit/Debit)
- M-Pesa (📱 Mobile Money)
- Crypto (⛓️ Blockchain)

---

### TransactionHistory

Paginated transaction list.

```tsx
import { TransactionHistory } from '@/components/wallet'

<TransactionHistory
  transactions={[...]}
  isLoading={false}
/>
```

**Features:**
- Pagination (10 per page)
- Type badges (deposit, win, loss, fee)
- Status indicators (completed, pending, failed)
- Color-coded amounts (+/-)

---

## Layout Components

### MainLayout

Root layout with navigation, footer, responsive grid.

```tsx
import { MainLayout } from '@/components/layout'

export default function RootLayout({ children }) {
  return <MainLayout>{children}</MainLayout>
}
```

**Features:**
- Sticky top navbar with logo and menu
- Mobile hamburger menu
- Responsive grid (max-width: 7xl)
- Footer with links and status
- Dark gradient background

---

## Page Structure

### Home (`/`)
- Hero section with CTA
- 3-stat overview
- Feature grid (6 cards)
- Leaderboard preview
- How-it-works steps
- Final CTA section

### Lobby (`/lobby`)
- Header with "Create Match" button
- Search/filter input
- Room card grid (responsive 1-3 cols)
- Join/watch room modals

### Match (`/match/[id]`)
- Match header with round counter
- Status badge (Bidding/Reveal/Completed)
- Timer display
- 3-column layout:
  - Your score card
  - Bid slider or reveal animation
  - Opponent score card
- Leaderboard
- Match completion screen

### Wallet (`/wallet`)
- Deposit/Withdraw buttons
- 2-column grid:
  - WalletBalance card
  - Quick stats card
- TransactionHistory
- Modals for deposit/withdraw

### Profile (`/profile`)
- User header with avatar, username, tier, rank
- 3-stat quick view
- Tabs: Stats | History | Leaderboard
- Stats tab: Win/loss ratio, bidding stats
- History tab: Recent matches with results
- Leaderboard tab: Global rankings

### Auth (`/auth/login`, `/auth/register`)
- Centered card form
- Email/password inputs
- Validation with error messages
- Link to opposite form
- Back to home link

---

## Responsive Breakpoints

```
Mobile: 0-640px (default/sm)
Tablet: 641px-1024px (md, lg)
Desktop: 1025px+ (xl, 2xl)
```

**Responsive Patterns:**
- Single column → 2 columns at md → 3 columns at lg
- Hidden on mobile: Desktop nav (shown via hamburger)
- Full width inputs on mobile, constrained on desktop
- Stacked buttons on mobile, inline on desktop

---

## Accessibility Features

1. **ARIA Labels**: All interactive elements have `aria-label` or `aria-labelledby`
2. **Focus Management**: Visible focus outlines (indigo-500)
3. **Semantic HTML**: Uses `<button>`, `<input>`, `<label>`, etc.
4. **Keyboard Navigation**: All interactions via keyboard
5. **Color Contrast**: WCAG AA compliant text colors
6. **Status Messages**: Error messages use `role="alert"`

---

## Animation & Transitions

### CSS Transitions
- **Fast**: 150ms (hover effects)
- **Normal**: 300ms (state changes)
- **Slow**: 500ms (page transitions)

### Tailwind Animation Classes
```
animate-spin          # Loading spinner
animate-pulse         # Pulsing glow
animate-bounce        # Bouncing text
animate-slide-in      # Slide from top
animate-fade-in       # Fade in
animate-scale-in      # Scale up from 95%
```

### Framer Motion Usage (Future)
- Bid reveals (card flip)
- Score counters
- Leaderboard transitions
- Modal entrances

---

## Theme Configuration

All design tokens centralized in `/src/lib/theme.ts`:

```typescript
import { theme, componentTokens } from '@/lib/theme'

// Access color palette
theme.colors.primary      // #6366f1
theme.colors.success      // #10b981
theme.colors.slate[800]   // #1e293b

// Access typography
theme.typography.fontSize.lg     // 18px
theme.typography.fontWeight.bold // 700

// Access components
componentTokens.button.primary    // CSS classes
componentTokens.card.border       // CSS classes
```

---

## Best Practices

### Component Usage

```tsx
// ✅ Good: Explicit variants and sizes
<Button variant="primary" size="lg">Action</Button>

// ✅ Good: Semantic HTML
<Card title="Results">...</Card>

// ✅ Good: Error handling
<Input error="Email is required" />

// ❌ Avoid: Unnecessary divs
// Use Card, Modal, Badge instead

// ❌ Avoid: Inline styles
// Use Tailwind classes instead

// ❌ Avoid: Magic numbers
// Use theme spacing: xl instead of 24px
```

### Form Best Practices

```tsx
// ✅ Good: React Hook Form + Zod
const form = useForm({ resolver: zodResolver(schema) })

// ✅ Good: Validation on change
onChange={(e) => validate(e.target.value)}

// ✅ Good: Server-side validation
if (error.code === 'INVALID_AMOUNT') setError('amount', 'Invalid')

// ✌️ Good: Loading state during submission
<Button isLoading={isSubmitting} disabled={isSubmitting}>Submit</Button>
```

### Real-time Updates

```tsx
// ✅ Good: WebSocket listeners update Zustand
socket.on('bid:placed', (data) => {
  useMatchStore.setState({ currentHighBid: data.amount })
})

// ✅ Good: UI reflects latest state
const { currentHighBid } = useMatchStore()

// ✌️ Good: Optimistic updates with rollback
setState(optimisticValue)
api.call().catch(() => setState(previousValue))
```

---

## Performance Considerations

1. **Image Optimization**: Use Next.js `Image` component
2. **Code Splitting**: Dynamic imports for heavy components
3. **Memoization**: Use `React.memo()` for expensive renders
4. **Debouncing**: Search inputs, slider updates
5. **Pagination**: TransactionHistory uses 10 items per page

---

## Dark Mode

The entire app defaults to dark mode. No light mode toggle yet (can be added via Zustand store).

```css
/* No special dark: prefixes needed - dark by default */
body {
  @apply bg-slate-950 text-slate-50;
}
```

---

## Future Enhancements

1. **Audio Feedback**: Howler.js for bid sounds, match alerts
2. **Notifications**: Toast notifications for real-time events
3. **Advanced Charts**: Match history with earnings trends
4. **Animations**: Full Framer Motion reveal sequences
5. **Custom Themes**: User-selectable color schemes
6. **PWA**: Offline support, install prompts
7. **Testing**: Vitest unit tests, Playwright E2E

---

## File Organization Summary

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── lobby/page.tsx
│   ├── match/[id]/page.tsx
│   ├── wallet/page.tsx
│   ├── profile/page.tsx
│   ├── layout.tsx               # Root layout with MainLayout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles + animations
├── components/
│   ├── ui/                      # Atomic components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Spinner.tsx
│   │   └── index.ts             # Barrel export
│   ├── game/                    # Game-specific components
│   │   ├── BidSlider.tsx
│   │   ├── ScoreCard.tsx
│   │   ├── Timer.tsx
│   │   ├── RevealAnimation.tsx
│   │   ├── Leaderboard.tsx
│   │   └── index.ts
│   ├── lobby/                   # Lobby components
│   │   ├── RoomCard.tsx
│   │   ├── CreateRoomForm.tsx
│   │   └── index.ts
│   ├── wallet/                  # Wallet components
│   │   ├── WalletBalance.tsx
│   │   ├── DepositForm.tsx
│   │   ├── TransactionHistory.tsx
│   │   └── index.ts
│   └── layout/                  # Layout wrapper
│       ├── MainLayout.tsx
│       └── index.ts
├── hooks/                       # Custom hooks
│   ├── useSocket.ts
│   ├── useMatch.ts
│   └── useWallet.ts
├── lib/
│   ├── theme.ts                 # Design tokens
│   ├── api.ts                   # API client
│   └── socket.ts                # Socket.io client
└── stores/                      # Zustand stores
    ├── auth.store.ts
    ├── match.store.ts
    └── wallet.store.ts
```

---

## Quick Start

### Installation

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

### Creating a New Component

1. Create file in appropriate folder (`ui/`, `game/`, `lobby/`, etc.)
2. Export from folder's `index.ts`
3. Import in pages via `@/components/[folder]`

```tsx
// components/ui/NewComponent.tsx
export const NewComponent: React.FC<Props> = (props) => {
  return <div>...</div>
}

// components/ui/index.ts
export { NewComponent } from './NewComponent'

// In a page:
import { NewComponent } from '@/components/ui'
```

### Adding Pages

1. Create folder under `app/`
2. Add `page.tsx` with 'use client' directive
3. Import components and build UI

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Maintained By**: Development Team
