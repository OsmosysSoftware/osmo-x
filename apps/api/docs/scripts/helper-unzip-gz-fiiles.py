import gzip
import shutil
import os

def unzip_gz_files(pattern="../../logs/error*.log.gz"):
    for file in os.listdir(pattern):
        if file.endswith(".gz"):
            gz_path = os.path.join(pattern, file)
            output_path = os.path.join(pattern, file[:-3])  # Remove .gz extension

            with gzip.open(gz_path, 'rb') as f_in:
                with open(output_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)

            print(f"Unzipped: {gz_path} -> {output_path}")

if __name__ == "__main__":
    unzip_gz_files()