# Usage to create excel file of common errors

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

3. Set correct paths in scripts (if needed)
4. Unzip files in log folder using helper script (if needed)

   ```bash
   python helper-unzip-gz-files.py
   ```

5. Run script to create excel of common errors found in logs

   ```bash
   # For logs set as object
   python main-logs-to-excel.py

   # For logs set as array
   python main-faulty-logs-to-excel.py
   ```