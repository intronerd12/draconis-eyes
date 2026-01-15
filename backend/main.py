from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import random

app = FastAPI(title="Dragon Fruit Quality Detection System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; specify frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Intelligent Dragon Fruit Ripeness and Quality Detection System API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/detect")
async def detect_quality(file: UploadFile = File(...)):
    # Read the image file to verify it's a valid image
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        # Here we would run the actual model inference
        # For now, we return mock data based on random values for demonstration
        
        ripeness_score = random.uniform(70, 99)
        quality_score = random.uniform(80, 99)
        defect_probability = random.uniform(0, 10)
        
        # Determine grade based on quality
        if quality_score > 90:
            grade = "A"
        elif quality_score > 80:
            grade = "B"
        else:
            grade = "C"

        return {
            "ripeness_score": ripeness_score,
            "quality_score": quality_score,
            "defect_probability": defect_probability,
            "grade": grade,
            "notes": "Automated analysis complete.",
            "color_analysis": "Vibrant Pink",
            "surface_quality": "Smooth, minimal scarring",
            "size_classification": "Large (Premium)",
            "ripeness_level": "Ready to eat",
            "defect_description": "None detected"
        }
        
    except Exception as e:
        return {"error": str(e)}
