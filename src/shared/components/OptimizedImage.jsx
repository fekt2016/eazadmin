import React, { useState } from 'react';
import { getOptimizedImageUrl } from '../utils/cloudinaryConfig';
import * as S from './OptimizedImage.styles';

/**
 * Specialized component for optimized Cloudinary images.
 * Handles loading states, fallbacks, and maintains aspect ratio.
 */
const OptimizedImage = ({
    src,
    slot,
    alt = "Saiisai",
    aspectRatio,
    objectFit,
    radius,
    bg,
    hoverZoom = false,
    className = "",
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const optimizedSrc = getOptimizedImageUrl(src, slot);

    return (
        <S.ImageWrapper
            $aspectRatio={aspectRatio}
            $radius={radius}
            $bg={bg}
            className={`${hoverZoom ? 'image-hover' : ''} ${className}`}
        >
            {!isLoaded && !hasError && <S.Skeleton />}
            <S.StyledImage
                src={hasError ? '/images/placeholder.png' : optimizedSrc}
                alt={alt}
                $loaded={isLoaded}
                $objectFit={objectFit || slot?.objectFit || (slot?.c === 'fit' ? 'contain' : 'cover')}
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                loading="lazy"
                {...props}
            />
        </S.ImageWrapper>
    );
};

export default OptimizedImage;
