
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/context/TranslationContext";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Language } from "@/context/TranslationContext";

interface LanguageSelectorProps {
  type: "source" | "target";
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ type, className }) => {
  const { 
    availableLanguages, 
    sourceLanguage, 
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage
  } = useTranslation();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentLanguage = type === "source" ? sourceLanguage : targetLanguage;
  
  const handleSelect = (language: Language) => {
    if (type === "source") {
      setSourceLanguage(language);
    } else {
      setTargetLanguage(language);
    }
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm focus-ring w-full"
      >
        <span className="text-base mr-1">{currentLanguage.flag}</span>
        <span className="font-medium">{currentLanguage.name}</span>
        <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-md border border-input bg-background/95 backdrop-blur-sm shadow-md z-10">
          <div className="py-1">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => handleSelect(language)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                  currentLanguage.code === language.code && "bg-accent/50 font-medium"
                )}
              >
                <span className="text-base mr-2">{language.flag}</span>
                <span>{language.name}</span>
                {currentLanguage.code === language.code && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
