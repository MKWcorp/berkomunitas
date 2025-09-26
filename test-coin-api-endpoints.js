// Test coin management API endpoints
const testAPI = async () => {
  try {
    // Test manual coin addition
    console.log('🧪 Testing manual coin API...');
    
    const response = await fetch('http://localhost:3000/api/admin/coins/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        member_id: 239,
        coin_amount: 1000,
        event: 'Testing API Manual Addition',
        event_type: 'admin_manual'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Manual API Success:', result);
    } else {
      const error = await response.text();
      console.error('❌ Manual API Error:', error);
    }
    
    // Test coins data API
    console.log('🧪 Testing coins data API...');
    
    const dataResponse = await fetch('http://localhost:3000/api/admin/coins');
    
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      console.log('✅ Data API Success:');
      console.log('📊 Summary:', data.summary);
      console.log('📜 History count:', data.history.length);
    } else {
      const error = await dataResponse.text();
      console.error('❌ Data API Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Fetch Error:', error.message);
  }
};

testAPI();