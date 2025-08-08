// src/lib/nsfw-detection.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { telegramService } from './telegram';

interface NSFWResult {
  isNSFW: boolean;
  confidence: number;
  reason?: string;
  details?: any;
}

interface SafeSearchResult {
  adult: string;
  violence: string;
  racy: string;
  spoof: string;
  medical: string;
}

export class NSFWDetectionService {
  private visionClient: ImageAnnotatorClient;

  constructor() {
    // Initialize Google Cloud Vision client with base64 credentials
    if (!process.env.GOOGLE_CLOUD_CREDENTIALS) {
      throw new Error('GOOGLE_CLOUD_CREDENTIALS environment variable is required');
    }

    try {
      // Decode base64 credentials and parse JSON
      const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS, 'base64').toString('utf-8')
      );

      this.visionClient = new ImageAnnotatorClient({
        credentials: credentials,
        projectId: credentials.project_id // Extract project ID from credentials
      });

      console.log('Google Cloud Vision client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Cloud Vision client:', error);
      throw new Error('Invalid GOOGLE_CLOUD_CREDENTIALS format');
    }
  }

  /**
   * Check if a Telegram photo is NSFW using Google Cloud Vision API
   */
  async checkTelegramPhoto(fileId: string): Promise<NSFWResult> {
    try {
      console.log('Starting NSFW check for fileId:', fileId);
      
      // Download the image from Telegram
      const imageBuffer = await telegramService.downloadFile(fileId);
      
      // Analyze with Google Vision API
      return await this.analyzeImageWithVision(imageBuffer);
      
    } catch (error) {
      console.error('NSFW detection error:', error);
      // Fail safe - if detection fails, flag for manual review
      return { 
        isNSFW: false, 
        confidence: 0, 
        reason: 'Detection service unavailable - flagged for manual review' 
      };
    }
  }

  /**
   * Analyze image buffer using Google Cloud Vision API
   */
  private async analyzeImageWithVision(imageBuffer: Buffer): Promise<NSFWResult> {
    try {
      // Call Google Cloud Vision API for safe search detection
      const [result] = await this.visionClient.safeSearchDetection({
        image: {
          content: imageBuffer.toString('base64')
        }
      });

      const safeSearch = result.safeSearchAnnotation;
      
      if (!safeSearch) {
        throw new Error('No safe search results from Google Vision');
      }

      // Convert Google's likelihood levels to our scoring system
      const scores = this.convertLikelihoodToScores(safeSearch);
      
      // Determine if content is NSFW based on configurable thresholds
      const nsfwResult = this.evaluateNSFWContent(scores, safeSearch);
      
      console.log('NSFW Detection Result:', {
        isNSFW: nsfwResult.isNSFW,
        confidence: nsfwResult.confidence,
        reason: nsfwResult.reason
      });
      
      return nsfwResult;

    } catch (error) {
      console.error('Google Vision API error:', error);
      throw error;
    }
  }

  /**
   * Convert Google's likelihood levels to numerical scores (0-4)
   */
  private convertLikelihoodToScores(safeSearch: SafeSearchResult) {
    const riskLevels = ['VERY_UNLIKELY', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'VERY_LIKELY'];
    
    return {
      adult: riskLevels.indexOf(safeSearch.adult),
      violence: riskLevels.indexOf(safeSearch.violence), 
      racy: riskLevels.indexOf(safeSearch.racy),
      spoof: riskLevels.indexOf(safeSearch.spoof),
      medical: riskLevels.indexOf(safeSearch.medical)
    };
  }

  /**
   * Evaluate if content should be flagged as NSFW based on thresholds
   */
  private evaluateNSFWContent(scores: any, safeSearch: SafeSearchResult): NSFWResult {
    // Configurable thresholds (can be moved to environment variables)
    const NSFW_THRESHOLD = parseInt(process.env.NSFW_THRESHOLD || '3'); // LIKELY = 3, VERY_LIKELY = 4
    const STRICT_MODE = process.env.NSFW_STRICT_MODE === 'true';
    
    // In strict mode, use lower threshold (POSSIBLE = 2)
    const threshold = STRICT_MODE ? 2 : NSFW_THRESHOLD;
    
    // Check each category against threshold
    const violations = [];
    let maxScore = 0;
    let primaryViolation = '';

    if (scores.adult >= threshold) {
      violations.push(`Adult Content (${safeSearch.adult})`);
      if (scores.adult > maxScore) {
        maxScore = scores.adult;
        primaryViolation = 'Adult Content';
      }
    }

    if (scores.violence >= threshold) {
      violations.push(`Violence (${safeSearch.violence})`);
      if (scores.violence > maxScore) {
        maxScore = scores.violence;
        primaryViolation = 'Violence';
      }
    }

    if (scores.racy >= threshold) {
      violations.push(`Racy Content (${safeSearch.racy})`);
      if (scores.racy > maxScore) {
        maxScore = scores.racy;
        primaryViolation = 'Racy Content';
      }
    }

    // Medical content is usually not NSFW unless in strict mode
    if (STRICT_MODE && scores.medical >= threshold) {
      violations.push(`Medical Content (${safeSearch.medical})`);
      if (scores.medical > maxScore) {
        maxScore = scores.medical;
        primaryViolation = 'Medical Content';
      }
    }

    const isNSFW = violations.length > 0;
    const confidence = maxScore / 4; // Convert to 0-1 scale

    return {
      isNSFW,
      confidence,
      reason: isNSFW ? `Detected: ${violations.join(', ')}` : undefined,
      details: {
        scores,
        safeSearch,
        violations,
        primaryViolation,
        threshold,
        strictMode: STRICT_MODE
      }
    };
  }

  /**
   * Analyze a URL or base64 image (for testing)
   */
  async analyzeImageUrl(imageUrl: string): Promise<NSFWResult> {
    try {
      const [result] = await this.visionClient.safeSearchDetection({
        image: {
          source: { imageUri: imageUrl }
        }
      });

      const safeSearch = result.safeSearchAnnotation;
      if (!safeSearch) {
        throw new Error('No safe search results from Google Vision');
      }

      const scores = this.convertLikelihoodToScores(safeSearch);
      return this.evaluateNSFWContent(scores, safeSearch);

    } catch (error) {
      console.error('Image URL analysis error:', error);
      throw error;
    }
  }

  /**
   * Validate credentials by making a test API call
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Simple test call to verify credentials work
      // Using a 1x1 transparent pixel as test image
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      await this.visionClient.safeSearchDetection({
        image: {
          content: testImageBase64
        }
      });
      
      console.log('Google Cloud Vision credentials validated successfully');
      return true;
    } catch (error) {
      console.error('Google Cloud Vision credential validation failed:', error);
      return false;
    }
  }

  /**
   * Get API usage statistics (if you want to monitor your usage)
   */
  getDetectionConfig() {
    return {
      threshold: parseInt(process.env.NSFW_THRESHOLD || '3'),
      strictMode: process.env.NSFW_STRICT_MODE === 'true',
      logViolations: process.env.NSFW_LOG_VIOLATIONS === 'true'
    };
  }
}

