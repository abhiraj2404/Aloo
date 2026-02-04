# @repo/tailwind-config

Shared Tailwind CSS v4 configuration and design tokens for the monorepo.

## Contents

- `src/theme.css` - Design tokens and theme variables using Tailwind v4's `@theme` directive

## Usage

### In UI packages

Import the theme in your styles file:

```css
@import "tailwindcss";
@import "@repo/tailwind-config/theme.css";
```

### In applications

Import the theme in your global CSS:

```css
@import "tailwindcss";
@import "@repo/tailwind-config/theme.css";
```

## Customizing

Add custom design tokens in `src/theme.css` using the `@theme` directive:

```css
@theme {
  --color-primary: oklch(53.73% 0.192 264);
  --font-sans: "Inter", system-ui, sans-serif;
}
```

**Note:** Do NOT import `tailwindcss` in `theme.css` - only define theme variables.
