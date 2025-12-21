@echo off
REM Quick Fix untuk Login Issue
echo.
echo ========================================
echo   FIX LOGIN ISSUE - Clear Old Tokens
echo ========================================
echo.
echo Masalah: Redirect loop antara login dan home
echo Solusi: Clear token lama yang invalid
echo.
echo.
echo CARA MANUAL (Lakukan ini):
echo ========================================
echo.
echo 1. Buka browser (http://localhost:3000)
echo 2. Tekan F12 (buka Developer Tools)
echo 3. Klik tab "Console"
echo 4. Copy-paste code ini:
echo.
echo --- COPY CODE DI BAWAH INI ---
echo localStorage.clear();
echo document.cookie.split(";").forEach(c =^> {document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");});
echo location.reload();
echo --- SAMPAI SINI ---
echo.
echo 5. Tekan Enter
echo 6. Page akan reload otomatis
echo 7. Sekarang coba klik Login lagi
echo.
echo.
pause
echo.
echo Restarting dev server untuk apply fixes...
echo.
npm run dev
