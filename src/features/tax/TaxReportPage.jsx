import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import {
  FaFileInvoiceDollar,
  FaSync,
  FaSave,
  FaHistory,
  FaCog,
} from "react-icons/fa";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import api from "../../shared/services/api";
import { toast } from "react-toastify";
import {
  usePlatformSettings,
  useUpdatePlatformSettings,
  usePlatformSettingsAuditLogs,
} from "../../shared/hooks/usePlatformSettings";

const formatCurrency = (amount) =>
  `GH₵${(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPercentage = (value) => ((value || 0) * 100).toFixed(2);

const TaxReportPage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [settingsPage, setSettingsPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: settings, isLoading: settingsLoading, error: settingsError } = usePlatformSettings();
  const updateMutation = useUpdatePlatformSettings();
  const { data: auditLogsData, isLoading: isLoadingLogs } =
    usePlatformSettingsAuditLogs(settingsPage, 50);

  const [formData, setFormData] = useState({
    vatRate: 0.125,
    nhilRate: 0.025,
    getfundRate: 0.025,
    platformCommissionRate: 0,
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        vatRate: settings.vatRate ?? 0.125,
        nhilRate: settings.nhilRate ?? 0.025,
        getfundRate: settings.getfundRate ?? 0.025,
        platformCommissionRate: settings.platformCommissionRate ?? 0,
      });
      setHasChanges(false);
    }
  }, [settings]);

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

  const confirmSave = () => {
    const updates = {};
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== settings[key]) {
        updates[key] = formData[key];
      }
    });
    updateMutation.mutate(updates, {
      onSuccess: () => {
        toast.success("Tax and platform settings updated successfully.");
        setShowConfirmModal(false);
        setHasChanges(false);
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || "Failed to update settings.");
        setShowConfirmModal(false);
      },
    });
  };

  const {
    data,
    isLoading: summaryLoading,
    error: summaryError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-tax-vat-summary", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await api.get(`/admin/tax/vat-summary?${params}`);
      return res.data;
    },
  });

  const summary = data?.summary ?? null;
  const bySeller = data?.breakdown?.bySeller ?? [];
  const period = data?.period ?? {};
  const auditLogs = auditLogsData?.auditLogs || [];
  const pagination = auditLogsData?.pagination || {};

  if (summaryError) {
    toast.error(summaryError?.response?.data?.message || "Failed to load VAT summary");
  }

  const isLoading = settingsLoading;
  const showReport = !settingsError && summary !== null;

  return (
    <PageContainer>
      <PageHeader>
        <Title>
          <FaFileInvoiceDollar />
          Tax & VAT
        </Title>
        <Subtitle>
          Configure tax rates, platform fees, and view VAT collected and withheld.
        </Subtitle>
      </PageHeader>

      {/* ---------- Platform settings (rates) ---------- */}
      {settingsError ? (
        <ErrorMessage>Failed to load settings. Please try again.</ErrorMessage>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                <FaCog /> VAT Settings
              </CardTitle>
              <CardDescription>
                VAT, NHIL & GETFund rates (Ghana GRA). Used for product prices and orders.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <RatesTable>
                <thead>
                  <tr>
                    <th>Tax</th>
                    <th>Rate (decimal)</th>
                    <th>Rate (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>VAT</td>
                    <td>{formData.vatRate}</td>
                    <td>{formatPercentage(formData.vatRate)}%</td>
                  </tr>
                  <tr>
                    <td>NHIL</td>
                    <td>{formData.nhilRate}</td>
                    <td>{formatPercentage(formData.nhilRate)}%</td>
                  </tr>
                  <tr>
                    <td>GETFund</td>
                    <td>{formData.getfundRate}</td>
                    <td>{formatPercentage(formData.getfundRate)}%</td>
                  </tr>
                </tbody>
              </RatesTable>
              <FormGrid>
                <FormGroup>
                  <Label>VAT Rate <Required>*</Required></Label>
                  <InputGroup>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      value={formData.vatRate}
                      onChange={(e) => handleInputChange("vatRate", e.target.value)}
                    />
                    <Suffix>% ({formatPercentage(formData.vatRate)}%)</Suffix>
                  </InputGroup>
                </FormGroup>
                <FormGroup>
                  <Label>NHIL Rate <Required>*</Required></Label>
                  <InputGroup>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      value={formData.nhilRate}
                      onChange={(e) => handleInputChange("nhilRate", e.target.value)}
                    />
                    <Suffix>% ({formatPercentage(formData.nhilRate)}%)</Suffix>
                  </InputGroup>
                </FormGroup>
                <FormGroup>
                  <Label>GETFund Rate <Required>*</Required></Label>
                  <InputGroup>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      value={formData.getfundRate}
                      onChange={(e) => handleInputChange("getfundRate", e.target.value)}
                    />
                    <Suffix>% ({formatPercentage(formData.getfundRate)}%)</Suffix>
                  </InputGroup>
                </FormGroup>
              </FormGrid>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Fees</CardTitle>
              <CardDescription>
                Commission rate applied to seller earnings.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <FormGroup>
                <Label>Platform Commission Rate <Required>*</Required></Label>
                <InputGroup>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={formData.platformCommissionRate}
                    onChange={(e) => handleInputChange("platformCommissionRate", e.target.value)}
                  />
                  <Suffix>% ({formatPercentage(formData.platformCommissionRate)}%)</Suffix>
                </InputGroup>
              </FormGroup>
            </CardBody>
          </Card>

          <ActionBar>
            <SaveButton
              onClick={() => setShowConfirmModal(true)}
              disabled={!hasChanges || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
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
              <WarningText>You have unsaved changes. Click Save to apply.</WarningText>
            )}
          </ActionBar>

          <Card>
            <CardHeader>
              <CardTitle><FaHistory /> Change History</CardTitle>
              <CardDescription>Audit log of tax and platform settings changes.</CardDescription>
            </CardHeader>
            <CardBody>
              {isLoadingLogs ? (
                <LoadingSpinner />
              ) : auditLogs.length === 0 ? (
                <EmptyState>No changes recorded yet.</EmptyState>
              ) : (
                <>
                  <AuditTable>
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
                          <td><FieldName>{log.fieldUpdated}</FieldName></td>
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
                          <td>{log.adminId?.name || log.adminId?.email || "N/A"}</td>
                          <td>{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </AuditTable>
                  {pagination.totalPages > 1 && (
                    <Pagination>
                      <PaginationButton
                        onClick={() => setSettingsPage((p) => Math.max(1, p - 1))}
                        disabled={settingsPage === 1}
                      >
                        Previous
                      </PaginationButton>
                      <PageInfo>
                        Page {pagination.currentPage || settingsPage} of {pagination.totalPages}
                      </PageInfo>
                      <PaginationButton
                        onClick={() =>
                          setSettingsPage((p) => Math.min(pagination.totalPages, p + 1))
                        }
                        disabled={settingsPage >= pagination.totalPages}
                      >
                        Next
                      </PaginationButton>
                    </Pagination>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* ---------- VAT Report ---------- */}
      <ReportSection>
        <SectionTitle>VAT Report</SectionTitle>
        <Toolbar>
          <Filters>
            <FilterGroup>
              <label>From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FilterGroup>
            <FilterGroup>
              <label>To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FilterGroup>
          </Filters>
          <RefreshButton onClick={() => refetch()} disabled={isFetching} title="Refresh">
            <FaSync className={isFetching ? "spin" : ""} />
            Refresh
          </RefreshButton>
        </Toolbar>

        {summaryLoading ? (
          <LoadingSpinner />
        ) : showReport ? (
          <>
            <SummaryGrid>
              <SummaryCard>
                <SummaryLabel>Total sales (VAT inclusive)</SummaryLabel>
                <SummaryValue>{formatCurrency(summary.totalSales)}</SummaryValue>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>Total base (excl. VAT)</SummaryLabel>
                <SummaryValue>{formatCurrency(summary.totalBasePrice)}</SummaryValue>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>Total VAT</SummaryLabel>
                <SummaryValue>{formatCurrency(summary.totalVAT)}</SummaryValue>
              </SummaryCard>
              <SummaryCard highlight>
                <SummaryLabel>VAT withheld by platform</SummaryLabel>
                <SummaryValue>{formatCurrency(summary.vatWithheldByPlatform)}</SummaryValue>
                <SummaryHint>From non–VAT-registered sellers (deducted from payouts)</SummaryHint>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>NHIL</SummaryLabel>
                <SummaryValue>{formatCurrency(summary.totalNHIL)}</SummaryValue>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>GETFund</SummaryLabel>
                <SummaryValue>{formatCurrency(summary.totalGETFund)}</SummaryValue>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>Total tax</SummaryLabel>
                <SummaryValue>{formatCurrency(summary.totalTax)}</SummaryValue>
              </SummaryCard>
              <SummaryCard>
                <SummaryLabel>Orders</SummaryLabel>
                <SummaryValue>{summary.orderCount ?? 0}</SummaryValue>
              </SummaryCard>
            </SummaryGrid>

            {summary.totalWithholdingCollected != null && (
              <WithholdingSection>
                <SectionTitle>Withholding tax (withdrawals)</SectionTitle>
                <WithholdingRow>
                  <span>Collected</span>
                  <strong>{formatCurrency(summary.totalWithholdingCollected)}</strong>
                </WithholdingRow>
                <WithholdingRow>
                  <span>Remitted</span>
                  <strong>{formatCurrency(summary.totalWithholdingRemitted)}</strong>
                </WithholdingRow>
                <WithholdingRow>
                  <span>Unremitted</span>
                  <strong>{formatCurrency(summary.totalWithholdingUnremitted)}</strong>
                </WithholdingRow>
              </WithholdingSection>
            )}

            {bySeller.length > 0 && (
              <Section>
                <SectionTitle>By seller</SectionTitle>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <th>Seller</th>
                        <th>Sales</th>
                        <th>VAT</th>
                        <th>VAT collected by</th>
                        <th>VAT withheld</th>
                        <th>Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bySeller.map((s) => (
                        <tr key={s.sellerId}>
                          <td>{s.sellerName || s.sellerId}</td>
                          <td>{formatCurrency(s.totalSales)}</td>
                          <td>{formatCurrency(s.totalVAT)}</td>
                          <td>
                            <VatBadge $by={s.vatCollectedBy || "platform"}>
                              {s.vatCollectedBy === "seller" ? "Seller" : "Platform"}
                            </VatBadge>
                          </td>
                          <td>{formatCurrency(s.vatWithheld)}</td>
                          <td>{s.orderCount ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </Section>
            )}

            {(period.startDate || period.endDate) && (
              <PeriodNote>
                Period:{" "}
                {period.startDate ? new Date(period.startDate).toLocaleDateString() : "—"} to{" "}
                {period.endDate ? new Date(period.endDate).toLocaleDateString() : "—"}
              </PeriodNote>
            )}
          </>
        ) : (
          <EmptyState>No tax data for the selected period.</EmptyState>
        )}
      </ReportSection>

      {showConfirmModal && (
        <ModalOverlay onClick={() => setShowConfirmModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Confirm Changes</ModalTitle>
            <ModalText>
              Save these tax and platform settings? They will apply to new orders and withdrawals.
            </ModalText>
            <ModalActions>
              <ModalButton variant="secondary" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </ModalButton>
              <ModalButton variant="primary" onClick={confirmSave}>
                Confirm & Save
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default TaxReportPage;

// ---------- Styles ----------
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.header`
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin-top: 0.25rem;
  font-size: 0.9375rem;
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
  border-bottom: 1px solid #e5e7eb;
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
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
  color: #374151;
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
  border: 1px solid #d1d5db;
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
  color: #6b7280;
  white-space: nowrap;
