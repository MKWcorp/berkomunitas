// API route untuk proxy request ke wilayah API dan bypass CORS
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  
  if (!endpoint) {
    return Response.json({ error: 'Endpoint parameter required' }, { status: 400 });
  }

  try {
    const apiBaseUrl = 'https://emsifa.github.io/api-wilayah-indonesia/api';
    const response = await fetch(`${apiBaseUrl}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    return Response.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Wilayah API proxy error:', error);
    return Response.json(
      { error: 'Failed to fetch wilayah data' }, 
      { status: 500 }
    );
  }
}