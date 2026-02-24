import { useFormContext } from "react-hook-form";
import styled from "styled-components";

const BasicSection = () => {
  const { register, watch, formState: { errors } } = useFormContext();
  
  const name = watch("name") || "";
  const description = watch("description") || "";
  const nameLength = name.length;
  const descriptionLength = description.length;

  return (
    <div>
      <FieldGroup>
        <Label>
          Product Name <Required>*</Required>
          {nameLength > 0 && <CharCount $warning={nameLength > 100}>{nameLength}/200</CharCount>}
        </Label>
        <Input
          {...register("name", { 
            required: "Please enter a product name",
            maxLength: { value: 200, message: "Product name must be less than 200 characters" }
          })}
          placeholder="e.g., Samsung Galaxy S21 Ultra 128GB"
          maxLength={200}
          $hasError={!!errors.name}
        />
        {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
        <HelperText>Choose a clear, descriptive name that customers will search for</HelperText>
      </FieldGroup>

      <FieldGroup>
        <Label>
          Description
          {descriptionLength > 0 && <CharCount $warning={descriptionLength > 2000}>{descriptionLength}/5000</CharCount>}
        </Label>
        <TextArea
          {...register("description", {
            maxLength: { value: 5000, message: "Description must be less than 5000 characters" }
          })}
          placeholder="Describe your product in detail..."
          rows={6}
          maxLength={5000}
        />
        <HelperText>Provide detailed information to help customers make informed decisions</HelperText>
      </FieldGroup>

      <FieldRow>
        <FieldGroup style={{ flex: 1 }}>
          <Label>Brand <Optional>(Optional)</Optional></Label>
          <Input {...register("brand")} placeholder="e.g., Samsung, Apple, Nike" />
          <HelperText>Product brand or manufacturer name</HelperText>
        </FieldGroup>
        <FieldGroup style={{ flex: 1 }}>
          <Label>Manufacturer <Optional>(Optional)</Optional></Label>
          <Input {...register("manufacturer")} placeholder="e.g., Sony Corporation" />
          <HelperText>Company that manufactured the product</HelperText>
        </FieldGroup>
      </FieldRow>

      <FieldRow>
        <FieldGroup style={{ flex: 1 }}>
          <Label>Warranty <Optional>(Optional)</Optional></Label>
          <Input {...register("warranty")} placeholder="e.g., 1 year, 2 years, 6 months" />
          <HelperText>Warranty period offered with this product</HelperText>
        </FieldGroup>

        <FieldGroup style={{ flex: 1 }}>
          <Label>
            Return / Refund Window (days) <Required>*</Required>
          </Label>
          <Input
            type="number"
            min={0}
            max={365}
            step={1}
            {...register("returnWindowDays", {
              required: "Please specify the refund/return window in days",
              min: { value: 0, message: "Return window cannot be negative" },
              max: { value: 365, message: "Return window cannot exceed 365 days" },
              valueAsNumber: true,
            })}
            placeholder="e.g., 30"
            $hasError={!!errors?.returnWindowDays}
          />
          {errors?.returnWindowDays && (
            <ErrorMessage>{errors.returnWindowDays.message}</ErrorMessage>
          )}
          <HelperText>
            Number of days a buyer can request a return/refund for this product.
          </HelperText>
        </FieldGroup>
      </FieldRow>
    </div>
  );
};
export default BasicSection;

const FieldGroup = styled.div` margin-bottom: 1.5rem; `;
const FieldRow = styled.div`
  display: flex;
  gap: 1.5rem;
  @media (max-width: 768px) { flex-direction: column; gap: 1rem; }
`;
const Label = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-weight: 400;
  color: #1e293b;
  font-size: 1.0625rem;
`;
const Required = styled.span` color: #ef4444; font-weight: 500; margin-left: 0.25rem; `;
const Optional = styled.span` color: #64748b; font-weight: 400; font-size: 0.9375rem; margin-left: 0.25rem; `;
const CharCount = styled.span`
  font-size: 0.875rem;
  color: ${({ $warning }) => ($warning ? '#ef4444' : '#64748b')};
  font-weight: 400;
`;
const HelperText = styled.p` margin: 0.375rem 0 0 0; font-size: 0.9375rem; color: #64748b; line-height: 1.4; `;
const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1.5px solid ${props => props.$hasError ? '#e53e3e' : '#e2e8f0'};
  border-radius: 8px;
  font-size: 1.0625rem;
  color: #1e293b;
  background: #ffffff;
  transition: all 0.2s ease;
  min-height: 44px;
  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#e53e3e' : 'var(--color-primary-500, #2563eb)'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(229, 62, 62, 0.1)' : 'rgba(37, 99, 235, 0.1)'};
  }
  &::placeholder { color: #94a3b8; }
`;
const Select = styled.select`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1.5px solid ${props => props.$hasError ? '#e53e3e' : '#e2e8f0'};
  border-radius: 8px;
  font-size: 1.0625rem;
  color: #1e293b;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#e53e3e' : 'var(--color-primary-500, #2563eb)'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(229, 62, 62, 0.1)' : 'rgba(37, 99, 235, 0.1)'};
  }
`;
const TextArea = styled.textarea`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1.0625rem;
  color: #1e293b;
  background: #ffffff;
  min-height: 120px;
  resize: vertical;
  transition: all 0.2s ease;
  font-family: inherit;
  line-height: 1.6;
  &:focus {
    outline: none;
    border-color: var(--color-primary-500, #2563eb);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  &::placeholder { color: #94a3b8; }
`;
const ErrorMessage = styled.span`
  display: block;
  margin-top: 0.5rem;
  color: #e53e3e;
  font-size: 0.875rem;
  font-weight: 400;
  padding: 0.5rem;
  background: #fed7d7;
  border-radius: 4px;
  border-left: 3px solid #e53e3e;
`;
