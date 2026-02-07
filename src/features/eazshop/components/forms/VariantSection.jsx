import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { generateSKU } from '../../../../shared/utils/helpers';
import { FiUploadCloud, FiX, FiImage } from "react-icons/fi";

export default function VariantSection({ variantAttributes = [], seller }) {
  const { control, register, setValue, getValues } = useFormContext();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "variants",
  });

  const [customAttributes, setCustomAttributes] = useState([]);
  const [newAttribute, setNewAttribute] = useState("");

  // Watch all variant stocks for changes
  const variantStocks = useWatch({
    control,
    name: "variants",
    defaultValue: [],
  });

  // Calculate total stock based on watched values
  const totalStock = useMemo(() => {
    return variantStocks.reduce(
      (sum, variant) => sum + (parseInt(variant?.stock || 0) || 0),
      0
    );
  }, [variantStocks]);

  // Combine predefined and custom attributes, excluding 'Brand'
  const allAttributes = useMemo(() => {
    const filteredPredefined = variantAttributes.filter(
      (attr) => attr.name.toLowerCase() !== "brand"
    );

    return [
      ...filteredPredefined,
      ...customAttributes
        .filter((name) => name.toLowerCase() !== "brand")
        .map((name) => ({ name, _id: `custom-${name}` })),
    ];
  }, [variantAttributes, customAttributes]);

  // Add a new custom attribute
  const addCustomAttribute = () => {
    const trimmedAttribute = newAttribute.trim();
    if (
      trimmedAttribute &&
      trimmedAttribute.toLowerCase() !== "brand" &&
      !customAttributes.includes(trimmedAttribute)
    ) {
      setCustomAttributes((prev) => [...prev, trimmedAttribute]);
      setNewAttribute("");
    }
  };

  // Generate variants from options
  const generateVariants = () => {
    const attributes = getValues("attributes") || [];
    const subCategory = getValues("subCategory") || "GENERAL";

    // Filter out attributes that have both name and value
    const validAttributes = attributes.filter(
      (attr) => attr?.name && attr?.value && attr.value.trim()
    );

    if (!validAttributes || validAttributes.length === 0) {
      console.warn("No valid attributes found. Please add attributes with values first.");
      // You could also show a toast notification here
      return;
    }

    // Parse comma-separated values from each attribute
    const attributeOptions = validAttributes.map((attr) => {
      const values = attr.value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      
      return {
        key: attr.name,
        values: values,
      };
    });

    // Create all possible combinations of option values (cartesian product)
    const combinations = attributeOptions.reduce((acc, option) => {
      if (!acc.length) {
        return option.values.map((value) => ({ [option.key]: value }));
      }
      return acc.flatMap((combo) =>
        option.values.map((value) => ({ ...combo, [option.key]: value }))
      );
    }, []);

    if (combinations.length === 0) {
      console.warn("No combinations generated. Please check your attribute values.");
      return;
    }

    // Create variant objects from combinations
    const newVariants = combinations.map((combo) => {
      // Map combination values to attribute format
      const variantAttributes = Object.keys(combo).map((key) => ({
        key: key,
        value: combo[key],
      }));

      // Create variant object for SKU generation
      const variantObj = variantAttributes.reduce((acc, attr) => {
        if (attr.value) acc[attr.key] = attr.value;
        return acc;
      }, {});

      return {
        attributes: variantAttributes,
        price: 0,
        stock: 0,
        sku: generateSKU({
          user: seller,
          variants: variantObj,
          category: subCategory,
        }),
        status: "active",
        condition: "new", // Default condition
      };
    });

    // Replace existing variants with the new generated ones
    replace(newVariants);
    console.log(`Generated ${newVariants.length} variants from ${validAttributes.length} attributes`);
  };

  // Add a single variant manually
  const addVariantManually = () => {
    append({
      attributes: allAttributes.map((attr) => ({
        key: attr.name,
        value: "",
      })),
      sku: "",
      price: 0,
      stock: 0,
      status: "active",
      condition: "new", // Default condition
    });
  };

  return (
    <div>
      <VariantControls>
        <GenerateButton type="button" onClick={generateVariants}>
          Generate Variants from Options
        </GenerateButton>
        <AddVariantButton type="button" onClick={addVariantManually}>
          + Add Variant Manually
        </AddVariantButton>
      </VariantControls>

      <AttributeManagement>
        <h4>Additional Attributes:</h4>
        <AttributeInputGroup>
          <AttributeInput
            type="text"
            value={newAttribute}
            onChange={(e) => setNewAttribute(e.target.value)}
            placeholder="New attribute name"
          />
          <AddAttributeButton type="button" onClick={addCustomAttribute}>
            Add Attribute
          </AddAttributeButton>
        </AttributeInputGroup>

        <AttributeList>
          {customAttributes
            .filter((attr) => attr.toLowerCase() !== "brand")
            .map((attr, index) => (
              <AttributeTag key={index}>
                {attr}
                <RemoveAttributeButton
                  type="button"
                  onClick={() =>
                    setCustomAttributes((prev) =>
                      prev.filter((a) => a !== attr)
                    )
                  }
                >
                  ×
                </RemoveAttributeButton>
              </AttributeTag>
            ))}
        </AttributeList>
      </AttributeManagement>

      <VariantCardsContainer>
        {fields.map((field, idx) => (
          <VariantCard key={field.id}>
            <VariantCardHeader>
              <VariantCardTitle>Variant {idx + 1}</VariantCardTitle>
              {fields.length > 1 && (
                <RemoveVariantButton type="button" onClick={() => remove(idx)}>
                  <FiX /> Remove
                </RemoveVariantButton>
              )}
            </VariantCardHeader>
            <VariantCardBody>
              <VariantRow
                variantIndex={idx}
                allAttributes={allAttributes}
                canRemove={fields.length > 1}
                remove={remove}
                register={register}
                control={control}
                setValue={setValue}
                getValues={getValues}
                seller={seller}
              />
            </VariantCardBody>
          </VariantCard>
        ))}
        <TotalQuantityCard>
          <TotalQuantityLabel>Total Quantity:</TotalQuantityLabel>
          <TotalQuantityValue>{totalStock}</TotalQuantityValue>
        </TotalQuantityCard>
      </VariantCardsContainer>
    </div>
  );
}

