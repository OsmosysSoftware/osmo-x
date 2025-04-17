# Usage to create excel file of common errors

The following scripts were executed in a Linux/Unix terminal.

## Prerequisites

Before you begin, ensure you have the following software installed:

**1. Python:**
- This project was run on Python 3.12.9
- **Check Version:** `python --version` or `python3 --version` (Version 3.8+ recommended)
- **Download:** [Python Official Website](https://www.python.org/downloads/)

**2. pip**
- **Check Version:** `pip --version` or `python -m pip --version`
- **Upgrade (Optional):** `python -m pip install --upgrade pip`
- **Download:** Included with Python installer.

**3. Visual Studio Code (VS Code):**
- A recommended, free source code editor.
- **Download:** [VS Code Official Website](https://code.visualstudio.com/download)

**4. (Optional) Virtual Environment `venv`**
- Creates isolated Python environments to manage project dependencies. Built into Python 3.3+.
- **Why:** Prevents package conflicts between projects.
- **Usage:** Typically created via `python -m venv <environment_name>` (e.g., `python -m venv .venv`).
- **Download:** Included with Python 3.3+.

---

## Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/OsmosysSoftware/osmo-x.git
   cd ./apps/api/docs/scripts
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```
3. Each script accepts arguments for log directory relative to the `scripts` folder.
   1. `--log-dir`: ../../logs
   2. `--output-dir`: .

4. Unzip .gz files in log folder using helper script (if needed)

   ```bash
   # Default
   python helper-unzip-gz-files.py

   # (Optional) With arguments
   python helper-unzip-gz-files.py --log-dir ../../logs
   ```

5. Run script to create excel & csv of common errors found in logs (each log is an object `{}`)

   ```bash
   # Default
   python main-logs-to-excel.py

   # (Optional) With arguments
   python main-logs-to-excel.py --log-dir ../../logs --output-dir .
   ```

6. Run script to create excel & csv of common errors found in faulty logs (each log is an array `[]`)

   ```bash
   # Default
   python main-faulty-logs-to-excel.py

   # (Optional) With arguments
   python main-faulty-logs-to-excel.py --log-dir ../../logs --output-dir .
   ```