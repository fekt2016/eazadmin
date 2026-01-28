import styled from "styled-components";
import { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { LoadingSpinner } from "../LoadingSpinner";

export default function CategoryForm({
  showForm,
  editingCategory,
  handleSubmit,
  formData,
  handleInputChange,
  formErrors,
  setFormData,
  imagePreview,
  setImagePreview,
  cancelForm,
  categories,
  createCategory,
  updateCategory,
}) {
  // const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [attributeInputs, setAttributeInputs] = useState({
    name: "",
    type: "text",
    isRequired: false,
    isFilterable: false,
    isVariant: false,
    value: "",
  });

  // Initialize form data
  useEffect(() => {
    if (editingCategory) {
      setFormData({
        ...editingCategory,
        attributes: editingCategory.attributes || [],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        image:
          "https://res.cloudinary.com/dz2xqjv8q/image/upload/v1698247967/eazworld/1_1_dk0l6h.jpg",
        parentCategory: null,
        status: "active",
        attributes: [],
      });
    }
  }, [editingCategory, setFormData]);

  const addNewAttribute = () => {
    if (!attributeInputs.name.trim()) return;

    const newAttribute = {
      name: attributeInputs.name.trim(),
      type: attributeInputs.type,
      isRequired: attributeInputs.isRequired,
      isFilterable: attributeInputs.isFilterable,
      isVariant: attributeInputs.isVariant,
      values: attributeInputs.value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v),
    };
    console.log("attributes", newAttribute);

    setFormData((prev) => ({
      ...prev,
      attributes: [...prev.attributes, newAttribute],
    }));

    // Reset attribute inputs
    setAttributeInputs({
      name: "",
      type: "text",
      isRequired: false,
      isFilterable: false,
      isVariant: false,
      value: "",
    });
  };

  const removeAttribute = (index) => {
    setFormData((prev) => {
      const updatedAttributes = [...prev.attributes];
      updatedAttributes.splice(index, 1);
      return {
        ...prev,
        attributes: updatedAttributes,
      };
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(e, formData);
  };

  return (
    <>
      {showForm && (
        <FormCard>
          <FormTitle>
            {editingCategory ? "Edit Category" : "Add New Category"}
          </FormTitle>
          <Form onSubmit={handleFormSubmit}>
            <FormGroup>
              <FormLabel>Category Name *</FormLabel>
              <FormInput
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                $error={!!formErrors.name}
              />
              {formErrors.name && <ErrorText>{formErrors.name}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <FormLabel>Description *</FormLabel>
              <FormTextArea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                $error={!!formErrors.description}
              />
              {formErrors.description && (
                <ErrorText>{formErrors.description}</ErrorText>
              )}
            </FormGroup>

            <FormGroup>
              <FormLabel>Category Image</FormLabel>
              {imagePreview && (
                <PreviewImage src={imagePreview} alt="Preview" />
              )}
              <FormInput
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    const file = e.target.files[0];
                    setFormData((prev) => ({ ...prev, image: file }));
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>Parent Category</FormLabel>
              <FormSelect
                name="parentCategory"
                value={formData.parentCategory || ""}
                onChange={handleInputChange}
              >
                <option value="">None (Top Level)</option>
                {categories
                  .filter((cat) => {
                    // Only show categories without a parent (top-level categories)
                    // Handle both object and string/null parentCategory
                    const hasParent = cat.parentCategory !== null && 
                                     cat.parentCategory !== undefined && 
                                     cat.parentCategory !== '' &&
                                     !(typeof cat.parentCategory === 'object' && 
                                       Object.keys(cat.parentCategory || {}).length === 0);
                    return !hasParent;
                  })
                  .filter(
                    (cat) => !editingCategory || cat._id !== editingCategory._id
                  )
                  .sort((a, b) => (a.name || '').localeCompare(b.name || '')) // Sort alphabetically
                  .map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
              </FormSelect>
              {process.env.NODE_ENV === 'development' && (
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                  Showing {categories.filter(cat => {
                    const hasParent = cat.parentCategory !== null && 
                                     cat.parentCategory !== undefined && 
                                     cat.parentCategory !== '' &&
                                     !(typeof cat.parentCategory === 'object' && 
                                       Object.keys(cat.parentCategory || {}).length === 0);
                    return !hasParent;
                  }).length} of {categories.length} categories (top-level only)
                </div>
              )}
            </FormGroup>

            <FormGroup>
              <FormLabel>Status</FormLabel>
              <StatusContainer>
                <StatusOption
                  $active={formData.status === "active"}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, status: "active" }))
                  }
                >
                  Active
                </StatusOption>
                <StatusOption
                  $active={formData.status === "inactive"}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, status: "inactive" }))
                  }
                >
                  Inactive
                </StatusOption>
              </StatusContainer>
            </FormGroup>

            {/* Attributes Section */}
            <AttributeSection>
              <SectionTitle>Attributes</SectionTitle>
              <SectionDescription>
                Define attributes for products in this category
              </SectionDescription>

              <AttributeFormGroup>
                <AttributeInputGroup>
                  <AttributeInput
                    type="text"
                    placeholder="Attribute Name"
                    value={attributeInputs.name}
                    onChange={(e) =>
                      setAttributeInputs((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />

                  <AttributeSelect
                    value={attributeInputs.type}
                    onChange={(e) =>
                      setAttributeInputs((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="enum">Enum (Multiple Values)</option>
                    <option value="color">Color</option>
                  </AttributeSelect>

                  <AttributeValueInput
                    type="text"
                    placeholder={
                      attributeInputs.type === "enum" ||
                      attributeInputs.type === "color"
                        ? "Comma-separated values (e.g., Red, Blue, Green)"
                        : "Default value"
                    }
                    value={attributeInputs.value}
                    onChange={(e) =>
                      setAttributeInputs((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    disabled={attributeInputs.type === "boolean"}
                  />
                </AttributeInputGroup>

                <AttributeOptions>
                  <AttributeOption>
                    <input
                      type="checkbox"
                      id="isRequired"
                      checked={attributeInputs.isRequired}
                      onChange={(e) =>
                        setAttributeInputs((prev) => ({
                          ...prev,
                          isRequired: e.target.checked,
                        }))
                      }
                    />
                    <label htmlFor="isRequired">Required</label>
                  </AttributeOption>

                  <AttributeOption>
                    <input
                      type="checkbox"
                      id="isFilterable"
                      checked={attributeInputs.isFilterable}
                      onChange={(e) =>
                        setAttributeInputs((prev) => ({
                          ...prev,
                          isFilterable: e.target.checked,
                        }))
                      }
                    />
                    <label htmlFor="isFilterable">Filterable</label>
                  </AttributeOption>

                  <AttributeOption>
                    <input
                      type="checkbox"
                      id="isVariant"
                      checked={attributeInputs.isVariant}
                      onChange={(e) =>
                        setAttributeInputs((prev) => ({
                          ...prev,
                          isVariant: e.target.checked,
                        }))
                      }
                    />
                    <label htmlFor="isVariant">Use for Variants</label>
                  </AttributeOption>
                </AttributeOptions>

                <AddAttributeButton type="button" onClick={addNewAttribute}>
                  <FaPlus /> Add Attribute
                </AddAttributeButton>
              </AttributeFormGroup>

              {formData.attributes && formData.attributes.length > 0 && (
                <AttributesList>
                  {formData.attributes.map((attr, index) => (
                    <AttributeItem key={index}>
                      <AttributeHeader>
                        <AttributeName>{attr.name}</AttributeName>
                        <AttributeTypeBadge $type={attr.type}>
                          {attr.type}
                        </AttributeTypeBadge>
                        <RemoveButton onClick={() => removeAttribute(index)}>
                          <FaTrash />
                        </RemoveButton>
                      </AttributeHeader>

                      <AttributeDetails>
                        <div>
                          <DetailLabel>Required:</DetailLabel>
                          <DetailValue>
                            {attr.isRequired ? "Yes" : "No"}
                          </DetailValue>
                        </div>
                        <div>
                          <DetailLabel>Filterable:</DetailLabel>
                          <DetailValue>
                            {attr.isFilterable ? "Yes" : "No"}
                          </DetailValue>
                        </div>
                        <div>
                          <DetailLabel>Variant:</DetailLabel>
                          <DetailValue>
                            {attr.isVariant ? "Yes" : "No"}
                          </DetailValue>
                        </div>

                        {(attr.type === "enum" || attr.type === "color") &&
                          attr.values &&
                          attr.values.length > 0 && (
                            <AttributeValuesContainer>
                              <DetailLabel>Values:</DetailLabel>
                              <AttributeValuesList>
                                {attr.values.map((value, valueIndex) => (
                                  <AttributeValueItem key={valueIndex}>
                                    {value}
                                  </AttributeValueItem>
                                ))}
                              </AttributeValuesList>
                            </AttributeValuesContainer>
                          )}
                      </AttributeDetails>
                    </AttributeItem>
                  ))}
                </AttributesList>
              )}
            </AttributeSection>

            <FormActions>
              <SecondaryButton type="button" onClick={cancelForm}>
                Cancel
              </SecondaryButton>
              <PrimaryButton 
                type="submit"
                disabled={createCategory?.isPending || updateCategory?.isPending || createCategory?.isLoading || updateCategory?.isLoading}
              >
                {(createCategory?.isPending || updateCategory?.isPending || createCategory?.isLoading || updateCategory?.isLoading) ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>{editingCategory ? "Updating..." : "Creating..."}</span>
                  </>
                ) : (
                  <span>{editingCategory ? "Update Category" : "Create Category"}</span>
                )}
              </PrimaryButton>
            </FormActions>
          </Form>
        </FormCard>
      )}
    </>
  );
}

// ================== Styled Components ==================
// ... (existing styles remain the same) ...

// New styles for attribute management
const AttributeSection = styled.div`
  grid-column: span 2;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
`;

const AttributeFormGroup = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
`;

const AttributeInputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.8rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AttributeInput = styled.input`
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
`;

const AttributeSelect = styled.select`
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: white;
`;

const AttributeValueInput = styled.input`
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
`;

const AttributeOptions = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
`;

const AttributeOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  input {
    margin: 0;
  }

  label {
    font-size: 0.9rem;
    color: #4b5563;
  }
`;

const AddAttributeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #4a6cf7;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.7rem 1.2rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #3a5af5;
  }
`;

const AttributesList = styled.div`
  display: grid;
  gap: 1rem;
`;

const AttributeItem = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.2rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const AttributeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
`;

const AttributeName = styled.span`
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
  flex: 1;
`;

const AttributeTypeBadge = styled.span`
  background: ${({ $type }) =>
    $type === "color"
      ? "#dbeafe"
      : $type === "enum"
      ? "#ede9fe"
      : $type === "boolean"
      ? "#dcfce7"
      : "#e5e7eb"};
  color: ${({ $type }) =>
    $type === "color"
      ? "#3b82f6"
      : $type === "enum"
      ? "#8b5cf6"
      : $type === "boolean"
      ? "#10b981"
      : "#4b5563"};
  padding: 0.25rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  margin: 0 1rem;
`;

const AttributeDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
`;

const DetailLabel = styled.span`
  font-size: 0.9rem;
  color: #6b7280;
  display: block;
  margin-bottom: 0.2rem;
`;

const DetailValue = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  color: #4b5563;
`;

const AttributeValuesContainer = styled.div`
  grid-column: span 2;
`;

const AttributeValuesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const AttributeValueItem = styled.span`
  background: #f3f4f6;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #4b5563;
`;

const FormCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
`;

const FormTitle = styled.h2`
  color: #2c3e50;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: ${(props) => (props.$fullWidth ? "span 2" : "auto")};

  @media (max-width: 768px) {
    grid-column: span 1;
  }
`;

const FormLabel = styled.label`
  font-size: 0.95rem;
  color: #34495e;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const FormInput = styled.input`
  padding: 0.9rem;
  border: 1px solid ${(props) => (props.$error ? "#e74c3c" : "#ddd")};
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const FormTextArea = styled.textarea`
  padding: 0.9rem;
  border: 1px solid ${(props) => (props.$error ? "#e74c3c" : "#ddd")};
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const FormSelect = styled.select`
  padding: 0.9rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const PreviewImage = styled.img`
  max-width: 100px;
  margin-bottom: 10px;
  border-radius: 4px;
  border: 1px solid #eee;
`;

const ErrorText = styled.span`
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.3rem;
`;

const StatusContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StatusOption = styled.div`
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${(props) => (props.$active ? "#27ae60" : "#ddd")};
  background-color: ${(props) =>
    props.$active ? "rgba(39, 174, 96, 0.1)" : "white"};
  color: ${(props) => (props.$active ? "#27ae60" : "#7f8c8d")};
  font-weight: ${(props) => (props.$active ? "500" : "normal")};

  &:hover {
    border-color: ${(props) => (props.$active ? "#219653" : "#3498db")};
    background-color: ${(props) =>
      props.$active ? "rgba(33, 150, 83, 0.15)" : "#f8f9fa"};
  }
`;

const FormActions = styled.div`
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-column: span 1;
  }
`;

const PrimaryButton = styled.button`
  padding: 0.8rem 1.8rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
  }
`;

const SecondaryButton = styled.button`
  padding: 0.8rem 1.8rem;
  background-color: white;
  color: #7f8c8d;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f8f9fa;
    border-color: #bbb;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 0.5rem;
`;

const SectionDescription = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #c82333;
  }
`;
