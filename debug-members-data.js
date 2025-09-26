// Debug script untuk memeriksa data members dari API
// Jalankan ini di console browser di halaman admin-app/members

async function debugMembersData() {
  try {
    console.log('Fetching members data from API...');
    const response = await fetch('/api/admin/members');
    const data = await response.json();
    
    console.log('Full API response:', data);
    
    if (data.members && data.members.length > 0) {
      console.log('Sample member data (first 3 members):');
      data.members.slice(0, 3).forEach((member, index) => {
        console.log(`Member ${index + 1}:`, {
          id: member.id,
          nama_lengkap: member.nama_lengkap,
          username: member.username,
          email: member.email,
          no_wa: member.no_wa,
          rawData: member
        });
      });
      
      // Count how many members have username
      const membersWithUsername = data.members.filter(m => m.username && m.username.trim() !== '');
      console.log(`Members with username: ${membersWithUsername.length}/${data.members.length}`);
      
      // Show members without username
      const membersWithoutUsername = data.members.filter(m => !m.username || m.username.trim() === '');
      if (membersWithoutUsername.length > 0) {
        console.log('Members without username (first 5):', 
          membersWithoutUsername.slice(0, 5).map(m => ({
            id: m.id,
            nama_lengkap: m.nama_lengkap,
            email: m.email
          }))
        );
      }
    } else {
      console.log('No members found in response');
    }
  } catch (error) {
    console.error('Error fetching members data:', error);
  }
}

// Run the debug
debugMembersData();
