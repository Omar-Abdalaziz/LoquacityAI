import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { ClipboardIcon, CheckIcon } from './icons';
import { Source } from '../types';
import { getTextDirection } from '../utils/textDirection';

interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children }) => {
    const { theme } = useTheme();
    const { t } = useLocalization();
    const [copied, setCopied] = useState(false);
    const textToCopy = String(children).replace(/\n$/, '');

    const language = className?.replace(/language-/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="my-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 overflow-hidden not-prose">
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">{language || 'code'}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors">
                    {copied ? (
                        <>
                            <CheckIcon className="w-4 h-4 text-green-500" />
                            {t('search.copied')}
                        </>
                    ) : (
                        <>
                            <ClipboardIcon className="w-4 h-4" />
                            {t('search.copy')}
                        </>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                style={theme === 'dark' ? oneDark : oneLight}
                language={language}
                PreTag="div"
                customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                codeTagProps={{ style: { fontFamily: 'inherit', fontSize: '0.875rem' } }}
            >
                {textToCopy}
            </SyntaxHighlighter>
        </div>
    );
};


interface MarkdownRendererProps {
  content: string;
  sources?: Source[] | null;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, sources }) => {
  const direction = getTextDirection(content);

  return (
    <div
      dir={direction}
      className="prose dark:prose-invert max-w-none 
                 text-base
                 prose-p:leading-8 prose-p:my-4 prose-p:text-slate-700 dark:prose-p:text-slate-300
                 prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100
                 prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
                 prose-h2:text-2xl prose-h2:mb-5 prose-h2:mt-10
                 prose-h3:text-xl prose-h3:mb-4 prose-h3:mt-8
                 prose-strong:text-slate-900 dark:prose-strong:text-slate-100
                 prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
                 prose-blockquote:border-l-4 prose-blockquote:border-slate-300 dark:prose-blockquote:border-slate-700
                 prose-blockquote:bg-slate-100/50 dark:prose-blockquote:bg-slate-800/40
                 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:my-4
                 prose-ul:my-5 prose-ol:my-5
                 prose-li:my-2 prose-li:marker:text-brand-500
                 prose-a:text-sky-600 dark:prose-a:text-sky-400 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-a:transition-colors
                 "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (match) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            // Inline code
            return (
                <code className="text-emerald-600 dark:text-amber-400 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 font-mono text-sm not-prose" {...props}>
                    {children}
                </code>
            );
          },
          a: ({ node, ...props }) => {
            if (props.href && props.href.startsWith('#citation-') && sources) {
              const sourceIndex = parseInt(props.href.replace('#citation-', ''), 10);
              const source = sources?.[sourceIndex];
              if (source === undefined) return <span>{`[${props.children}]`}</span>;
              
              const citationNumber = sourceIndex + 1;
              const safeTitle = source.title.replace(/"/g, '&quot;');
              const ariaLabel = `Source ${citationNumber}: ${safeTitle}`;

              return (
                <sup className="citation">
                  <button
                    className="citation-trigger"
                    data-source-index={sourceIndex}
                    title={safeTitle}
                    aria-label={ariaLabel}
                  >
                    {citationNumber}
                  </button>
                </sup>
              );
            }
            // Render normal links, ensuring they open in a new tab
            return <a target="_blank" rel="noopener noreferrer" {...props} />;
          },
           // We handle 'pre' through our custom CodeBlock component for block-level code.
           // This override prevents ReactMarkdown/prose from rendering an outer <pre> tag around our component.
          pre: ({ node, ...props }) => <div {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
