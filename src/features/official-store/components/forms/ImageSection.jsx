import styled from "styled-components";
import { useEffect, useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { FiUploadCloud, FiX } from "react-icons/fi";

// Styled components - defined before component to ensure they're available
const ImageSectionContainer = styled.div`
  margin-bottom: 2rem;
`;

const ImageUploadCard = styled.div`
  padding: 1.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }
`;

const UploadLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9375rem;
`;

const Required = styled.span`
  color: #ef4444;
  font-weight: 600;
  margin-left: 0.25rem;
`;

const Optional = styled.span`
  color: #64748b;
  font-weight: 400;
  font-size: 0.8125rem;
  margin-left: 0.25rem;
`;

const HelperText = styled.span`
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 400;
  line-height: 1.4;
`;

const UploadArea = styled.div`
  border: 2px dashed ${props => props.$hasError ? '#e53e3e' : '#cbd5e0'};
  border-radius: 12px;
  padding: 2rem 1.5rem;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  background: ${props => props.$hasError ? '#fef2f2' : '#f8fafc'};

  &:hover {
    border-color: ${props => props.$hasError ? '#e53e3e' : 'var(--color-primary-500)'};
    background-color: ${props => props.$hasError ? '#fee2e2' : '#fefce8'};
  }

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

const ImageErrorMessage = styled.div`
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.75rem;
  font-weight: 400;
  padding: 0.5rem;
  background: #fed7d7;
  border-radius: 4px;
  border-left: 3px solid #e53e3e;
`;

const UploadIcon = styled.div`
  font-size: 2.5rem;
  color: var(--color-primary-500);
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }
`;

const UploadText = styled.p`
  margin: 0;
  color: #718096;

  strong {
    color: #3182ce;
    font-weight: 500;
  }
`;

const FileInput = styled.input`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
`;

const PreviewContainer = styled.div`
  margin-top: 1.5rem;
`;

const PreviewTitle = styled.h4`
  font-size: 1.1rem;
  color: #2d3748;
  margin-top: 0;
  margin-bottom: 1rem;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ImagePreview = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  aspect-ratio: 1/1;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  background: rgba(229, 62, 62, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 32px; /* Touch-friendly */
  min-height: 32px;

  &:hover {
    background: #c53030;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 18px;
    height: 18px;
  }
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    top: 0.375rem;
    right: 0.375rem;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const CoverPreview = styled.div`
  max-width: 400px;
  margin-top: 1rem;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const CoverImage = styled.img`
  width: 100%;
  max-height: 300px;
  object-fit: cover;
`;

export default function ImageSection({ isSubmitting }) {
  const { watch, setValue, register, trigger, formState: { errors } } = useFormContext();
  const [coverPreview, setCoverPreview] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Use ref to track cover image to prevent it from being cleared
  const coverImageRef = useRef(null);

  // Watch form values for images
  const imageCover = watch("imageCover");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const images = watch("images") || [];
  
  // Update ref when imageCover changes
  useEffect(() => {
    if (imageCover) {
      coverImageRef.current = imageCover;
    }
  }, [imageCover]);
  
  // Register imageCover for validation
  useEffect(() => {
    register("imageCover", {
      required: "Please upload a cover image for your product",
      validate: (value) => {
        if (!value || (typeof value === 'string' && value === '')) {
          return "Please upload a cover image for your product";
        }
        return true;
      }
    });
  }, [register]);

  // Sync cover preview
  useEffect(() => {
    if (typeof imageCover === "string") {
      setCoverPreview(imageCover);
    } else if (imageCover instanceof File) {
      const preview = URL.createObjectURL(imageCover);
      setCoverPreview(preview);
    } else {
      setCoverPreview("");
    }
  }, [imageCover]);

  // Sync images previews
  useEffect(() => {
    const previews = images.map((img) => {
      if (typeof img === "string") return img;
      if (img instanceof File) return URL.createObjectURL(img);
      return "";
    });

    setImagePreviews(previews);
  }, [images]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
      imagePreviews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [coverPreview, imagePreviews]);

  const handleCoverImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue("imageCover", file, { shouldValidate: true, shouldDirty: true });
      // Update ref to track the cover image
      coverImageRef.current = file;
      // Trigger validation after setting the value
      trigger("imageCover");
      // Clear the input value to allow re-selecting the same file
      e.target.value = '';
    } else {
      // If no file selected, don't clear the existing value
      // This prevents accidental clearing when clicking cancel
    }
  };

  const handleAdditionalImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Get current images to preserve them - use the watched value directly
    const currentImages = images || [];
    
    // Get the cover image from ref (most reliable) or current value
    const currentImageCover = coverImageRef.current || imageCover;
    
    // Set the new images array
    setValue("images", [...currentImages, ...files], { 
      shouldDirty: true,
      shouldValidate: false 
    });
    
    // Ensure imageCover is preserved - restore it immediately if needed
    if (currentImageCover) {
      // Check if imageCover was cleared and restore it
      const checkAndRestore = () => {
        const currentCover = watch("imageCover");
        if (!currentCover && currentImageCover) {
          setValue("imageCover", currentImageCover, { 
            shouldValidate: true,
            shouldDirty: true 
          });
          coverImageRef.current = currentImageCover;
        }
      };
      
      // Check immediately and also after a brief delay to catch any async clearing
      checkAndRestore();
      setTimeout(checkAndRestore, 10);
    }
    
    // Clear the input value to allow re-selecting the same files
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setValue("images", newImages);
  };

  return (
    <ImageSectionContainer>
      {/* Cover Image Upload */}
      <ImageUploadCard>
        <UploadLabel>
          Cover Image <Required>*</Required>
          <HelperText>This is the main image customers will see first</HelperText>
        </UploadLabel>
        <UploadArea $hasError={!!errors.imageCover}>
          <UploadIcon>
            <FiUploadCloud />
          </UploadIcon>
          <UploadText>
            <strong>Click to upload</strong> or drag and drop
          </UploadText>
          <UploadText>Recommended: 1200x800 pixels (JPG, PNG, WebP)</UploadText>
          <FileInput
            type="file"
            accept="image/*"
            onChange={handleCoverImage}
            disabled={isSubmitting}
            name="imageCover"
            key={`cover-image-${imageCover ? 'has-file' : 'no-file'}`}
          />
        </UploadArea>
        {errors.imageCover && (
          <ImageErrorMessage>{errors.imageCover.message}</ImageErrorMessage>
        )}

        {coverPreview && (
          <PreviewContainer>
            <PreviewTitle>Cover Preview</PreviewTitle>
            <CoverPreview>
              <CoverImage src={coverPreview} alt="Cover preview" />
            </CoverPreview>
          </PreviewContainer>
        )}
      </ImageUploadCard>

      {/* Additional Images Upload */}
      <ImageUploadCard>
        <UploadLabel>
          Additional Images
          <Optional>(Optional)</Optional>
          <HelperText>Add more images to showcase different angles and features</HelperText>
        </UploadLabel>
        <UploadArea>
          <UploadIcon>
            <FiUploadCloud />
          </UploadIcon>
          <UploadText>
            <strong>Click to upload</strong> or drag and drop
          </UploadText>
          <UploadText>You can select multiple images (up to 10)</UploadText>
          <FileInput
            type="file"
            multiple
            accept="image/*"
            onChange={handleAdditionalImages}
            disabled={isSubmitting}
          />
        </UploadArea>

        {imagePreviews.length > 0 && (
          <PreviewContainer>
            <PreviewTitle>Additional Images Preview</PreviewTitle>
            <PreviewGrid>
              {imagePreviews.map((preview, index) => (
                <ImagePreview key={index}>
                  <PreviewImage src={preview} alt={`Product ${index + 1}`} />
                  <RemoveButton
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    disabled={isSubmitting}
                  >
                    <FiX />
                  </RemoveButton>
                </ImagePreview>
              ))}
            </PreviewGrid>
          </PreviewContainer>
        )}
      </ImageUploadCard>
    </ImageSectionContainer>
  );
}
