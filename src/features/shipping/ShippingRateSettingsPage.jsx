import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGetShippingRate, useUpdateShippingRate } from '../../hooks/useShipping';
import { FaPercentage, FaSave, FaExclamationCircle } from 'react-icons/fa';
import Button from '../../components/ui/Button';

export default function ShippingRateSettingsPage({ embedded = false }) {
  const { data: currentRateData, isLoading } = useGetShippingRate();
  const updateRateMutation = useUpdateShippingRate();

  const currentRate = currentRateData?.data?.platformCutPercentage || 0;

  const [percentage, setPercentage] = useState('');

  useEffect(() => {
    if (currentRateData?.data) {
      setPercentage(currentRateData.data.platformCutPercentage.toString());
    }
  }, [currentRateData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numValue = Number(percentage);

    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      return; // Validation handled by input attributes, but double check
    }

    await updateRateMutation.mutateAsync({ platformCutPercentage: numValue });
  };

  if (isLoading) {
    return (
      <Container>
        <p>Loading settings...</p>
      </Container>
    );
  }

  const content = (
    <SettingsCard $embedded={embedded}>
      <CurrentRateInfo>
        <InfoIcon><FaExclamationCircle /></InfoIcon>
        <InfoText>
          <strong>Current active platform cut: {currentRate}%</strong>
          <br />
          This percentage is automatically deducted from the total shipping fee paid by the buyer. The remainder goes to the dispatcher.
        </InfoText>
      </CurrentRateInfo>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="platformCut">Platform Cut Percentage (%)</Label>
          <InputWrapper>
            <Input
              id="platformCut"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              required
            />
            <InputAddon>%</InputAddon>
          </InputWrapper>
          <HelpText>Enter a value between 0 and 100</HelpText>
        </FormGroup>

        <Button
          type="submit"
          variant="primary"
          disabled={updateRateMutation.isPending || percentage === currentRate.toString()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FaSave />
          {updateRateMutation.isPending ? 'Saving...' : 'Update Rate'}
        </Button>
      </Form>
    </SettingsCard>
  );

  if (embedded) {
    return content;
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaPercentage /> Shipping Rate Settings
        </Title>
        <Description>Configure the platform's percentage cut on all shipping charges</Description>
      </Header>
      {content}
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  color: #7f8c8d;
  font-size: 1rem;
`;

const SettingsCard = styled.div`
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: ${props => props.$embedded ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.05)'};
  border: ${props => props.$embedded ? '1px solid #e2e8f0' : 'none'};
  max-width: 600px;
`;

const CurrentRateInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background-color: #ebf5ff;
  border-left: 4px solid #3b82f6;
  border-radius: 4px;
  margin-bottom: 2rem;
`;

const InfoIcon = styled.div`
  color: #3b82f6;
  font-size: 1.25rem;
  margin-top: 0.125rem;
`;

const InfoText = styled.p`
  color: #1e3a8a;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
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
  color: #2c3e50;
  font-size: 0.95rem;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  max-width: 300px;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const InputAddon = styled.div`
  position: absolute;
  right: 1rem;
  color: #64748b;
  font-weight: 600;
`;

const HelpText = styled.span`
  font-size: 0.85rem;
  color: #64748b;
`;
