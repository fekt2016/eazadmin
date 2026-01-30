import styled from "styled-components";
import { useState, useEffect } from "react";
import { FaSave, FaInfoCircle } from "react-icons/fa";
import { useEazShop } from "../../shared/hooks/useEazShop";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import { toast } from "react-toastify";

export default function EazShopShippingFeesPage() {
  const { useGetEazShopShippingFees, useUpdateEazShopShippingFees } = useEazShop();
  const { data: feesData, isLoading, error } = useGetEazShopShippingFees();
  const updateMutation = useUpdateEazShopShippingFees();

  const fees = feesData?.data?.fees || feesData || null;

  const [formData, setFormData] = useState({
    sameCity: 0,
    crossCity: 0,
    heavyItem: 0,
    freeDeliveryThreshold: 0,
  });

  // Update form data when fees are loaded
  useEffect(() => {
    if (fees) {
      setFormData({
        sameCity: fees.sameCity || 0,
        crossCity: fees.crossCity || 0,
        heavyItem: fees.heavyItem || 0,
        freeDeliveryThreshold: fees.freeDeliveryThreshold || 0,
      });
    }
  }, [fees]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(formData);
      toast.success("Shipping fees updated successfully!");
    } catch (error) {
      toast.error("Failed to update shipping fees: " + (error.message || "Unknown error"));
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorContainer>Error: {error.message}</ErrorContainer>;

  return (
    <DashboardContainer>
      <Header>
        <TitleContainer>
          <Title>Saiisai Shipping Fees</Title>
          <Subtitle>Manage shipping fees for Saiisai official store</Subtitle>
        </TitleContainer>
      </Header>

      <FormContainer>
        <Form onSubmit={handleSubmit}>
          <FormSection>
            <SectionTitle>Delivery Fees</SectionTitle>
            <SectionDescription>
              Set the base shipping fees for different delivery scenarios
            </SectionDescription>

            <FormGroup>
              <Label>
                Same City Delivery (₵)
                <InfoIcon title="Fee for deliveries within the same city (e.g., Accra to Accra)">
                  <FaInfoCircle />
                </InfoIcon>
              </Label>
              <Input
                type="number"
                name="sameCity"
                value={formData.sameCity}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              <HintText>Fee charged for deliveries within the same city</HintText>
            </FormGroup>

            <FormGroup>
              <Label>
                Cross City Delivery (₵)
                <InfoIcon title="Fee for deliveries between different cities (e.g., Accra to Tema)">
                  <FaInfoCircle />
                </InfoIcon>
              </Label>
              <Input
                type="number"
                name="crossCity"
                value={formData.crossCity}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              <HintText>Fee charged for deliveries between different cities</HintText>
            </FormGroup>

            <FormGroup>
              <Label>
                Heavy Item Fee (₵)
                <InfoIcon title="Additional fee for heavy items (weight-based)">
                  <FaInfoCircle />
                </InfoIcon>
              </Label>
              <Input
                type="number"
                name="heavyItem"
                value={formData.heavyItem}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              <HintText>Additional fee per kg for heavy items</HintText>
            </FormGroup>
          </FormSection>

          <FormSection>
            <SectionTitle>Free Delivery</SectionTitle>
            <SectionDescription>
              Set the minimum order amount for free delivery
            </SectionDescription>

            <FormGroup>
              <Label>
                Free Delivery Threshold (₵)
                <InfoIcon title="Orders above this amount qualify for free delivery">
                  <FaInfoCircle />
                </InfoIcon>
              </Label>
              <Input
                type="number"
                name="freeDeliveryThreshold"
                value={formData.freeDeliveryThreshold}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              <HintText>
                Orders above this amount will receive free delivery
              </HintText>
            </FormGroup>
          </FormSection>

          <ButtonGroup>
            <SaveButton
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <LoadingSpinner size="small" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  Save Changes
                </>
              )}
            </SaveButton>
          </ButtonGroup>
        </Form>
      </FormContainer>
    </DashboardContainer>
  );
}

// Styled Components
const DashboardContainer = styled.div`
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const TitleContainer = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
`;

const FormContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
`;

const Form = styled.form`
  max-width: 800px;
`;

const FormSection = styled.div`
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;

  &:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
`;

const SectionDescription = styled.p`
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 1.5rem 0;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
`;

const InfoIcon = styled.span`
  color: #64748b;
  cursor: help;
  font-size: 0.9rem;
  transition: color 0.2s;

  &:hover {
    color: #6366f1;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  color: #334155;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &:disabled {
    background-color: #f1f5f9;
    cursor: not-allowed;
  }
`;

const HintText = styled.p`
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0.5rem 0 0 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorContainer = styled.div`
  padding: 2rem;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  margin: 2rem;
`;

