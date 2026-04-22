import { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useMutation } from '@tanstack/react-query';
import { FaTools, FaSearch, FaPlay, FaCheckCircle } from 'react-icons/fa';
import { orderService } from '../../shared/services/orderApi';
import {
  PageHeader,
  PageTitle,
  PageSub,
} from '../../shared/components/page/PageHeader';

const T = {
  bodyBg: 'var(--color-body-bg)',
};

/**
 * Which tax reconciliation actions are allowed for this order (matches backend rules).
 */
function computeTaxEligibilityFromSnapshot(amountSnapshot) {
  const rows = amountSnapshot?.sellerOrders || [];
  const elig = {
    tax_addback: false,
    tax_vat_addback: false,
    tax_vat_deduct: false,
    tax_nhil_addback: false,
    tax_nhil_deduct: false,
    tax_getfund_addback: false,
    tax_getfund_deduct: false,
  };
  for (const row of rows) {
    const platform = row.vatCollectedBy === 'platform';
    const vat = Number(row.totalVAT ?? row.sellerTaxes?.totalVAT ?? 0);
    const nhil = Number(row.totalNHIL ?? row.sellerTaxes?.totalNHIL ?? 0);
    const getfund = Number(row.totalGETFund ?? row.sellerTaxes?.totalGETFund ?? 0);
    const totalTax = Number(
      row.totalTax ?? row.sellerTaxes?.totalTax ?? vat + nhil + getfund,
    );
    if (platform && vat > 0) {
      elig.tax_vat_addback = true;
      elig.tax_vat_deduct = true;
    }
    if (platform && nhil > 0) {
      elig.tax_nhil_addback = true;
      elig.tax_nhil_deduct = true;
    }
    if (platform && getfund > 0) {
      elig.tax_getfund_addback = true;
      elig.tax_getfund_deduct = true;
    }
    if (platform && totalTax > 0) {
      elig.tax_addback = true;
    }
  }
  return elig;
}

function extractAmountSnapshot(apiPayload) {
  return apiPayload?.data?.data?.amountSnapshot ?? null;
}

const TAX_RECON_TYPES = new Set([
  'tax_addback',
  'tax_vat_addback',
  'tax_vat_deduct',
  'tax_nhil_addback',
  'tax_nhil_deduct',
  'tax_getfund_addback',
  'tax_getfund_deduct',
]);

