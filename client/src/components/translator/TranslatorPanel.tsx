import React, { useState, useRef, useEffect } from 'react'
import { Repeat, Copy, Volume2, Star, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/context/TranslationContext'
import { useTranslator } from '@/hooks/useTranslation'
import LanguageSelector from './LanguageSelector'
import CustomizationOptions from './CustomizationOptions'
import CustomButton from '@/components/ui/CustomButton'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AnimatedTransition from '@/components/shared/AnimatedTransition'
import { Skeleton } from '../ui/skeleton'

const TranslatorPanel: React.FC = () => {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [activeTab, setActiveTab] = useState('translate')
  const sourceTextareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const {
    sourceLanguage,
    targetLanguage,
    swapLanguages,
    translationOptions,
    translations,
    isLoadingTranslations,
    addTranslation,
    toggleFavorite,
    isTranslating,
    translationPagination, 
    setTranslationsPage 
  } = useTranslation()

  const { isLoading, error } = useTranslator()

  useEffect(() => {
    if (error) {
      toast({
        title: 'Translation Error',
        description: error,
        variant: 'destructive',
      })
    }
  }, [error, toast])

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: 'Empty Text',
        description: 'Please enter some text to translate.',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await addTranslation({
        text: sourceText,
        sourceLang: sourceLanguage,
        targetLang: targetLanguage,
        options: translationOptions,
      })

      if (result && result.data && result.data.translatedText) {
        setTranslatedText(result.data.translatedText)
      }
    } catch (error) {
      // Error handling is done in the useEffect
    }
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: 'Copied',
          description: 'Text copied to clipboard',
        })
      },
      err => {
        console.error('Could not copy text: ', err)
        toast({
          title: 'Copy Failed',
          description: 'Could not copy text to clipboard',
          variant: 'destructive',
        })
      }
    )
  }

  const handleTextToSpeech = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = langCode
      window.speechSynthesis.speak(utterance)

      toast({
        title: 'Speaking',
        description: 'Text-to-speech started',
      })
    } else {
      toast({
        title: 'Not Supported',
        description: 'Text-to-speech is not supported in your browser',
        variant: 'destructive',
      })
    }
  }

  const handleClear = () => {
    setSourceText('')
    setTranslatedText('')
    if (sourceTextareaRef.current) {
      sourceTextareaRef.current.focus()
    }
  }

  const handleSwapLanguages = () => {
    if (translatedText) {
      setSourceText(translatedText)
      setTranslatedText('')
    }
    swapLanguages()
  }


  return (
    <div className="w-full max-w-3xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="translate">Translate</TabsTrigger>
          <TabsTrigger value="history">Recent Translations</TabsTrigger>
        </TabsList>

        <TabsContent value="translate" className="space-y-6">
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <LanguageSelector type="source" className="w-40" />

              <CustomButton
                variant="ghost"
                size="icon"
                onClick={handleSwapLanguages}
                aria-label="Swap languages"
                className="mx-2"
              >
                <Repeat className="h-5 w-5" />
              </CustomButton>

              <LanguageSelector type="target" className="w-40" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
              <div className="p-4">
                <Textarea
                  ref={sourceTextareaRef}
                  value={sourceText}
                  onChange={e => setSourceText(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="min-h-[200px] resize-none border-0 focus-visible:ring-0 p-0 shadow-none"
                />

                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2">
                    <CustomButton
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleTextToSpeech(sourceText, sourceLanguage.code)
                      }
                      disabled={!sourceText}
                      aria-label="Text to speech"
                    >
                      <Volume2 className="h-4 w-4" />
                    </CustomButton>

                    <CustomButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToClipboard(sourceText)}
                      disabled={!sourceText}
                      aria-label="Copy source text"
                    >
                      <Copy className="h-4 w-4" />
                    </CustomButton>
                  </div>

                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    disabled={!sourceText}
                  >
                    Clear
                  </CustomButton>
                </div>
              </div>

              <div className="p-4 bg-translator-muted/30">
                {translatedText ? (
                  <div className="min-h-[200px] text-sm">
                    <AnimatedTransition show={true} direction="fade">
                      <p className="whitespace-pre-line">{translatedText}</p>
                    </AnimatedTransition>
                  </div>
                ) : (
                  <div className="min-h-[200px] flex items-center justify-center text-muted-foreground text-sm italic">
                    {isLoading ? (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-6 w-6 rounded-full border-2 border-translator-accent border-r-transparent animate-spin"></div>
                        <p>Translating...</p>
                      </div>
                    ) : (
                      'Translation will appear here'
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2">
                    <CustomButton
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleTextToSpeech(translatedText, targetLanguage.code)
                      }
                      disabled={!translatedText}
                      aria-label="Text to speech"
                    >
                      <Volume2 className="h-4 w-4" />
                    </CustomButton>

                    <CustomButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToClipboard(translatedText)}
                      disabled={!translatedText}
                      aria-label="Copy translated text"
                    >
                      <Copy className="h-4 w-4" />
                    </CustomButton>
                  </div>

                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={() => setTranslatedText('')}
                    disabled={!translatedText}
                  >
                    Clear
                  </CustomButton>
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CustomizationOptions className="w-full sm:w-auto" />

                <CustomButton
                  onClick={handleTranslate}
                  isLoading={isTranslating}
                  disabled={!sourceText.trim() || isTranslating}
                  className="sm:ml-auto bg-blue-600 rounded-xl"
                >
                  Translate
                </CustomButton>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="glass-panel rounded-xl overflow-hidden p-4">
            <h3 className="text-lg font-medium mb-4">Recent Translations</h3>

            {isLoadingTranslations ? (
              // Loading state with skeletons
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/60 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-4 w-32" />
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-7 w-7 rounded-md" />
                        <Skeleton className="h-7 w-7 rounded-md" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4 mt-1" />
                      </div>

                      <div>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : translations.length > 0 ? (
              <div className="space-y-4">
                {translations.map(item => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border/60 p-4 transition-all hover:border-translator-accent/40 hover:shadow-sm"
                  >
                    {/* Translation item content */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>
                          {item.sourceLang.toUpperCase()} →{' '}
                          {item.targetLang.toUpperCase()}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <CustomButton
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSourceText(item.sourceText)
                            setTranslatedText(item.translatedText)
                            setActiveTab('translate')
                          }}
                          aria-label="Reuse this translation"
                          className="h-7 w-7"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </CustomButton>

                        <CustomButton
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(item.id)}
                          aria-label={
                            item.isFavorite
                              ? 'Remove from favorites'
                              : 'Add to favorites'
                          }
                          className="h-7 w-7"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              item.isFavorite
                                ? 'fill-yellow-400 text-yellow-400'
                                : ''
                            }`}
                          />
                        </CustomButton>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground text-xs mb-1">
                          Source:
                        </p>
                        <p className="line-clamp-2">{item.sourceText}</p>
                      </div>

                      <div className="text-sm">
                        <p className="text-muted-foreground text-xs mb-1">
                          Translation:
                        </p>
                        <p className="line-clamp-2">{item.translatedText}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {translations.length > 0 && (
  <div className="flex justify-between items-center mt-4 pt-2 border-t border-border/40">
    <div className="text-sm text-muted-foreground">
      Page {translationPagination.currentPage} of {translationPagination.totalPages}
    </div>
    
    <div className="flex gap-2">
      <CustomButton
        variant="outline"
        size="sm"
        onClick={() => setTranslationsPage(translationPagination.currentPage - 1)}
        disabled={translationPagination.currentPage <= 1 || isLoadingTranslations}
      >
        Previous
      </CustomButton>
      
      <CustomButton
        variant="outline"
        size="sm"
        onClick={() => setTranslationsPage(translationPagination.currentPage + 1)}
        disabled={translationPagination.currentPage >= translationPagination.totalPages || isLoadingTranslations}
      >
        Next
      </CustomButton>
    </div>
  </div>
)}
              </div>
            ) : (
              // Empty state
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  No translations yet. Start translating to see your history.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TranslatorPanel
