import glob
import json
import re
import pandas as pd
import os
import sys
import argparse
from datetime import datetime

"""
Done for logs that are set as arrays
[{"timestamp":"1","level":"2","severity":"3","tracebackId":"4","source":"5","message":"6","stackTrace":"7"},"2025-02-21T04:52:56.165Z","error","high","c1f8ad2e-5a0e-4571-9574-4b97e142f45b","MailgunNotificationConsumer","Error getting delivery status from provider for notification with id: 71909",[null]]
"""

# Parse command line arguments
parser = argparse.ArgumentParser(description='Process array-like error logs, normalize messages, and generate summary reports grouped by source.')
parser.add_argument('--log-dir', default='../logs', help='Directory containing error logs (default: ../logs)')
parser.add_argument('--output-dir', default='.', help='Directory for output files (default: .)')
args = parser.parse_args()

# Configure paths from arguments
LOG_DIR = args.log_dir
OUTPUT_DIR = args.output_dir

# Get all log files
log_pattern = os.path.join(LOG_DIR, "error*.log")
log_files = glob.glob(log_pattern)

if not log_files:
    print("No log files found. Please check the LOG_DIR path.")
    sys.exit(1)
else:
    print(f"Found {len(log_files)} log file(s) in '{LOG_DIR}':")

# Function to normalize error messages
def normalize_message(msg):
    # Ensure msg is a string before applying regex
    msg = str(msg)
    msg = re.sub(r'\d+', '[NUM]', msg)  # Replace numbers (IDs, counts)
    msg = re.sub(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', '[UUID]', msg)  # Replace UUIDs
    msg = re.sub(r'([A-Z]{3,}-\d+)', '[TICKET]', msg)  # Replace JIRA-like ticket numbers (ABC-1234)
    return msg.strip()

# List to store extracted error messages and sources
error_data = []

# Process each log file
for log_file in log_files:
    try:
        print(f"Reading file: {log_file}")
        with open(log_file, 'r', encoding='utf-8') as file:
            # Using enumerate to get line number for better error messages
            for line_num, line in enumerate(file, 1):
                try:
                    line_content = line.strip()
                    if not line_content: # Skip empty lines
                        continue
                    log_entry = json.loads(line_content)  # Parse JSON array

                    # Basic structure validation
                    if isinstance(log_entry, list) and len(log_entry) > 1:
                        first_obj = log_entry[0]  # First entry contains the key mappings

                        if isinstance(first_obj, dict):  # Ensure it's a dictionary
                            message_index = -1
                            source_index = -1
                            source = "Unknown Source" # Default value as required

                            try:
                                # Find message index (mandatory)
                                message_index = list(first_obj.keys()).index("message") + 1
                            except ValueError:
                                # If message key is missing, we cannot proceed with this entry
                                print(f"Skipping line {line_num} in {log_file}: 'message' key missing in header {first_obj}")
                                continue # Skip to next line

                            # Try to find source index
                            try:
                                source_index = list(first_obj.keys()).index("source") + 1
                            except ValueError:
                                # 'source' key not found in header, source remains "Unknown Source"
                                pass

                            # Extract message
                            message = log_entry[message_index] if message_index < len(log_entry) else ""

                            # Extract source value using index ONLY if source_index was found AND is within bounds
                            if source_index != -1: # i.e., if 'source' key was found in header
                                source = log_entry[source_index] if source_index < len(log_entry) else "Unknown Source"
                            # Else: source remains the default "Unknown Source"

                            # Add data if message is not empty
                            if message:
                                normalized_msg = normalize_message(message)
                                error_data.append((normalized_msg, source))

                # Catch errors related to JSON parsing or unexpected index access during data extraction
                except (json.JSONDecodeError, IndexError) as e:
                    print(f"Skipping invalid line {line_num} in {log_file}: {e}")
                    continue  # Skip invalid lines
                # Catch any other unexpected error during line processing
                except Exception as e:
                     print(f"Skipping line {line_num} in {log_file} due to unexpected error: {e}")
                     continue
    except IOError as e:
        print(f"Error opening file {log_file}: {e}")
    except Exception as e:
        print(f"General error processing file {log_file}: {e}")


# Create DataFrame and Save Reports ONLY if data exists
if error_data:
    df = pd.DataFrame(error_data, columns=["Normalized_Message", "Source"])

    # Count occurrences of each unique error message
    df_grouped = df.groupby(["Normalized_Message", "Source"]).size().reset_index(name="Count")

    # Filenames with timestamps for CSV and Excel
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filename = os.path.join(OUTPUT_DIR, f"error_summary_faulty_{timestamp}.csv")
    excel_filename = os.path.join(OUTPUT_DIR, f"error_summary_faulty_{timestamp}.xlsx")

    # Save to CSV and Excel
    try:
        df_grouped.to_csv(csv_filename, index=False)
        print(f"\nSaved CSV report to: {csv_filename}")
    except Exception as e:
        print(f"Error saving CSV file: {e}")

    try:
        df_grouped.to_excel(excel_filename, index=False, engine='openpyxl')
        print(f"Saved Excel report to: {excel_filename}")
    except ImportError:
         print("Error saving Excel file: The 'openpyxl' library is required. Please install it (`pip install openpyxl`)")
    except Exception as e:
        print(f"Error saving Excel file: {e}")
else:
    print("No valid error data found. No report files generated.")

print("Script finished.")