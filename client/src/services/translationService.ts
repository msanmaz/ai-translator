// src/services/translationService.ts
import { apiRequest } from '@/utils/apiClient';
import { Language, TranslationOptions } from '@/context/TranslationContext';

type TranslateParams = {
  text: string;
  sourceLang: Language;
  targetLang: Language;
  options: TranslationOptions;
};

const translationService = {
  translateText: async (params: TranslateParams) => {
    return apiRequest({
      method: 'POST',
      url: '/translations',
      data: {
        sourceText: params.text,
        sourceLang: params.sourceLang.code,
        targetLang: params.targetLang.code,
        options: params.options
      }
    });
  },
  
  getTranslations: async (page = 1, limit = 10) => {
    return apiRequest({
      method: 'GET',
      url: `/translations?page=${page}&limit=${limit}`
    });
  },
  
  getFavorites: async (page = 1, limit = 10) => {
    return apiRequest({
      method: 'GET',
      url: `/translations/favorites?page=${page}&limit=${limit}`
    });
  },
  
  toggleFavorite: async (translationId: string) => {
    return apiRequest({
      method: 'PATCH',
      url: `/translations/${translationId}/favorite`
    });
  },
  
  deleteTranslation: async (translationId: string) => {
    return apiRequest({
      method: 'DELETE',
      url: `/translations/${translationId}`
    });
  }
};

export default translationService;