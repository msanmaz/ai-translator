// src/components/shared/SupportWidget.tsx
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircleQuestion, HelpCircle } from 'lucide-react';
import { useIntercomContext } from '@/context/IntercomContext';

type SupportWidgetVariant = 'icon' | 'button' | 'card';

interface SupportWidgetProps {
  variant?: SupportWidgetVariant;
  label?: string;
  className?: string;
}

/**
 * Support widget that opens the Intercom messenger
 */
const SupportWidget: React.FC<SupportWidgetProps> = ({
  variant = 'icon',
  label = 'Get Support',
  className = ''
}) => {
  const intercom = useIntercomContext();
  const [isMounted, setIsMounted] = useState(false);
  
  // Check if we're running on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleClick = () => {
    if (!isMounted) return;
    
    intercom.trackEvent('support_widget_clicked', { variant });
    intercom.showMessenger();
  };
  
  // Icon-only version
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full ${className}`}
        onClick={isMounted ? handleClick : undefined} // Only add handler on client
        aria-label="Get support"
      >
        <MessageCircleQuestion className="h-5 w-5" />
      </Button>
    );
  }
  
  // Button version
  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`gap-1.5 ${className}`}
        onClick={isMounted ? handleClick : undefined} // Only add handler on client
      >
        <HelpCircle className="h-4 w-4" />
        {label}
      </Button>
    );
  }
  
  // Card version
  return (
    <div className={`rounded-lg border p-4 bg-card shadow-sm ${className}`}>
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-full">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-base font-medium">Need Help?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Have questions about translations or using this app?
          </p>
          
          <Button 
            variant="default" 
            size="sm" 
            className="w-full mt-3"
            onClick={isMounted ? handleClick : undefined} // Only add handler on client
          >
            <MessageCircleQuestion className="h-4 w-4 mr-2" />
            Chat with Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupportWidget;