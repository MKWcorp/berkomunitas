// Debug script untuk test API events
console.log('🔍 Testing /api/events endpoint...');

export default async function handler(req, res) {
  try {
    // Test basic response
    return res.status(200).json({ 
      success: true, 
      message: 'Debug API works',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return res.status(500).json({ 
      error: 'Debug API failed',
      details: error.message 
    });
  }
}
