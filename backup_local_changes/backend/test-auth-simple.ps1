# Simple Authentication Test

Write-Host "Testing GameForge Authentication API..." -ForegroundColor Green
Write-Host ""

# Test 1: Login
Write-Host "1. Testing login:" -ForegroundColor Cyan
$loginBody = '{"email":"john@gameforge.com","password":"password123"}'

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "User: $($loginResponse.data.user.name)" -ForegroundColor White
    $token = $loginResponse.data.token
    Write-Host "Token received" -ForegroundColor Yellow
    Write-Host ""
    
    # Test 2: Get profile
    Write-Host "2. Testing get profile:" -ForegroundColor Cyan
    $headers = @{ Authorization = "Bearer $token" }
    $profileResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/profile" -Method GET -Headers $headers
    Write-Host "Profile retrieved!" -ForegroundColor Green
    Write-Host "Projects count: $($profileResponse.data.projects.Count)" -ForegroundColor White
    Write-Host ""
    
    # Test 3: Create project
    Write-Host "3. Testing create project:" -ForegroundColor Cyan
    $projectBody = '{"title":"Auth Test Game","description":"Created via auth test","status":"DRAFT"}'
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/projects" -Method POST -Body $projectBody -ContentType "application/json" -Headers $headers
    Write-Host "Project created!" -ForegroundColor Green
    Write-Host "Project: $($createResponse.data.title)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test complete!" -ForegroundColor Green
