import { useForm, FormProvider } from "react-hook-form";
import styled from "styled-components";
import useCategory from '../../../../shared/hooks/useCategory';
import BasicSection from "./BasicSection";
import CategorySection from "./CategorySection";
import VariantSection from "./VariantSection";
import ImageSection from "./ImageSection";
import SpecificationSection from "./SpecificationSection";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { LoadingSpinner } from '../../../../shared/components/LoadingSpinner';
import { generateSKU } from '../../../../shared/utils/helpers';

const ProductForm = ({ initialData, onSubmit, isSubmitting, mode = "add", onFormChange, seller: sellerProp }) => {
  const seller = sellerProp || { id: 'eazshop' };

  const { getCategories, getParentCategories } = useCategory();
  const { data, isLoading, error } = getCategories;
  const { data: parentCategoriesData, isLoading: isLoadingParents } = getParentCategories;

  // Declare all state hooks at the top to ensure consistent hook order
  const [variantAttributes, setVariantAttributes] = useState([]);
  const [step, setStep] = useState(1);

  const allCategories = useMemo(() => {
    // Handle different response structures
    const categories = data?.data?.results || 
                      data?.data?.data?.results || 
                      data?.results || 
                      data?.data || 
                      [];
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProductForm] Categories data structure:', {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        categoriesCount: categories.length,
        firstCategory: categories[0],
      });
    }
    
    return Array.isArray(categories) ? categories : [];
  }, [data]);

  // Extract parent categories from dedicated endpoint
  const parentCategoriesFromEndpoint = useMemo(() => {
    const parents = parentCategoriesData?.data?.categories || 
                    parentCategoriesData?.categories || 
                    parentCategoriesData?.data || 
                    [];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProductForm] Parent categories from endpoint:', {
        hasData: !!parentCategoriesData,
        parentCategoriesCount: Array.isArray(parents) ? parents.length : 0,
      });
    }
    
    return Array.isArray(parents) ? parents : [];
  }, [parentCategoriesData]);

  const initialFormValues = useMemo(() => {
    const defaults = {
      name: "",
      description: "",
      imageCover: "",
      images: [],
      parentCategory: "",
      subCategory: "",
      variants: [
        {
          attributes: [],
          price: 0,
          stock: 0,
          sku: "",
          status: "active",
        },
      ],
      brand: "",
      manufacturer: "",
      warranty: "",
      condition: "new",
      specifications: {
        material: [{ value: "", hexCode: "" }],
        weight: "",
        dimension: "",
      },
    };

    if (initialData) {
      return {
        ...defaults,
        ...initialData,
        parentCategory:
          initialData.parentCategory?._id || initialData.parentCategory || "",
        subCategory:
          initialData.subCategory?._id || initialData.subCategory || "",
        manufacturer: initialData.manufacturer || "",
        warranty: initialData.warranty || "",
        condition: initialData.condition || "new",
        variants:
          (initialData.variants && Array.isArray(initialData.variants) && initialData.variants.length > 0)
            ? initialData.variants.map((variant) => ({
                ...variant,
                price:
                  typeof variant.price === "number"
                    ? variant.price
                    : parseFloat(variant.price) || 0,
                stock:
                  typeof variant.stock === "number"
                    ? variant.stock
                    : parseInt(variant.stock) || 0,
                attributes:
                  variant.attributes?.map((attr) => ({
                    key: attr.key,
                    value: attr.value,
                  })) || [],
              }))
            : defaults.variants,
        specifications: {
          weight: initialData.specifications?.weight || "",
          dimension: initialData.specifications?.dimension || "",
          material: initialData.specifications?.material?.length
            ? initialData.specifications.material.map((m) => ({
                value: m.value || "",
                hexCode: m.hexCode || "",
              }))
            : defaults.specifications.material,
        },
      };
    }
    return defaults;
  }, [initialData]);

  const methods = useForm({ 
    defaultValues: initialFormValues,
    mode: 'onChange' // Validate on change for better UX
  });
  const { handleSubmit, control, watch, reset, trigger, setValue, formState: { errors } } = methods;
  const parentCategory = watch("parentCategory");
  const subCategory = watch("subCategory");
  const productName = watch("name");
  const variants = watch("variants");

  // Track form changes for unsaved changes warning (edit mode only)
  useEffect(() => {
    if (onFormChange && mode === "edit") {
      const subscription = watch(() => {
        onFormChange();
      });
      return () => subscription.unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFormChange, mode]); // watch is stable and doesn't need to be in deps

  useEffect(() => {
    reset(initialFormValues);
    
    // Explicitly set category values when initialData is available (for edit mode)
    // This ensures categories are set even if there's a timing issue with reset
    if (initialData && mode === "edit") {
      // Use the same extraction logic as initialFormValues
      const parentCatId = initialData.parentCategory?._id || initialData.parentCategory || "";
      const subCatId = initialData.subCategory?._id || initialData.subCategory || "";
      
      if (parentCatId && parentCatId !== "") {
        setValue("parentCategory", parentCatId, { shouldValidate: false, shouldDirty: false });
      }
      if (subCatId && subCatId !== "") {
        setValue("subCategory", subCatId, { shouldValidate: false, shouldDirty: false });
      }
    }
  }, [initialFormValues, reset, initialData, mode, setValue]);

  useEffect(() => {
    if (subCategory && allCategories.length) {
      const category = allCategories.find((cat) => cat._id === subCategory);
      setVariantAttributes(category?.attributes || []);
    }
  }, [subCategory, allCategories]);

  const getCategoryName = useCallback(
    (id) => {
      if (!id) return "";
      const category = allCategories.find((cat) => cat._id === id);
      return category?.name || "";
    },
    [allCategories]
  );

  // Note: addNewVariant is no longer needed here since VariantSection manages its own useFieldArray
  // The VariantSection component handles adding variants internally

  // Prevent infinite SKU generation loop
  useEffect(() => {
    if (!variants || variants.length === 0 || !subCategory) return;

    const updatedVariants = variants.map((variant) => {
      const variantObj = (variant.attributes || []).reduce((acc, attr) => {
        acc[attr.key] = attr.value;
        return acc;
      }, {});

      return {
        ...variant,
        sku: generateSKU({
          user: seller,
          variants: variantObj,
          category: getCategoryName(subCategory),
        }),
      };
    });

    reset((prev) => ({ ...prev, variants: updatedVariants }), {
      keepValues: true,
    });
  }, [productName, subCategory, variants, reset, seller, getCategoryName]);

  // Validate step 1 fields before proceeding
  const validateStep1 = async () => {
    // Validate basic fields first
    const basicFields = ['name', 'parentCategory', 'subCategory'];
    const basicValid = await trigger(basicFields);
    
    if (!basicValid) {
      return false;
    }
    
    // Validate all variants exist and have required fields
    const currentVariants = watch('variants') || [];
    if (!currentVariants || currentVariants.length === 0) {
      // Show alert if no variants
      alert('Please add at least one product variant before proceeding');
      return false;
    }
    
    // Validate each variant's required fields
    const variantFields = [];
    currentVariants.forEach((_, index) => {
      variantFields.push(`variants.${index}.price`);
      variantFields.push(`variants.${index}.stock`);
      variantFields.push(`variants.${index}.condition`);
    });
    
    const variantsValid = await trigger(variantFields);
    
    if (!variantsValid) {
      // Error messages are already displayed inline by the form fields
      // Just return false to prevent proceeding
      return false;
    }
    
    return true;
  };

  const goNext = async () => {
    if (step === 1) {
      // Validate step 1 before proceeding
      const isValid = await validateStep1();
      if (!isValid) {
        // Scroll to first error field
        setTimeout(() => {
          const firstErrorField = document.querySelector('input:invalid, select:invalid') ||
                                  document.querySelector('[data-error="true"]') ||
                                  document.querySelector('.error-message')?.parentElement?.querySelector('input, select');
          if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstErrorField.focus();
          }
        }, 100);
        return;
      }
      setStep(2);
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setStep(2);
    }
  };

  const goBack = () => {
    setStep(1);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // In edit mode, show all sections at once (no stepper)
  useEffect(() => {
    if (mode === "edit") {
      setStep(2); // Show all sections
    }
  }, [mode]);

  const isLastStep = step === 2;
  const isEditMode = mode === "edit";

  // Early returns must come AFTER all hooks are declared
  if (isLoading || isLoadingParents) return <LoadingSpinner />;
  if (error) return <div>Error loading categories</div>;

  const handleHeaderBack = () => {
    if (isEditMode) {
      window.history.back();
      return;
    }
    if (step === 2) {
      // On step 2, go back to step 1
      goBack();
    } else {
      // On step 1, go back to previous page
      window.history.back();
    }
  };

  return (
    <ProductFormContainer>
      {!isEditMode && (
        <>
          <FormHeader>
            <BackButton onClick={handleHeaderBack}>
              <FaArrowLeft /> Back
            </BackButton>
            <FormTitle>
              Add New Product
            </FormTitle>
          </FormHeader>

          <StepperContainer>
            <Step $active={step === 1}>
              {step === 1 ? "1. Product Details" : "✓ Product Details"}
            </Step>
            <StepDivider $completed={step === 2} />
            <Step $active={step === 2}>
              {step === 2 ? "2. Media & Specifications" : "Media & Specifications"}
            </Step>
          </StepperContainer>
        </>
      )}

      <FormProvider {...methods}>
        <StyledForm
          onSubmit={handleSubmit(async (values) => {
            // Only submit on last step
            if (isLastStep) {
              // Validate all required fields before submission
              const allFields = [
                'name',
                'parentCategory',
                'subCategory',
                'imageCover'
              ];
              
              // Add variant fields
              const currentVariants = values.variants || [];
              currentVariants.forEach((_, index) => {
                allFields.push(`variants.${index}.price`);
                allFields.push(`variants.${index}.stock`);
                allFields.push(`variants.${index}.condition`);
              });
              
              const isValid = await trigger(allFields);
              
              if (!isValid) {
                // Scroll to first error
                setTimeout(() => {
                  const firstErrorField = document.querySelector('input:invalid, select:invalid') ||
                                          document.querySelector('[data-error="true"]') ||
                                          document.querySelector('.error-message')?.parentElement?.querySelector('input, select');
                  if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.focus();
                  }
                }, 100);
                return;
              }
              
              // Validate variants exist
              if (!values.variants || values.variants.length === 0) {
                // Scroll back to step 1 and show error
                setStep(1);
                setTimeout(() => {
                  alert('Please add at least one product variant');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
                return;
              }
              
              // Validate cover image
              if (!values.imageCover) {
                // Error message will be shown by ImageSection validation
                // Just scroll to it
                setTimeout(() => {
                  const imageError = document.querySelector('[name="imageCover"]')?.closest('.error-message') || 
                                    document.querySelector('.error-message');
                  if (imageError) {
                    imageError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
                return;
              }
              
              onSubmit(values);
            }
          })}
        >
          {(step === 1 || isEditMode) && (
            <Step1Content>
              {!isEditMode && (
                <StepHeader>
                  <StepNumber>Step 1 of 2</StepNumber>
                  <StepDescription>Enter basic product information, category, and variants</StepDescription>
                </StepHeader>
              )}
              
              <SectionContainer>
                <SectionTitle>
                  <span>Basic Information</span>
                </SectionTitle>
                <BasicSection />
              </SectionContainer>

              <SectionContainer>
                <SectionTitle>
                  <span>Category</span>
                </SectionTitle>
                {allCategories.length === 0 && parentCategoriesFromEndpoint.length === 0 ? (
                  <div style={{ padding: '1rem', color: '#718096', textAlign: 'center' }}>
                    Loading categories...
                  </div>
                ) : (
                  <CategorySection
                    categories={allCategories}
                    parentCategories={parentCategoriesFromEndpoint}
                    parentCategory={parentCategory}
                    subCategory={subCategory}
                  />
                )}
              </SectionContainer>

              <SectionContainer>
                <SectionTitle>
                  <span>Variants</span>
                </SectionTitle>
                <VariantSection
                  variantAttributes={variantAttributes}
                  seller={seller}
                />
              </SectionContainer>
            </Step1Content>
          )}

          {(step === 2 || isEditMode) && (
            <Step2Content>
              {!isEditMode && (
                <StepHeader>
                  <StepNumber>Step 2 of 2</StepNumber>
                  <StepDescription>Add product images and specifications</StepDescription>
                </StepHeader>
              )}
              
              <SectionContainer>
                <SectionTitle>
                  <span>Product Images</span>
                </SectionTitle>
                <ImageSection
                  isSubmitting={isSubmitting}
                  initialData={initialData}
                />
              </SectionContainer>

              <SectionContainer>
                <SectionTitle>
                  <span>Specifications</span>
                </SectionTitle>
                <SpecificationSection />
              </SectionContainer>
            </Step2Content>
          )}

          <FormActions>
            {!isEditMode && step > 1 && (
              <SecondaryButton type="button" onClick={goBack}>
                <FaArrowLeft /> Back
              </SecondaryButton>
            )}
            {!isEditMode && !isLastStep ? (
              <PrimaryButton 
                type="button" 
                onClick={goNext}
                disabled={isSubmitting}
              >
                Next <span style={{ marginLeft: '0.5rem' }}>→</span>
              </PrimaryButton>
            ) : (
              <PrimaryButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner /> {isEditMode ? "Saving Changes..." : "Submitting..."}
                  </>
                ) : (
                  mode === "add" ? "Add Product" : "Save Changes"
                )}
              </PrimaryButton>
            )}
          </FormActions>
        </StyledForm>
      </FormProvider>
    </ProductFormContainer>
  );
};
export default ProductForm;

// Styled Components
const ProductFormContainer = styled.div`
  max-width: 100%;
  margin: 0;
  padding: 0;
`;

const FormHeader = styled.div`
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FormTitle = styled.h2`
  font-size: 2rem;
  font-weight: 500;
  color: #1a202c;
  margin: 0;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: 400;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e0;
  }
`;

const StyledForm = styled.form`
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 1.75rem;
  
  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const SectionContainer = styled.div`
  margin-bottom: 2rem;
  padding: 1.75rem;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  overflow: visible; /* Allow content to overflow for horizontal scrolling */
  width: 100%;
  
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.375rem;
  font-weight: 400;
  color: #1e293b;
  margin: 0 0 1.25rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
`;

const SubmitButton = styled.button`
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.8rem 1.5rem;
  font-size: 1.125rem;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  margin-top: 1rem;

  &:hover {
    background: #2b6cb0;
  }

  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }
`;

const StepperContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const Step = styled.div`
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 400;
  background: ${(p) => (p.$active ? "var(--color-primary-600)" : "#ffffff")};
  color: ${(p) => (p.$active ? "#ffffff" : "#64748b")};
  border: 2px solid
    ${(p) => (p.$active ? "var(--color-primary-600)" : "#e2e8f0")};
  transition: all 0.3s ease;
  position: relative;
  
  ${(p) => p.$active && `
    box-shadow: 0 2px 8px rgba(49, 130, 206, 0.3);
    transform: translateY(-1px);
  `}
`;

const StepDivider = styled.div`
  flex: 1;
  height: 2px;
  background: linear-gradient(
    to right,
    ${(p) => p.$completed ? "var(--color-primary-400)" : "rgba(148, 163, 184, 0.3)"},
    rgba(148, 163, 184, 0.1)
  );
  border-radius: 2px;
  transition: background 0.3s ease;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 1.25rem 1.75rem;
  margin-left: -1.75rem;
  margin-right: -1.75rem;
  margin-bottom: -1.75rem;
  border-radius: 0 0 12px 12px;
  
  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 0.75rem;
    padding: 1rem;
    margin-left: -1.25rem;
    margin-right: -1.25rem;
    margin-bottom: -1.25rem;
  }
`;

const PrimaryButton = styled.button`
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem 1.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 44px; /* Touch-friendly */

  &:hover:not(:disabled) {
    background: var(--color-primary-700);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 1rem 1.5rem;
    font-size: 1rem;
    min-height: 48px;
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SecondaryButton = styled.button`
  background: #ffffff;
  color: #4a5568;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1.0625rem;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Step1Content = styled.div`
  animation: fadeIn 0.3s ease-in;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Step2Content = styled.div`
  animation: fadeIn 0.3s ease-in;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const StepHeader = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
`;

const StepNumber = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary-600);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const StepDescription = styled.p`
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #fed7d7;
  border-radius: 4px;
  border-left: 3px solid #e53e3e;
`;
