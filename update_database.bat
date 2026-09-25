@echo off
echo =======================================================
echo Updating Supabase Database with Missing Migrations...
echo =======================================================
echo.
call npx supabase db push
echo.
echo =======================================================
echo Update finished! If it asks you to login or link your
echo project, please follow the instructions above.
echo =======================================================
pause