function VariantRow({
  variantIndex,
  allAttributes = [],
  canRemove,
  remove,
  register,
  control,
  setValue,
  getValues,
  seller,
}) {
  const { formState: { errors } } = useFormContext();
  const firstRun = useRef(true);
  const prevAttrValues = useRef([]);
  const subCategory = useWatch({ name: "subCategory", control }) || "GENERAL";

  const watchedAttrs = useWatch({
    control,
    name: `variants.${variantIndex}.attributes`,
    defaultValue: [],
  });
  
  const variantErrors = errors.variants?.[variantIndex];

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      prevAttrValues.current = (watchedAttrs || []).map((a) => a.value);
      return;
    }

    const currentValues = (watchedAttrs || []).map((a) => a.value);
    const prevValues = prevAttrValues.current;

    const valuesChanged =
      currentValues.length !== prevValues.length ||
      currentValues.some((val, i) => val !== prevValues[i]);

    if (!valuesChanged) return;

    prevAttrValues.current = currentValues;

    const variantsObj = (watchedAttrs || []).reduce((o, a) => {
      if (a?.key && a.value) o[a.key] = a.value;
      return o;
    }, {});

    const newSku = generateSKU({
      seller,
      variants: variantsObj,
      category: subCategory,
    });
    const currentSku = getValues(`variants.${variantIndex}.sku`);

    if (newSku !== currentSku) {
      setValue(`variants.${variantIndex}.sku`, newSku, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [watchedAttrs, setValue, getValues, variantIndex, seller, subCategory]);

  return (
    <VariantFieldsGrid>
      {/* Attributes Section */}
      <VariantFieldGroup>
        <FieldLabel>Attributes</FieldLabel>
        <VariantAttributes>
          {allAttributes.map((attr, ai) => {
            // Find the attribute index in the variant's attributes array
            const attrIndex = watchedAttrs.findIndex(
              (a) => a.key === attr.name
            );

            // If not found, add it to the variant
            if (attrIndex === -1) {
              const newAttrs = [...watchedAttrs, { key: attr.name, value: "" }];
              setValue(`variants.${variantIndex}.attributes`, newAttrs);
              return null;
            }

            return (
              <AttributeItem key={`${attr.name}-${ai}`}>
                <input
                  type="hidden"
                  {...register(
                    `variants.${variantIndex}.attributes.${attrIndex}.key`
                  )}
                  value={attr.name}
                />
                <AttributeName>{attr.name}:</AttributeName>
                <AttributeInput
                  {...register(
                    `variants.${variantIndex}.attributes.${attrIndex}.value`
                  )}
                  placeholder={`Enter ${attr.name}`}
                />
              </AttributeItem>
            );
          })}
        </VariantAttributes>
      </VariantFieldGroup>

      {/* SKU */}
      <VariantFieldGroup>
        <FieldLabel>SKU</FieldLabel>
        <Input
          readOnly
          {...register(`variants.${variantIndex}.sku`)}
          placeholder="SKU"
        />
      </VariantFieldGroup>

      {/* Price */}
      <VariantFieldGroup>
        <FieldLabel>Price <Required>*</Required></FieldLabel>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          {...register(`variants.${variantIndex}.price`, {
            required: "Please enter a price for this variant",
            min: { value: 0.01, message: "Price must be greater than 0" },
          })}
          placeholder="Price"
          $hasError={!!variantErrors?.price}
        />
        {variantErrors?.price && (
          <VariantErrorMessage>{variantErrors.price.message}</VariantErrorMessage>
        )}
      </VariantFieldGroup>

      {/* Quantity */}
      <VariantFieldGroup>
        <FieldLabel>Quantity <Required>*</Required></FieldLabel>
        <Input
          type="number"
          min="0"
          {...register(`variants.${variantIndex}.stock`, {
            required: "Please enter quantity for this variant",
            min: { value: 0, message: "Quantity must be 0 or greater" },
          })}
          placeholder="Quantity"
          $hasError={!!variantErrors?.stock}
        />
        {variantErrors?.stock && (
          <VariantErrorMessage>{variantErrors.stock.message}</VariantErrorMessage>
        )}
      </VariantFieldGroup>

      {/* Status */}
      <VariantFieldGroup>
        <FieldLabel>Status</FieldLabel>
        <Select {...register(`variants.${variantIndex}.status`)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </VariantFieldGroup>

      {/* Condition */}
      <VariantFieldGroup>
        <FieldLabel>Condition <Required>*</Required></FieldLabel>
        <Select 
          {...register(`variants.${variantIndex}.condition`, { 
            required: "Please select a condition for this variant" 
          })}
          $hasError={!!variantErrors?.condition}
        >
          <option value="">Select condition</option>
          <option value="new">New</option>
          <option value="like_new">Like New</option>
          <option value="open_box">Open Box</option>
          <option value="refurbished">Refurbished</option>
          <option value="used">Used</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </Select>
        {variantErrors?.condition && (
          <VariantErrorMessage>{variantErrors.condition.message}</VariantErrorMessage>
        )}
      </VariantFieldGroup>

      {/* Images - Full Width */}
      <VariantFieldGroupFullWidth>
        <FieldLabel>Images</FieldLabel>
        <VariantImageUpload
          variantIndex={variantIndex}
          control={control}
          setValue={setValue}
          register={register}
        />
      </VariantFieldGroupFullWidth>
    </VariantFieldsGrid>
  );
}

// --- Styled Components ---
const VariantControls = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const GenerateButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;

  &:hover {
    background: #388e3c;
  }
`;

const AddVariantButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;

  &:hover {
    background: #1976d2;
  }
`;

const AttributeManagement = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
`;

const AttributeInputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const AttributeInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 1rem;
`;

const AddAttributeButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #5a6268;
  }
