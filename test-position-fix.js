// Test positioning with null handling
const allPositions = Array(155).fill(null);

// Fill positions 0-36: Badge holders (ranks 1-37)
for (let i = 0; i < 37; i++) {
    allPositions[i] = {
        nama_lengkap: `Badge Holder ${i + 1}`,
        loyalty_point: 100 - i,
        isDrwCorpEmployee: false
    };
}

// Fill positions 65+: ALL DRW Corp employees (starting from rank 66)
const employees = Array.from({length: 53}, (_, i) => `Employee ${i + 1}`);
employees.forEach((name, index) => {
    const position = 65 + index; // Start from position 65 (rank 66)
    if (position < 155) {
        allPositions[position] = {
            nama_lengkap: name,
            loyalty_point: 0,
            isDrwCorpEmployee: true
        };
    }
});

console.log('🔍 TESTING POSITIONING WITH NULL HANDLING...\n');

// Simulate getRankingPositions() logic
const positions = allPositions.map((member, index) => ({
    member,
    rank: index + 1
})).filter(item => item.member !== null);

console.log(`📊 Total positions with members: ${positions.length}`);

console.log('\n🏆 First 10 positions:');
for (let i = 0; i < 10; i++) {
    const pos = positions[i];
    const type = pos.member.isDrwCorpEmployee ? '[EMPLOYEE]' : '[BADGE HOLDER]';
    console.log(`Position ${i + 1}: Rank ${pos.rank} - ${pos.member.nama_lengkap} ${type}`);
}

console.log('\n⛓️  Employee section (should start around position 38):');
const firstEmployeePos = positions.findIndex(p => p.member.isDrwCorpEmployee);
console.log(`First employee at position: ${firstEmployeePos + 1}`);
console.log(`First employee rank: ${positions[firstEmployeePos].rank}`);

for (let i = firstEmployeePos; i < firstEmployeePos + 5; i++) {
    const pos = positions[i];
    console.log(`Position ${i + 1}: Rank ${pos.rank} - ${pos.member.nama_lengkap} [EMPLOYEE]`);
}
