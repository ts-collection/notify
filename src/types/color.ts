type RGBColor =
  | `rgb(${number},${number},${number})`
  | `rgb(${number}, ${number}, ${number})`
  | `rgb(${number},${number}, ${number})`
  | `rgb(${number}, ${number},${number})`;

type HexColor = `#${string}`;

export type CustomColor = HexColor | RGBColor;
