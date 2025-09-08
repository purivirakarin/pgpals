#!/usr/bin/env node

/**
 * PGPals Photo Downloader Script
 * 
 * This script downloads all submission photos from the PGPals application.
 * It can be run as a standalone Node.js script.
 * 
 * Usage:
 *   node download-photos.js [options]
 * 
 * Options:
 *   --url <base_url>         Base URL of the PGPals application (default: http://localhost:3000)
 *   --quest-id <id>          Filter by specific quest ID
 *   --status <status>        Filter by submission status (pending_ai, approved, rejected, etc.)
 *   --user-id <id>           Filter by specific user ID
 *   --include-deleted        Include soft-deleted submissions
 *   --output-dir <dir>       Output directory for downloaded photos (default: ./photos)
 *   --session-token <token>  Admin session token for authentication
 *   --help                   Show this help message
 * 
 * Examples:
 *   node download-photos.js --url https://pgpals.app --output-dir ./photos
 *   node download-photos.js --quest-id 5 --status approved
 *   node download-photos.js --user-id 123 --include-deleted
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  questId: null,
  status: null,
  userId: null,
  includeDeleted: false,
  outputDir: './photos',
  sessionToken: null,
  help: false
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--url':
        config.baseUrl = nextArg;
        i++;
        break;
      case '--quest-id':
        config.questId = nextArg;
        i++;
        break;
      case '--status':
        config.status = nextArg;
        i++;
        break;
      case '--user-id':
        config.userId = nextArg;
        i++;
        break;
      case '--include-deleted':
        config.includeDeleted = true;
        break;
      case '--output-dir':
        config.outputDir = nextArg;
        i++;
        break;
      case '--session-token':
        config.sessionToken = nextArg;
        i++;
        break;
      case '--help':
        config.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }
}

// Show help message
function showHelp() {
  const helpText = `
PGPals Photo Downloader Script

This script downloads all submission photos from the PGPals application.

Usage:
  node download-photos.js [options]

Options:
  --url <base_url>         Base URL of the PGPals application (default: http://localhost:3000)
  --quest-id <id>          Filter by specific quest ID
  --status <status>        Filter by submission status (pending_ai, approved, rejected, etc.)
  --user-id <id>           Filter by specific user ID
  --include-deleted        Include soft-deleted submissions
  --output-dir <dir>       Output directory for downloaded photos (default: ./photos)
  --session-token <token>  Admin session token for authentication
  --help                   Show this help message

Examples:
  node download-photos.js --url https://pgpals.app --output-dir ./photos
  node download-photos.js --quest-id 5 --status approved
  node download-photos.js --user-id 123 --include-deleted

Note: You need admin authentication to use this script. You can either:
1. Run this script from a machine where you're logged in as admin in a browser
2. Provide a session token using --session-token option
`;
  console.log(helpText);
}

// Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestModule = url.startsWith('https:') ? https : http;
    
    const req = requestModule.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
  });
}

// Download a file
function downloadFile(url, filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const requestModule = url.startsWith('https:') ? https : http;
    
    const req = requestModule.get(url, options, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(filePath);
        
        res.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        
        fileStream.on('error', (error) => {
          fs.unlink(filePath, () => {}); // Delete the partial file
          reject(error);
        });
      } else {
        reject(new Error(`HTTP ${res.statusCode}: Failed to download ${url}`));
      }
    });
    
    req.on('error', (error) => {
      reject(error);
    });
  });
}

// Create directory if it doesn't exist
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Main function
async function main() {
  parseArgs();
  
  if (config.help) {
    showHelp();
    return;
  }
  
  console.log('PGPals Photo Downloader');
  console.log('========================');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Output directory: ${config.outputDir}`);
  
  if (config.questId) console.log(`Quest ID filter: ${config.questId}`);
  if (config.status) console.log(`Status filter: ${config.status}`);
  if (config.userId) console.log(`User ID filter: ${config.userId}`);
  if (config.includeDeleted) console.log(`Including deleted submissions`);
  
  console.log('');
  
  try {
    // Build the API URL
    const params = new URLSearchParams();
    params.append('format', 'json');
    if (config.questId) params.append('questId', config.questId);
    if (config.status) params.append('status', config.status);
    if (config.userId) params.append('userId', config.userId);
    if (config.includeDeleted) params.append('includeDeleted', 'true');
    
    const apiUrl = `${config.baseUrl}/api/admin/submissions/download-photos?${params.toString()}`;
    
    console.log('Fetching photo list...');
    
    // Prepare request options for authentication
    const requestOptions = {};
    if (config.sessionToken) {
      requestOptions.headers = {
        'Cookie': `next-auth.session-token=${config.sessionToken}`
      };
    }
    
    // Get the list of photos
    const response = await makeRequest(apiUrl, requestOptions);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    console.log(`Found ${response.total_photos} photos to download`);
    
    if (response.total_photos === 0) {
      console.log('No photos found with the specified filters.');
      return;
    }
    
    // Create output directory
    ensureDir(config.outputDir);
    
    // Download each photo
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < response.photos.length; i++) {
      const photo = response.photos[i];
      const progress = `[${i + 1}/${response.photos.length}]`;
      
      try {
        console.log(`${progress} Downloading: ${photo.suggested_filename}`);
        
        const photoUrl = `${config.baseUrl}${photo.download_url}`;
        const filePath = path.join(config.outputDir, photo.suggested_filename);
        
        await downloadFile(photoUrl, filePath, requestOptions);
        successCount++;
        
      } catch (error) {
        console.error(`${progress} Error downloading ${photo.suggested_filename}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('Download completed!');
    console.log(`Successful downloads: ${successCount}`);
    console.log(`Failed downloads: ${errorCount}`);
    console.log(`Photos saved to: ${path.resolve(config.outputDir)}`);
    
    // Create a summary file
    const summaryPath = path.join(config.outputDir, 'download-summary.json');
    const summary = {
      timestamp: new Date().toISOString(),
      total_photos: response.total_photos,
      successful_downloads: successCount,
      failed_downloads: errorCount,
      filters_applied: response.filters_applied,
      photos: response.photos
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`Summary saved to: ${path.resolve(summaryPath)}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.message.includes('Unauthorized')) {
      console.log('');
      console.log('Authentication failed. Please make sure you are logged in as an admin.');
      console.log('You can either:');
      console.log('1. Run this script from a machine where you are logged in as admin in a browser');
      console.log('2. Provide a session token using the --session-token option');
    }
    
    process.exit(1);
  }
}

// Handle process exit
process.on('SIGINT', () => {
  console.log('\nDownload interrupted by user.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nDownload terminated.');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, config };
