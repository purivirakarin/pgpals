#!/bin/bash

# PGPals Photo Download Script (Bash version)
# This script uses curl to download photos from PGPals submissions
#
# Usage: ./download-photos.sh [BASE_URL] [SESSION_TOKEN] [OUTPUT_DIR]
#
# Examples:
#   ./download-photos.sh http://localhost:3000 "your-session-token" ./photos
#   ./download-photos.sh https://pgpals.app "your-session-token" ./downloads

# Default values
BASE_URL=${1:-"http://localhost:3000"}
SESSION_TOKEN=${2:-""}
OUTPUT_DIR=${3:-"./photos"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}PGPals Photo Downloader (Bash)${NC}"
echo "=================================="
echo "Base URL: $BASE_URL"
echo "Output Directory: $OUTPUT_DIR"
echo ""

# Check if required tools are available
command -v curl >/dev/null 2>&1 || { echo -e "${RED}Error: curl is required but not installed.${NC}" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo -e "${RED}Error: jq is required but not installed. Please install jq first.${NC}" >&2; exit 1; }

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Prepare curl headers
if [ -n "$SESSION_TOKEN" ]; then
    HEADERS="-H 'Cookie: next-auth.session-token=$SESSION_TOKEN'"
else
    HEADERS=""
fi

echo -e "${YELLOW}Fetching photo list...${NC}"

# Get photo list
RESPONSE=$(curl -s $HEADERS "$BASE_URL/api/admin/submissions/download-photos?format=json")

# Check if the response is valid JSON
if ! echo "$RESPONSE" | jq . >/dev/null 2>&1; then
    echo -e "${RED}Error: Invalid response from server${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

# Check for errors in response
ERROR=$(echo "$RESPONSE" | jq -r '.error // empty')
if [ -n "$ERROR" ]; then
    echo -e "${RED}Error: $ERROR${NC}"
    
    if [[ "$ERROR" == *"Unauthorized"* ]]; then
        echo ""
        echo "Authentication failed. Please make sure you:"
        echo "1. Are logged in as an admin user"
        echo "2. Provide a valid session token as the second argument"
        echo ""
        echo "To get your session token:"
        echo "1. Log in as admin in your browser"
        echo "2. Open Developer Tools (F12)"
        echo "3. Go to Application/Storage → Cookies"
        echo "4. Find 'next-auth.session-token' cookie"
        echo "5. Copy its value"
    fi
    
    exit 1
fi

# Get total photos count
TOTAL_PHOTOS=$(echo "$RESPONSE" | jq -r '.total_photos')

if [ "$TOTAL_PHOTOS" -eq 0 ]; then
    echo -e "${YELLOW}No photos found with current filters.${NC}"
    exit 0
fi

echo -e "${GREEN}Found $TOTAL_PHOTOS photos to download${NC}"
echo ""

# Ask for confirmation
read -p "Do you want to download $TOTAL_PHOTOS photos? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Download cancelled."
    exit 0
fi

# Download each photo
SUCCESS_COUNT=0
ERROR_COUNT=0
PHOTO_INDEX=0

# Save photo list to temporary file for processing
TEMP_FILE=$(mktemp)
echo "$RESPONSE" | jq -r '.photos[] | @base64' > "$TEMP_FILE"

while IFS= read -r photo_data; do
    # Decode and parse photo data
    PHOTO=$(echo "$photo_data" | base64 --decode)
    FILE_ID=$(echo "$PHOTO" | jq -r '.telegram_file_id')
    FILENAME=$(echo "$PHOTO" | jq -r '.suggested_filename')
    
    PHOTO_INDEX=$((PHOTO_INDEX + 1))
    echo -ne "${BLUE}[$PHOTO_INDEX/$TOTAL_PHOTOS]${NC} Downloading: $FILENAME..."
    
    # Download the photo
    if curl -s $HEADERS "$BASE_URL/api/admin/submissions/download-photos?format=download&fileId=$FILE_ID" -o "$OUTPUT_DIR/$FILENAME"; then
        # Check if file was actually downloaded (not empty or error page)
        if [ -s "$OUTPUT_DIR/$FILENAME" ]; then
            echo -e " ${GREEN}✓${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo -e " ${RED}✗ (empty file)${NC}"
            rm -f "$OUTPUT_DIR/$FILENAME"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    else
        echo -e " ${RED}✗ (download failed)${NC}"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    
    # Small delay to avoid overwhelming the server
    sleep 0.1
    
done < "$TEMP_FILE"

# Cleanup
rm -f "$TEMP_FILE"

echo ""
echo -e "${GREEN}Download completed!${NC}"
echo "Successful downloads: $SUCCESS_COUNT"
echo "Failed downloads: $ERROR_COUNT"
echo "Photos saved to: $(realpath "$OUTPUT_DIR")"

# Create a simple summary file
SUMMARY_FILE="$OUTPUT_DIR/download-summary.txt"
cat > "$SUMMARY_FILE" << EOF
PGPals Photo Download Summary
============================
Date: $(date)
Base URL: $BASE_URL
Output Directory: $OUTPUT_DIR
Total Photos Found: $TOTAL_PHOTOS
Successful Downloads: $SUCCESS_COUNT
Failed Downloads: $ERROR_COUNT

EOF

echo "Summary saved to: $(realpath "$SUMMARY_FILE")"
