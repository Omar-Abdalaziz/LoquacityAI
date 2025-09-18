import React, { useEffect, useRef, useState } from 'react';
import { Source } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

interface CitationPopoverProps {
  source: Source;
  targetElement: HTMLElement;
  onClose: () => void;
  onGoToSource: () => void;
}

const getDomain = (uri: string): string => {
  try {
    const url = new URL(uri);
    return url.hostname;
  } catch (e) {
    return uri;
  }
};

export const CitationPopover: React.FC<CitationPopoverProps> = ({ source, targetElement, onClose, onGoToSource }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { t } = useLocalization();
  const domain = getDomain(source.uri);
  const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${domain}`;

  useEffect(() => {
    const calculatePosition = () => {
      if (!targetElement || !popoverRef.current) return;
      
      const targetRect = targetElement.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = targetRect.bottom + window.scrollY + 8;
      let left = targetRect.left + window.scrollX + (targetRect.width / 2) - (popoverRect.width / 2);

      // Adjust if it overflows the bottom
      if (top + popoverRect.height > window.scrollY + viewportHeight) {
        top = targetRect.top + window.scrollY - popoverRect.height - 8;
      }

      // Adjust if it overflows left/right
      if (left < 0) {
        left = 8;
      } else if (left + popoverRect.width > viewportWidth) {
        left = viewportWidth - popoverRect.width - 8;
      }

      setPosition({ top, left });
    };

    calculatePosition(); // Initial calculation
    // A small timeout allows the popover to render and get its dimensions before final positioning
    const timer = setTimeout(calculatePosition, 0);

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && !targetElement.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', onClose); // Close on resize to avoid misplacement
    window.addEventListener('scroll', onClose); // Also close on scroll

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('scroll', onClose);
    };
  }, [targetElement, onClose]);

  return (
    <div
      ref={popoverRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-50 w-80 max-w-sm bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 animate-pop-in p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Source Information"
    >
      <div className="flex items-start gap-3">
        <img 
          src={faviconUrl} 
          alt="" 
          className="w-5 h-5 mt-1 object-contain rounded-full flex-shrink-0 bg-white"
        />
        <div className="flex-grow overflow-hidden">
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate" title={source.title}>
            {source.title}
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <button onClick={onGoToSource} className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400">
          {t('sources.goToSource')}
        </button>
        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
          {t('sources.openLink')}
        </a>
      </div>
    </div>
  );
};