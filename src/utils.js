// Utility to parse money values from strings (e.g., "$1,234.56") to number
function parseMoney(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return Number(String(value).replace(/[$,]/g, '')) || 0;
}

module.exports = { parseMoney }; 