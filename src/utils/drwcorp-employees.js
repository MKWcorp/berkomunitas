// DRW Corp Employee Master List
// Update this list when new employees join or names need to be corrected

export const DRW_CORP_EMPLOYEES = [
];

// Helper function to add new employees
export function addNewEmployees(newEmployees) {
  if (!Array.isArray(newEmployees)) {
    throw new Error('newEmployees must be an array');
  }

  // Check for duplicates
  const duplicates = newEmployees.filter(name =>
    DRW_CORP_EMPLOYEES.some(existing => existing.toLowerCase() === name.toLowerCase())
  );

  if (duplicates.length > 0) {
    console.warn('Duplicate employees found:', duplicates);
  }

  // Add unique new employees
  const uniqueNew = newEmployees.filter(name =>
    !DRW_CORP_EMPLOYEES.some(existing => existing.toLowerCase() === name.toLowerCase())
  );

  DRW_CORP_EMPLOYEES.push(...uniqueNew);

  return {
    added: uniqueNew.length,
    duplicates: duplicates.length,
    total: DRW_CORP_EMPLOYEES.length
  };
}

// Helper function to remove employees
export function removeEmployees(employeeNames) {
  if (!Array.isArray(employeeNames)) {
    throw new Error('employeeNames must be an array');
  }

  const initialLength = DRW_CORP_EMPLOYEES.length;

  employeeNames.forEach(name => {
    const index = DRW_CORP_EMPLOYEES.findIndex(emp =>
      emp.toLowerCase() === name.toLowerCase()
    );
    if (index !== -1) {
      DRW_CORP_EMPLOYEES.splice(index, 1);
    }
  });

  return {
    removed: initialLength - DRW_CORP_EMPLOYEES.length,
    total: DRW_CORP_EMPLOYEES.length
  };
}

// Helper function to update employee name
export function updateEmployeeName(oldName, newName) {
  const index = DRW_CORP_EMPLOYEES.findIndex(emp =>
    emp.toLowerCase() === oldName.toLowerCase()
  );

  if (index === -1) {
    throw new Error(`Employee "${oldName}" not found`);
  }

  // Check if new name already exists
  const existingIndex = DRW_CORP_EMPLOYEES.findIndex(emp =>
    emp.toLowerCase() === newName.toLowerCase()
  );

  if (existingIndex !== -1 && existingIndex !== index) {
    throw new Error(`Employee "${newName}" already exists`);
  }

  DRW_CORP_EMPLOYEES[index] = newName;

  return {
    updated: true,
    oldName,
    newName
  };
}

// Export functions for use in API routes
export default {
  DRW_CORP_EMPLOYEES,
  addNewEmployees,
  removeEmployees,
  updateEmployeeName
};

