"""
Simple test server to debug the issue
"""
from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Test Asset Generation Service")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Test server is running"}

@app.get("/")
async def root():
    return {"message": "Asset Generation Service - Test Version"}

if __name__ == "__main__":
    print("🎮 Starting Test Asset Generation Service on port 8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
