# Usage to create excel file of common errors

1. Clone the repository:

   ```bash
   git clone https://github.com/OsmosysSoftware/osmo-x.git
   cd ./apps/api/docs/scripts
   ```


2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Set correct paths in scripts (if needed)
4. Unzip files in log folder using helper script (if needed)

   ```bash
   python helper-unzip-gz-fiiles.py
   ```

5. Run script to create excel of common errors found in logs

   ```bash
   # For logs set as object
   python main-logs-to-excel.py

   # For logs set as array
   python main-faulty-logs-to-excel.py
   ```