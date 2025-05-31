import json
import glob
import pandas as pd
from collections import Counter
import re
import os
import sys
import argparse
from datetime import datetime

"""
Done for logs that are set as objects
{"timestamp":"2024-10-24T06:24:15.102Z","level":"error","severity":"high","tracebackId":"1011-20227bef6f-4b9f-11f1-461c-9550-aa","source":"MailgunNotificationConsumer","message":"Error getting delivery status from provider for notification with id: 1471975236","stackTrace":[null]}
"""

# Function to normalize error messages
def normalize_message(msg):
    msg = re.sub(r'\d+', '[NUM]', msg)  # Replace numbers (IDs, counts)
    msg = re.sub(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', '[UUID]', msg)  # Replace UUIDs
    msg = re.sub(r'([A-Z]{3,}-\d+)', '[TICKET]', msg)  # Replace JIRA-like ticket numbers (ABC-1234)
    return msg.strip()

# Function to process a single log entry (dictionary)
def process_log_entry(entry, counter):
    """
    Processes a single log entry dictionary. If it's an error, normalizes
    the message, extracts the source, and updates the counter.
    """
    if isinstance(entry, dict) and entry.get("level") == "error":
        raw_message = entry.get("message", "Unknown Error")
        source = entry.get("source", "Unknown Source")

        normalized_message = normalize_message(raw_message)

        # Use a tuple (normalized_message, source) as the key
        counter[(normalized_message, source)] += 1

# Parse command line arguments
parser = argparse.ArgumentParser(description='Process error logs, normalize messages, and generate summary reports grouped by source.')
parser.add_argument('--log-dir', default='../logs', help='Directory containing error logs (default: ../logs)')
parser.add_argument('--output-dir', default='.', help='Directory for output files (default: .)')
args = parser.parse_args()

# Configure paths from arguments
LOG_DIR = args.log_dir
OUTPUT_DIR = args.output_dir

# Step 1: Find all log files
log_pattern = os.path.join(LOG_DIR, "error*.log")
log_files = glob.glob(log_pattern)

if not log_files:
    print("No log files found. Please check the LOG_DIR path.")
    sys.exit(1)
else:
    print(f"Found {len(log_files)} log file(s) in '{LOG_DIR}':")

# Use Counter to store counts for (normalized_message, source) tuples
error_counts = Counter()

# Step 2: Process each file
for log_file in log_files:
    print(f"Opening file: {log_file}")
    line_count = 0
    error_count_file = 0
    try:
        with open(log_file, "r", encoding='utf-8') as f: # Specify encoding
            for line in f:
                line_count += 1
                line_content = line.strip()
                if not line_content: # Skip empty lines
                    continue
                try:
                    # Handle potential BOM (Byte Order Mark) at the start of the file/line
                    if line_content.startswith('\ufeff'):
                        line_content = line_content[1:]

                    log_entry = json.loads(line_content)  # Parse JSON

                    # Log entry can be a single object or an array of objects
                    if isinstance(log_entry, list):
                        for entry in log_entry:
                             process_log_entry(entry, error_counts)
                             if isinstance(entry, dict) and entry.get("level") == "error":
                                 error_count_file +=1
                    elif isinstance(log_entry, dict):
                        process_log_entry(log_entry, error_counts)
                        if log_entry.get("level") == "error":
                            error_count_file += 1
                    else:
                         print(f"  Skipping line {line_count}: Expected JSON object or array, got {type(log_entry)}")


                except json.JSONDecodeError as e:
                    print(f"  Skipping invalid JSON on line {line_count} in {os.path.basename(log_file)}: {e}")
                except Exception as e: # Catch other potential errors during line processing
                     print(f"  Error processing line {line_count} in {os.path.basename(log_file)}: {e}")
        print(f"  Finished processing {log_file}. Found {error_count_file} error entries.")

    except FileNotFoundError:
        print(f"Error: Log file not found: {log_file}")
    except Exception as e:
        print(f"Error reading or processing file {log_file}: {e}")


# Step 3: Convert to DataFrame and save reports
print("\nGenerating reports...")
if not error_counts:
    print("No error entries found in the log files.")
    sys.exit(0)

# Create DataFrame from the counter items
# Each item in error_counts.items() is like: (('Normalized Message', 'Source'), Count)
data_for_df = []
for (msg, src), count in error_counts.items():
    data_for_df.append({
        "Normalized Error Message": msg,
        "Source": src,
        "Count": count
    })

df = pd.DataFrame(data_for_df)

# Sort by frequency
df.sort_values(by="Count", ascending=False, inplace=True)

# Filenames with timestamps for CSV and Excel
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
csv_filename = os.path.join(OUTPUT_DIR, f"error_summary_{timestamp}.csv")
excel_filename = os.path.join(OUTPUT_DIR, f"error_summary_{timestamp}.xlsx")

# Save to CSV with error handling
try:
    df.to_csv(csv_filename, index=False, encoding='utf-8')
    print(f"\nSaved CSV report to: {csv_filename}")
except Exception as e:
    print(f"Error saving CSV file: {e}")

# Save to Excel with error handling
try:
    df.to_excel(excel_filename, index=False, engine='openpyxl')
    print(f"Saved Excel report to: {excel_filename}")
except ImportError:
      print("Error saving Excel file: The 'openpyxl' library is required. Please install it (`pip install openpyxl`)")
except Exception as e:
    print(f"Error saving Excel file: {e}")

print("Script finished.")