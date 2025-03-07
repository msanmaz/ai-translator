import { useState } from "react";
import { Language, TranslationOptions } from "../context/TranslationContext";
import translationService from "../services/translationService";
import { handleApiError } from "@/utils/errorHandlers";

interface TranslationResponse {
  success: boolean;
  data: {
    translatedText: string;
    [key: string]: string | number | boolean | object;
  };
}


interface TranslateParams {
  text: string;
  sourceLang: Language;
  targetLang: Language;
  options: TranslationOptions;
}

export const useTranslator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateText = async ({ text, sourceLang, targetLang, options }: TranslateParams): Promise<string> => {
    if (!text.trim()) return "";

    setIsLoading(true);
    setError(null);

    try {
      const response = await translationService.translateText({
        text, sourceLang, targetLang, options
      }) as TranslationResponse;
      
      return response.data.translatedText;
    } catch (err) {
      const errorMessage = handleApiError(err, "Translation failed. Please try again.");
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { translateText, isLoading, error };
};