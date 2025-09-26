// SIMPLE TEST: Badge holders 1-65, Employee list 66+
const badgeHolders = Array.from({length: 37}, (_, i) => ({ 
    nama_lengkap: `Badge Holder ${i + 1}`, 
    loyalty_point: 100 - i,
    isDrwCorpEmployee: false 
}));

const employees = Array.from({length: 53}, (_, i) => ({ 
    nama_lengkap: `Employee ${i + 1}`, 
    loyalty_point: 0,
    isDrwCorpEmployee: true 
}));

console.log('🎯 TESTING NEW LOGIC...\n');

// Create array for final members
const allMembers = [];

// Fill ranks 1-65: ONLY badge holders (37 from database)
allMembers.push(...badgeHolders);

// Fill empty positions until rank 65 if needed
while (allMembers.length < 65) {
    allMembers.push(null);
}

console.log(`📊 After filling up to rank 65: ${allMembers.length} positions`);
console.log(`📊 Non-null members: ${allMembers.filter(m => m !== null).length}`);

// Starting from rank 66: Add ALL DRW Corp employees
employees.forEach((employee, index) => {
    allMembers.push(employee);
});

console.log(`📊 After adding employees: ${allMembers.length} total positions`);

// Filter out null positions for display
const finalMembers = allMembers.filter(member => member !== null);

console.log(`\n✅ FINAL RESULT:`);
console.log(`Total members to display: ${finalMembers.length}`);

console.log(`\nFirst 5 members:`);
for (let i = 0; i < 5; i++) {
    const member = finalMembers[i];
    console.log(`Rank ${i + 1}: ${member.nama_lengkap} - ${member.loyalty_point} points${member.isDrwCorpEmployee ? ' [EMPLOYEE]' : ' [BADGE HOLDER]'}`);
}

console.log(`\nMembers around rank 66 (array index 65):`);
for (let i = 35; i < 42; i++) {
    if (finalMembers[i]) {
        const member = finalMembers[i];
        console.log(`Rank ${i + 1}: ${member.nama_lengkap} - ${member.loyalty_point} points${member.isDrwCorpEmployee ? ' [EMPLOYEE]' : ' [BADGE HOLDER]'}`);
    }
}

// Find where employees start
const firstEmployeeIndex = finalMembers.findIndex(m => m.isDrwCorpEmployee);
console.log(`\n🎯 First employee appears at: Rank ${firstEmployeeIndex + 1}`);

const badgeHolderCount = finalMembers.filter(m => !m.isDrwCorpEmployee).length;
const employeeCount = finalMembers.filter(m => m.isDrwCorpEmployee).length;

console.log(`\n📊 SUMMARY:`);
console.log(`Badge holders: ${badgeHolderCount} (should be in ranks 1-65)`);
console.log(`Employees: ${employeeCount} (should start from rank 66)`);
console.log(`Total: ${finalMembers.length}`);
