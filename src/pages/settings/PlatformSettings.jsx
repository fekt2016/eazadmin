import { useState, useEffect } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import {
  usePlatformSettings,
  useUpdatePlatformSettings,
  usePlatformSettingsAuditLogs,
} from "../../shared/hooks/usePlatformSettings";
import { FaSave, FaHistory, FaCog } from "react-icons/fa";

export default function PlatformSettings() {
  const { data: settings, isLoading, error } = usePlatformSettings();
  const updateMutation = useUpdatePlatformSettings();
  const [page, setPage] = useState(1);
  const { data: auditLogsData, isLoading: isLoadingLogs } = usePlatformSettingsAuditLogs(page, 50);

  // Form state
  const [formData, setFormData] = useState({
    vatRate: 0.125,
    nhilRate: 0.025,
    getfundRate: 0.025,
    covidLevyRate: 0.01,
    withholdingIndividual: 0.03,
    withholdingCompany: 0.15,
    platformCommissionRate: 0,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        vatRate: settings.vatRate ?? 0.125,
        nhilRate: settings.nhilRate ?? 0.025,
        getfundRate: settings.getfundRate ?? 0.025,
        covidLevyRate: settings.covidLevyRate ?? 0.01,
        withholdingIndividual: settings.withholdingIndividual ?? 0.03,
        withholdingCompany: settings.withholdingCompany ?? 0.15,
        platformCommissionRate: settings.platformCommissionRate ?? 0,
      });
      setHasChanges(false);
    }
  }, [settings]);

  // Track changes
  useEffect(() => {
    if (settings) {
      const changed = Object.keys(formData).some(
        (key) => formData[key] !== settings[key]
      );
      setHasChanges(changed);
    }
  }, [formData, settings]);

  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0 || numValue > 1) {
      toast.error(`${field} must be between 0 and 1 (0% to 100%)`);
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleSave = () => {
    setShowConfirmModal(true);
  };

  const confirmSave = () => {
    const updates = {};
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== settings[key]) {
        updates[key] = formData[key];
      }
    });

    updateMutation.mutate(updates, {
      onSuccess: (data) => {
        toast.success("Platform settings updated successfully!");
        setShowConfirmModal(false);
        setHasChanges(false);
      },
      onError: (error) => {
        const message =
          error.response?.data?.message ||
          "Failed to update platform settings";
        toast.error(message);
        setShowConfirmModal(false);
      },
    });
  };

  const formatPercentage = (value) => ((value || 0) * 100).toFixed(2);

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>
          Failed to load platform settings. Please try again.
        </ErrorMessage>
      </Container>
    );
  }

  const auditLogs = auditLogsData?.auditLogs || [];
  const pagination = auditLogsData?.pagination || {};

  return (
    <Container>
      <Header>
        <Title>
          <FaCog />
          Platform Settings
        </Title>
        <Subtitle>Manage tax rates, fees, and platform configuration</Subtitle>
      </Header>

      {/* VAT Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>VAT Settings</CardTitle>
          <CardDescription>
            Configure Value Added Tax (VAT) components according to Ghana GRA rules
          </CardDescription>
        </CardHeader>
        <CardBody>
          <FormGrid>
            <FormGroup>
              <Label>
                VAT Rate <Required>*</Required>
              </Label>
              <InputGroup>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={formData.vatRate}
                  onChange={(e) =>
                    handleInputChange("vatRate", e.target.value)
                  }
                />
                <Suffix>% ({formatPercentage(formData.vatRate)}%)</Suffix>
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <Label>
                NHIL Rate <Required>*</Required>
              </Label>
              <InputGroup>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={formData.nhilRate}
                  onChange={(e) =>
                    handleInputChange("nhilRate", e.target.value)
                  }
                />
                <Suffix>% ({formatPercentage(formData.nhilRate)}%)</Suffix>
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <Label>
                GETFund Rate <Required>*</Required>
              </Label>
              <InputGroup>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={formData.getfundRate}
                  onChange={(e) =>
                    handleInputChange("getfundRate", e.target.value)
                  }
                />
                <Suffix>% ({formatPercentage(formData.getfundRate)}%)</Suffix>
              </InputGroup>
            </FormGroup>
          </FormGrid>
        </CardBody>
      </Card>

      {/* COVID Levy Card */}
      <Card>
        <CardHeader>
          <CardTitle>COVID Levy</CardTitle>
          <CardDescription>
            COVID-19 Health Recovery Levy (added on top of VAT-inclusive price)
          </CardDescription>
        </CardHeader>
        <CardBody>
          <FormGroup>
            <Label>
              COVID Levy Rate <Required>*</Required>
            </Label>
            <InputGroup>
              <Input
                type="number"
                step="0.001"
                min="0"
                max="1"
                value={formData.covidLevyRate}
                onChange={(e) =>
                  handleInputChange("covidLevyRate", e.target.value)
                }
              />
              <Suffix>% ({formatPercentage(formData.covidLevyRate)}%)</Suffix>
            </InputGroup>
          </FormGroup>
        </CardBody>
      </Card>

      {/* Withholding Tax Card */}
      <Card>
        <CardHeader>
          <CardTitle>Withholding Tax Rates</CardTitle>
          <CardDescription>
            Tax rates applied to seller withdrawals based on tax category
          </CardDescription>
        </CardHeader>
        <CardBody>
          <FormGrid>
            <FormGroup>
              <Label>
                Individual Sellers <Required>*</Required>
              </Label>
              <InputGroup>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={formData.withholdingIndividual}
                  onChange={(e) =>
                    handleInputChange("withholdingIndividual", e.target.value)
                  }
                />
                <Suffix>
                  % ({formatPercentage(formData.withholdingIndividual)}%)
                </Suffix>
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <Label>
                Company Sellers <Required>*</Required>
              </Label>
              <InputGroup>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={formData.withholdingCompany}
                  onChange={(e) =>
                    handleInputChange("withholdingCompany", e.target.value)
                  }
                />
                <Suffix>
                  % ({formatPercentage(formData.withholdingCompany)}%)
                </Suffix>
              </InputGroup>
            </FormGroup>
          </FormGrid>
        </CardBody>
      </Card>

      {/* Platform Commission Card */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Fees</CardTitle>
          <CardDescription>
            Platform commission rate applied to seller earnings
          </CardDescription>
        </CardHeader>
        <CardBody>
          <FormGroup>
            <Label>
              Platform Commission Rate <Required>*</Required>
            </Label>
            <InputGroup>
              <Input
                type="number"
                step="0.001"
                min="0"
                max="1"
                value={formData.platformCommissionRate}
                onChange={(e) =>
                  handleInputChange("platformCommissionRate", e.target.value)
                }
              />
              <Suffix>
                % ({formatPercentage(formData.platformCommissionRate)}%)
              </Suffix>
            </InputGroup>
          </FormGroup>
        </CardBody>
      </Card>

      {/* Save Button */}
      <ActionBar>
        <SaveButton
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isLoading || updateMutation.isPending}
        >
          {(updateMutation.isLoading || updateMutation.isPending) ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FaSave />
              <span>Save Changes</span>
            </>
          )}
        </SaveButton>
        {hasChanges && (
          <WarningText>
            You have unsaved changes. Click "Save Changes" to apply them.
          </WarningText>
        )}
      </ActionBar>

      {/* Change History Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <FaHistory /> Change History
          </CardTitle>
          <CardDescription>
            Audit log of all platform settings changes
          </CardDescription>
        </CardHeader>
        <CardBody>
          {isLoadingLogs ? (
            <LoadingSpinner />
          ) : auditLogs.length === 0 ? (
            <EmptyState>No changes recorded yet.</EmptyState>
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Before</th>
                    <th>After</th>
                    <th>Admin</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <FieldName>{log.fieldUpdated}</FieldName>
                      </td>
                      <td>
                        {typeof log.beforeValue === "number"
                          ? `${formatPercentage(log.beforeValue)}%`
                          : log.beforeValue}
                      </td>
                      <td>
                        {typeof log.afterValue === "number"
                          ? `${formatPercentage(log.afterValue)}%`
                          : log.afterValue}
                      </td>
                      <td>
                        {log.adminId?.name || log.adminId?.email || "N/A"}
                      </td>
                      <td>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {pagination.totalPages > 1 && (
                <Pagination>
                  <PaginationButton
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </PaginationButton>
                  <PageInfo>
                    Page {pagination.currentPage || page} of{" "}
                    {pagination.totalPages}
                  </PageInfo>
                  <PaginationButton
                    onClick={() =>
                      setPage((p) =>
                        Math.min(pagination.totalPages, p + 1)
                      )
                    }
                    disabled={page >= pagination.totalPages}
                  >
                    Next
                  </PaginationButton>
                </Pagination>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ModalOverlay onClick={() => setShowConfirmModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Confirm Changes</ModalTitle>
            <ModalText>
              Are you sure you want to save these changes? This will affect all
              new orders and withdrawals going forward.
            </ModalText>
            <ModalActions>
              <ModalButton
                variant="secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </ModalButton>
              <ModalButton variant="primary" onClick={confirmSave}>
                Confirm & Save
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-grey-900);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: var(--color-grey-600);
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-grey-200);
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-grey-900);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardDescription = styled.p`
  font-size: 0.875rem;
  color: var(--color-grey-600);
`;

const CardBody = styled.div`
  padding: 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-grey-700);
`;

const Required = styled.span`
  color: #ef4444;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--color-grey-300);
  border-radius: 6px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const Suffix = styled.span`
  font-size: 0.875rem;
  color: var(--color-grey-600);
  white-space: nowrap;
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--color-grey-50);
  border-radius: 8px;
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #1d4ed8;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`;

const WarningText = styled.p`
  font-size: 0.875rem;
  color: #f59e0b;
  font-weight: 500;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;

  thead {
    background: var(--color-grey-50);
  }

  th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-grey-700);
    border-bottom: 2px solid var(--color-grey-200);
  }

  td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-grey-200);
    font-size: 0.875rem;
  }

  tr:hover {
    background: var(--color-grey-50);
  }
`;

const FieldName = styled.span`
  font-weight: 500;
  color: var(--color-grey-900);
  text-transform: capitalize;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--color-grey-500);
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-grey-300);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--color-grey-50);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  font-size: 0.875rem;
  color: var(--color-grey-600);
`;

const ErrorMessage = styled.div`
  padding: 2rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  text-align: center;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const ModalText = styled.p`
  color: var(--color-grey-600);
  margin-bottom: 1.5rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${({ variant }) =>
    variant === "primary"
      ? `
    background: #2563eb;
    color: white;
    border: none;
    &:hover {
      background: #1d4ed8;
    }
  `
      : `
    background: white;
    color: var(--color-grey-700);
    border: 1px solid var(--color-grey-300);
    &:hover {
      background: var(--color-grey-50);
    }
  `}
`;