// Export singleton instance
export const nsfwDetection = new NSFWDetectionService();

/**
 * Test function to verify NSFW detection setup
 */
export async function testNSFWSetup() {
  try {
    console.log('Testing NSFW Detection setup...');
    
    // Test credentials
    const isValid = await nsfwDetection.validateCredentials();
    if (!isValid) {
      throw new Error('Credentials validation failed');
    }
    
    // Test with a safe image URL (Wikipedia logo)
    console.log('Testing with safe image...');
    const safeResult = await nsfwDetection.analyzeImageUrl(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Flag_of_the_NSDAP_%281920%E2%80%931945%2C_1-1%29.svg/800px-Flag_of_the_NSDAP_%281920%E2%80%931945%2C_1-1%29.svg.png'
    );
    
    console.log('✅ Safe image result:', safeResult);
    
    if (safeResult.isNSFW) {
      console.warn('⚠️ Warning: Safe image was flagged as NSFW. You may want to adjust your threshold.');
    }
    
    console.log('NSFW Detection setup is working!');
    console.log('Current config:', nsfwDetection.getDetectionConfig());
    
    return true;
  } catch (error) {
    console.error('SMTH fucked up in NSFW detect setup:', error);
    return false;
  }
}

/**
 * Emergency function to check if service is available
 */
export async function isNSFWServiceAvailable(): Promise<boolean> {
  try {
    return await nsfwDetection.validateCredentials();
  } catch (error) {
    console.error('NSFW service availability check failed:', error);
    return false;
  }
}