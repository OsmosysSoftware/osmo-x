import gzip
import shutil
import os

def unzip_gz_files():
    base_path = os.path.abspath(os.path.join(__file__, "../../../logs"))
    for file in os.listdir(base_path):
        if file.endswith(".gz"):
            gz_path = os.path.join(base_path, file)
            output_path = os.path.join(base_path, file[:-3])  # Remove .gz extension

            with gzip.open(gz_path, 'rb') as f_in:
                with open(output_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)

            print(f"Unzipped: {gz_path} -> {output_path}")

if __name__ == "__main__":
    unzip_gz_files()