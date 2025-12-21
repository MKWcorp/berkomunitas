// Quick fix: Clear all SSO tokens
console.log('Clearing SSO tokens...');
const script = `
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('sso_user');
document.cookie = 'access_token=; path=/; max-age=0';
document.cookie = 'refresh_token=; path=/; max-age=0';
console.log('âœ… Tokens cleared! Please reload the page.');
`;
console.log('\ní³‹ Copy this code and paste in browser console (F12):\n');
console.log(script);
console.log('\nThen reload the page and try login again.');
