
import React from "react";
import { useTranslation, TranslationOptions } from "@/context/TranslationContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

interface CustomizationOptionsProps {
  className?: string;
}

const CustomizationOptions: React.FC<CustomizationOptionsProps> = ({ className }) => {
  const { translationOptions, setTranslationOptions } = useTranslation();

  const handleToneChange = (value: string) => {
    setTranslationOptions((prev) => ({
      ...prev,
      tone: value as TranslationOptions["tone"],
    }));
  };

  const handleStyleChange = (value: string) => {
    setTranslationOptions((prev) => ({
      ...prev,
      style: value as TranslationOptions["style"],
    }));
  };

  const handlePreserveFormattingChange = (checked: boolean) => {
    setTranslationOptions((prev) => ({
      ...prev,
      preserveFormatting: checked,
    }));
  };

  return (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem value="customization">
        <AccordionTrigger className="flex items-center text-sm py-2">
          <Settings className="h-4 w-4 mr-2" />
          Customization Options
        </AccordionTrigger>
        <AccordionContent className="pt-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Tone</h4>
              <RadioGroup
                value={translationOptions.tone}
                onValueChange={handleToneChange}
                className="flex flex-wrap gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="formal" id="tone-formal" />
                  <Label htmlFor="tone-formal" className="text-sm cursor-pointer">Formal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="informal" id="tone-informal" />
                  <Label htmlFor="tone-informal" className="text-sm cursor-pointer">Informal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="casual" id="tone-casual" />
                  <Label htmlFor="tone-casual" className="text-sm cursor-pointer">Casual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="professional" id="tone-professional" />
                  <Label htmlFor="tone-professional" className="text-sm cursor-pointer">Professional</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Style</h4>
              <RadioGroup
                value={translationOptions.style}
                onValueChange={handleStyleChange}
                className="flex flex-wrap gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="style-standard" />
                  <Label htmlFor="style-standard" className="text-sm cursor-pointer">Standard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simplified" id="style-simplified" />
                  <Label htmlFor="style-simplified" className="text-sm cursor-pointer">Simplified</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="detailed" id="style-detailed" />
                  <Label htmlFor="style-detailed" className="text-sm cursor-pointer">Detailed</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="preserve-formatting" className="text-sm cursor-pointer">
                Preserve Formatting
              </Label>
              <Switch
                id="preserve-formatting"
                checked={translationOptions.preserveFormatting}
                onCheckedChange={handlePreserveFormattingChange}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default CustomizationOptions;
