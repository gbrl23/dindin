# Task: Redesign AddTransactionView UI/UX

## 1. ANALYSIS
- **Goal:** Improve layout distribution of the "Add Transaction" view.
- **Tone:** Premium, Modern, Fintech.
- **Visual Style:** Glassmorphism (Liquid Glass) with central focus.
- **Constraints/Feedback:** 
    - Keep it centralized.
    - Improve category selection (many items).
    - Use two-column layout on desktop to balance height.
    - Ensure accessibility (contrast) within the glass style.

## 2. PLANNING
- **Technology Stack:** Existing project uses React, Lucide icons, and some Tailwind/Custom CSS.
- **Key Changes:**
    - Refactor `AddTransactionView.jsx` to use a more structured layout.
    - Implement a "Category Grid" or "Category Selector" with search if needed, but for now, a clean wrap-grid instead of horizontal scroll.
    - Use backdrop-blur and semi-transparent backgrounds for the "Glass" effect.
    - Group related inputs into clear sections.
    - Optimize the "Hero Amount" area.

## 3. SOLUTIONING (UI Design Details)

### Layout Structure (Desktop: 2 Columns, Mobile: 1 Column)
- **Top Area (Full Width):** Header + Transaction Type Tabs.
- **Hero Area (Full Width):** Large Center-aligned Amount + Description field (integrated).
- **Secondary Area (2 Columns on Desktop):**
    - **Left Column:** Categoria (Grid) + Data.
    - **Right Column:** Meio de Pagamento + Opções Avançadas (Dividir, Recorrência, Parcelar).
- **Footer Area (Full Width):** Confirmation Button (Large, Floating effect).

### Visual Tokens (Glassmorphism)
- **Background:** `rgba(255, 255, 255, 0.7)` with `backdrop-filter: blur(12px)`.
- **Borders:** `1px solid rgba(255, 255, 255, 0.3)`.
- **Shadows:** Deep, soft shadows `0 20px 40px rgba(0,0,0,0.05)`.
- **Typography:** Using existing font system but with better hierarchy.

### Category Selector Refinement
- Instead of horizontal scroll: A multi-column grid that "fits" within the card. If there are many, we can use a small scrollable area *within* the card or a "Show more" button.
- **Better UX:** Grid of 4 columns for icons + labels.

## 4. IMPLEMENTATION PLAN
1. **Phase 1: Styles Update.** Define Glassmorphism utility classes or inline styles.
2. **Phase 2: Header & Hero.** Refactor the top section to be more compact.
3. **Phase 3: Body Layout.** Implement the 2-column grid for desktop.
4. **Phase 4: Category Component.** Refactor categories into a grid.
5. **Phase 5: Polish.** Add micro-animations and final touch-ups.

## 5. VERIFICATION CRITERIA
- [ ] Centralized on all screen sizes.
- [ ] No excessive vertical scroll on desktop.
- [ ] Glassmorphism effect visible and aesthetically pleasing.
- [ ] Categories are easy to select and don't feel "lost".
- [ ] High contrast for readability.
