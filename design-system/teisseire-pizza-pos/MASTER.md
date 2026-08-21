# Teisseire Pizza POS design system

This file records the visual system implemented in the customer ordering experience, authentication flows, and administration area. Runtime tokens live in `resources/css/app.css`; this document is the human-readable source of truth.

## Brand direction

The supplied Teisseire Pizza flyer established the core cues: a black field, warm pizza-orange highlights, cream type, strong menu hierarchy, and generous food imagery. The web experience translates those cues into a modern ordering system without reproducing the flyer layout literally.

The customer experience is dark, warm, tactile, and high-contrast. The administration area uses the same ember accent with a calmer cream workspace and a near-black navigation rail.

## Color tokens

| Role | Customer | Administration |
| --- | --- | --- |
| Canvas | `#080706` | `#f7f0e6` |
| Raised surface | `#15110e` | `#fffaf2` |
| Strong surface | `#21160f` | `#23170f` |
| Primary text | `#fff6e8` | `#1c130e` |
| Muted text | `#a99d8e` | `#746659` |
| Primary action | `#ff671d` | `#dc5127` |
| Action hover | `#ff8341` | `#bd3f1f` |
| Border | `rgba(255,246,232,.16)` | `#dfcfbc` |
| Destructive | `#d7473f` | `#991b1b` |
| Success | `#79a88a` | `#47795d` |

Orange is reserved for actions, active navigation, progress, prices, and short emphasis. It is not used for body text on cream backgrounds.

## Typography

- Display and culinary headings: Playfair Display, weight 700.
- Customer body and controls: Karla, weights 400–700.
- Administration UI and data: Instrument Sans, weights 400–700.
- Fonts are bundled locally through `@fontsource`; no runtime font request is required.
- Body text is at least 16 px in customer forms. Uppercase eyebrow labels use additional tracking and remain short.

## Layout and components

- Customer content width: up to 1216 px with 16–32 px responsive gutters.
- Customer cards: 20–24 px radius, fine warm border, near-black surface, restrained shadow.
- Admin cards: 16–20 px radius, cream surface, subtle sand border, low shadow.
- Primary buttons: filled ember, high-contrast dark label, 44 px minimum hit target.
- Secondary buttons: transparent or dark surface with visible border and focus ring.
- Form controls: 48 px default height, persistent labels, clear inline errors, visible `:focus-visible` outline.
- Product imagery uses a fixed crop and descriptive category fallback; product text and controls never overlay the food image.
- Lucide supplies interface icons. The pizza mark and favicon are project-native SVG artwork.

## Customer journey

1. Browse the digital menu, search, or filter one of eight categories.
2. Review product imagery, descriptions, prices, and shared formules.
3. Use the address, hours, and phone contact to reach the restaurant outside the website.

The public customer website is intentionally read-only: it must not expose cart, checkout, delivery request, or online order controls. Dine-in, pickup, and delivery workflows remain available in the protected administration area.

## Motion

- Entry motion uses opacity and translate only, generally 220–420 ms.
- Hover and press feedback uses color, shadow, and small transforms between 150–240 ms.
- No layout-affecting animation or continuous decoration is used.
- The scoped `prefers-reduced-motion: reduce` rule removes nonessential transitions and animations.

## Image system

All current menu imagery is local WebP artwork created for this project:

- `teisseire-pizza-hero.webp`
- `menu-pizza-tomate.webp`
- `menu-pizza-creme.webp`
- `menu-panini-tiramisu.webp`
- `menu-boissons.webp`
- `menu-gratin-ravioles.webp`

Do not introduce remote placeholder or stock-image dependencies. Uploaded product photography may override a seeded category image through the admin product editor.

## Accessibility and responsive rules

- Maintain WCAG AA text contrast and visible keyboard focus.
- Interactive controls must have a 44×44 px minimum target on touch layouts.
- Use semantic headings, labels, button elements, status roles, and `aria-invalid`/`aria-describedby` for form errors.
- Do not rely on color alone for selected, error, payment, or order states.
- Validate at 390 px mobile, 768 px tablet, 1024 px small desktop, and 1440 px desktop.
- Fixed navigation controls must not cover content; horizontal page scrolling is prohibited.

## Release checklist

- Customer, login, dashboard, orders, products, and categories use Teisseire vocabulary and currency formatting.
- No cart, checkout, delivery-request, or online-order controls appear on the customer menu.
- No disabled-registration link appears on login.
- Product photos have a local fallback and useful alternative text.
- Loading, empty, validation, unavailable, and terminal order states remain legible.
- Reduced-motion, keyboard focus, mobile layout, TypeScript, ESLint, Prettier, and the production build pass before release.
