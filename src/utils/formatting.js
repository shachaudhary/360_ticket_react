// utils/formatting.js
// export function toProperCase(str) {
//     if (!str) return "";
//     return str
//         .toLowerCase()
//         .replace(/_/g, ' ') // Replace underscores with spaces
//         .replace(/(^|\s|-|\/)\S/g, (match) => match.toUpperCase());
// }

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



// // utils/formatting.js
// export function toProperCase(str) {
//     if (!str) return "";
//     return str
//         .toLowerCase()
//         .replace(/(^|\s|-|\/)\S/g, (match) => match.toUpperCase());
// }
