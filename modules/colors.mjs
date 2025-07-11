import { randomNum } from "./random.mjs";

/**
 * converts a color in hex or rgb format to an array of its components
 * currently DOESN'T WORK WITH COLOR KEYWORDS
 * @param {string} hexColor 
 * @returns {number[]}
 */
export function colorHexToRGB(hexColor) {
  if (hexColor.startsWith("rgb")) {
    return hexColor
      .replaceAll(/[^\d,]/g, "")
      .split(",")
      .map((str) => Number(str));
  }
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);
  return [red, green, blue];
}

/**
 * gets luminance associated with a set of rgb components
 * luminance formula as per https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * @param {number[]} components 
 * @returns {number}
 */
export function getLuminance(components) {
  const [R, G, B] = components
    .map((component) => component / 255)
    .map((component) => {
      if (component <= 0.03928) {
        return component / 12.92;
      }
      return ((component + 0.055) / 1.055) ** 2.4;
    });
  return R * 0.2126 + G * 0.7152 + B * 0.0722;
}

/**
 * returns the hex color associated with a set of rgb components
 * @param {number[]} param0 
 * @returns {string}
 */
export function getHexColor([red, green, blue]) {
  return (
    "#" +
    `${red.toString(16).padStart(2, "0")}${green
      .toString(16)
      .padStart(2, "0")}${blue.toString(16).padStart(2, "0")}`
  );
}

/**
 * checks if two luminances have some minimum contrast
 * contrast ratio formula as per https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 * @param {number} lum1 
 * @param {number} lum2 
 * @param {number} minContrast 
 * @returns {boolean}
 */
export function validContrast(lum1, lum2, minContrast) {
  const [smaller, greater] = lum1 <= lum2 ? [lum1, lum2] : [lum2, lum1];
  return (greater + 0.05) / (smaller + 0.05) >= minContrast;
}

/**
 * generates any random color up to given maximum rgb components
 * by default, the colors can be in full range for all components
 * @param {number} R 
 * @param {number} G 
 * @param {number} B 
 * @returns {string}
 */
export function randomColor(R = 255, G = 255, B = 255) {
  return getHexColor(
    [R, G, B].map(
      (multiplier) =>
        255 - multiplier + Math.floor(randomNum() * (multiplier + 1))
    )
  );
}

/**
 * generates a random color with a minimum contrast with all base colors passed as argument
 * @param {string[]} baseColors 
 * @param {number} contrast 
 * @returns {string}
 */
export function generateColorWithContrast(baseColors, contrast) {
  const baseLums = baseColors.map(color => getLuminance(colorHexToRGB(color)));

  let color;
  let colorComponents;
  let lum;

  do {
    color = randomColor();
    colorComponents = colorHexToRGB(color);
    lum = getLuminance(colorComponents);
  } while (baseLums.some(baseLum => !validContrast(baseLum, lum, contrast)));

  return color;
}
