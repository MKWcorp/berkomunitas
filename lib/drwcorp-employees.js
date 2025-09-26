// DRW Corp Employee Master List
// Update this list when new employees join or names need to be corrected

export const DRW_CORP_EMPLOYEES = [
  'Eri Kartono',
  'Hani Suryandari',
  'Andri Alamsyah',
  'Ayi Miraj Sidik Yatno',
  'Deni Kristanto',
  'Prajnavidya Adhivijna',
  'Muhammad Khoirul Wiro',
  'Iin Risanti',
  'Muhammad Rijal Yahya',
  'Muhammad Faris Al-Hakim',
  'Ulung Muchlis Nugroho',
  'Shofa Tasya Aulia',
  'Seny Triastuti',
  'Asti Apriani Suyatno',
  'Haris Ahsan Haq Jauhary',
  'Syahroni Binugroho',
  'Sinaring Randri Aditia',
  'Wildan Hari Pratama',
  'Dinda Nadya Salsabila',
  'Wildan Arif Rahmatulloh',
  'Toto Krisdayanto',
  'Annisatul Khoiryyah',
  'Tara Derifatoni',
  'Wahyu Bagus Septian',
  'Ahmad Andrian Syah',
  'Aulia Putri',
  'Hasri Handayani',
  'Abidzar Afif',
  'Hawary Ansorullah',
  'Dian Elsa Rosiana',
  'Kristy Karina Silalahi',
  'Muhammad Kamalurrofiq',
  'Bintang Armuneta',
  'Mohammad Bintang Lazuardi',
  'Layli Noor Ifadhoh',
  'Gega Putra Perdana',
  'Angga Saputra',
  'Deandra Marhaendra',
  'Eep Sugiarto',
  'Agus Sumarno',
  'Rinto Atmojo',
  'Andhika bagus sanjaya',
  'Eka Aprilia',
  'Ihsan Dzaky Saputra',
  'Danang Demestian',
  'Ziaul Haq Alviani',
  'Riski Andra Widiyawati',
  'Fredy Dwi Herdhiawan',
  'Nanang Setiawan',
  'Azzahra Putri Lintang Madaratri',
  'Moch Iqbal Maulana Azis',
  'Nur Azizah Putri Sabila',
  'Yudha Bayu Widiana'
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
const drwCorpEmployeesExports = {
  DRW_CORP_EMPLOYEES,
  addNewEmployees,
  removeEmployees,
  updateEmployeeName
};

export default drwCorpEmployeesExports;
