---
name: Ethereal Mindfulness
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c8c2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#303030'
  outline: '#8d928c'
  outline-variant: '#434843'
  surface-tint: '#bdcabe'
  primary: '#bdcabe'
  on-primary: '#28332b'
  primary-container: '#1b261e'
  on-primary-container: '#818e83'
  inverse-primary: '#556157'
  secondary: '#e6c183'
  on-secondary: '#422d00'
  secondary-container: '#5e4513'
  on-secondary-container: '#d7b377'
  tertiary: '#b6ccb5'
  on-tertiary: '#223524'
  tertiary-container: '#152717'
  on-tertiary-container: '#7b907a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d9e6d9'
  primary-fixed-dim: '#bdcabe'
  on-primary-fixed: '#131e16'
  on-primary-fixed-variant: '#3e4a40'
  secondary-fixed: '#ffdea8'
  secondary-fixed-dim: '#e6c183'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5b4311'
  tertiary-fixed: '#d2e9d0'
  tertiary-fixed-dim: '#b6ccb5'
  on-tertiary-fixed: '#0e1f10'
  on-tertiary-fixed-variant: '#384b39'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353535'
typography:
  h1:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '300'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  h3:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  margin-page: 40px
  gutter: 24px
  section-gap: 80px
---

## Brand & Style
This design system centers on a "Poetic Minimalism" aesthetic. It is designed to feel like a digital sanctuary—an immersive, high-end experience that prioritizes mental clarity and sensory richness. The style blends **Glassmorphism** with **Tactile** elements, creating a sense of physical presence through soft shadows and blurred depth. 

The UI should evoke a sense of quiet luxury. It avoids the clinical coldness of typical productivity apps, instead leaning into an editorial and cinematic feeling. High-quality nature photography serves as the foundational "canvas," with UI elements appearing as delicate glass panes floating atop these landscapes.

## Colors
The palette is deeply rooted in the natural world. The primary "Forest Green" (#1B261E) provides a grounded, dark foundation. Secondary "Subtle Gold" (#C5A368) is used sparingly for highlights, success states, and premium moments, while "Sage" (#869B85) acts as an accent for supportive UI elements.

"Warm Stone" (#D6D2C4) is used for light-themed typography on dark backgrounds to reduce ocular strain compared to pure white. The background layers utilize "Charcoal" (#232323) for deep interface surfaces to ensure a premium, immersive dark-mode default.

## Typography
The typographic hierarchy relies on the contrast between the literary, serif quality of **Newsreader** and the functional, clean precision of **Inter**. 

Headlines should be expressive and spacious, often utilizing the "light" or "italic" weights of Newsreader to convey a poetic tone. Body text in Inter is optimized for readability during long-form journaling. For navigation and small UI labels, use `label-caps` to provide a structured, architectural feel that balances the organic nature of the headlines.

## Layout & Spacing
This design system utilizes a **Fixed Grid** model for desktop and a fluid, generous-margin model for mobile. The philosophy is "Maximum Whitespace"—elements are given significant room to breathe to prevent cognitive overload.

Layouts should be centered and balanced. Avoid dense clusters of information. Use `section-gap` to clearly delineate different phases of the mindfulness journey, ensuring the user focuses on one thought at a time.

## Elevation & Depth
Depth is achieved through **Glassmorphism** and ambient shadows rather than solid color fills. 

- **Level 1 (Base):** Full-screen nature photography with a subtle dark overlay.
- **Level 2 (Panels):** "Frosted Glass" surfaces using `backdrop-filter: blur(20px)` and a 10% opacity white tint. 
- **Level 3 (Interactive):** Elements that are active or hovered receive a "Subtle Gold" 1px border and a diffused 24px-spread shadow (0, 12, 24, rgba(0,0,0,0.3)).

Borders are extremely thin (0.5px to 1px) and use low-contrast tones to feel etched rather than drawn.

## Shapes
The shape language is "Rounded" (0.5rem base), providing a soft, approachable feel that avoids the rigidity of sharp corners. Large containers like journaling cards should use `rounded-xl` (1.5rem) to feel like smooth river stones. Interactive elements like buttons should be pill-shaped to emphasize their tactile, touchable nature.

## Components
- **Buttons:** Primary buttons are pill-shaped with a glass background and gold text. Secondary buttons are text-only with `label-caps` styling and a gold underline on hover.
- **Refined Cards:** Containers use the glassmorphic style with a `0.5px` stroke in "Stone." Internal padding should be at least `32px` to maintain the premium feel.
- **Progress Indicators:** Use thin, elegant circular rings or horizontal lines in "Gold." The motion should be slow and fluid (ease-in-out).
- **Input Fields:** Minimalist design with only a bottom border. When focused, the border transitions from "Stone" to "Sage."
- **Custom Iconography:** Use thin-stroke (1pt) linear icons with open paths to maintain the "airy" aesthetic.
- **Nature Scrims:** A custom component that applies a dynamic gradient overlay to background images to ensure typography remains legible regardless of the photo's brightness.