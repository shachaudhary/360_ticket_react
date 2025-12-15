// utils/formatting.js
export function toProperCase1(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/(^|\s|-|\/)\S/g, (match) => match.toUpperCase());
}

// export function toProperCase(str) {
//     if (!str) return "";

//     // If the entire string is uppercase, return it as-is
//     if (str === str.toUpperCase()) {
//         return str;
//     }

//     return str
//         .toLowerCase()
//         .replace(/_/g, ' ') // Replace underscores with spaces
//         .replace(/(^|\s|-|\/)\S/g, (match) => match.toUpperCase());
// }



export function toProperCase(str) {
  if (!str) return "";

  return str
    .replace(/_/g, " ") // replace underscores with spaces
    .split(" ")
    .map((word) => {
      // If the word is ALL CAPS, keep it as-is
      if (word === word.toUpperCase()) {
        return word;
      }
      // Else, capitalize first letter and keep rest lowercased
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Cleans Unicode escape sequences and formats text
 * Replaces Unicode escape sequences like \u00a0 (non-breaking space) with actual characters
 * @param {string} text - The text to clean
 * @returns {string} - The cleaned text
 */
export function cleanText(text) {
  if (!text) return "";
  
  // Replace Unicode escape sequences like \u00a0 (non-breaking space) with actual characters
  let cleaned = text.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });
  
  // Replace other common escape sequences
  cleaned = cleaned
    .replace(/\\n/g, " ") // Replace newlines with spaces
    .replace(/\\t/g, " ") // Replace tabs with spaces
    .replace(/\\r/g, "") // Remove carriage returns
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace
  
  return cleaned;
}



// // utils/formatting.js
// export function toProperCase(str) {
//     if (!str) return "";
//     return str
//         .toLowerCase()
//         .replace(/(^|\s|-|\/)\S/g, (match) => match.toUpperCase());
// }