const SellerCreditReconciliationPage = () => {
  const [bulkLimit, setBulkLimit] = useState('100');
  const [singleOrderId, setSingleOrderId] = useState('');
  const [singleReconciliationType, setSingleReconciliationType] = useState(
    'missing_credit_tx'
  );
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentSellerId, setAdjustmentSellerId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [taxEligibility, setTaxEligibility] = useState(null);
  const [taxPreviewLoading, setTaxPreviewLoading] = useState(false);
  const previewTimerRef = useRef(null);
  const previewOrderIdRef = useRef('');

  const bulkMutation = useMutation({
    mutationFn: ({ dryRun }) =>
      orderService.reconcileSellerCredits({
        limit: Number(bulkLimit) || 100,
        dryRun,
      }),
    onSuccess: (data) => {
      setError('');
      setResult(data);
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || err?.message || 'Bulk reconciliation failed.';
      setError(message);
      setResult(null);
    },
  });

  const singleMutation = useMutation({
    mutationFn: ({ dryRun }) =>
      orderService.reconcileSingleSellerCreditByIdentifier(singleOrderId.trim(), {
        dryRun,
        reconciliationType: singleReconciliationType,
        ...(singleReconciliationType === 'seller_amount_adjustment' && {
          adjustmentAmount: Number(adjustmentAmount) || 0,
          sellerId: adjustmentSellerId.trim() || undefined,
        }),
      }),
    onSuccess: (data) => {
      setError('');
      setResult(data);
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || err?.message || 'Single-order reconciliation failed.';
      setError(message);
      setResult(null);
    },
  });

  const taxElig = useMemo(() => {
    if (!taxEligibility) {
      return {
        tax_addback: false,
        tax_vat_addback: false,
        tax_vat_deduct: false,
        tax_nhil_addback: false,
        tax_nhil_deduct: false,
        tax_getfund_addback: false,
        tax_getfund_deduct: false,
      };
    }
    return taxEligibility;
  }, [taxEligibility]);

  useEffect(() => {
    const id = singleOrderId.trim();
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    if (!id) {
      setTaxEligibility(null);
      setTaxPreviewLoading(false);
      return;
    }
    previewOrderIdRef.current = id;
    setTaxPreviewLoading(true);
    previewTimerRef.current = setTimeout(async () => {
      try {
        const payload = await orderService.previewSellerCreditReconciliation(id);
        if (previewOrderIdRef.current !== id) return;
        const snap = extractAmountSnapshot(payload);
        if (snap) {
          setTaxEligibility(computeTaxEligibilityFromSnapshot(snap));
        } else {
          setTaxEligibility({
            tax_addback: false,
            tax_vat_addback: false,
            tax_vat_deduct: false,
            tax_nhil_addback: false,
            tax_nhil_deduct: false,
            tax_getfund_addback: false,
            tax_getfund_deduct: false,
          });
        }
      } catch {
        if (previewOrderIdRef.current !== id) return;
        setTaxEligibility({
          tax_addback: false,
          tax_vat_addback: false,
          tax_vat_deduct: false,
          tax_nhil_addback: false,
          tax_nhil_deduct: false,
          tax_getfund_addback: false,
          tax_getfund_deduct: false,
        });
      } finally {
        if (previewOrderIdRef.current === id) {
          setTaxPreviewLoading(false);
        }
      }
    }, 450);
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [singleOrderId]);

  useEffect(() => {
    if (!singleOrderId.trim() && TAX_RECON_TYPES.has(singleReconciliationType)) {
      setSingleReconciliationType('missing_credit_tx');
    }
  }, [singleOrderId, singleReconciliationType]);

  useEffect(() => {
    if (!TAX_RECON_TYPES.has(singleReconciliationType)) return;
    if (!taxEligibility || !taxEligibility[singleReconciliationType]) {
      setSingleReconciliationType('missing_credit_tx');
    }
  }, [singleReconciliationType, taxEligibility]);

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle as="div" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <FaTools style={{ fontSize: '2rem', color: 'var(--color-primary-600)' }} />
            <span>Seller Credit Reconciliation</span>
          </PageTitle>
          <PageSub>
            Detect and fix delivered orders where revenue history exists but seller credit
            transaction is missing.
          </PageSub>
        </div>
      </PageHeader>

      <Card>
        <CardTitle>
          <FaSearch />
          Bulk Reconciliation
        </CardTitle>
        <FormRow>
          <Field>
            <Label>Limit (max 500)</Label>
            <Input
              type="number"
              min="1"
              max="500"
              value={bulkLimit}
              onChange={(e) => setBulkLimit(e.target.value)}
            />
          </Field>
          <ButtonGroup>
            <Button
              type="button"
              onClick={() => bulkMutation.mutate({ dryRun: true })}
              disabled={bulkMutation.isPending || singleMutation.isPending}
            >
              <FaPlay />
              Dry Run
            </Button>
            <Button
              type="button"
              $primary
              onClick={() => bulkMutation.mutate({ dryRun: false })}
              disabled={bulkMutation.isPending || singleMutation.isPending}
            >
              <FaCheckCircle />
              Execute
            </Button>
          </ButtonGroup>
        </FormRow>
      </Card>

      <Card>
        <CardTitle>
          <FaSearch />
          Single Order Reconciliation
        </CardTitle>
        <FormRow
          $columns={
            singleReconciliationType === 'seller_amount_adjustment'
              ? '1fr minmax(200px, 280px) minmax(120px, 160px) minmax(180px, 220px) auto'
              : undefined
          }
        >
          <Field>
            <Label>Order ID, Order Number, or Tracking Number</Label>
            <Input
              type="text"
              placeholder="e.g. 69a... | ORD-20260320-0005 | EAZ-20260320-444508"
              value={singleOrderId}
              onChange={(e) => setSingleOrderId(e.target.value)}
            />
            {singleOrderId.trim() && taxPreviewLoading ? (
              <HintText>Checking order for tax options…</HintText>
            ) : singleOrderId.trim() && taxEligibility ? (
              <HintText>
                Tax add/remove options are enabled only when the seller has platform-withheld
                tax and a positive amount for that line.
              </HintText>
            ) : null}
          </Field>
          <Field>
            <Label>Reconciliation Type</Label>
            <Select
              value={singleReconciliationType}
              onChange={(e) => setSingleReconciliationType(e.target.value)}
            >
              <option value="missing_credit_tx">
                Missing Credit Transaction
              </option>
              <option value="tax_addback" disabled={!taxElig.tax_addback}>
                Tax Add-Back (all taxes) to Seller
                {!taxElig.tax_addback ? ' — N/A' : ''}
              </option>
              <optgroup label="VAT">
                <option value="tax_vat_addback" disabled={!taxElig.tax_vat_addback}>
                  VAT — Add to Seller{!taxElig.tax_vat_addback ? ' — N/A' : ''}
                </option>
                <option value="tax_vat_deduct" disabled={!taxElig.tax_vat_deduct}>
                  VAT — Remove from Seller{!taxElig.tax_vat_deduct ? ' — N/A' : ''}
                </option>
              </optgroup>
              <optgroup label="NHIL">
                <option value="tax_nhil_addback" disabled={!taxElig.tax_nhil_addback}>
                  NHIL — Add to Seller{!taxElig.tax_nhil_addback ? ' — N/A' : ''}
                </option>
                <option value="tax_nhil_deduct" disabled={!taxElig.tax_nhil_deduct}>
                  NHIL — Remove from Seller{!taxElig.tax_nhil_deduct ? ' — N/A' : ''}
                </option>
              </optgroup>
              <optgroup label="GETFund">
                <option value="tax_getfund_addback" disabled={!taxElig.tax_getfund_addback}>
                  GETFund — Add to Seller{!taxElig.tax_getfund_addback ? ' — N/A' : ''}
                </option>
                <option value="tax_getfund_deduct" disabled={!taxElig.tax_getfund_deduct}>
                  GETFund — Remove from Seller{!taxElig.tax_getfund_deduct ? ' — N/A' : ''}
                </option>
              </optgroup>
              <option value="seller_amount_adjustment">
                Seller Amount Adjustment
              </option>
            </Select>
          </Field>
          {singleReconciliationType === 'seller_amount_adjustment' && (
            <>
              <Field>
                <Label>Amount (GHS)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 100.50"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                />
              </Field>
              <Field>
                <Label>Seller ID (optional)</Label>
                <Input
                  type="text"
                  placeholder="Leave empty if 1 seller"
                  value={adjustmentSellerId}
                  onChange={(e) => setAdjustmentSellerId(e.target.value)}
                />
              </Field>
            </>
          )}
          <ButtonGroup>
            <Button
              type="button"
              onClick={() => singleMutation.mutate({ dryRun: true })}
              disabled={
                !singleOrderId.trim() ||
                (TAX_RECON_TYPES.has(singleReconciliationType) &&
                  !taxElig[singleReconciliationType]) ||
                (singleReconciliationType === 'seller_amount_adjustment' &&
                  (!adjustmentAmount.trim() || Number(adjustmentAmount) <= 0)) ||
                bulkMutation.isPending ||
                singleMutation.isPending
              }
            >
              <FaPlay />
              Dry Run
            </Button>
            <Button
              type="button"
              $primary
              onClick={() => singleMutation.mutate({ dryRun: false })}
              disabled={
                !singleOrderId.trim() ||
                (TAX_RECON_TYPES.has(singleReconciliationType) &&
                  !taxElig[singleReconciliationType]) ||
                (singleReconciliationType === 'seller_amount_adjustment' &&
                  (!adjustmentAmount.trim() || Number(adjustmentAmount) <= 0)) ||
                bulkMutation.isPending ||
                singleMutation.isPending
              }
            >
              <FaCheckCircle />
              Execute
            </Button>
          </ButtonGroup>
        </FormRow>
      </Card>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {result && (
        <ResultCard>
          <ResultTitle>Latest Result</ResultTitle>
          <ResultPre>{JSON.stringify(result, null, 2)}</ResultPre>
        </ResultCard>
      )}
    </PageContainer>
  );
};

