---
page: block-4-reflection
---
A mobile-first lesson screen for "Block 4: Emotional Reflection" in the VASpeak app.

**DESIGN SYSTEM (REQUIRED):**
- **Vibe:** Gamified, Duolingo-like mobile app. Friendly, rounded, spaced out. Focus on empathy and calm reflection.
- **Colors:**
  - Background: Warm White `#FFFBF1`
  - Cards/Surfaces: Pure White `#FFFFFF`
  - Primary Accent: Sunflower Gold `#F2A906` (Use for CTAs, progress bars. USE NAVY TEXT ON THIS, NOT WHITE).
  - Text & Secondary: Deep Navy `#1B365D`
- **Typography:** Headings in `Plus Jakarta Sans`, Body in `Inter`.
- **Shapes:** Generously rounded cards (`rounded-2xl` or 16px). Buttons (`rounded-md` or 6px-8px).
- **Shadows:** Soft Deep Navy shadows on cards (e.g., `shadow-[0_4px_14px_rgba(27,54,93,0.08)]`).
- **Layout:** Mobile-first layout. Single column optimized for phone screens. Generous padding.

**Page Structure:**
1. **Top Bar:** "X" icon to exit top left, a progress bar filling 100% of the screen width in Sunflower Gold top center. (End of lesson).
2. **Hero/Header:** A calm, friendly illustration (like a resting smiley face or a star). Heading: "Lesson Complete!" in Deep Navy.
3. **Reflection Prompts:**
   - Question: "How did you feel about talking to the frustrated client today?"
   - Three large, emoji-based selectable buttons/cards arranged horizontally:
     - 😥 "Anxious" (Greyed out/unselected styling)
     - 😐 "Okay" (Greyed out/unselected styling)
     - 😎 "Confident" (Selected state: Sunflower Gold border, subtle gold tint).
4. **Text Input:** Below the emojis, an optional text area: "Any specific words you struggled with? (Optional)".
5. **Bottom CTA:** A massive fixed button at the bottom: "Finish & Claim Reward" (Sunflower Gold with Deep Navy text, maybe a little gift or coin icon in the button).

Make it look incredibly satisfying to reach this screen. It should feel like a reward for finishing the daily lesson loop.
