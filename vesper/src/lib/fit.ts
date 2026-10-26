/** Size guide tables. Indicative conversions; final charts come from the CMS per product line. */
export const FOOTWEAR_SIZES = {
  caption: "Footwear: EU sizing with UK / US conversions and foot length (heel to longest toe).",
  columns: ["EU", "UK", "US", "Foot length (cm)"],
  rows: [
    ["39", "5.5", "6", "24.6"], ["40", "6.5", "7", "25.3"], ["41", "7", "8", "26.0"], ["42", "8", "8.5", "26.7"],
    ["43", "9", "9.5", "27.3"], ["44", "9.5", "10", "28.0"], ["45", "10.5", "11", "28.7"], ["46", "11", "12", "29.3"],
  ],
  howTo: "Stand on a sheet of paper, mark your heel and longest toe, and measure the distance. If you are between two lengths, read the fit note on the product.",
};

export const APPAREL_SIZES = {
  caption: "Apparel: body measurements in centimetres.",
  columns: ["Size", "Chest (cm)", "Waist (cm)"],
  rows: [["XS", "86–91", "71–76"], ["S", "91–96", "76–81"], ["M", "96–101", "81–86"], ["L", "101–106", "86–91"], ["XL", "106–111", "91–96"]],
  howTo: "Measure around the fullest part of your chest, keeping the tape level under your arms.",
};
