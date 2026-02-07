import { useFieldArray, useFormContext } from "react-hook-form";
import styled from "styled-components";
import { FaTrash, FaPlus, FaInfoCircle } from "react-icons/fa";

const SpecificationSection = () => {
  const { register, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "specifications.material",
  });

  return (
    <div>
      <SectionTitle>Materials</SectionTitle>
      {fields.map((field, index) => (
        <MaterialGroup key={field.id}>
          <InputGroup>
            <Label>Material Name</Label>
            <Input
              type="text"
              {...register(`specifications.material.${index}.value`)}
              placeholder="e.g. Cotton, Polyester"
            />
          </InputGroup>

          <InputGroup>
            <Label>Color Code (Hex)</Label>
            <Input
              type="text"
              {...register(`specifications.material.${index}.hexCode`)}
              placeholder="#FFFFFF"
            />
          </InputGroup>

          <RemoveButton type="button" onClick={() => remove(index)}>
            Remove
          </RemoveButton>
        </MaterialGroup>
      ))}

      <AddButton
        type="button"
        onClick={() => append({ value: "", hexCode: "" })}
      >
        + Add Material
      </AddButton>

      <InputGroup>
        <Label>Weight</Label>
        <Input
          type="text"
          {...register("specifications.weight")}
          placeholder="e.g. 0.5kg"
        />
      </InputGroup>

      <InputGroup>
        <Label>Dimensions</Label>
        <Input
          type="text"
          {...register("specifications.dimension")}
          placeholder="e.g. 10x10x5cm"
        />
      </InputGroup>
    </div>
  );
};
const SectionTitle = styled.h4`
  font-size: 1.5rem;
  font-weight: 400;
  color: #2d3748;
  margin-top: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

// Styled components
const MaterialGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 400;
  font-size: 1.0625rem;
  color: #2d3748;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1.0625rem;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3182ce;
    outline: none;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
  }
`;

const AddButton = styled.button`
  background: #edf2f7;
  color: #2d3748;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #e2e8f0;
  }
`;

const RemoveButton = styled.button`
  background: #fed7d7;
  color: #e53e3e;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #feb2b2;
  }
`;

export default SpecificationSection;
