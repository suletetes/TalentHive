// Content sanitization utilities to prevent XSS attacks
import { toast } from 'react-hot-toast';

// HTML entities for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#x3D;',
};

// Dangerous HTML tags that should be completely removed
const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'textarea',
  'button',
  'select',
  'option',
  'link',
  'meta',
  'style',
  'base',
  'applet',
  'body',
  'html',
  'head',
  'title',
];

// Dangerous attributes that should be removed
const DANGEROUS_ATTRIBUTES = [
  'onload',
  'onerror',
  'onclick',
  'onmouseover',
  'onmouseout',
  'onmousedown',
  'onmouseup',
  'onkeydown',
  'onkeyup',
  'onkeypress',
  'onfocus',
  'onblur',
  'onchange',
  'onsubmit',
  'onreset',
  'onselect',
  'onabort',
  'javascript:',
  'vbscript:',
  'data:',
  'expression',
];

// URL protocols that are allowed
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

export class ContentSanitizer {
  // Basic HTML escaping for user input
  static escapeHtml(text: string): string {
    if (typeof text !== 'string') {
      return String(text);
    }
    
    return text.replace(/[&<>"'`=\/]/g, (match) => HTML_ENTITIES[match] || match);
  }
  
  // Unescape HTML entities
  static unescapeHtml(text: string): string {
    if (typeof text !== 'string') {
      return String(text);
    }
    
    const entityMap = Object.fromEntries(
      Object.entries(HTML_ENTITIES).map(([char, entity]) => [entity, char])
    );
    
    return text.replace(/&[#\w]+;/g, (entity) => entityMap[entity] || entity);
  }
  
  // Sanitize text content (removes all HTML)
  static sanitizeText(text: string): string {
    if (typeof text !== 'string') {
      return String(text);
    }
    
    // Remove all HTML tags
    let sanitized = text.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    sanitized = this.unescapeHtml(sanitized);
    
    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return sanitized.trim();
  }
  
  // Sanitize rich text content (allows safe HTML)
  static sanitizeRichText(html: string): string {
    if (typeof html !== 'string') {
      return String(html);
    }
    
    // Remove dangerous tags
    let sanitized = html;
    DANGEROUS_TAGS.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gi');
      sanitized = sanitized.replace(regex, '');
      
      // Also remove self-closing tags
      const selfClosingRegex = new RegExp(`<${tag}[^>]*\/?>`, 'gi');
      sanitized = sanitized.replace(selfClosingRegex, '');
    });
    
    // Remove dangerous attributes
    DANGEROUS_ATTRIBUTES.forEach(attr => {
      const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    // Validate URLs in href and src attributes
    sanitized = this.sanitizeUrls(sanitized);
    
    return sanitized;
  }
  
  // Sanitize URLs in HTML content
  private static sanitizeUrls(html: string): string {
    // Sanitize href attributes
    html = html.replace(/href\s*=\s*["']([^"']+)["']/gi, (match, url) => {
      if (this.isValidUrl(url)) {
        return match;
      }
      return 'href="#"';
    });
    
    // Sanitize src attributes
    html = html.replace(/src\s*=\s*["']([^"']+)["']/gi, (match, url) => {
      if (this.isValidUrl(url)) {
        return match;
      }
      return 'src=""';
    });
    
    return html;
  }
  
  // Validate URL safety
  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ALLOWED_PROTOCOLS.includes(urlObj.protocol);
    } catch {
      // Check for relative URLs
      if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        return true;
      }
      return false;
    }
  }
  
  // Sanitize user profile data
  static sanitizeProfile(profile: any): any {
    if (!profile || typeof profile !== 'object') {
      return profile;
    }
    
    const sanitized = { ...profile };
    
    // Sanitize text fields
    const textFields = ['firstName', 'lastName', 'title', 'location', 'company'];
    textFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = this.sanitizeText(sanitized[field]);
      }
    });
    
    // Sanitize rich text fields
    const richTextFields = ['bio', 'description'];
    richTextFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = this.sanitizeRichText(sanitized[field]);
      }
    });
    
    // Sanitize skills array
    if (Array.isArray(sanitized.skills)) {
      sanitized.skills = sanitized.skills.map((skill: any) => this.sanitizeText(String(skill)));
    }
    
    return sanitized;
  }
  
  // Sanitize project data
  static sanitizeProject(project: any): any {
    if (!project || typeof project !== 'object') {
      return project;
    }
    
    const sanitized = { ...project };
    
    // Sanitize text fields
    if (sanitized.title) {
      sanitized.title = this.sanitizeText(sanitized.title);
    }
    
    if (sanitized.category) {
      sanitized.category = this.sanitizeText(sanitized.category);
    }
    
    // Sanitize rich text fields
    if (sanitized.description) {
      sanitized.description = this.sanitizeRichText(sanitized.description);
    }
    
    // Sanitize skills array
    if (Array.isArray(sanitized.skills)) {
      sanitized.skills = sanitized.skills.map((skill: any) => this.sanitizeText(String(skill)));
    }
    
    // Sanitize requirements array
    if (Array.isArray(sanitized.requirements)) {
      sanitized.requirements = sanitized.requirements.map((req: any) => this.sanitizeText(String(req)));
    }
    
    return sanitized;
  }
  
  // Sanitize message content
  static sanitizeMessage(message: any): any {
    if (!message || typeof message !== 'object') {
      return message;
    }
    
    const sanitized = { ...message };
    
    if (sanitized.content) {
      sanitized.content = this.sanitizeRichText(sanitized.content);
    }
    
    if (sanitized.subject) {
      sanitized.subject = this.sanitizeText(sanitized.subject);
    }
    
    return sanitized;
  }
  
  // Sanitize proposal data
  static sanitizeProposal(proposal: any): any {
    if (!proposal || typeof proposal !== 'object') {
      return proposal;
    }
    
    const sanitized = { ...proposal };
    
    if (sanitized.coverLetter) {
      sanitized.coverLetter = this.sanitizeRichText(sanitized.coverLetter);
    }
    
    // Sanitize milestones
    if (Array.isArray(sanitized.milestones)) {
      sanitized.milestones = sanitized.milestones.map((milestone: any) => ({
        ...milestone,
        title: milestone.title ? this.sanitizeText(milestone.title) : milestone.title,
        description: milestone.description ? this.sanitizeRichText(milestone.description) : milestone.description,
      }));
    }
    
    return sanitized;
  }
  
  // Validate and sanitize file uploads
  static validateFileUpload(file: File): { isValid: boolean; error?: string } {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 10MB limit' };
    }
    
    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not allowed' };
    }
    
    // Check filename for dangerous characters
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(file.name)) {
      return { isValid: false, error: 'Filename contains invalid characters' };
    }
    
    return { isValid: true };
  }
  
  // Log potential XSS attempts
  static logSuspiciousContent(content: string, context: string): void {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /eval\(/i,
      /expression\(/i,
    ];
    
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(content));
    
    if (hasSuspiciousContent) {
      console.warn(`Suspicious content detected in ${context}:`, {
        content: content.substring(0, 100),
        context,
        timestamp: new Date().toISOString(),
      });
      
      // In development, show warning toast
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        toast.error(`Suspicious content detected in ${context}`, { duration: 5000 });
      }
    }
  }
}

// React component wrapper for safe content rendering
export const SafeContent: React.FC<{
  content: string;
  type?: 'text' | 'rich';
  className?: string;
}> = ({ content, type = 'text', className }) => {
  const sanitizedContent = type === 'rich' 
    ? ContentSanitizer.sanitizeRichText(content)
    : ContentSanitizer.sanitizeText(content);
  
  if (type === 'rich') {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    );
  }
  
  return <span className={className}>{sanitizedContent}</span>;
};

// Hook for sanitizing form data
export const useSanitizedForm = () => {
  const sanitizeFormData = (data: any, type: 'profile' | 'project' | 'message' | 'proposal') => {
    switch (type) {
      case 'profile':
        return ContentSanitizer.sanitizeProfile(data);
      case 'project':
        return ContentSanitizer.sanitizeProject(data);
      case 'message':
        return ContentSanitizer.sanitizeMessage(data);
      case 'proposal':
        return ContentSanitizer.sanitizeProposal(data);
      default:
        return data;
    }
  };
  
  return { sanitizeFormData };
};