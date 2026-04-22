import { createGlobalStyle } from "styled-components";
import { devicesMax } from "./breakpoint";

const breakpoints = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export const devices = {
  xs: `(min-width: ${breakpoints.xs})`,
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  "2xl": `(min-width: ${breakpoints["2xl"]})`,
};

const GlobalStyles = createGlobalStyle`
:root {
  /* Primary — amber/gold (replaces blue) */
  --color-primary-50:  #ffffea;
  --color-primary-100: #fff8c5;
  --color-primary-200: #ffee85;
  --color-primary-300: #ffe046;
  --color-primary-400: #ffce1b;
  --color-primary-500: #e29800;
  --color-primary-600: #bb6c02;
  --color-primary-700: #985308;
  --color-primary-800: #7c440b;
  --color-primary-900: #5c3308;

  --color-brand-500: #bb6c02;
  --color-brand-600: #985308;
  --color-brand-700: #7c440b;

  /* Back-compat: maps used by older components */
  --color-brand-50: var(--color-primary-50);
  --color-brand-100: var(--color-primary-100);
  --color-brand-200: var(--color-primary-200);
  --color-brand-800: var(--color-primary-800);
  --color-brand-900: var(--color-primary-900);

  --success: #15803d;
  --success-light: #f0fdf4;
  --error:   #dc2626;
  --error-light: #fef2f2;
  --warning: #a16207;
  --warning-light: #fefce8;
  --info:    #0369a1;
  --info-light: #e0f2fe;

  --color-body-bg:  #F9F8F5;
  --color-card-bg:  #FFFFFF;
  --color-border:   #F1EFE8;

  --shadow-sm: 0 0.2rem 1rem rgba(0,0,0,0.08);
  --shadow-md: 0 0.6rem 2.4rem rgba(0,0,0,0.06);
  --shadow-lg: 0 2.4rem 3.2rem rgba(0,0,0,0.12);

  --border-radius-sm:  5px;
  --border-radius-md:  7px;
  --border-radius-lg:  9px;
  --border-radius-xl:  12px;
  --border-radius-cir: 999px;
  --border-radius-tiny: 3px;
  --Border-radius-cir: 999px;

  /* Spacing scale — aligned with eazseller */
  --spacing-xs: 0.4rem;
  --spacing-sm: 0.8rem;
  --spacing-md: 1.6rem;
  --spacing-lg: 2.4rem;
  --spacing-xl: 3.2rem;
  --spacing-2xl: 4.8rem;
  --spacing-3xl: 6.4rem;

  /* Static typography scale (rem; follows html font-size) — eazseller */
  --font-size-xs: 1.2rem;
  --font-size-sm: 1.4rem;
  --font-size-md: 1.6rem;
  --font-size-lg: 1.8rem;
  --font-size-xl: 2rem;
  --font-size-2xl: 2.4rem;
  --font-size-3xl: 3.2rem;
  --font-size-4xl: 4rem;

  /* Fluid type scale — eazseller */
  --text-xs:   clamp(1rem,   0.95vw + 0.8rem,  1.2rem);
  --text-sm:   clamp(1.2rem, 1vw + 1rem,       1.4rem);
  --text-base: clamp(1.4rem, 1.2vw + 1.2rem,   1.6rem);
  --text-lg:   clamp(1.6rem, 1.4vw + 1.4rem,   1.8rem);
  --text-xl:   clamp(1.8rem, 1.6vw + 1.6rem,   2rem);
  --text-2xl:  clamp(2rem,   1.8vw + 1.8rem,   2.4rem);
  --text-3xl:  clamp(2.4rem, 2vw + 2rem,       3.2rem);
  --text-4xl:  clamp(3.2rem, 2.5vw + 2.5rem, 4rem);

  /* Spacing aliases — eazseller */
  --space-xs: var(--spacing-xs);
  --space-sm: var(--spacing-sm);
  --space-md: var(--spacing-md);
  --space-lg: var(--spacing-lg);
  --space-xl: var(--spacing-xl);
  --space-2xl: var(--spacing-2xl);
  --space-3xl: var(--spacing-3xl);

  /*
   * Dashboard layout rhythm — prefer these over ad-hoc px/rem in page shells
   * so spacing stays consistent across admin routes.
   */
  --layout-content-padding: var(--space-lg);
  --layout-header-padding-x: var(--space-lg);
  --layout-header-padding-x-mobile: var(--space-md);
  --layout-page-padding: var(--space-xl);
  --layout-page-padding-mobile: var(--space-md);
  --layout-section-gap: var(--space-lg);
  --layout-stack-gap: var(--space-md);
  --layout-inline-gap: var(--space-sm);
  --layout-tight-gap: var(--space-xs);

  /* Radius aliases — eazseller */
  --radius-md: var(--border-radius-md);
  --radius-lg: var(--border-radius-lg);
  --radius-xl: var(--border-radius-xl);
  --radius-full: 50%;

  --text-muted: var(--color-grey-500);
  --text-secondary: var(--color-grey-600);
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  --transition-fast:   0.15s ease;
  --transition-base:   0.3s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
  --transition-bounce: cubic-bezier(0.68,-0.55,0.265,1.55);

  --color-facebook: #4267B2;
  --color-twitter-900: #1DA1F2;
  --color-instagram: #FFDC80;

  --color-white-0: #fff;
  --color-grey-50: #f9fafb;
  --color-grey-100: #f3f4f6;
  --color-grey-200: #e5e7eb;
  --color-grey-300: #d1d5db;
  --color-grey-400: #9ca3af;
  --color-grey-500: #6b7280;
  --color-grey-600: #4b5563;
  --color-grey-700: #374151;
  --color-grey-800: #1f2937;
  --color-grey-900: #111827;

  --color-blue-100: #e0f2fe;
  --color-blue-700: #0369a1;
  --color-green-100: #dcfce7;
  --color-green-700: #15803d;

  --color-sec-800:#b08f3a;
  --color-sec-500:#d0b56f;
  --color-sec-700: #ffc337;

  --color-bitcoin-300: #fff6e1;
  --color-bitcoin-500:#ffecbf;
  --color-bitcoin-900: #f2a900;
  --color-usdt-500: #D2F4EA;
  --color-usdt-900: #26A17B;
  --color-doge-500:#ffdd76;
  --color-doge-900:#cb9800;
  --color-ethereum-500:#9eb6b8;
  --color-litecoin-500:#aae4ff;
  --color-bitcsh-500: #b6d990;
  --color-whatsapp-100: #25D366;
  --color-whatsapp-700: #128C7E;
  --color-gold-900: #FFD700;
  --color-gold-700: #eada9c;

  --color-yellow-100: #fef9c3;
  --color-yellow-700: #a16207;
  --color-indigo-100: #e0e7ff;
  --color-indigo-700: #4338ca;
  --color-silver-100: #e5e7eb;
  --color-silver-700: #374151;

  --color-black-100: #f7f7f7;
  --color-black-200: #e3e3e3;
  --color-black-300: #c8c8c8;
  --color-black-400: #a4a4a4;
  --color-black-500: #818181;
  --color-black-600: #666666;
  --color-black-700: #515151;
  --color-black-800: #434343;
  --color-black-850: #383838;
  --color-black-900: #313131;
  --color-black-950: #000000;

  --color-red-100: #fee2e2;
  --color-red-500:#fcc;
  --color-red-700: #b91c1c;
  --color-red-800: #991b1b;
  --color-green-700:#00b26b;
  --color-red-900:	#FF0000;

  --backdrop-color: rgba(255, 255, 255, 0.1);

  --sidebar-width: 240px;
  --header-height: 64px;

  --font-body: 'Inter', sans-serif;
  --font-heading: 'Inter', sans-serif;
  --font-brand: 'Inter', sans-serif;

  --image-grayscale: 0;
  --image-opacity: 100%;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  padding: 0;
  margin: 0;

  transition: background-color 0.3s, border 0.3s;
}

html {
  width: 100vw;
  /* Root rem scale — matches eazseller */
  font-size: 66.5%;
  @media ${devicesMax.md} {
    font-size: 64%;
  }
  @media ${devicesMax.sm} {
    font-size: 60%;
    width: 100vw;
  }
}

body {
  font-family: var(--font-body);
  font-weight: 300;
  background: var(--color-body-bg);
  color: var(--color-grey-700);
  transition: color 0.3s, background-color 0.3s;
  min-height: 100vh;
  line-height: 1.5;
  font-size: 1.6rem;
  width: 100vw;
   overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 400;
  line-height: 1.2;
  color: var(--color-grey-900);
}

h1 {
  font-weight: 500;
  font-size: 3.2rem;
}

h2 {
  font-weight: 400;
  font-size: 2.4rem;
}

h3 {
  font-weight: 400;
  font-size: 2rem;
}

h4 {
  font-weight: 400;
  font-size: 1.8rem;
}

h5 {
  font-weight: 400;
  font-size: 1.6rem;
}

h6 {
  font-weight: 400;
  font-size: 1.4rem;
}

input,
button,
textarea,
select {
  font: inherit;
  color: inherit;
}

button {
  cursor: pointer;
}

*:disabled {
  cursor: not-allowed;
}

select:disabled,
input:disabled {
  background-color: var(--color-grey-200);
  color: var(--color-grey-500);
}

input:focus,
button:focus,
textarea:focus,
select:focus {
  outline: 2px solid var(--color-primary-600);
  outline-offset: -1px;
}

button:has(svg) {
  line-height: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

ul {
  list-style: none;
}

p,
h1,
h2,
h3,
h4,
h5,
h6 {
  overflow-wrap: break-word;
  hyphens: auto;
}

  img {
    max-width: 100%;
    display: block;
    object-fit: inherit;
    filter: grayscale(var(--image-grayscale)) opacity(var(--image-opacity));
  }

  .avatar-container img {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }

`;
export default GlobalStyles;
