
// const size = {
//   xs: '400px', // for small screen mobile
//   sm: '600px', // for mobile screen
//   md: '900px', // for tablets
//   lg: '1280px', // for laptops
//   xl: '1440px', // for desktop / monitors
//   xxl: '1920px', // for big screens
// }

// export const device = {
//   xs: `(max-width: ${size.xs})`,
//   sm: `(max-width: ${size.sm})`,
//   md: `(max-width: ${size.md})`,
//   lg: `(max-width: ${size.lg})`,
//   xl: `(max-width: ${size.xl})`,
//   xxl: `(max-width: ${size.xxl})`,
// }

// @media ${device.sm} {
//   display: none;
// }


const breakpoints = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
}

export const devicesMax = {
  xs: `(max-width: ${breakpoints.xs})`,
  sm: `(max-width: ${breakpoints.sm})`,
  md: `(max-width: ${breakpoints.md})`,
  lg: `(max-width: ${breakpoints.lg})`,
  xl: `(max-width: ${breakpoints.xl})`,
  "2xl": `(max-width: ${breakpoints["2xl"]})`,
}

export const devicesMin = {
  xs: `(min-width: ${breakpoints.xs})`,
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  "2xl": `(min-width: ${breakpoints["2xl"]})`,
}