/**
 * Utility function to convert BigInt values to Numbers for JSON serialization
 * @param {any} obj - The object to convert
 * @returns {any} - Object with BigInt values converted to Numbers
 */
export function convertBigInt(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertBigInt);
  }
  
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k in obj) {
      out[k] = typeof obj[k] === 'bigint' ? Number(obj[k]) : convertBigInt(obj[k]);
    }
    return out;
  }
  
  return obj;
}

/**
 * Helper function specifically for converting arrays of objects with BigInt fields
 * @param {Array} arr - Array of objects to convert
 * @returns {Array} - Array with BigInt values converted to Numbers
 */
export function convertBigIntsInArray(arr) {
  return arr.map(item => {
    const newItem = {};
    for (const key in item) {
      if (typeof item[key] === 'bigint') {
        newItem[key] = Number(item[key]);
      } else {
        newItem[key] = item[key];
      }
    }
    return newItem;
  });
}
