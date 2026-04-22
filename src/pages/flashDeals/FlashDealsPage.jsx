import { useMemo, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { toast } from "react-toastify";
import {
  useGetFlashDeals,
  useGetFlashDeal,
  useCreateFlashDeal,
  useUpdateFlashDeal,
  useDeleteFlashDeal,
  useCancelFlashDeal,
  useGetSubmissions,
  useReviewSubmission,
  useUploadBanner,
} from "../../shared/hooks/useFlashDeal";
import Button from "../../shared/components/Button";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { ConfirmationModal } from "../../shared/components/Modal/ConfirmationModal";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
`;

const PageWrap = styled.div`
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const StatCard = styled.div`
  background: var(--color-card-bg, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--border-radius-md, 8px);
  padding: 0.75rem 1rem;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: var(--color-grey-500, #6b7280);
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const FilterBtn = styled.button`
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: ${({ $active }) =>
    $active ? "var(--color-primary-600, #2563eb)" : "transparent"};
  color: ${({ $active }) => ($active ? "#fff" : "inherit")};
  cursor: pointer;
  font-size: 0.85rem;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--border-radius-md, 8px);
  background: var(--color-card-bg, #fff);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-grey-50, #f9fafb);
`;

const Td = styled.td`
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid var(--color-border, #eef2f7);
  vertical-align: middle;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  background: ${({ $variant }) => {
    switch ($variant) {
      case "active":
        return "#dcfce7";
      case "scheduled":
        return "#dbeafe";
      case "ended":
      case "draft":
        return "#f3f4f6";
      case "cancelled":
        return "#fee2e2";
      default:
        return "#f3f4f6";
    }
  }};
  color: ${({ $variant }) => {
    switch ($variant) {
      case "active":
        return "#166534";
      case "scheduled":
        return "#1e40af";
      case "cancelled":
        return "#991b1b";
      default:
        return "#374151";
    }
  }};
  animation: ${({ $pulse }) => ($pulse ? pulse : "none")} 1.6s ease-in-out
    infinite;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalCard = styled.div`
  background: var(--color-card-bg, #fff);
  border-radius: 12px;
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.25rem;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 0.9rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 72px;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 0.9rem;
  resize: vertical;
`;

const DetailPanel = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1001;
  display: flex;
  justify-content: flex-end;
`;

const DetailAside = styled.aside`
  width: min(640px, 100%);
  background: var(--color-card-bg, #fff);
  height: 100%;
  overflow-y: auto;
  padding: 1rem 1.25rem;
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
`;

const TabBtn = styled.button`
  flex: 1;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: ${({ $active }) => ($active ? "var(--color-primary-50, #eff6ff)" : "#fff")};
  font-weight: 600;
  cursor: pointer;
`;

const Thumb = styled.img`
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
`;

function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function displayStatus(deal) {
  return deal?.currentStatus || deal?.status || "";
}

function productThumbUrl(product) {
  const imgs = product?.images;
  if (!Array.isArray(imgs) || imgs.length === 0) return "";
  const first = imgs[0];
  if (typeof first === "string") return first;
  return first?.url || first?.secure_url || "";
}

const initialForm = {
  title: "",
  description: "",
  bannerImage: "",
  startTime: "",
  endTime: "",
  maxProducts: 50,
  minDiscountPercent: 10,
  maxDiscountPercent: 70,
};

export default function FlashDealsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const params = useMemo(
    () => (statusFilter ? { status: statusFilter } : {}),
    [statusFilter]
  );
  const { data: deals = [], isLoading, refetch } = useGetFlashDeals(params);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [detailId, setDetailId] = useState(null);
  const [detailTab, setDetailTab] = useState("approved");

  const { data: detailBundle } = useGetFlashDeal(detailId);
  const flashDealDetail = detailBundle?.flashDeal;
  const approvedFromDetail = detailBundle?.approvedProducts ?? [];

  const { data: submissions = [] } = useGetSubmissions(detailId, {});

  const createMut = useCreateFlashDeal();
  const updateMut = useUpdateFlashDeal();
  const deleteMut = useDeleteFlashDeal();
  const cancelMut = useCancelFlashDeal();
  const reviewMut = useReviewSubmission();
  const uploadMut = useUploadBanner();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const stats = useMemo(() => {
    const active = deals.filter((d) => displayStatus(d) === "active").length;
    const scheduled = deals.filter(
      (d) => displayStatus(d) === "scheduled"
    ).length;
    let products = 0;
    let pending = 0;
    deals.forEach((d) => {
      products += d.approvedProductCount || 0;
      pending += d.pendingSubmissionCount || 0;
    });
    return { active, scheduled, products, pending };
  }, [deals]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setFormOpen(true);
  };

  const openEdit = (deal) => {
    setEditingId(deal._id);
    setForm({
      title: deal.title || "",
      description: deal.description || "",
      bannerImage: deal.bannerImage || "",
      startTime: toDatetimeLocalValue(deal.startTime),
      endTime: toDatetimeLocalValue(deal.endTime),
      maxProducts: deal.maxProducts ?? 50,
      minDiscountPercent: deal.discountRules?.minDiscountPercent ?? 10,
      maxDiscountPercent: deal.discountRules?.maxDiscountPercent ?? 70,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        bannerImage: form.bannerImage || undefined,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        maxProducts: Number(form.maxProducts) || 50,
        discountRules: {
          minDiscountPercent: Number(form.minDiscountPercent),
          maxDiscountPercent: Number(form.maxDiscountPercent),
        },
      };
      if (editingId) {
        await updateMut.mutateAsync({ id: editingId, data: payload });
        toast.success("Flash deal updated");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Flash deal created");
      }
      setFormOpen(false);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Save failed");
    }
  };

  const onBannerFile = async (e, dealId) => {
    const file = e.target.files?.[0];
    if (!file || !dealId) return;
    try {
      await uploadMut.mutateAsync({ id: dealId, file });
      toast.success("Banner uploaded");
      refetch();
      if (detailId === dealId) refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    }
    e.target.value = "";
  };

  const pendingRows = useMemo(
    () => submissions.filter((s) => s.status === "pending"),
    [submissions]
  );

  const approveRow = async (subId) => {
    try {
      await reviewMut.mutateAsync({
        submissionId: subId,
        data: { status: "approved" },
      });
      toast.success("Approved");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Approve failed");
    }
  };

  const submitReject = async () => {
    if (!rejectModal) return;
    try {
      await reviewMut.mutateAsync({
        submissionId: rejectModal,
        data: { status: "rejected", rejectionReason: rejectReason.trim() },
      });
      toast.success("Rejected");
      setRejectModal(null);
      setRejectReason("");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Reject failed");
    }
  };

  const badgeVariant = useCallback((deal) => {
    const s = displayStatus(deal);
    if (s === "active") return "active";
    if (s === "scheduled") return "scheduled";
    if (s === "cancelled") return "cancelled";
    if (s === "ended") return "ended";
    return "draft";
  }, []);

  return (
    <PageWrap>
      <HeaderRow>
        <Title>Flash Deals</Title>
        <Button type="button" onClick={openCreate}>
          Create Flash Deal
        </Button>
      </HeaderRow>

      <StatsRow>
        <StatCard>
          <StatLabel>Active</StatLabel>
          <StatValue>{stats.active}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Scheduled</StatLabel>
          <StatValue>{stats.scheduled}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Approved products</StatLabel>
          <StatValue>{stats.products}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Pending submissions</StatLabel>
          <StatValue>{stats.pending}</StatValue>
        </StatCard>
      </StatsRow>

      <Filters>
        {["", "draft", "scheduled", "active", "ended", "cancelled"].map((s) => (
          <FilterBtn
            key={s || "all"}
            type="button"
            $active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          >
            {s ? s : "All"}
          </FilterBtn>
        ))}
      </Filters>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th>Products</Th>
                <Th>Pending</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal._id}>
                  <Td>{deal.title}</Td>
                  <Td>
                    <Badge
                      $variant={badgeVariant(deal)}
                      $pulse={displayStatus(deal) === "active"}
                    >
                      {displayStatus(deal)}
                    </Badge>
                  </Td>
                  <Td>{deal.startTime ? new Date(deal.startTime).toLocaleString() : "—"}</Td>
                  <Td>{deal.endTime ? new Date(deal.endTime).toLocaleString() : "—"}</Td>
                  <Td>
                    {deal.approvedProductCount ?? 0}/{deal.maxProducts ?? 50}
                  </Td>
                  <Td>{deal.pendingSubmissionCount ?? 0}</Td>
                  <Td>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setDetailId(deal._id);
                        setDetailTab("approved");
                      }}
                    >
                      View
                    </Button>{" "}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => openEdit(deal)}
                    >
                      Edit
                    </Button>{" "}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await cancelMut.mutateAsync(deal._id);
                          toast.success("Deal cancelled");
                          refetch();
                        } catch (e) {
                          toast.error(e?.response?.data?.message || "Cancel failed");
                        }
                      }}
                      disabled={cancelMut.isPending}
                    >
                      Cancel
                    </Button>{" "}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setDeleteTarget(deal)}
                      disabled={!["draft", "cancelled"].includes(deal.status)}
                    >
                      Delete
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}

      {formOpen && (
        <ModalOverlay
          role="presentation"
          onClick={() => setFormOpen(false)}
        >
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>
              {editingId ? "Edit flash deal" : "Create flash deal"}
            </h2>
            <FormGrid>
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <TextArea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Banner image URL (optional)</Label>
                <Input
                  value={form.bannerImage}
                  onChange={(e) =>
                    setForm({ ...form, bannerImage: e.target.value })
                  }
                />
              </div>
              {editingId && (
                <div>
                  <Label>Upload banner</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onBannerFile(e, editingId)}
                  />
                </div>
              )}
              <div>
                <Label>Start</Label>
                <Input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
              <div>
                <Label>Max products</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxProducts}
                  onChange={(e) =>
                    setForm({ ...form, maxProducts: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Min discount %</Label>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={form.minDiscountPercent}
                  onChange={(e) =>
                    setForm({ ...form, minDiscountPercent: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Max discount %</Label>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={form.maxDiscountPercent}
                  onChange={(e) =>
                    setForm({ ...form, maxDiscountPercent: e.target.value })
                  }
                />
              </div>
            </FormGrid>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <Button type="button" onClick={() => setFormOpen(false)}>
                Close
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={createMut.isPending || updateMut.isPending}
              >
                Save
              </Button>
            </div>
          </ModalCard>
        </ModalOverlay>
      )}

      {detailId && (
        <DetailPanel
          role="presentation"
          onClick={() => setDetailId(null)}
        >
          <DetailAside onClick={(e) => e.stopPropagation()}>
            <HeaderRow style={{ marginBottom: 0 }}>
              <Title style={{ fontSize: "1.15rem" }}>
                {flashDealDetail?.title || "Flash deal"}
              </Title>
              <Button type="button" onClick={() => setDetailId(null)}>
                Close
              </Button>
            </HeaderRow>
            {flashDealDetail?.bannerImage && (
              <img
                src={flashDealDetail.bannerImage}
                alt=""
                style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8 }}
              />
            )}
            <div style={{ marginTop: "0.5rem" }}>
              <Badge $variant={badgeVariant(flashDealDetail || {})}>
                {displayStatus(flashDealDetail || {})}
              </Badge>
            </div>
            <div>
              <Label>Upload banner</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => onBannerFile(e, detailId)}
              />
            </div>
            <Tabs>
              <TabBtn
                type="button"
                $active={detailTab === "approved"}
                onClick={() => setDetailTab("approved")}
              >
                Approved
              </TabBtn>
              <TabBtn
                type="button"
                $active={detailTab === "pending"}
                onClick={() => setDetailTab("pending")}
              >
                Pending
              </TabBtn>
            </Tabs>
            {detailTab === "approved" && (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Product</Th>
                      <Th>Seller</Th>
                      <Th>Prices</Th>
                      <Th>Sold</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedFromDetail.map((row) => (
                      <tr key={row._id}>
                        <Td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {productThumbUrl(row.product) && (
                              <Thumb src={productThumbUrl(row.product)} alt="" />
                            )}
                            {row.product?.name}
                          </div>
                        </Td>
                        <Td>{row.seller?.shopName || row.seller?.businessName}</Td>
                        <Td>
                          GH₵{row.originalPrice} → GH₵{row.flashPrice}
                        </Td>
                        <Td>
                          {row.soldCount}
                          {row.maxQuantity != null ? ` / ${row.maxQuantity}` : ""}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
            {detailTab === "pending" && (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Product</Th>
                      <Th>Seller</Th>
                      <Th>Offer</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRows.map((row) => (
                      <tr key={row._id}>
                        <Td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {productThumbUrl(row.product) && (
                              <Thumb src={productThumbUrl(row.product)} alt="" />
                            )}
                            {row.product?.name}
                          </div>
                        </Td>
                        <Td>{row.seller?.shopName || row.seller?.businessName}</Td>
                        <Td>
                          {row.discountType} {row.discountValue} → GH₵
                          {row.flashPrice}
                        </Td>
                        <Td>
                          <Button
                            type="button"
                            onClick={() => approveRow(row._id)}
                            disabled={reviewMut.isPending}
                          >
                            Approve
                          </Button>{" "}
                          <Button
                            type="button"
                            onClick={() => setRejectModal(row._id)}
                          >
                            Reject
                          </Button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </DetailAside>
        </DetailPanel>
      )}

      {deleteTarget && (
        <ConfirmationModal
          isOpen
          title="Delete flash deal?"
          message="This removes the deal and all seller submissions."
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              await deleteMut.mutateAsync(deleteTarget._id);
              toast.success("Deleted");
              setDeleteTarget(null);
              refetch();
            } catch (e) {
              toast.error(e?.response?.data?.message || "Delete failed");
            }
          }}
        />
      )}

      {rejectModal && (
        <ModalOverlay onClick={() => setRejectModal(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Reject submission</h3>
            <Label>Reason</Label>
            <TextArea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <Button type="button" onClick={() => setRejectModal(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={submitReject}>
                Submit
              </Button>
            </div>
          </ModalCard>
        </ModalOverlay>
      )}
    </PageWrap>
  );
}
