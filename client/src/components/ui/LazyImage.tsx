// Lazy loading image component with optimization
import React, { useState, useRef, useEffect, memo } from 'react';
import { Box, Skeleton } from '@mui/material';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: React.ReactNode;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  // Cloudinary optimization options
  cloudinaryOptions?: {
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    gravity?: 'auto' | 'face' | 'center';
  };
}

export const LazyImage = memo<LazyImageProps>(({
  src,
  alt,
  width,
  height,
  className,
  style,
  placeholder,
  fallback = '/images/placeholder.jpg',
  onLoad,
  onError,
  cloudinaryOptions = {
    quality: 'auto',
    format: 'auto',
    crop: 'fill',
    gravity: 'auto',
  },
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Optimize Cloudinary URL
  const optimizedSrc = React.useMemo(() => {
    if (!src.includes('cloudinary.com')) {
      return src;
    }

    const { quality, format, crop, gravity } = cloudinaryOptions;
    const transformations = [];

    if (width && height) {
      transformations.push(`w_${width},h_${height},c_${crop}`);
    } else if (width) {
      transformations.push(`w_${width}`);
    } else if (height) {
      transformations.push(`h_${height}`);
    }

    if (quality) {
      transformations.push(`q_${quality}`);
    }

    if (format) {
      transformations.push(`f_${format}`);
    }

    if (gravity && crop !== 'scale') {
      transformations.push(`g_${gravity}`);
    }

    if (transformations.length === 0) {
      return src;
    }

    // Insert transformations into Cloudinary URL
    const transformString = transformations.join(',');
    return src.replace('/upload/', `/upload/${transformString}/`);
  }, [src, width, height, cloudinaryOptions]);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    const currentImg = imgRef.current;
    if (!currentImg) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1,
      }
    );

    observerRef.current.observe(currentImg);

    return () => {
      if (observerRef.current && currentImg) {
        observerRef.current.unobserve(currentImg);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const containerStyle: React.CSSProperties = {
    width: width || '100%',
    height: height || 'auto',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
  };

  return (
    <Box ref={imgRef} className={className} style={containerStyle}>
      {/* Placeholder while loading */}
      {!isLoaded && !hasError && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {placeholder || (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              animation="wave"
            />
          )}
        </Box>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          src={optimizedSrc}
          alt={alt}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy" // Native lazy loading as fallback
        />
      )}

      {/* Fallback image on error */}
      {hasError && (
        <img
          src={fallback}
          alt={alt}
          style={imageStyle}
          onLoad={handleLoad}
        />
      )}
    </Box>
  );
});

LazyImage.displayName = 'LazyImage';

// Hook for preloading images
export const useImagePreloader = () => {
  const preloadImage = React.useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadImages = React.useCallback((sources: string[]): Promise<void[]> => {
    return Promise.allSettled(sources.map(preloadImage)) as Promise<void[]>;
  }, [preloadImage]);

  return { preloadImage, preloadImages };
};

// Progressive image loading component
interface ProgressiveImageProps extends LazyImageProps {
  lowQualitySrc?: string;
}

export const ProgressiveImage = memo<ProgressiveImageProps>(({
  src,
  lowQualitySrc,
  ...props
}) => {
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);

  // Generate low quality version if not provided
  const lowQualityUrl = React.useMemo(() => {
    if (lowQualitySrc) return lowQualitySrc;
    
    if (src.includes('cloudinary.com')) {
      return src.replace('/upload/', '/upload/q_10,f_auto,w_50/');
    }
    
    return src;
  }, [src, lowQualitySrc]);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Low quality image */}
      {!highQualityLoaded && (
        <LazyImage
          {...props}
          src={lowQualityUrl}
          style={{
            ...props.style,
            filter: 'blur(5px)',
            transform: 'scale(1.1)', // Slightly larger to hide blur edges
          }}
        />
      )}

      {/* High quality image */}
      <LazyImage
        {...props}
        src={src}
        onLoad={() => {
          setHighQualityLoaded(true);
          props.onLoad?.();
        }}
        style={{
          ...props.style,
          position: highQualityLoaded ? 'static' : 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </Box>
  );
});

ProgressiveImage.displayName = 'ProgressiveImage';

// Image gallery with lazy loading
interface LazyImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    thumbnail?: string;
  }>;
  columns?: number;
  gap?: number;
  onImageClick?: (index: number) => void;
}

export const LazyImageGallery = memo<LazyImageGalleryProps>(({
  images,
  columns = 3,
  gap = 8,
  onImageClick,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {images.map((image, index) => (
        <Box
          key={index}
          sx={{
            aspectRatio: '1',
            cursor: onImageClick ? 'pointer' : 'default',
            borderRadius: 1,
            overflow: 'hidden',
            '&:hover': {
              transform: onImageClick ? 'scale(1.02)' : 'none',
              transition: 'transform 0.2s ease-in-out',
            },
          }}
          onClick={() => onImageClick?.(index)}
        >
          <LazyImage
            src={image.thumbnail || image.src}
            alt={image.alt}
            width="100%"
            height="100%"
            cloudinaryOptions={{
              quality: 'auto',
              format: 'auto',
              crop: 'fill',
              gravity: 'auto',
            }}
          />
        </Box>
      ))}
    </Box>
  );
});

LazyImageGallery.displayName = 'LazyImageGallery';