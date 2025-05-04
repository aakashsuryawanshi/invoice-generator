#!/usr/bin/env python3
import os
import sys
import shutil
import base64
from pathlib import Path


def encode_folder(input_folder_path):
    """
    Takes an input folder path, creates a copy with '-encoded' suffix,
    adds '.txt' extension to all files, and base64 encodes their content.
    
    Args:
        input_folder_path: Path to the input folder
    """
    # Convert to absolute path and validate
    input_folder = Path(input_folder_path).resolve()
    if not input_folder.is_dir():
        print(f"Error: {input_folder} is not a valid directory")
        sys.exit(1)
    
    # Create output folder path
    folder_name = input_folder.name
    output_folder = input_folder.parent / f"{folder_name}-encoded"
    
    # Remove output folder if it exists
    if output_folder.exists():
        shutil.rmtree(output_folder)
    
    # Copy input folder to output folder
    shutil.copytree(input_folder, output_folder)
    
    # Process all files in output folder
    for root, dirs, files in os.walk(output_folder, topdown=False):
        for file in files:
            file_path = Path(root) / file
            
            # Rename file to add .txt extension
            new_file_path = file_path.parent / f"{file}.txt"
            
            try:
                # Read file content
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                # Base64 encode content
                encoded_content = base64.b64encode(content)
                
                # Save encoded content to new file
                with open(new_file_path, 'wb') as f:
                    f.write(encoded_content)
                
                # Remove original file
                if file_path != new_file_path:
                    os.remove(file_path)
                    
            except Exception as e:
                print(f"Error processing {file_path}: {e}")
    
    print(f"Successfully created encoded folder at: {output_folder}")
    return str(output_folder)


def decode_folder(encoded_folder_path):
    """
    Takes an encoded folder path, removes the '-encoded' suffix,
    removes '.txt' extension from all files, and base64 decodes their content.

    Args:
        encoded_folder_path: Path to the encoded folder
    """
    # Convert to absolute path and validate
    encoded_folder = Path(encoded_folder_path).resolve()
    if not encoded_folder.is_dir():
        print(f"Error: {encoded_folder} is not a valid directory")
        sys.exit(1)

    # Create output folder path
    folder_name = encoded_folder.name.replace('-encoded', '')
    output_folder = encoded_folder.parent / folder_name

    # Remove output folder if it exists
    if output_folder.exists():
        shutil.rmtree(output_folder)

    # Copy encoded folder to output folder
    shutil.copytree(encoded_folder, output_folder)

    # Process all files in output folder
    for root, dirs, files in os.walk(output_folder, topdown=False):
        for file in files:
            file_path = Path(root) / file

            # Remove .txt extension
            if file_path.suffix == '.txt':
                new_file_path = file_path.with_suffix('')

                try:
                    # Read encoded content
                    with open(file_path, 'rb') as f:
                        encoded_content = f.read()

                    # Base64 decode content
                    decoded_content = base64.b64decode(encoded_content)

                    # Save decoded content to new file
                    with open(new_file_path, 'wb') as f:
                        f.write(decoded_content)

                    # Remove original file
                    if file_path != new_file_path:
                        os.remove(file_path)

                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

    print(f"Successfully created decoded folder at: {output_folder}")
    return str(output_folder)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python encode_folder.py <folder_path>")
        sys.exit(1)
    
    input_folder = sys.argv[1]
    output_folder = decode_folder(input_folder)
    print(f"Encoded folder created at: {output_folder}")