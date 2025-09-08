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

const GlobalStyles = createGlobalStyle`:root {

 
  /* Indigo */
  --color-brand-50: #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-200: #c7d2fe;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;
  --color-brand-800: #3730a3;
  --color-brand-900: #312e81;

  --color-facebook: #4267B2;
  --color-twitter-900: #1DA1F2;
  --color-instagram: #FFDC80:


  --color-primary-100: #d4efff;
  --color-primary-200: #bbceff;
  --color-primary-300: #83c9ff;
  --color-primary-400: #52a2ff;
  --color-primary-500: #2b7aff;
  --color-primary-600: #084dff;
  --color-primary-700: #0046ff;
  --color-primary-800: #033ed3;
  //used
  --color-primary-900: #0d3aa2;
  --color-primary-950: #08205e;


  /* Grey */
  //used
  --color-white-0: #fff;
  --color-grey-50: #f9fafb;
  --color-grey-100: #f3f4f6;
  --color-grey-200: #e5e7eb;
  --color-grey-300: #d1d5db;
  //used
  --color-grey-400: #9ca3af;
  --color-grey-500: #6b7280;
  --color-grey-600: #4b5563;
  --color-grey-700: #374151;
  --color-grey-800: #1f2937;
  //used
  --color-grey-900: #111827;

  --color-blue-100: #e0f2fe;
  --color-blue-700: #0369a1;
  --color-green-100: #dcfce7;
  //used
  --color-green-700: #15803d;

  //used
  --color-sec-800:#b08f3a;
  --color-sec-500:#d0b56f;
  --color-sec-700: #ffc337;


  //used


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
 


   /* Add these layout variables */
    --sidebar-width: 240px;
    --header-height: 64px;
    
    /* Existing variables */
    --color-grey-50: #f9fafb;
    --color-grey-100: #f3f4f6;
    --color-grey-200: #e5e7eb;
    --color-white-0: #fff;
  



  --color--blue-100: #e0f2fe;
  --color-blue-700: #0369a1;
  --color-green-100: #dcfce7;
  --color-green-700: #15803d;
  --color-yellow-100: #fef9c3;
  --color-yellow-700: #a16207;
  --color-silver-100: #e5e7eb;
  --color-silver-700: #374151;
  --color-indigo-100: #e0e7ff;
  --color-indigo-700: #4338ca;



//used
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
  //used
  --color-black-950: #000000;

  --color-red-100: #fee2e2;
  //used
  --color-red-500:#fcc;
  --color-red-700: #b91c1c;
  --color-red-800: #991b1b;
  --color-green-700:#00b26b;
  --color-red-900:	#FF0000;

  --backdrop-color: rgba(255, 255, 255, 0.1);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0px 0.6rem 2.4rem rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 2.4rem 3.2rem rgba(0, 0, 0, 0.12);

  --border-radius-tiny: 3px;
  --border-radius-sm: 5px;
  --border-radius-md: 7px;
  --border-radius-lg: 9px;
  --Border-radius-cir:100px;

  /* For dark mode */
  --image-grayscale: 0;
  --image-opacity: 100%;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  padding: 0;
  margin: 0;

  /* Creating animations for dark mode */
  transition: background-color 0.3s, border 0.3s;
}

html {
  width: 100vw;
  font-size: 62.5%;
  @media ${devicesMax.md} {
    font-size: 60%;
  }
  @media ${devicesMax.sm} {
    font-size: 55%;
    width: 100vw;
  }
}

body {
  font-family: "Poppins", sans-serif;
  color: var(--color-grey-700);
  transition: color 0.3s, background-color 0.3s;
  min-height: 100vh;
  line-height: 1.5;
  font-size: 1.6rem;
  width: 100vw;
   overflow-x: hidden;
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
  outline: 2px solid var(--color-black-950);
  outline-offset: -1px;
}

/* Parent selector, finally 😃 */
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

  /* For dark mode */
  filter: grayscale(var(--image-grayscale)) opacity(var(--image-opacity));
}



`;
export default GlobalStyles;
