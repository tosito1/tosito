import os
import sys
import hashlib
import json

def get_file_hash(filepath, block_size=65536):
    """Calculates the MD5 hash of a file efficiently by reading in blocks."""
    hasher = hashlib.md5()
    try:
        with open(filepath, 'rb') as f:
            while True:
                data = f.read(block_size)
                if not data:
                    break
                hasher.update(data)
        return hasher.hexdigest()
    except Exception:
        return None

def find_duplicates(directory):
    if not os.path.isdir(directory):
        print(json.dumps({"error": f"Invalid directory: {directory}"}))
        sys.exit(1)

    # Dictionary to map 'file_size' -> list of file paths
    # This optimization prevents hashing every single file
    size_dict = {}
    total_files_scanned = 0

    try:
        for root, _, files in os.walk(directory):
            for filename in files:
                filepath = os.path.join(root, filename)
                try:
                    # Resolve symlinks or access issues
                    if not os.path.exists(filepath):
                        continue
                        
                    file_size = os.path.getsize(filepath)
                    if file_size > 0: # Ignore 0-byte files
                        if file_size in size_dict:
                            size_dict[file_size].append(filepath)
                        else:
                            size_dict[file_size] = [filepath]
                        total_files_scanned += 1
                except Exception:
                    pass
    except Exception as e:
        print(json.dumps({"error": f"Error walking directory: {str(e)}"}))
        sys.exit(1)

    # Filter out entries with only one file (no duplicates possible)
    potential_duplicates = {size: paths for size, paths in size_dict.items() if len(paths) > 1}
    
    # Dictionary to group duplicates by hash
    hash_dict = {}
    
    for paths in potential_duplicates.values():
        for filepath in paths:
            file_hash = get_file_hash(filepath)
            if file_hash:
                if file_hash in hash_dict:
                    hash_dict[file_hash].append(filepath)
                else:
                    hash_dict[file_hash] = [filepath]

    # Leave only entries with true duplicates
    duplicates_only = {hash_val: paths for hash_val, paths in hash_dict.items() if len(paths) > 1}
    
    result = {
        "status": "success",
        "scanned_files": total_files_scanned,
        "duplicate_groups_count": len(duplicates_only),
        "duplicates": []
    }
    
    for hash_val, paths in duplicates_only.items():
        original = paths[0]
        try:
            sizeBytes = os.path.getsize(original)
        except:
            sizeBytes = 0
            
        result["duplicates"].append({
            "hash": hash_val,
            "size": sizeBytes,
            "original": original,
            "copies": paths[1:]
        })

    # Output strictly as JSON so C# can parse it perfectly
    print(json.dumps(result))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No directory provided. Usage: python FindDuplicates.py <directory_path>"}))
        sys.exit(1)
        
    directory_to_scan = sys.argv[1]
    find_duplicates(directory_to_scan)
