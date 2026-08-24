# Teisseire Pizza Digital Menu design system

This file records the visual system implemented in the public digital menu, authentication flows, and administration CMS. Runtime tokens live in `resources/css/app.css`; this document is the human-readable source of truth.

## Brand direction

The supplied Teisseire Pizza flyer established the core cues: a black field, warm pizza-orange highlights, cream type, strong menu hierarchy, and generous food imagery. The web experience translates those cues into a modern QR-code digital menu without reproducing the flyer layout literally.

The customer experience is dark, warm, tactile, and high-contrast. The administration area uses the same ember accent with a calmer cream workspace and a near-black navigation rail.

## Color tokens

| Role           | Customer                | Administration |
| -------------- | ----------------------- | -------------- |
| Canvas         | `#080706`               | `#f7f0e6`      |
| Raised surface | `#15110e`               | `#fffaf2`      |
| Strong surface | `#21160f`               | `#23170f`      |
| Primary text   | `#fff6e8`               | `#1c130e`      |
| Muted text     | `#a99d8e`               | `#746659`      |
| Primary action | `#ff671d`               | `#dc5127`      |
| Action hover   | `#ff8341`               | `#bd3f1f`      |
| Border         | `rgba(255,246,232,.16)` | `#dfcfbc`      |
| Destructive    | `#d7473f`               | `#991b1b`      |
| Success        | `#79a88a`               | `#47795d`      |

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
- Lucide supplies interface icons. The visible brand mark uses the supplied Teisseire Pizza Halal raster logo, with a project-native favicon retained for browser chrome.

## Customer journey

1. Scan the QR code and land directly on `/`.
2. Browse the digital menu, search, or jump between sticky categories.
3. Review imagery, ingredients, descriptions, prices, and unavailable states.
4. Use the address, hours, and phone contact to reach the restaurant outside the website.

The public website is intentionally read-only: it must not expose cart, checkout, delivery request, pickup request, payment, receipt, cashier, or online order controls. The protected administration area is a small CMS for Menu, Categories, and Restaurant Settings only.

## Motion

- Entry motion uses opacity and translate only, generally 220–420 ms.
- Hover and press feedback uses color, shadow, and small transforms between 150–240 ms.
- No layout-affecting animation or continuous decoration is used.
- The scoped `prefers-reduced-motion: reduce` rule removes nonessential transitions and animations.

## Image system

All current menu imagery is local WebP artwork created for this project:

- `teisseire-pizza-hero.webp`
- `teisseire-pizza-halal-logo.png`
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
- Do not rely on color alone for selected, error, unavailable, or disabled states.
- Validate at 390 px mobile, 768 px tablet, 1024 px small desktop, and 1440 px desktop.
- Fixed navigation controls must not cover content; horizontal page scrolling is prohibited.

## Release checklist

- Customer, login, dashboard, menu, categories, and restaurant settings use Teisseire vocabulary and currency formatting.
- No cart, checkout, delivery-request, pickup-request, payment, receipt, cashier, or online-order controls appear on the customer menu or admin navigation.
- No disabled-registration link appears on login.
- Product photos have a local fallback and useful alternative text.
- Loading, empty, validation, unavailable, and disabled-category states remain legible.
- Reduced-motion, keyboard focus, mobile layout, TypeScript, ESLint, Prettier, and the production build pass before release.
