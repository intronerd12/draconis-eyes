
import os
import sys
import subprocess
import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Improve Mobile Scanning Accuracy via Self-Training")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs (default: 50)")
    parser.add_argument("--device", type=str, default="cpu", help="Device to use (cpu or cuda)")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    backend_dir = repo_root / "backend"
    
    print("=== Dragon Vision Accuracy Improvement Tool ===")
    print(f"Working directory: {backend_dir}")
    print("This script will ingest uploaded images from the mobile app and retrain the model.")
    
    # Check if selftrain_pipeline.py exists
    pipeline_script = backend_dir / "selftrain_pipeline.py"
    if not pipeline_script.exists():
        print(f"Error: {pipeline_script} not found!")
        return

    # Construct command
    cmd = [
        sys.executable,
        str(pipeline_script),
        "--epochs", str(args.epochs),
        "--device", args.device,
        # Use strong augmentation for better accuracy
        "--mixup", "0.1",
        "--mosaic", "0.8",
    ]
    
    print("\nStarting self-training pipeline...")
    print(f"Command: {' '.join(cmd)}")
    print("\nNOTE: This process may take several hours depending on your hardware.")
    print("You can continue using the app, but scanning might be slower during training.\n")
    
    try:
        subprocess.run(cmd, check=True, cwd=repo_root)
        print("\n=== Success! Model accuracy improved. ===")
        print("The new model has been saved to backend/ml_models/yolo_best.pt")
        print("Please restart the backend server to apply changes.")
    except subprocess.CalledProcessError as e:
        print(f"\nError: Training failed with exit code {e.returncode}")
    except KeyboardInterrupt:
        print("\nTraining interrupted by user.")

if __name__ == "__main__":
    main()
