// src/components/categories/VariantOptionsForm.js
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import { FaPlus, FaTrash, FaSave, FaTimes } from "react-icons/fa";

const VariantOptionsForm = ({ category, onSave, onCancel }) => {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm();
  const [variantTypes, setVariantTypes] = useState([]);
  const [editingOption, setEditingOption] = useState(null);
  const [newOption, setNewOption] = useState("");

  // Initialize form with category data
  useEffect(() => {
    if (category) {
      setValue("name", category.name);
      setValue("status", category.status || "active");

      if (category.variantOptions) {
        setVariantTypes(category.variantOptions);
      }

      // Set options if they exist
      if (category.options) {
        const optionsObj = {};
        if (category.options instanceof Map) {
          for (const [key, values] of category.options) {
            optionsObj[key] = values;
          }
        } else {
          Object.assign(optionsObj, category.options);
        }
        setValue("options", optionsObj);
      }
    }
  }, [category, setValue]);

  // Add a new variant type
  const addVariantType = () => {
    if (newOption.trim()) {
      const newType = newOption.trim();
      // Check for duplicates
      if (!variantTypes.includes(newType)) {
        setVariantTypes([...variantTypes, newType]);
        // Initialize options for this variant type
        setValue(`options.${newType}`, []);
        setNewOption("");
      }
    }
  };

  // Remove a variant type
  const removeVariantType = (type) => {
    setVariantTypes(variantTypes.filter((t) => t !== type));
    // Remove options for this variant type
    setValue(`options.${type}`, undefined);
  };

  // Add an option to a variant type
  const addOption = (variantType, option) => {
    if (option.trim()) {
      const newOpt = option.trim();
      const currentOptions = getValues(`options.${variantType}`) || [];
      // Check for duplicates
      if (!currentOptions.includes(newOpt)) {
        setValue(`options.${variantType}`, [...currentOptions, newOpt]);
        setEditingOption(null);
      }
    }
  };

  // Remove an option from a variant type
  const removeOption = (variantType, option) => {
    const currentOptions = getValues(`options.${variantType}`) || [];
    setValue(
      `options.${variantType}`,
      currentOptions.filter((o) => o !== option)
    );
  };

  // Handle form submission
  const onSubmit = (data) => {
    // Prepare variant options and options map
    const variantOptions = variantTypes;
    const optionsMap = new Map();

    variantTypes.forEach((type) => {
      if (data.options[type]) {
        optionsMap.set(type, data.options[type]);
      }
    });

    // Prepare the updated category
    const updatedCategory = {
      ...category,
      name: data.name,
      status: data.status,
      variantOptions,
      options: optionsMap,
    };

    onSave(updatedCategory);
  };

  return (
    <FormContainer>
      <FormHeader>
        <h2>{category ? `Edit ${category.name}` : "Add New Category"}</h2>
        <CloseButton onClick={onCancel}>
          <FaTimes />
        </CloseButton>
      </FormHeader>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormGroup>
          <Label>Category Name</Label>
          <Input
            {...register("name", { required: "Category name is required" })}
            placeholder="Enter category name"
          />
          {errors.name && <ErrorText>{errors.name.message}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label>Status</Label>
          <Select {...register("status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormGroup>

        <SectionDivider>
          <h3>Variant Options</h3>
          <p>Define the variant types and their options for this category</p>
        </SectionDivider>

        <FormGroup>
          <Label>Add New Variant Type</Label>
          <OptionInputGroup>
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="e.g., Material, Size, Color"
            />
            <AddButton type="button" onClick={addVariantType}>
              <FaPlus /> Add Type
            </AddButton>
          </OptionInputGroup>
        </FormGroup>

        {variantTypes.length > 0 && (
          <VariantSection>
            <h4>Current Variant Types</h4>
            {variantTypes.map((type) => (
              <VariantGroup key={type}>
                <VariantHeader>
                  <VariantName>{type}</VariantName>
                  <RemoveButton
                    type="button"
                    onClick={() => removeVariantType(type)}
                  >
                    <FaTrash />
                  </RemoveButton>
                </VariantHeader>

                <OptionsList>
                  {(getValues(`options.${type}`) || []).map((option, idx) => (
                    <OptionItem key={`${type}-${idx}`}>
                      {option}
                      <RemoveButton
                        type="button"
                        onClick={() => removeOption(type, option)}
                      >
                        <FaTrash size={12} />
                      </RemoveButton>
                    </OptionItem>
                  ))}

                  {editingOption === type ? (
                    <OptionInputGroup>
                      <Input
                        type="text"
                        placeholder="Add new option"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addOption(type, e.target.value);
                            e.target.value = "";
                          }
                        }}
                      />
                      <AddButton
                        type="button"
                        onClick={(e) => {
                          const input = e.target.previousElementSibling;
                          addOption(type, input.value);
                          input.value = "";
                        }}
                      >
                        <FaPlus size={12} />
                      </AddButton>
                      <CancelButton
                        type="button"
                        onClick={() => setEditingOption(null)}
                      >
                        Cancel
                      </CancelButton>
                    </OptionInputGroup>
                  ) : (
                    <AddOptionButton
                      type="button"
                      onClick={() => setEditingOption(type)}
                    >
                      <FaPlus size={12} /> Add Option
                    </AddOptionButton>
                  )}
                </OptionsList>
              </VariantGroup>
            ))}
          </VariantSection>
        )}

        <ButtonGroup>
          <SubmitButton type="submit">
            <FaSave /> Save Changes
          </SubmitButton>
          <CancelButton type="button" onClick={onCancel}>
            Cancel
          </CancelButton>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
};

export default VariantOptionsForm;

// Styled components
const FormContainer = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
  max-width: 800px;
  margin: 2rem auto;
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;

  h2 {
    font-size: 1.5rem;
    color: #333;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #777;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;

  &:hover {
    background: #f8f9fa;
    color: #333;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #444;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
`;

const ErrorText = styled.span`
  color: #e53e3e;
  font-size: 0.85rem;
`;

const SectionDivider = styled.div`
  margin: 1.5rem 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    color: #333;
  }

  p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
`;

const OptionInputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const AddButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
`;

const VariantSection = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;

  h4 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: #444;
  }
`;

const VariantGroup = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const VariantHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const VariantName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: #333;
  text-transform: capitalize;
`;

const RemoveButton = styled.button`
  background: #fef2f2;
  color: #e53e3e;
  border: 1px solid #fed7d7;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;

  &:hover {
    background: #fee2e2;
  }
`;

const OptionsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const OptionItem = styled.div`
  background: #edf2f7;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
`;

const AddOptionButton = styled.button`
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: #dcfce7;
  }
`;

const CancelButton = styled.button`
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e2e8f0;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
  justify-content: flex-end;
`;

const SubmitButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;

  &:hover {
    background: #2563eb;
  }
`;
