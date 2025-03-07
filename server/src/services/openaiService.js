import { OpenAI } from 'openai';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Service to handle interactions with OpenAI API for translations
 */
class OpenAIService {
  /**
   * Translate text using OpenAI
   * 
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @param {Object} options - Additional translation options (tone, style, etc.)
   * @returns {Promise<string>} - Translated text
   */
  async translateText(text, sourceLang, targetLang, options = {}) {
    try {
      // Validate inputs
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input');
      }
      
      if (!sourceLang || !targetLang) {
        throw new Error('Source and target languages are required');
      }
      
      // Create enhanced system instruction based on languages and options
      const systemInstruction = this._createSystemInstruction(sourceLang, targetLang, options);
      
      // Determine appropriate model and parameters based on options
      const modelParams = this._determineModelParameters(options);
      
      // Check if text exceeds token limit and handle accordingly
      if (this._exceedsTokenLimit(text)) {
        return this._handleLargeText(text, sourceLang, targetLang, options);
      }
      
      // Call OpenAI API for translation
      const response = await openai.chat.completions.create({
        model: modelParams.model,
        messages: [
          {
            role: 'system',
            content: systemInstruction
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: modelParams.temperature,
        max_tokens: modelParams.maxTokens
      });
      
      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error(`OpenAI translation error: ${error.message}`);
      
      // Handle different types of errors
      if (error.response) {
        const status = error.response.status;
        
        if (status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (status === 401) {
          throw new Error('Authentication error. Please check your API key.');
        } else if (status === 500) {
          throw new Error('OpenAI service error. Please try again later.');
        }
      }
      
      throw new Error('Translation failed. Please try again.');
    }
  }
  
  /**
   * Create a detailed system instruction based on languages and options
   * @private
   */
  _createSystemInstruction(sourceLang, targetLang, options) {
    // Basic instruction
    let instruction = `You are a professional translator with expertise in ${sourceLang} and ${targetLang}. `;
    instruction += `Translate the text from ${sourceLang} to ${targetLang}, preserving the original meaning and context. `;
    
    // Add tone instruction
    if (options.tone) {
      switch(options.tone) {
        case 'formal':
          instruction += 'Use formal language, appropriate for professional or academic contexts. ';
          break;
        case 'informal':
          instruction += 'Use informal but respectful language. ';
          break;
        case 'casual':
          instruction += 'Use casual, conversational language. ';
          break;
        case 'professional':
          instruction += 'Use professional language appropriate for business contexts. ';
          break;
        default:
          instruction += 'Use a neutral tone. ';
      }
    }
    
    // Add style instruction
    if (options.style) {
      switch(options.style) {
        case 'simplified':
          instruction += 'Simplify the translation while preserving core meaning. Use simpler vocabulary and shorter sentences. ';
          break;
        case 'detailed':
          instruction += 'Provide a detailed translation, preserving nuances and subtleties of the original text. ';
          break;
        case 'standard':
        default:
          instruction += 'Translate with a balance of accuracy and readability. ';
      }
    }
    
    // Add formatting instruction
    if (options.preserveFormatting) {
      instruction += 'Preserve the original formatting including paragraphs, bullet points, and text structure. ';
    }
    
    // Language-specific instructions
    instruction += this._getLanguageSpecificInstructions(targetLang);
    
    return instruction;
  }
  
  /**
   * Get language-specific translation instructions
   * @private
   */
  _getLanguageSpecificInstructions(targetLang) {
    // Map of language codes to specific instructions
    const langInstructions = {
      'es': 'For Spanish, pay attention to formal vs. informal "you" (tú/usted) based on the tone. ',
      'fr': 'For French, pay attention to formal vs. informal "you" (tu/vous) based on the tone. ',
      'de': 'For German, pay attention to formal vs. informal "you" (du/Sie) based on the tone. ',
      'ja': 'For Japanese, use appropriate levels of politeness (keigo) based on the tone. ',
      'zh': 'For Chinese, use simplified characters unless otherwise specified. ',
      // Add more languages as needed
    };
    
    return langInstructions[targetLang] || '';
  }
  
  /**
   * Determine model and parameters based on options
   * @private
   */
  _determineModelParameters(options) {
    // Default parameters
    const params = {
      model: 'gpt-4', // Default to GPT-4 for best translation quality
      temperature: 0.3, // Default to lower temperature for accuracy
      maxTokens: 2000 // Default max tokens
    };
    
    // Adjust based on style
    if (options.style === 'detailed') {
      params.temperature = 0.4; // Slightly higher for more nuanced translations
      params.maxTokens = 3000; // More tokens for detailed translations
    } else if (options.style === 'simplified') {
      params.temperature = 0.2; // Lower for more consistent, simple translations
      params.maxTokens = 1500; // Fewer tokens for simplified translations
    }
    
    return params;
  }
  
  /**
   * Check if text exceeds token limit
   * @private
   */
  _exceedsTokenLimit(text) {
    // Rough estimation: 1 token is about 4 characters for English
    // For safety, we'll use a more conservative estimate
    const estimatedTokens = Math.ceil(text.length / 3);
    
    // GPT-4 has a context window of about 8K tokens, but we want to leave room for the response
    return estimatedTokens > 3000;
  }
  
  /**
   * Handle large text by splitting, translating chunks, and recombining
   * @private
   */
  async _handleLargeText(text, sourceLang, targetLang, options) {
    // Split text into paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    
    // Group paragraphs into chunks of reasonable size
    const chunks = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed our chunk size limit, start a new chunk
      if (currentChunk.length + paragraph.length > 2500) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    // Translate each chunk
    const translatedChunks = [];
    for (const chunk of chunks) {
      // We need to use the basic translateText method without the large text check
      // to avoid infinite recursion
      const translatedChunk = await this._translateChunk(chunk, sourceLang, targetLang, options);
      translatedChunks.push(translatedChunk);
    }
    
    // Combine translated chunks
    return translatedChunks.join('\n\n');
  }
  
  /**
   * Translate a single chunk of text (helper method for handling large texts)
   * @private
   */
  async _translateChunk(chunk, sourceLang, targetLang, options) {
    // Create system instruction
    const systemInstruction = this._createSystemInstruction(sourceLang, targetLang, options);
    
    // Determine model parameters
    const modelParams = this._determineModelParameters(options);
    
    // Call OpenAI API
    try {
      const response = await openai.chat.completions.create({
        model: modelParams.model,
        messages: [
          {
            role: 'system',
            content: systemInstruction
          },
          {
            role: 'user',
            content: chunk
          }
        ],
        temperature: modelParams.temperature,
        max_tokens: modelParams.maxTokens
      });
      
      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error(`Chunk translation error: ${error.message}`);
      // For chunk errors, we'll return an error indicator rather than failing the whole translation
      return `[TRANSLATION ERROR: ${error.message}]`;
    }
  }
  
  /**
   * Detect the language of the provided text
   * @param {string} text - Text to analyze
   * @returns {Promise<string>} - Detected language code
   */
  async detectLanguage(text) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a language detection system. Analyze the provided text and respond with only the ISO 639-1 language code of the detected language (e.g., "en" for English, "fr" for French).'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });
      
      return response.choices[0].message.content.trim().toLowerCase();
    } catch (error) {
      logger.error(`Language detection error: ${error.message}`);
      throw new Error('Language detection failed. Please specify the source language manually.');
    }
  }
}

export default new OpenAIService();