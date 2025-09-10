import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { getTextDirection } from '../utils/textDirection';

/**
 * Preprocesses markdown text from an AI to ensure proper paragraph spacing.
 * It intelligently converts single newlines into paragraph breaks (`\n\n`)
 * for prose, while preserving the intended formatting of lists and code blocks.
 *
 * @param md The raw markdown string.
 * @returns A formatted string with corrected paragraph breaks.
 */
const reformatParagraphs = (md: string): string => {
    if (!md) return '';
    // Split by code blocks to avoid processing their content
    return md.split(/(```[\s\S]*?```)/g).map((part, i) => {
        // If it's a code block (which will be at odd indices), return it as is
        if (i % 2 === 1) return part;

        // Process the text part
        const lines = part.trim().split('\n');
        let newContent = '';
        for (let j = 0; j < lines.length; j++) {
            const line = lines[j];
            const nextLine = lines[j + 1];

            newContent += line;

            if (nextLine !== undefined) {
                const isListRegex = /^\s*([-*]|\d+\.)\s/;
                // If the current line and next line are part of the same list, add one newline
                if (isListRegex.test(line.trim()) && isListRegex.test(nextLine.trim())) {
                    newContent += '\n';
                } 
                // If the current line is intentionally blank, it's already a separator, add one newline
                else if (line.trim() === '') {
                    newContent += '\n';
                }
                // Otherwise, it's a paragraph break, so add two newlines
                else {
                    newContent += '\n\n';
                }
            }
        }
        // Clean up any resulting triple (or more) newlines to ensure clean output
        return newContent.replace(/\n{3,}/g, '\n\n');
    }).join('');
}


export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const direction = getTextDirection(content);

  // Reformat the content to ensure proper paragraph spacing before parsing
  const formattedContent = reformatParagraphs(content || '');

  // Allow 'sup', 'button' tags and specific attributes for citations
  const sanitizedHtml = DOMPurify.sanitize(marked.parse(formattedContent) as string, {
      ADD_TAGS: ['sup', 'button'],
      ADD_ATTR: ['id', 'href', 'class', 'title', 'data-source-index', 'aria-label']
  });

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const codeBlocks = container.querySelectorAll('pre');

    codeBlocks.forEach(preEl => {
      if (preEl.querySelector('.copy-code-button')) {
          return;
      }
      
      if (preEl.parentElement?.style.position !== 'relative') {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        preEl.parentNode?.insertBefore(wrapper, preEl);
        wrapper.appendChild(preEl);
      }
      
      const codeEl = preEl.querySelector('code');
      const textToCopy = codeEl?.innerText || '';
      
      const button = document.createElement('button');
      button.className = 'copy-code-button absolute top-2 right-2 p-1.5 rounded-md bg-slate-200/50 dark:bg-slate-900/50 hover:bg-slate-300/70 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all opacity-50 focus:opacity-100 group-hover:opacity-100';
      button.title = 'Copy code';
      
      const iconHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25h-1.5a2.25 2.25 0 0 1-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"></path></svg>`;
      const checkIconHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-green-500"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`;
      
      button.innerHTML = iconHTML;

      button.onclick = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
          button.innerHTML = checkIconHTML;
          setTimeout(() => {
             button.innerHTML = iconHTML;
          }, 2000);
        });
      };

      preEl.appendChild(button);
    });
  }, [sanitizedHtml]);

  return (
    <div
      ref={contentRef}
      dir={direction}
      className="prose dark:prose-invert max-w-none 
                 text-base
                 prose-p:leading-loose prose-p:mb-6 prose-p:text-slate-700 dark:prose-p:text-slate-300
                 prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100
                 prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
                 prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-12
                 prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-8
                 prose-strong:text-slate-900 dark:prose-strong:text-slate-100
                 prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
                 prose-blockquote:border-l-4 prose-blockquote:border-sky-500
                 prose-blockquote:bg-slate-100/50 dark:prose-blockquote:bg-slate-800/40
                 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:my-6
                 prose-ul:my-5 prose-ol:my-5
                 prose-li:my-2 prose-li:marker:text-sky-500
                 prose-a:text-sky-600 dark:prose-a:text-sky-400 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-a:transition-colors
                 prose-code:text-emerald-600 dark:prose-code:text-amber-400
                 prose-code:bg-slate-100 dark:prose-code:bg-slate-800
                 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm
                 prose-pre:bg-slate-100/70 dark:prose-pre:bg-slate-900/70
                 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-800
                 prose-pre:rounded-lg prose-pre:p-0 prose-pre:my-6
                 prose-pre:text-sm"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};