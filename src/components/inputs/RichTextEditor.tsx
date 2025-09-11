import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link, Image, Code, Quote, Undo, Redo, Type, Palette
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  
  // Editor options
  height?: number;
  showToolbar?: boolean;
  allowImages?: boolean;
  allowLinks?: boolean;
  maxLength?: number;
  
  // Toolbar customization
  toolbarItems?: string[];
  
  // Events
  onFocus?: () => void;
  onBlur?: () => void;
}

interface ToolbarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  command: string;
  value?: string;
  type?: 'button' | 'dropdown' | 'color';
  options?: Array<{ value: string; label: string }>;
}

const DEFAULT_TOOLBAR_ITEMS: ToolbarItem[] = [
  { id: 'bold', icon: <Bold className="w-4 h-4" />, label: 'Bold', command: 'bold' },
  { id: 'italic', icon: <Italic className="w-4 h-4" />, label: 'Italic', command: 'italic' },
  { id: 'underline', icon: <Underline className="w-4 h-4" />, label: 'Underline', command: 'underline' },
  { id: 'strikethrough', icon: <Strikethrough className="w-4 h-4" />, label: 'Strikethrough', command: 'strikeThrough' },
  { id: 'separator1', icon: null, label: '', command: '' },
  {
    id: 'fontSize',
    icon: <Type className="w-4 h-4" />,
    label: 'Font Size',
    command: 'fontSize',
    type: 'dropdown',
    options: [
      { value: '1', label: 'Small' },
      { value: '3', label: 'Normal' },
      { value: '5', label: 'Large' },
      { value: '7', label: 'Extra Large' }
    ]
  },
  {
    id: 'foreColor',
    icon: <Palette className="w-4 h-4" />,
    label: 'Text Color',
    command: 'foreColor',
    type: 'color'
  },
  { id: 'separator2', icon: null, label: '', command: '' },
  { id: 'alignLeft', icon: <AlignLeft className="w-4 h-4" />, label: 'Align Left', command: 'justifyLeft' },
  { id: 'alignCenter', icon: <AlignCenter className="w-4 h-4" />, label: 'Align Center', command: 'justifyCenter' },
  { id: 'alignRight', icon: <AlignRight className="w-4 h-4" />, label: 'Align Right', command: 'justifyRight' },
  { id: 'separator3', icon: null, label: '', command: '' },
  { id: 'insertUnorderedList', icon: <List className="w-4 h-4" />, label: 'Bullet List', command: 'insertUnorderedList' },
  { id: 'insertOrderedList', icon: <ListOrdered className="w-4 h-4" />, label: 'Numbered List', command: 'insertOrderedList' },
  { id: 'separator4', icon: null, label: '', command: '' },
  { id: 'blockquote', icon: <Quote className="w-4 h-4" />, label: 'Quote', command: 'formatBlock', value: 'blockquote' },
  { id: 'code', icon: <Code className="w-4 h-4" />, label: 'Code', command: 'formatBlock', value: 'pre' },
  { id: 'separator5', icon: null, label: '', command: '' },
  { id: 'createLink', icon: <Link className="w-4 h-4" />, label: 'Insert Link', command: 'createLink' },
  { id: 'insertImage', icon: <Image className="w-4 h-4" />, label: 'Insert Image', command: 'insertImage' },
  { id: 'separator6', icon: null, label: '', command: '' },
  { id: 'undo', icon: <Undo className="w-4 h-4" />, label: 'Undo', command: 'undo' },
  { id: 'redo', icon: <Redo className="w-4 h-4" />, label: 'Redo', command: 'redo' }
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  label,
  error,
  disabled = false,
  required = false,
  className = '',
  height = 200,
  showToolbar = true,
  allowImages = true,
  allowLinks = true,
  maxLength,
  toolbarItems,
  onFocus,
  onBlur
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedText, setSelectedText] = useState('');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const linkDialogRef = useRef<HTMLDivElement>(null);
  const imageDialogRef = useRef<HTMLDivElement>(null);
  
  // Get filtered toolbar items
  const getToolbarItems = useCallback((): ToolbarItem[] => {
    let items = DEFAULT_TOOLBAR_ITEMS;
    
    if (toolbarItems) {
      items = items.filter(item => toolbarItems.includes(item.id));
    }
    
    if (!allowLinks) {
      items = items.filter(item => item.id !== 'createLink');
    }
    
    if (!allowImages) {
      items = items.filter(item => item.id !== 'insertImage');
    }
    
    return items;
  }, [toolbarItems, allowLinks, allowImages]);
  
  // Execute editor command
  const executeCommand = useCallback((command: string, value?: string) => {
    if (!editorRef.current || disabled) return;
    
    editorRef.current.focus();
    
    try {
      if (command === 'createLink') {
        const selection = window.getSelection();
        if (selection && selection.toString()) {
          setSelectedText(selection.toString());
          setShowLinkDialog(true);
          return;
        } else {
          const url = prompt('Enter URL:');
          if (url) {
            document.execCommand(command, false, url);
          }
        }
      } else if (command === 'insertImage') {
        setShowImageDialog(true);
        return;
      } else {
        document.execCommand(command, false, value);
      }
      
      // Update content after command
      setTimeout(() => {
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      }, 0);
    } catch (error) {
      console.error('Editor command error:', error);
    }
  }, [disabled, onChange]);
  
  // Handle content change
  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      
      // Check max length
      if (maxLength) {
        const textContent = editorRef.current.textContent || '';
        if (textContent.length > maxLength) {
          return;
        }
      }
      
      onChange(content);
    }
  }, [onChange, maxLength]);
  
  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');
    
    // Use plain text if HTML is not available or contains potentially unsafe content
    const contentToInsert = html && !html.includes('<script') ? html : text;
    
    document.execCommand('insertHTML', false, contentToInsert);
    handleContentChange();
  }, [handleContentChange]);
  
  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            executeCommand('redo');
          } else {
            e.preventDefault();
            executeCommand('undo');
          }
          break;
      }
    }
    
    // Check max length
    if (maxLength && editorRef.current) {
      const textContent = editorRef.current.textContent || '';
      if (textContent.length >= maxLength && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    }
  }, [executeCommand, maxLength]);
  
  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
  }, [onFocus]);
  
  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (onBlur) {
      onBlur();
    }
  }, [onBlur]);
  
  // Insert link
  const insertLink = useCallback(() => {
    if (linkUrl && editorRef.current) {
      editorRef.current.focus();
      
      if (selectedText) {
        const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`;
        document.execCommand('insertHTML', false, linkHtml);
      } else {
        document.execCommand('createLink', false, linkUrl);
      }
      
      setShowLinkDialog(false);
      setLinkUrl('');
      setSelectedText('');
      handleContentChange();
    }
  }, [linkUrl, selectedText, handleContentChange]);
  
  // Insert image
  const insertImage = useCallback(() => {
    if (imageUrl && editorRef.current) {
      editorRef.current.focus();
      
      const imageHtml = `<img src="${imageUrl}" alt="" style="max-width: 100%; height: auto;" />`;
      document.execCommand('insertHTML', false, imageHtml);
      
      setShowImageDialog(false);
      setImageUrl('');
      handleContentChange();
    }
  }, [imageUrl, handleContentChange]);
  
  // Check if command is active
  const isCommandActive = useCallback((command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }, []);
  
  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);
  
  // Close dialogs on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (linkDialogRef.current && !linkDialogRef.current.contains(event.target as Node)) {
        setShowLinkDialog(false);
      }
      if (imageDialogRef.current && !imageDialogRef.current.contains(event.target as Node)) {
        setShowImageDialog(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const toolbarItemsToRender = getToolbarItems();
  
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div
        className={`
          border rounded-lg overflow-hidden transition-all duration-200
          ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}
          ${error ? 'border-red-500 ring-2 ring-red-200' : ''}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {/* Toolbar */}
        {showToolbar && (
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
            <div className="flex items-center space-x-1 flex-wrap">
              {toolbarItemsToRender.map((item, index) => {
                if (item.id.startsWith('separator')) {
                  return (
                    <div
                      key={index}
                      className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"
                    />
                  );
                }
                
                if (item.type === 'dropdown') {
                  return (
                    <select
                      key={item.id}
                      onChange={(e) => executeCommand(item.command, e.target.value)}
                      disabled={disabled}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">{item.label}</option>
                      {item.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  );
                }
                
                if (item.type === 'color') {
                  return (
                    <div key={item.id} className="relative">
                      <input
                        type="color"
                        onChange={(e) => executeCommand(item.command, e.target.value)}
                        disabled={disabled}
                        className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        title={item.label}
                      />
                    </div>
                  );
                }
                
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => executeCommand(item.command, item.value)}
                    disabled={disabled}
                    className={`
                      p-2 rounded transition-colors
                      ${isCommandActive(item.command) 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    title={item.label}
                  >
                    {item.icon}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleContentChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            p-3 outline-none overflow-y-auto
            ${disabled ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}
            text-gray-900 dark:text-gray-100
          `}
          style={{ minHeight: height }}
          data-placeholder={placeholder}
        />
        
        {/* Character Count */}
        {maxLength && (
          <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-right">
            {editorRef.current?.textContent?.length || 0} / {maxLength}
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center space-x-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
      
      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="absolute z-50 mt-1 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div ref={linkDialogRef} className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Insert Link
            </h4>
            
            {selectedText && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Text: "{selectedText}"
              </div>
            )}
            
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
            />
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={insertLink}
                disabled={!linkUrl}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert
              </button>
              
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Dialog */}
      {showImageDialog && (
        <div className="absolute z-50 mt-1 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div ref={imageDialogRef} className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Insert Image
            </h4>
            
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
            />
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={insertImage}
                disabled={!imageUrl}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert
              </button>
              
              <button
                type="button"
                onClick={() => setShowImageDialog(false)}
                className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Placeholder Styles */}
      <style jsx>{`
        [contenteditable="true"]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable="true"] {
          outline: none;
        }
        
        [contenteditable="true"] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
        }
        
        [contenteditable="true"] pre {
          background-color: #f3f4f6;
          padding: 0.5rem;
          border-radius: 0.375rem;
          font-family: monospace;
          overflow-x: auto;
        }
        
        [contenteditable="true"] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contenteditable="true"] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
export type { RichTextEditorProps };