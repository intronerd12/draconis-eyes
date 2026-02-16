# Training on Google Colab (via Google Drive)

Since you uploaded the data to Google Drive, follow these steps to train your model using the GPU.

## Step 1: Open Google Colab
1. Go to [Google Colab](https://colab.research.google.com/).
2. Click **New Notebook**.
3. In the menu, go to **Runtime** > **Change runtime type**.
4. Select **T4 GPU** and click **Save**.

## Step 2: Run the Training Code
Copy and paste the following code into the first cell of your notebook and run it (Shift+Enter).
This code will:
1. Mount your Google Drive.
2. Unzip the file from `/content/drive/MyDrive/DragonFruit/colab_upload.zip`.
3. Train the YOLOv8 model on the 2226 images.
4. Download the best model to your computer.

```python
# 1. Mount Google Drive
from google.colab import drive
print("Mounting Google Drive...")
drive.mount('/content/drive')

# 2. Install Dependencies
!pip install ultralytics

# 3. Unzip Data from Drive
import zipfile
import os
import yaml
from ultralytics import YOLO

# The path you provided (Updated to your specific zip file)
# Make sure you upload "Dragon Fruit Vignan.v2i.yolov8.zip" to this folder in Drive
zip_path = "/content/drive/MyDrive/DragonFruit/Dragon Fruit Vignan.v2i.yolov8.zip"

print(f"Unzipping data from {zip_path}...")
if os.path.exists(zip_path):
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(".")
else:
    raise FileNotFoundError(f"Could not find file at {zip_path}. Please check the path.")

# 4. Train Model (Self-Contained Script)
# This script automatically finds your dataset and trains the model, 
# even if the folder structure is different or files are missing.

from ultralytics import YOLO
import yaml

# Search for data.yaml to locate the dataset
print("Searching for data.yaml (skipping system folders)...")
dataset_yaml = None

# Optimization: check current directory first
if os.path.exists("data.yaml"):
    dataset_yaml = os.path.abspath("data.yaml")
    print(f"Found dataset configuration at: {dataset_yaml}")

# Optimization: check immediate subdirectories
if not dataset_yaml:
    for d in os.listdir("."):
        p = os.path.join(".", d)
        if os.path.isdir(p) and "data.yaml" in os.listdir(p):
             dataset_yaml = os.path.abspath(os.path.join(p, "data.yaml"))
             print(f"Found dataset configuration at: {dataset_yaml}")
             break

# Full walk if not found yet (excluding heavy folders)
if not dataset_yaml:
    exclude_dirs = {'node_modules', '.git', 'venv', 'env', '__pycache__', 'runs', 'yolo_runs'}
    for root, dirs, files in os.walk("."):
        # Modify dirs in-place to skip unwanted directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        if "data.yaml" in files:
            # Check if this looks like the correct dataset (has train/valid folders nearby)
            if "train" in dirs or "valid" in dirs or os.path.exists(os.path.join(root, "train")):
                dataset_yaml = os.path.abspath(os.path.join(root, "data.yaml"))
                print(f"Found dataset configuration at: {dataset_yaml}")
                break
            # Fallback candidate if structure is weird
            elif not dataset_yaml:
                 dataset_yaml = os.path.abspath(os.path.join(root, "data.yaml"))

if not dataset_yaml:
    print("Could not find 'data.yaml'. Listing top-level directories to help debug:")
    print(os.listdir("."))
    raise FileNotFoundError("Could not find 'data.yaml' in the unzipped files. Please check your zip file contents.")

# Fix paths in data.yaml if necessary (make them absolute to avoid errors)
with open(dataset_yaml, 'r') as f:
    data_config = yaml.safe_load(f)

# Ensure paths are absolute
base_dir = os.path.dirname(dataset_yaml)
if 'path' not in data_config:
    data_config['path'] = base_dir # YOLOv8 uses 'path' as base
else:
    # If path is defined but relative, make it absolute
    if not os.path.isabs(data_config['path']):
         data_config['path'] = os.path.abspath(os.path.join(base_dir, data_config['path']))

# Write back the corrected yaml
with open(dataset_yaml, 'w') as f:
    yaml.dump(data_config, f)

print("Starting training with YOLOv8s...")
# Load a model
model = YOLO("yolov8s.pt")  # load a pretrained model (recommended for training)

# Train the model
# epochs=30 (as requested)
results = model.train(data=dataset_yaml, epochs=30, imgsz=640, device=0)

# 5. Download Result
from google.colab import files

# Find the best.pt file
# Ultralytics saves to runs/detect/train/weights/best.pt by default
# But if multiple runs, it might be train2, train3, etc.
runs_dir = "runs/detect"
if os.path.exists(runs_dir):
    runs = [os.path.join(runs_dir, d) for d in os.listdir(runs_dir) if os.path.isdir(os.path.join(runs_dir, d))]
    runs.sort(key=os.path.getmtime, reverse=True)
    
    if runs:
        best_pt = os.path.join(runs[0], "weights", "best.pt")
        if os.path.exists(best_pt):
            print(f"Downloading model from: {best_pt}")
            files.download(best_pt)
        else:
            print(f"Model file not found at {best_pt}")
    else:
        print("No training runs found.")
else:
    print("No runs directory found.")
```

## Step 3: Install the New Model
1. Once the file `best.pt` downloads, rename it to `yolo_best.pt`.
2. Move it to your local project folder:
   `C:\Users\Sachzie\Downloads\dragons-vision\backend\ml_models\yolo_best.pt`
3. Restart your backend server.
