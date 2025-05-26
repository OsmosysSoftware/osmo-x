import gzip
import shutil
import os
import argparse

# Parse command line arguments
parser = argparse.ArgumentParser(description='Unzip gz files in specified folder')
parser.add_argument('--log-dir', default='../logs', help='Directory containing error logs')
args = parser.parse_args()

# Configure path from argument
LOG_DIR = args.log_dir

def unzip_gz_files():
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), LOG_DIR))
    if not os.path.exists(base_path):
        print(f"Error: Directory not found: {base_path}")
        return

    print(f"Checking logs in directory: {base_path}")
    processed = False
    for file in os.listdir(base_path):
        if file.endswith(".gz"):
            processed = True
            gz_path = os.path.join(base_path, file)
            output_path = os.path.join(base_path, file[:-3])  # Remove .gz extension

            try:
                with gzip.open(gz_path, 'rb') as f_in, open(output_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
                print(f"Unzipped: {gz_path} -> {output_path}")
            except Exception as e:
                print(f"Error unzipping {gz_path}: {e}")

    if(processed == False):
        print("No files with extension .gz found")

if __name__ == "__main__":
    unzip_gz_files()