// Enhanced similarity matching functions
export function findSimilarNames(targetName, existingNames, threshold = 0.6) {
  const results = [];

  for (const existingName of existingNames) {
    const similarity = calculateEnhancedSimilarity(targetName.toLowerCase(), existingName.toLowerCase());
    if (similarity >= threshold) {
      results.push({
        targetName,
        existingName,
        similarity: Math.round(similarity * 100) / 100,
        matchType: getMatchType(targetName, existingName)
      });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

// Enhanced similarity calculation with multiple algorithms
function calculateEnhancedSimilarity(str1, str2) {
  // Try different matching strategies
  const strategies = [
    () => calculateSimilarity(str1, str2), // Original Levenshtein
    () => calculateInitialSimilarity(str1, str2), // Initial matching
    () => calculateAbbreviationSimilarity(str1, str2), // Abbreviation matching
    () => calculateWordSimilarity(str1, str2), // Word-by-word matching
    () => calculateSubstringSimilarity(str1, str2), // Substring matching
  ];

  // Return the highest similarity score
  return Math.max(...strategies.map(strategy => strategy()));
}

// Levenshtein distance calculation
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Original Levenshtein distance similarity
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Initial matching (e.g., "eri kartono" vs "eri")
function calculateInitialSimilarity(str1, str2) {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');

  // Check if one is initial of the other
  if (words1.length === 1 && words2.length > 1) {
    const initial = words1[0];
    const fullName = words2.join(' ');
    if (fullName.toLowerCase().startsWith(initial.toLowerCase())) {
      return 0.9; // High similarity for initial match
    }
  }

  if (words2.length === 1 && words1.length > 1) {
    const initial = words2[0];
    const fullName = words1.join(' ');
    if (fullName.toLowerCase().startsWith(initial.toLowerCase())) {
      return 0.9; // High similarity for initial match
    }
  }

  return 0;
}

// Abbreviation matching (e.g., "muhammad khoirul wiro" vs "m k wiro")
function calculateAbbreviationSimilarity(str1, str2) {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');

  // Check for abbreviation patterns
  if (words1.length > 1 && words2.length > 1 && words1.length === words2.length) {
    let matchCount = 0;
    for (let i = 0; i < words1.length; i++) {
      const word1 = words1[i];
      const word2 = words2[i];

      // Check if word2 is abbreviation of word1
      if (word2.length === 1 && word1.toLowerCase().startsWith(word2.toLowerCase())) {
        matchCount++;
      }
      // Check if word2 is first few letters of word1
      else if (word2.length <= 3 && word1.toLowerCase().startsWith(word2.toLowerCase())) {
        matchCount++;
      }
    }

    if (matchCount === words1.length) {
      return 0.95; // Very high similarity for abbreviation match
    }
  }

  return 0;
}

// Word-by-word similarity
function calculateWordSimilarity(str1, str2) {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');

  if (words1.length !== words2.length) return 0;

  let totalSimilarity = 0;
  for (let i = 0; i < words1.length; i++) {
    const sim = calculateSimilarity(words1[i], words2[i]);
    totalSimilarity += sim;
  }

  return totalSimilarity / words1.length;
}

// Substring similarity
function calculateSubstringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  // Check if shorter string is substring of longer
  if (longer.includes(shorter)) {
    return shorter.length / longer.length;
  }

  // Check for partial substring matches
  let matchLength = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matchLength++;
    }
  }

  return matchLength / shorter.length;
}

// Determine match type for better categorization
function getMatchType(targetName, existingName) {
  const target = targetName.toLowerCase();
  const existing = existingName.toLowerCase();

  const targetWords = target.split(' ');
  const existingWords = existing.split(' ');

  // Initial match
  if ((targetWords.length === 1 && existingWords.length > 1) ||
      (existingWords.length === 1 && targetWords.length > 1)) {
    return 'initial';
  }

  // Abbreviation match
  if (targetWords.length === existingWords.length && targetWords.length > 1) {
    let isAbbrev = true;
    for (let i = 0; i < targetWords.length; i++) {
      if (!(existingWords[i].length <= 3 && targetWords[i].startsWith(existingWords[i]))) {
        isAbbrev = false;
        break;
      }
    }
    if (isAbbrev) return 'abbreviation';
  }

  // Substring match
  if (target.includes(existing) || existing.includes(target)) {
    return 'substring';
  }

  // Similar spelling
  const similarity = calculateSimilarity(target, existing);
  if (similarity > 0.8) return 'similar_spelling';

  return 'partial_match';
}

// Manual matching functions
export const manualMatches = new Map();

// Add manual match
export function addManualMatch(employeeName, matchedWith) {
  manualMatches.set(employeeName.toLowerCase(), matchedWith.toLowerCase());
}

// Remove manual match
export function removeManualMatch(employeeName) {
  manualMatches.delete(employeeName.toLowerCase());
}

// Get manual match
export function getManualMatch(employeeName) {
  return manualMatches.get(employeeName.toLowerCase());
}

// Check if name has manual match
export function hasManualMatch(employeeName) {
  return manualMatches.has(employeeName.toLowerCase());
}

// Get all manual matches
export function getAllManualMatches() {
  return Array.from(manualMatches.entries()).map(([key, value]) => ({
    employeeName: key,
    matchedWith: value
  }));
}
