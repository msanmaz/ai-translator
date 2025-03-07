import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient,keepPreviousData } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import translationService from "@/services/translationService";

export interface SingleTranslationResponse {
  success: boolean;
  data: {
    id: string;
    sourceText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    isFavorite: boolean;
  };
}

export type Language = {
  code: string;
  name: string;
  flag?: string;
};

export type TranslationOptions = {
  tone: "formal" | "informal" | "casual" | "professional" | "standard";
  style: "standard" | "simplified" | "detailed";
  preserveFormatting: boolean;
};

export type Translation = {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  createdAt: number;
  options: TranslationOptions;
  isFavorite: boolean;
};

export interface TranslationResponse {
  success: boolean;
  data: Translation[];
  count?: number;
  totalPages?: number;
  currentPage?: number;
}

// Pagination info type
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

// Type for translation data
interface TranslationData {
  text: string;
  sourceLang: Language;
  targetLang: Language;
  options: TranslationOptions;
}

// Context type for mutation
interface MutationContext {
  previousTranslations?: TranslationResponse;
  previousFavorites?: TranslationResponse;
}

type TranslationContextType = {
  sourceLanguage: Language;
  targetLanguage: Language;
  setSourceLanguage: (lang: Language) => void;
  setTargetLanguage: (lang: Language) => void;
  swapLanguages: () => void;
  availableLanguages: Language[];
  translationOptions: TranslationOptions;
  setTranslationOptions: React.Dispatch<React.SetStateAction<TranslationOptions>>;
  translations: Translation[];
  favorites: Translation[];
  isLoadingTranslations: boolean;
  isLoadingFavorites: boolean;
  addTranslation: (data: TranslationData) => Promise<SingleTranslationResponse>;
  toggleFavorite: (id: string) => void;
  isTranslating: boolean;
  
  // Pagination related
  translationPagination: PaginationInfo;
  favoritesPagination: PaginationInfo;
  setTranslationsPage: (page: number) => void;
  setFavoritesPage: (page: number) => void;
};

const DEFAULT_OPTIONS: TranslationOptions = {
  tone: "standard",
  style: "standard",
  preserveFormatting: true,
};

const DEFAULT_PAGINATION: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 0
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};


const STORAGE_KEY_SOURCE = "translation_source_lang";
const STORAGE_KEY_TARGET = "translation_target_lang";
const STORAGE_KEY_OPTIONS = "translation_options";

const LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
];

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [sourceLanguage, setSourceLanguage] = useState<Language>(LANGUAGES[0]);
  const [targetLanguage, setTargetLanguage] = useState<Language>(LANGUAGES[1]);
  const [translationOptions, setTranslationOptions] = useState<TranslationOptions>(DEFAULT_OPTIONS);
  
  // Pagination state
  const [translationsPage, setTranslationsPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);

  // Fetch translations using React Query with pagination
  const translationsQuery = useQuery<TranslationResponse, Error>({
    queryKey: ['translations', user?.id, translationsPage],
    queryFn: async () => await translationService.getTranslations(translationsPage) as TranslationResponse,
    enabled: !!user,
    staleTime: 60000,
    refetchOnMount: false,
    placeholderData: keepPreviousData 
  });
  
  // Fetch favorites using React Query with pagination
  const favoritesQuery = useQuery<TranslationResponse, Error>({
    queryKey: ['favorites', user?.id, favoritesPage],
    queryFn: async () => await translationService.getFavorites(favoritesPage) as TranslationResponse,
    enabled: !!user,
    staleTime: 60000,
    refetchOnMount: false,
    placeholderData: keepPreviousData
  });
  
  // Add translation mutation
  const addTranslationMutation = useMutation<SingleTranslationResponse, Error, TranslationData>({
    mutationFn: async (translationData) => 
      await translationService.translateText(translationData) as SingleTranslationResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
    }
  });
  const isTranslating = addTranslationMutation.isPending;

  // Toggle favorite mutation with optimistic updates
  const toggleFavoriteMutation = useMutation<TranslationResponse, Error, string, MutationContext>({
    mutationFn: async (id) => 
      await translationService.toggleFavorite(id) as TranslationResponse,
          onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['translations'] });
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      
      const previousTranslations = queryClient.getQueryData<TranslationResponse>(['translations', user?.id, translationsPage]);
      const previousFavorites = queryClient.getQueryData<TranslationResponse>(['favorites', user?.id, favoritesPage]);
      
      // Update all pages of translations cache to reflect the favorite change
      queryClient.getQueriesData<TranslationResponse>({ queryKey: ['translations', user?.id] })
        .forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, {
              ...data,
              data: data.data.map(t => 
                t.id === id ? {...t, isFavorite: !t.isFavorite} : t
              )
            });
          }
        });
      
      // Handle removing from favorites if unfavoriting
      const isFavorited = previousFavorites?.data.some(t => t.id === id);
      
      if (isFavorited && previousFavorites) {
        queryClient.setQueryData<TranslationResponse>(['favorites', user?.id, favoritesPage], old => {
          if (!old) return previousFavorites;
          const updatedData = old.data.filter(t => t.id !== id);
          
          const newCount = (old.count || 0) - 1;
          
          // If this was the last item on the last page, adjust page number
          const shouldGoToPreviousPage = 
            updatedData.length === 0 && 
            old.currentPage !== undefined && 
            old.currentPage > 1 && 
            old.currentPage === old.totalPages;
          
          return {
            ...old,
            data: updatedData,
            count: newCount,
            totalPages: Math.max(1, Math.ceil(newCount / 10)),
            currentPage: shouldGoToPreviousPage ? old.currentPage - 1 : old.currentPage
          };
        });
        
        // If going to previous page is needed, update the page state
        if (previousFavorites.data.length === 1 && 
            favoritesPage > 1 && 
            favoritesPage === previousFavorites.totalPages) {
          setFavoritesPage(favoritesPage - 1);
        }
      }
      
      return { previousTranslations, previousFavorites };
    },
    onError: (err, id, context) => {
      if (context?.previousTranslations) {
        queryClient.setQueryData(['translations', user?.id, translationsPage], context.previousTranslations);
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', user?.id, favoritesPage], context.previousFavorites);
      }
    },
    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  // Helper function for add translation
  const addTranslation = async (data: TranslationData): Promise<SingleTranslationResponse> => {
    return addTranslationMutation.mutateAsync(data);
  };

  // Helper function for toggle favorite
  const toggleFavorite = (id: string) => {
    toggleFavoriteMutation.mutate(id);
  };

  // Handle source/target language swap
  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  };

  // Load saved languages and options when user changes
  useEffect(() => {
    if (user) {
      const userId = user.id;
      const savedSourceLang = localStorage.getItem(`${STORAGE_KEY_SOURCE}_${userId}`);
      const savedTargetLang = localStorage.getItem(`${STORAGE_KEY_TARGET}_${userId}`);
      const savedOptions = localStorage.getItem(`${STORAGE_KEY_OPTIONS}_${userId}`);
      
      if (savedSourceLang) {
        try {
          const lang = JSON.parse(savedSourceLang);
          const foundLang = LANGUAGES.find(l => l.code === lang.code);
          if (foundLang) setSourceLanguage(foundLang);
        } catch (e) {
          console.error("Failed to parse saved source language", e);
        }
      }
      
      if (savedTargetLang) {
        try {
          const lang = JSON.parse(savedTargetLang);
          const foundLang = LANGUAGES.find(l => l.code === lang.code);
          if (foundLang) setTargetLanguage(foundLang);
        } catch (e) {
          console.error("Failed to parse saved target language", e);
        }
      }
      
      if (savedOptions) {
        try {
          setTranslationOptions({
            ...DEFAULT_OPTIONS,
            ...JSON.parse(savedOptions)
          });
        } catch (e) {
          console.error("Failed to parse saved options", e);
        }
      }
    }
  }, [user]);

  // Save languages and options to localStorage
  useEffect(() => {
    if (user) {
      const userId = user.id;
      localStorage.setItem(`${STORAGE_KEY_SOURCE}_${userId}`, JSON.stringify(sourceLanguage));
      localStorage.setItem(`${STORAGE_KEY_TARGET}_${userId}`, JSON.stringify(targetLanguage));
      localStorage.setItem(`${STORAGE_KEY_OPTIONS}_${userId}`, JSON.stringify(translationOptions));
    }
  }, [sourceLanguage, targetLanguage, translationOptions, user]);

  // Reset when logged out
  useEffect(() => {
    if (!user) {
      setSourceLanguage(LANGUAGES[0]);
      setTargetLanguage(LANGUAGES[1]);
      setTranslationOptions(DEFAULT_OPTIONS);
      setTranslationsPage(1);
      setFavoritesPage(1);
    }
  }, [user]);

  // Extract data from queries
  const translations = translationsQuery.data?.data || [];
  const favorites = favoritesQuery.data?.data || [];
  const isLoadingTranslations = translationsQuery.isLoading || translationsQuery.isFetching;
  const isLoadingFavorites = favoritesQuery.isLoading || favoritesQuery.isFetching;

  // Create pagination info objects
  const translationPagination: PaginationInfo = {
    currentPage: translationsQuery.data?.currentPage || 1,
    totalPages: translationsQuery.data?.totalPages || 1,
    totalCount: translationsQuery.data?.count || 0
  };
  
  const favoritesPagination: PaginationInfo = {
    currentPage: favoritesQuery.data?.currentPage || 1,
    totalPages: favoritesQuery.data?.totalPages || 1,
    totalCount: favoritesQuery.data?.count || 0
  };

  return (
    <TranslationContext.Provider
      value={{
        sourceLanguage,
        targetLanguage,
        setSourceLanguage,
        setTargetLanguage,
        swapLanguages,
        availableLanguages: LANGUAGES,
        translationOptions,
        setTranslationOptions,
        translations,
        favorites,
        isLoadingTranslations,
        isLoadingFavorites,
        addTranslation,
        toggleFavorite,
        isTranslating,
        translationPagination,
        favoritesPagination,
        setTranslationsPage,
        setFavoritesPage
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};