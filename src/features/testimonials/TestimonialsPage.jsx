import styled from "styled-components";
import { useMemo, useState } from "react";
import { FiCheck, FiEyeOff, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import useTestimonial from "../../shared/hooks/useTestimonial";
import { toast } from "react-toastify";
import { ConfirmationModal } from "../../shared/components/Modal/ConfirmationModal";

const truncate = (text, max = 120) => {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
};

export default function TestimonialsPage() {
  const {
    useGetAllTestimonials,
    useApproveTestimonial,
    useRejectTestimonial,
    useUnpublishTestimonial,
    useDeleteTestimonial,
  } = useTestimonial();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, note: "" });
  const [deleteId, setDeleteId] = useState(null);

  const queryParams = useMemo(() => {
    const p = { limit: 200 };
    if (statusFilter !== "all") p.status = statusFilter;
    return p;
  }, [statusFilter]);

  const { data: testimonials = [], isLoading, error } =
    useGetAllTestimonials(queryParams);

  const approveMutation = useApproveTestimonial();
  const rejectMutation = useRejectTestimonial();
  const unpublishMutation = useUnpublishTestimonial();
  const deleteMutation = useDeleteTestimonial();

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return testimonials;
    return testimonials.filter((t) => {
      const seller = t.seller || {};
      const hay = [
        t.content,
        seller.businessName,
        seller.email,
        seller.shopName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [testimonials, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const pageRows = filtered.slice(indexOfFirst, indexOfLast);

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const statusStyle = (status) => {
    switch (status) {
      case "approved":
        return { bg: "#dcfce7", color: "#166534" };
      case "pending":
        return { bg: "#fef9c3", color: "#854d0e" };
      case "rejected":
        return { bg: "#fee2e2", color: "#b91c1c" };
      default:
        return { bg: "#f1f5f9", color: "#64748b" };
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.id) return;
    try {
      await rejectMutation.mutateAsync({
        id: rejectModal.id,
        note: rejectModal.note?.trim() || undefined,
      });
      setRejectModal({ open: false, id: null, note: "" });
    } catch {
      // toast handled in hook
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <ErrorBox>
        Failed to load testimonials: {error.message || "Unknown error"}
      </ErrorBox>
    );
  }

  return (
    <Wrap>
      <Header>
        <Title>Seller testimonials</Title>
        <Subtitle>
          Approve to publish on the buyer homepage. Unpublish keeps approval but
          hides from the site.
        </Subtitle>
        <Toolbar>
          <SearchWrap>
            <FiSearch />
            <SearchInput
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search seller, email, or text…"
            />
          </SearchWrap>
          <FilterSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </FilterSelect>
        </Toolbar>
      </Header>

      <Stats>
        <Stat>
          <StatValue>{testimonials.length}</StatValue>
          <StatLabel>Loaded</StatLabel>
        </Stat>
        <Stat>
          <StatValue>
            {testimonials.filter((t) => t.status === "pending").length}
          </StatValue>
          <StatLabel>Pending</StatLabel>
        </Stat>
        <Stat>
          <StatValue>
            {
              testimonials.filter((t) => t.status === "approved" && t.isPublished)
                .length
            }
          </StatValue>
          <StatLabel>Live on homepage</StatLabel>
        </Stat>
      </Stats>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Seller</Th>
              <Th>Content</Th>
              <Th>Rating</Th>
              <Th>Status</Th>
              <Th>Published</Th>
              <Th>Updated</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <Td colSpan={7}>
                  <Empty>No testimonials match your filters.</Empty>
                </Td>
              </tr>
            ) : (
              pageRows.map((t) => {
                const id = t._id || t.id;
                const seller = t.seller || {};
                const name =
                  seller.businessName || seller.shopName || "Seller";
                const email = seller.email || "";
                const busy =
                  approveMutation.isPending ||
                  rejectMutation.isPending ||
                  unpublishMutation.isPending ||
                  deleteMutation.isPending;
                return (
                  <tr key={id}>
                    <Td>
                      <strong>{name}</strong>
                      {email ? <Small>{email}</Small> : null}
                    </Td>
                    <Td>{truncate(t.content, 140)}</Td>
                    <Td>{t.rating ?? "—"}</Td>
                    <Td>
                      <Badge $bg={statusStyle(t.status).bg} $color={statusStyle(t.status).color}>
                        {t.status}
                      </Badge>
                    </Td>
                    <Td>{t.isPublished ? "Yes" : "No"}</Td>
                    <Td>{formatDate(t.updatedAt || t.createdAt)}</Td>
                    <Td>
                      <Actions>
                        {t.status === "pending" && (
                          <>
                            <IconBtn
                              type="button"
                              title="Approve & publish"
                              disabled={busy}
                              onClick={() => approveMutation.mutate(id)}
                            >
                              <FiCheck />
                            </IconBtn>
                            <IconBtn
                              type="button"
                              title="Reject"
                              $danger
                              disabled={busy}
                              onClick={() =>
                                setRejectModal({ open: true, id, note: "" })
                              }
                            >
                              <FiX />
                            </IconBtn>
                          </>
                        )}
                        {t.status === "approved" && t.isPublished && (
                          <IconBtn
                            type="button"
                            title="Unpublish from homepage"
                            disabled={busy}
                            onClick={() => unpublishMutation.mutate(id)}
                          >
                            <FiEyeOff />
                          </IconBtn>
                        )}
                        {t.status === "approved" && !t.isPublished && (
                          <IconBtn
                            type="button"
                            title="Approve again to publish"
                            disabled={busy}
                            onClick={() => approveMutation.mutate(id)}
                          >
                            <FiCheck />
                          </IconBtn>
                        )}
                        <IconBtn
                          type="button"
                          title="Delete"
                          $danger
                          disabled={busy}
                          onClick={() => setDeleteId(id)}
                        >
                          <FiTrash2 />
                        </IconBtn>
                      </Actions>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </TableWrap>

      {filtered.length > itemsPerPage && (
        <Pagination>
          <PageInfo>
            Showing {indexOfFirst + 1}–
            {Math.min(indexOfLast, filtered.length)} of {filtered.length}
          </PageInfo>
          <PageControls>
            <PageBtn
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </PageBtn>
            <PageInfo>
              Page {currentPage} / {totalPages}
            </PageInfo>
            <PageBtn
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </PageBtn>
          </PageControls>
        </Pagination>
      )}

      {rejectModal.open && (
        <ModalOverlay
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-title"
        >
          <ModalBox>
            <ModalHead>
              <h2 id="reject-title">Reject testimonial</h2>
              <CloseType
                type="button"
                onClick={() =>
                  setRejectModal({ open: false, id: null, note: "" })
                }
              >
                ×
              </CloseType>
            </ModalHead>
            <ModalBody>
              <label htmlFor="reject-note">Note to seller (optional)</label>
              <TextArea
                id="reject-note"
                rows={4}
                value={rejectModal.note}
                onChange={(e) =>
                  setRejectModal((m) => ({ ...m, note: e.target.value }))
                }
                placeholder="Reason for rejection…"
                maxLength={300}
              />
            </ModalBody>
            <ModalFoot>
              <GhostBtn
                type="button"
                onClick={() =>
                  setRejectModal({ open: false, id: null, note: "" })
                }
              >
                Cancel
              </GhostBtn>
              <DangerBtn
                type="button"
                onClick={handleRejectSubmit}
                disabled={rejectMutation.isPending}
              >
                Reject
              </DangerBtn>
            </ModalFoot>
          </ModalBox>
        </ModalOverlay>
      )}

      <ConfirmationModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteMutation.mutateAsync(deleteId);
          } catch {
            toast.error("Delete failed");
          } finally {
            setDeleteId(null);
          }
        }}
        title="Delete testimonial?"
        message="This permanently removes the testimonial. This cannot be undone."
        confirmText="Delete"
        confirmColor="#dc2626"
      />
    </Wrap>
  );
}

const Wrap = styled.div`
  padding: 1.5rem;
  max-width: 1400px;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  margin: 0 0 0.35rem;
  font-size: 1.5rem;
  color: #0f172a;
`;

const Subtitle = styled.p`
  margin: 0 0 1rem;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.45;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
`;

const SearchWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 220px;
  max-width: 420px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
`;

const SearchInput = styled.input`
  border: none;
  flex: 1;
  font-size: 0.95rem;
  outline: none;
`;

const FilterSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 0.9rem;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`;

const Stat = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.85rem 1rem;
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
`;

const Td = styled.td`
  padding: 0.85rem 1rem;
  vertical-align: top;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
`;

const Small = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.2rem;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const IconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: ${(p) => (p.$danger ? "#fef2f2" : "#fff")};
  color: ${(p) => (p.$danger ? "#b91c1c" : "#475569")};
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: ${(p) => (p.$danger ? "#fee2e2" : "#f1f5f9")};
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Empty = styled.div`
  padding: 2rem;
  text-align: center;
  color: #64748b;
`;

const ErrorBox = styled.div`
  margin: 2rem;
  padding: 1rem 1.25rem;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 8px;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const PageInfo = styled.span`
  font-size: 0.875rem;
  color: #64748b;
`;

const PageControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PageBtn = styled.button`
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  font-size: 0.875rem;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalBox = styled.div`
  background: #fff;
  border-radius: 12px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
`;

const ModalHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  h2 {
    margin: 0;
    font-size: 1.1rem;
  }
`;

const CloseType = styled.button`
  border: none;
  background: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #64748b;
`;

const ModalBody = styled.div`
  padding: 1rem 1.25rem;
  label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.35rem;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
`;

const ModalFoot = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e2e8f0;
`;

const GhostBtn = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
`;

const DangerBtn = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: #b91c1c;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
