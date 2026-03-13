---
description: Design system for VASpeak UI generation in Stitch.
---

# VASpeak Design System

## 1. Brand Identity
- **Personality**: Friendly, encouraging, professional but accessible, gamified (Duolingo-like).
- **Target Audience**: Vietnamese Virtual Assistants learning English.
- **Form Factor**: Strictly **Mobile-First**. Designs should look perfect on narrow smartphone screens (iPhone 12/Pixel 5 dimensions) holding center stage.

## 2. Color Palette
- **Primary / Brand**: Sunflower Gold `#F2A906` (Used for Primary CTAs, Active States, Progress bars. *Rule: NEVER set white text on Sunflower Gold. Always use Deep Navy text on Sunflower Gold backgrounds.*)
- **Secondary / Text**: Deep Navy `#1B365D` (Used for Headings, secondary buttons, main text, and container shadows).
- **Background**: Warm White `#FFFBF1` (Base app background).
- **Surfaces**: White `#FFFFFF` (For cards, modals, input fields).
- **Success/Gamification**: Bright mint/green for correct answers, fiery orange for streaks.

## 3. Typography
- **Headings**: `Plus Jakarta Sans` (Bold, clean, geometric).
- **Body Text**: `Inter` (Highly legible at small sizes).

## 4. Component Styles
- **Cards & Containers**: Generously rounded (`border-radius: 16px`). Must have a subtle Deep Navy shadow (e.g., `box-shadow: 0 4px 14px rgba(27, 54, 93, 0.08)`).
- **Hover/Active States**: Cards hover state can feature a soft Sunflower Gold glow.
- **Buttons**: Slightly less rounded than cards (`border-radius: 6px` to `8px`). Primary buttons are Sunflower Gold with Deep Navy text.
- **Input Fields**: 12px rounded, 1px solid border of a light navy tint. Focus ring should be Sunflower Gold.
- **Animations**: simple `fade-in` and subtle transforms (`translate-y-1`). No gratuitous/heavy animations.

## 5. Layout & Structure
- **Padding**: Generous padding inside cards (e.g., `p-5` or `p-6`).
- **Spacing**: Clear visual hierarchy with ample whitespace between sections.
- **Bottom Navigation**: (If applicable on app shell) Fixed bottom bar for Mobile-first feel.

## 6. Design System Notes for Stitch Generation (COPY THIS INTO PROMPTS)
```markdown
**DESIGN SYSTEM (REQUIRED):**
- **Vibe:** Gamified, Duolingo-like mobile app. Friendly, rounded, spaced out.
- **Colors:**
  - Background: Warm White `#FFFBF1`
  - Cards/Surfaces: Pure White `#FFFFFF`
  - Primary Accent: Sunflower Gold `#F2A906` (Use for CTAs, progress bars. USE NAVY TEXT ON THIS, NOT WHITE).
  - Text & Secondary: Deep Navy `#1B365D`
- **Typography:** Headings in `Plus Jakarta Sans`, Body in `Inter`.
- **Shapes:** Generously rounded cards (`rounded-2xl` or 16px). Buttons (`rounded-md` or 6px-8px).
- **Shadows:** Soft Deep Navy shadows on cards (e.g., `shadow-[0_4px_14px_rgba(27,54,93,0.08)]`).
- **Layout:** Mobile-first layout. Single column optimized for phone screens. Generous padding.
```
