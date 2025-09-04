@echo off
echo Testing GameForge API...
echo.

REM Test health endpoint
echo 1. Testing health endpoint:
curl -s http://localhost:3001/api/health
echo.
echo.

REM Test getting all projects
echo 2. Getting all projects:
curl -s http://localhost:3001/api/projects/all
echo.
echo.

REM Test creating a new project
echo 3. Creating a new project:
curl -s -X POST http://localhost:3001/api/projects ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"api-test\",\"title\":\"API Test Project\",\"description\":\"Created via API test script\",\"status\":\"DRAFT\"}"
echo.
echo.

REM Get projects again to see the new one
echo 4. Getting all projects again (should show new project):
curl -s http://localhost:3001/api/projects/all
echo.
echo.

echo API test complete!
