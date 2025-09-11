# Test Authentication Endpoints

Write-Host "🔐 Testing GameForge Authentication API..." -ForegroundColor Green
Write-Host ""

# Test 1: Login with existing user
Write-Host "1. Testing login with john@gameforge.com:" -ForegroundColor Cyan
$loginBody = @{
    email = "john@gameforge.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "User: $($loginResponse.data.user.name) ($($loginResponse.data.user.email))" -ForegroundColor White
    $token = $loginResponse.data.token
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Yellow
    Write-Host ""
    
    # Test 2: Get user profile
    Write-Host "2. Testing get profile with token:" -ForegroundColor Cyan
    $headers = @{
        Authorization = "Bearer $token"
    }
    $profileResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/profile" -Method GET -Headers $headers
    Write-Host "✅ Profile retrieved!" -ForegroundColor Green
    Write-Host "User: $($profileResponse.data.name) ($($profileResponse.data.email))" -ForegroundColor White
    Write-Host "Projects: $($profileResponse.data.projects.Count)" -ForegroundColor White
    Write-Host ""
    
    # Test 3: Get user projects
    Write-Host "3. Testing get user projects:" -ForegroundColor Cyan
    $projectsResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/projects/my-projects" -Method GET -Headers $headers
    Write-Host "✅ Projects retrieved!" -ForegroundColor Green
    Write-Host "Found $($projectsResponse.data.Count) projects:" -ForegroundColor White
    foreach ($project in $projectsResponse.data) {
        Write-Host "  - $($project.title) [$($project.status)]" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Test 4: Create a new project
    Write-Host "4. Testing create new project:" -ForegroundColor Cyan
    $newProjectBody = @{
        title = "Authentication Test Game"
        description = "Created via authentication test script"
        status = "DRAFT"
    } | ConvertTo-Json
    
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/projects" -Method POST -Body $newProjectBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Project created!" -ForegroundColor Green
    Write-Host "Project: $($createResponse.data.title)" -ForegroundColor White
    Write-Host "ID: $($createResponse.data.id)" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "🎉 Authentication test complete!" -ForegroundColor Green
