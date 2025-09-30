// utils/formatting.js
// export function toProperCase(str) {
//     if (!str) return "";
//     return str
//         .toLowerCase()
//         .replace(/_/g, ' ') // Replace underscores with spaces
//         .replace(/(^|\s|-|\/)\S/g, (match) => match.toUpperCase());
// }

export function toProperCase(str) {
    if (!str) return "";

    // If the entire string is uppercase, return it as-is
    if (str === str.toUpperCase()) {
        return str;
    }

    return str
        .toLowerCase()
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/(^|\s|-|\/)\S/g, (match) => match.toUpperCase());
}




// // utils/formatting.js
// export function toProperCase(str) {
//     if (!str) return "";
//     return str
//         .toLowerCase()
//         .replace(/(^|\s|-|\/)\S/g, (match) => match.toUpperCase());
// }