`;

const AttributeList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const AttributeTag = styled.span`
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const RemoveAttributeButton = styled.button`
  margin-left: 0.5rem;
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 0.25rem;

  &:hover {
    color: #bd2130;
  }
`;

const VariantCardsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const VariantCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const VariantCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
`;

const VariantCardTitle = styled.h4`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
`;

const RemoveVariantButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #fecaca;
    border-color: #fca5a5;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const VariantCardBody = styled.div`
  width: 100%;
`;

const VariantFieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const VariantFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const VariantFieldGroupFullWidth = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Required = styled.span`
  color: #ef4444;
  font-weight: 600;
`;
const VariantAttributes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
const AttributeItem = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;
const AttributeName = styled.span`
  font-weight: 600;
  color: #4a5568;
  min-width: 100px;
`;
const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${props => props.$hasError ? '#e53e3e' : '#cbd5e0'};
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#e53e3e' : '#3182ce'};
    box-shadow: 0 0 0 2px ${props => props.$hasError ? 'rgba(229, 62, 62, 0.1)' : 'rgba(49, 130, 206, 0.1)'};
  }
  
  &[readonly] {
    background: #f7fafc;
    cursor: not-allowed;
  }
`;
const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${props => props.$hasError ? '#e53e3e' : '#cbd5e0'};
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#e53e3e' : '#3182ce'};
    box-shadow: 0 0 0 2px ${props => props.$hasError ? 'rgba(229, 62, 62, 0.1)' : 'rgba(49, 130, 206, 0.1)'};
  }
