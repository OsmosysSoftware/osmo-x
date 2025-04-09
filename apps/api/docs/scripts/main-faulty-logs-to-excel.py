import glob
import json
import re
import pandas as pd

"""
Done for logs that are set as arrays
[{"timestamp":"1","level":"2","severity":"3","tracebackId":"4","source":"5","message":"6","stackTrace":"7"},"2025-02-21T04:52:56.165Z","error","high","c1f8ad2e-5a0e-4571-9574-4b97e142f45b","MailgunNotificationConsumer","Error getting delivery status from provider for notification with id: 71909",[null]]
"""

# Get all log files
log_files = glob.glob("../../logs/error*.log")

print(f"Found {len(log_files)} log files.")

# Function to normalize error messages
def normalize_message(msg):
    msg = re.sub(r'\d+', '[NUM]', msg)  # Replace numbers (IDs, counts)
    msg = re.sub(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', '[UUID]', msg)  # Replace UUIDs
    msg = re.sub(r'([A-Z]{3,}-\d+)', '[TICKET]', msg)  # Replace JIRA-like ticket numbers (ABC-1234)
    return msg.strip()

# List to store extracted error messages and sources
error_data = []

# Process each log file
for log_file in log_files:
    print(f"Reading file: {log_file}")
    with open(log_file, 'r', encoding='utf-8') as file:
        for line in file:
            try:
                log_entry = json.loads(line.strip())  # Parse JSON array
                if isinstance(log_entry, list) and len(log_entry) > 1:
                    first_obj = log_entry[0]  # First entry contains the key mappings

                    if isinstance(first_obj, dict):  # Ensure it's a dictionary
                        # Get message and source indices
                        message_index = list(first_obj.keys()).index("message") + 1
                        source_index = list(first_obj.keys()).index("source") + 1

                        # Extract message and source (if source is missing, use "Unknown")
                        message = log_entry[message_index] if message_index < len(log_entry) else ""
                        source = log_entry[source_index] if source_index < len(log_entry) else "Unknown"

                        if message:
                            normalized_msg = normalize_message(message)
                            error_data.append((normalized_msg, source))
            except (json.JSONDecodeError, ValueError, IndexError) as e:
                print(f"Skipping invalid line in {log_file}: {e}")
                continue  # Skip invalid lines

# Create DataFrame
df = pd.DataFrame(error_data, columns=["Normalized_Message", "Source"])

# Count occurrences of each unique error message
df_grouped = df.groupby(["Normalized_Message", "Source"]).size().reset_index(name="Count")

# Print summary of grouped errors
print("\nSummary of grouped errors:")
for _, row in df_grouped.iterrows():
    print(f"Error: {row['Normalized_Message']} (Source: {row['Source']}) - Count: {row['Count']}")

# Save to CSV and Excel
df_grouped.to_csv("grouped_error_summary.csv", index=False)
df_grouped.to_excel("grouped_error_summary.xlsx", index=False)

print("\nSaved grouped errors to grouped_error_summary.csv and grouped_error_summary.xlsx")
