import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    console.log('🔍 Testing member-badges API endpoint');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    // Check if user email is in headers
    const userEmail = request.headers.get('x-user-email');
    console.log('User email from headers:', userEmail);
    
    if (!userEmail) {
      return NextResponse.json({
        error: "Missing x-user-email header",
        debug: "This endpoint requires admin authentication"
      }, { status: 401 });
    }
    
    return NextResponse.json({
      message: "API test successful",
      userEmail: userEmail,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Test API Error:", error);
    return NextResponse.json({
      error: "Test API failed",
      message: error.message
    }, { status: 500 });
  }
}