`;

const VariantErrorMessage = styled.div`
  color: #e53e3e;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  font-weight: 400;
  padding: 0.25rem 0.5rem;
  background: #fed7d7;
  border-radius: 3px;
  border-left: 2px solid #e53e3e;
`;
const TotalQuantityCard = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
`;

const TotalQuantityLabel = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
`;

const TotalQuantityValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #3182ce;
`;

// Variant Image Upload Component - one image per variant only
function VariantImageUpload({ variantIndex, control, setValue, register }) {
  const [imagePreview, setImagePreview] = useState("");
  const watchedImages = useWatch({
    control,
    name: `variants.${variantIndex}.images`,
    defaultValue: [],
  });

  const singleImage = Array.isArray(watchedImages) && watchedImages.length > 0 ? watchedImages[0] : null;

  // Sync single image preview
  useEffect(() => {
    if (!singleImage) {
      setImagePreview("");
      return;
    }
    const preview = typeof singleImage === "string" ? singleImage : (singleImage instanceof File ? URL.createObjectURL(singleImage) : "");
    setImagePreview(preview);
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [singleImage]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValue(`variants.${variantIndex}.images`, [file], {
      shouldDirty: true,
    });
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setValue(`variants.${variantIndex}.images`, [], {
      shouldDirty: true,
    });
  };

  return (
    <VariantImageContainer>
      <VariantImageLabel>Variant image</VariantImageLabel>
      <VariantImageUploadArea>
        <VariantImageUploadIcon>
          <FiImage size={16} />
        </VariantImageUploadIcon>
        <VariantImageUploadText>One image only</VariantImageUploadText>
        <VariantImageFileInput
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </VariantImageUploadArea>

      {imagePreview && (
        <VariantImageSinglePreview>
          <VariantPreviewImage src={imagePreview} alt="Variant" />
          <VariantImageRemoveButton type="button" onClick={handleRemoveImage}>
            <FiX size={12} />
          </VariantImageRemoveButton>
        </VariantImageSinglePreview>
      )}
    </VariantImageContainer>
  );
}

const VariantImageContainer = styled.div`
  min-width: 200px;
  max-width: 300px;
`;

const VariantImageLabel = styled.span`
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 0.35rem;
`;

const VariantImageUploadArea = styled.div`
  border: 1.5px dashed #cbd5e0;
  border-radius: 6px;
  padding: 0.75rem;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8fafc;

  &:hover {
    border-color: #3182ce;
    background: #edf2f7;
  }
`;

const VariantImageUploadIcon = styled.div`
  color: #a0aec0;
  margin-bottom: 0.25rem;
  display: flex;
  justify-content: center;
`;

const VariantImageUploadText = styled.span`
  font-size: 0.75rem;
  color: #718096;
  display: block;
`;

const VariantImageFileInput = styled.input`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
`;

const VariantImageSinglePreview = styled.div`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 1/1;
  border: 1px solid #e2e8f0;
  margin-top: 0.5rem;
  max-width: 120px;
`;

const VariantImagePreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const VariantImagePreview = styled.div`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 1/1;
  border: 1px solid #e2e8f0;
`;

const VariantPreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const VariantImageRemoveButton = styled.button`
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background: rgba(229, 62, 62, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;

  &:hover {
    background: #c53030;
    transform: scale(1.1);
  }
`;
