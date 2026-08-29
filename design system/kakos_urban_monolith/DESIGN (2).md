---
name: KAKOS Urban Monolith
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c9c6c5'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b1a'
  on-tertiary-container: '#868381'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e6e1df'
  tertiary-fixed-dim: '#cac6c3'
  on-tertiary-fixed: '#1d1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
typography:
  display-lg:
    fontFamily: Oswald
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Oswald
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Oswald
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Oswald
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
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
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 12px
  container-margin: 16px
---

## Brand & Style
The design system embodies a high-octane, premium fast-fashion aesthetic tailored for the contemporary Cameroonian man. It leans heavily into **Modern Minimalism** fused with **High-Contrast Boldness**, creating a digital environment that feels architectural, urgent, and unapologetically masculine.

The UI should evoke the energy of Douala and Yaoundé street culture—sophisticated yet raw. By utilizing high-density layouts and a stark color palette, the design system positions the brand as a premium authority in urban menswear. The focus is on clarity, speed, and visual impact.

## Colors
The palette is built on extreme contrast to mirror high-end editorial layouts. 

- **Deep Carbon Black (#0A0A0A):** Used for primary surfaces, typography, and "hero" UI elements to anchor the brand's masculinity.
- **Crisp White (#FFFFFF):** The primary canvas, ensuring product photography remains the focal point without visual interference.
- **Electric Cyan (#00F0FF):** A high-energy accent used sparingly for calls-to-action, active states, and urgent notifications (e.g., "Limited Drop").
- **Neutral Grays:** Utilized for secondary information and UI borders to maintain a structured, organized appearance without breaking the monochrome core.

## Typography
The typography strategy creates a "fast-fashion pulse" through scale and weight. 

**Oswald** is the driver for all headlines; its condensed nature allows for high-impact messaging even in tight spaces. All headlines should be set in **uppercase** to reinforce the bold, architectural feel. 

**Inter** provides a functional, utilitarian balance for body copy and technical product details. It ensures high legibility during the browsing and checkout experience. Use tighter letter-spacing for headlines to increase visual density and wide letter-spacing for small labels to improve scannability.

## Layout & Spacing
The design system utilizes a **4px base grid** to achieve high-density merchandising.

- **Grid Model:** A 12-column fluid grid for desktop and a 2-column grid for mobile to maximize product visibility.
- **Density:** Gutters are intentionally tight (12px) to allow product imagery to dominate the screen, creating a "wall of fashion" effect.
- **Mobile Adaptivity:** On mobile devices, side margins are reduced to 16px. Vertical rhythm should be aggressive, with minimal padding between related elements to maintain a sense of urgency and momentum.

## Elevation & Depth
This design system avoids traditional shadows in favor of **Tonal Layers** and **Bold Outlines**. 

- **Flat Hierarchy:** Use solid fills and 1px borders (#E5E5E5) to separate sections.
- **Active Elevation:** When an element requires focus (like a modal or a floating cart), use a solid 4px "block shadow" in Deep Carbon Black instead of a soft blur. This reinforces the brutalist, urban aesthetic.
- **Muted Surfaces:** Use #F5F5F5 for background sections to distinguish between different product categories or editorial blocks.

## Shapes
The shape language is strictly **architectural and sharp**. 

Standard components use a **4px (Soft)** radius. This subtle rounding prevents the UI from feeling dated while maintaining the "hard" edge associated with modern streetwear. Buttons and input fields should strictly adhere to this radius to maintain a cohesive, disciplined visual language. Large containers (like cards) should also follow this rule—never exceed 4px for any structural element.

## Components

### Buttons
- **Primary:** Solid #0A0A0A background with #FFFFFF text. Sharp 4px corners. High-energy hover state transitions to #00F0FF.
- **Secondary:** Transparent background with a 2px #0A0A0A border.
- **Accent:** Solid #00F0FF background with #0A0A0A text for "Add to Cart" or "Buy Now" actions.

### Badges / Chips
- **Status Badges:** Small, uppercase labels with #0A0A0A background and #FFFFFF text (e.g., "NEW DROP", "SOLD OUT").
- **Discount Badges:** Use #00F0FF background to catch the eye immediately against the monochrome UI.

### Product Cards
- **Structure:** Zero-gap between image and info block. 1px #E5E5E5 border.
- **Typography:** Product title in Inter (Bold, 14px), Price in Oswald (Medium, 16px).
- **Imagery:** High-contrast urban photography. Images should occupy 80% of the card's vertical space.

### Input Fields
- **Style:** 1px #E5E5E5 border that turns #0A0A0A on focus. No soft glows—only solid color shifts. Labels should be small, uppercase, and bolded above the field.

### Photography Guidelines
- Models must be portrayed in urban Cameroonian environments (modern architecture, transit hubs). 
- High-contrast, directional lighting to emphasize garment texture and silhouette. 
- Avoid generic stock photography; focus on authentic, high-fashion representation of Black male models.