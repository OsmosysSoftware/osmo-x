import json
import glob
import pandas as pd
from collections import Counter

"""
Done for logs that are set as objects
{"timestamp":"2024-10-24T06:24:15.102Z","level":"error","severity":"high","tracebackId":"1011-20227bef6f-4b9f-11f1-461c-9550-aa","source":"MailgunNotificationConsumer","message":"Error getting delivery status from provider for notification with id: 1471975236","stackTrace":[null]}
"""

# Step 1: Read all log files
log_files = glob.glob("../../logs/error*.log")

error_counts = Counter()

# Step 2: Process each file
for log_file in log_files:
    print(f"opening file: {log_file}")
    with open(log_file, "r") as f:
        for line in f:
            try:
                log_entry = json.loads(line.strip())  # Parse JSON

                # Ensure log_entry is a list (array) or a dictionary (object)
                if isinstance(log_entry, list):
                    for entry in log_entry:
                        if isinstance(entry, dict) and "level" in entry and entry["level"] == "error":
                            error_message = entry.get("message", "Unknown Error")
                            error_counts[error_message] += 1
                elif isinstance(log_entry, dict):
                    if "level" in log_entry and log_entry["level"] == "error":
                        error_message = log_entry.get("message", "Unknown Error")
                        error_counts[error_message] += 1

            except json.JSONDecodeError:
                print(f"Skipping invalid JSON in {log_file}")

# Step 3: Convert to DataFrame and save as Excel
df = pd.DataFrame(error_counts.items(), columns=["Error Message", "Count"])
df.sort_values(by="Count", ascending=False, inplace=True)  # Sort by frequency

# Save to Excel
df.to_excel("./error_summary.xlsx", index=False)
print("Excel file 'error_summary.xlsx' created successfully!")