export default SellerCreditReconciliationPage;

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: ${T.bodyBg};
`;

const Card = styled.div`
  background: var(--color-white-0);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 1.6rem;
  margin-bottom: 1.6rem;
`;

const CardTitle = styled.h3`
  margin: 0 0 1.2rem 0;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--color-grey-900);
  font-size: 1.7rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${(props) =>
    props.$columns || '1fr minmax(240px, 320px) auto'};
  gap: 1.2rem;
  align-items: end;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 1.3rem;
  color: var(--color-grey-700);
  font-weight: 600;
`;

const HintText = styled.p`
  margin: 0.4rem 0 0 0;
  font-size: 1.2rem;
  color: var(--color-grey-500);
  line-height: 1.4;
`;

const Input = styled.input`
  border: 1px solid var(--color-grey-300);
  border-radius: var(--border-radius-md);
  padding: 0.9rem 1rem;
  font-size: 1.4rem;
  background: var(--color-white-0);
`;

const Select = styled.select`
  border: 1px solid var(--color-grey-300);
  border-radius: var(--border-radius-md);
  padding: 0.9rem 1rem;
  font-size: 1.4rem;
  background: var(--color-white-0);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.8rem;
`;

const Button = styled.button`
  border: 1px solid
    ${(props) =>
      props.$primary ? 'var(--color-primary-600)' : 'var(--color-grey-300)'};
  background: ${(props) =>
    props.$primary ? 'var(--color-primary-600)' : 'var(--color-white-0)'};
  color: ${(props) => (props.$primary ? 'var(--color-white-0)' : 'var(--color-grey-800)')};
  border-radius: var(--border-radius-md);
  padding: 0.9rem 1.2rem;
  font-size: 1.3rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
`;

const ErrorBanner = styled.div`
  margin-top: 1rem;
  padding: 1rem 1.2rem;
  background: var(--color-red-100);
  color: var(--color-red-800);
  border-radius: var(--border-radius-md);
  font-size: 1.3rem;
  font-weight: 600;
`;

const ResultCard = styled.div`
  margin-top: 1.6rem;
  background: var(--color-white-0);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 1.6rem;
`;

const ResultTitle = styled.h4`
  margin: 0 0 1rem 0;
  font-size: 1.6rem;
  color: var(--color-grey-900);
`;

const ResultPre = styled.pre`
  margin: 0;
  padding: 1rem;
  background: var(--color-grey-50);
  border: 1px solid var(--color-grey-200);
  border-radius: var(--border-radius-md);
  color: var(--color-grey-800);
  overflow: auto;
  font-size: 1.2rem;
  line-height: 1.5;
`;