`;

const RatesTable = styled.table`
  width: 100%;
  max-width: 400px;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  thead { background: #f9fafb; }
  th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
  }
  td {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
  }
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f9fafb;
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
  &:hover:not(:disabled) { background: #1d4ed8; }
  &:disabled { opacity: 0.5; cursor: wait; }
`;

const WarningText = styled.p`
  font-size: 0.875rem;
  color: #f59e0b;
  font-weight: 500;
`;

const AuditTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  thead { background: #f3f4f6; }
  th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
  }
  td {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
  }
`;

const FieldName = styled.span`
  font-weight: 500;
  color: #111827;
  text-transform: capitalize;
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
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  &:hover:not(:disabled) { background: #f9fafb; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const PageInfo = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  padding: 2rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 2rem;
`;

const ReportSection = styled.section`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  color: #374151;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const Filters = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  label { font-size: 0.75rem; color: #6b7280; }
  input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  &:disabled { opacity: 0.7; cursor: not-allowed; }
  .spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const SummaryCard = styled.div`
  padding: 1rem;
  background: ${(p) => (p.highlight ? "#eff6ff" : "#f9fafb")};
  border-radius: 8px;
  border: 1px solid ${(p) => (p.highlight ? "#93c5fd" : "#e5e7eb")};
`;

const SummaryLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const SummaryValue = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
`;

const SummaryHint = styled.div`
  font-size: 0.7rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const WithholdingSection = styled.section`
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  max-width: 400px;
`;

const WithholdingRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.875rem;
  strong { color: #111827; }
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }
  th {
    background: #f3f4f6;
    font-weight: 600;
    color: #374151;
  }
  tbody tr:last-child td { border-bottom: none; }
`;

const VatBadge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${(p) => (p.$by === "seller" ? "#d1fae5" : "#fef3c7")};
  color: ${(p) => (p.$by === "seller" ? "#065f46" : "#92400e")};
`;

const PeriodNote = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 1rem;
`;

const EmptyState = styled.p`
  color: #6b7280;
  padding: 2rem;
  text-align: center;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
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
  color: #6b7280;
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
  ${({ variant }) =>
    variant === "primary"
      ? `
    background: #2563eb;
    color: white;
    border: none;
    &:hover { background: #1d4ed8; }
  `
      : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    &:hover { background: #f9fafb; }
  `}
`;
