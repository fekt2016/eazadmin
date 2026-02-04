import { useState, useMemo } from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaEdit, FaTrash, FaPlus, FaSyncAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import Button from "../../shared/components/Button";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import adApi from "../../shared/services/adApi";

const AD_TYPES = [
  { value: "banner", label: "Homepage Banner" },
  { value: "carousel", label: "Homepage Carousel" },
  { value: "popup", label: "Homepage Popup" },
  { value: "native", label: "Native Placement" },
];

const initialFormState = {
  title: "",
  imageUrl: "",
  link: "",
  promotionKey: "",
  type: "banner",
  startDate: "",
  endDate: "",
  active: true,
  discountPercent: "",
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

// Try to derive the main customer site base URL from the API base URL.
// Example: https://api.saiisai.com -> https://saiisai.com
const deriveMainSiteFromApiBase = (rawApiBase) => {
  if (!rawApiBase || typeof rawApiBase !== "string") return "";
  try {
    const url = new URL(rawApiBase);
    let host = url.host;
    if (host.toLowerCase().startsWith("api.")) {
      host = host.slice(4);
    }
    return `${url.protocol}//${host}`;
  } catch {
    return "";
  }
};

const resolveLink = (rawLink) => {
  const trimmed = (rawLink || "").trim();
  if (!trimmed) return trimmed;
  // If admin enters a full URL, keep it as-is
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Otherwise, treat it as a path and ALWAYS convert to an absolute URL,
  // because the backend validation requires an absolute HTTP(S) URL.
  const envBase = import.meta.env.VITE_MAIN_SITE_URL;
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  // Prefer explicit buyer app base if configured
  let base =
    (envBase && envBase.trim()) ||
    deriveMainSiteFromApiBase(apiBase) ||
    (typeof window !== "undefined" ? window.location.origin : "");

  // Fallback: if we somehow have no base (SSR or unusual env), force https://
  if (!base) {
    const normalizedPathOnly = trimmed.replace(/^\/+/, "");
    return `https://${normalizedPathOnly}`;
  }

  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = trimmed.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

const extractPromotionKeyFromLink = (link) => {
  if (!link) return "";
  try {
    const url = new URL(link);
    const path = url.pathname || "";
    const match = path.match(/^\/offers\/([^/?#]+)/i);
    return match ? match[1] : "";
  } catch {
    // Fallback: treat link as path
    const match = link.match(/^\/offers\/([^/?#]+)/i);
    return match ? match[1] : "";
  }
};

const buildPayload = (state) => {
  const rawLink = (state.link || "").trim();
  const promoPath =
    !rawLink && state.promotionKey
      ? `/offers/${state.promotionKey.trim()}`
      : rawLink;

  const payload = {
    title: state.title.trim(),
    imageUrl: state.imageUrl.trim(),
    link: resolveLink(promoPath),
    type: state.type,
    active: Boolean(state.active),
  };

  if (state.discountPercent !== "" && state.discountPercent !== null && state.discountPercent !== undefined) {
    const value = Number(state.discountPercent);
    if (!Number.isNaN(value)) {
      payload.discountPercent = value;
    }
  }

  payload.startDate = state.startDate
    ? new Date(state.startDate).toISOString()
    : new Date().toISOString();

  payload.endDate = state.endDate
    ? new Date(state.endDate).toISOString()
    : null;

  return payload;
};

const AdsManagementPage = () => {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState(initialFormState);
  const [editingAd, setEditingAd] = useState(null);
  const [imageFileName, setImageFileName] = useState("");

  const {
    data: adsData,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { ads } = await adApi.getAds();
      return ads;
    },
  });

  const ads = useMemo(() => adsData ?? [], [adsData]);

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingAd(null);
  };

  const createAdMutation = useMutation({
    mutationFn: adApi.createAd,
    onSuccess: () => {
      toast.success("Advertisement created successfully");
      queryClient.invalidateQueries(["admin-ads"]);
      resetForm();
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create advertisement",
      );
    },
  });

  const updateAdMutation = useMutation({
    mutationFn: ({ id, payload }) => adApi.updateAd(id, payload),
    onSuccess: () => {
      toast.success("Advertisement updated successfully");
      queryClient.invalidateQueries(["admin-ads"]);
      resetForm();
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update advertisement",
      );
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: adApi.deleteAd,
    onSuccess: () => {
      toast.success("Advertisement deleted");
      queryClient.invalidateQueries(["admin-ads"]);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete advertisement",
      );
    },
  });

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto-fill Destination Link from Promotion Key when appropriate
      if (name === "promotionKey") {
        const slug = value.trim();
        const autoPath = slug ? `/offers/${slug}` : "";
        const prevAutoPath = prev.promotionKey
          ? `/offers/${prev.promotionKey}`
          : "";
        const linkWasEmptyOrAuto =
          !prev.link || prev.link.trim() === "" || prev.link === prevAutoPath;

        if (linkWasEmptyOrAuto) {
          next.link = autoPath;
        }
      }

      return next;
    });
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFileName(file.name);
    try {
      toast.info("Uploading image…");
      const imageUrl = await adApi.uploadImage(file);
      if (!imageUrl) {
        toast.error("Image upload failed. Please try again.");
        return;
      }
      setFormState((prev) => ({
        ...prev,
        imageUrl,
      }));
      toast.success("Image uploaded successfully.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload image"
      );
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    const promotionKey = extractPromotionKeyFromLink(ad.link);
    setFormState({
      title: ad.title || "",
      imageUrl: ad.imageUrl || "",
      link: ad.link || "",
      promotionKey,
      type: ad.type || "banner",
      startDate: toDateInputValue(ad.startDate),
      endDate: toDateInputValue(ad.endDate),
      active: ad.active ?? true,
      discountPercent:
        typeof ad.discountPercent === "number" && !Number.isNaN(ad.discountPercent)
          ? String(ad.discountPercent)
          : "",
    });
  };

  const handleDelete = (ad) => {
    const id = ad?.id || ad?._id;
    if (!id) return;

    if (window.confirm(`Delete advertisement "${ad.title}"?`)) {
      deleteAdMutation.mutate(id);
    }
  };

  const handleToggleActive = (ad) => {
    const id = ad?.id || ad?._id;
    if (!id) return;
    updateAdMutation.mutate({
      id,
      payload: { active: !ad.active },
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formState.title.trim() || !formState.imageUrl.trim() || !formState.link.trim()) {
      toast.error("Title, image and destination link are required.");
      return;
    }

    const payload = buildPayload(formState);

    if (editingAd) {
      const id = editingAd.id || editingAd._id;
      updateAdMutation.mutate({ id, payload });
    } else {
      createAdMutation.mutate(payload);
    }
  };

  const isSubmitting =
    createAdMutation.isPending || updateAdMutation.isPending;

  return (
    <PageWrapper>
      <HeaderRow>
        <div>
          <PageTitle>Advertisements</PageTitle>
          <PageSubtitle>
            Manage promotional placements displayed to buyers across the storefront.
          </PageSubtitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => queryClient.invalidateQueries(["admin-ads"])}
          disabled={isFetching}
          icon={<FaSyncAlt />}
        >
          Refresh
        </Button>
      </HeaderRow>

      <GridLayout>
        <Card>
          <SectionHeader>
            <SectionTitle>
              {editingAd ? "Edit Advertisement" : "Create Advertisement"}
            </SectionTitle>
            {editingAd ? (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </SectionHeader>

          <Form onSubmit={handleSubmit}>
            <FormGrid>
              <FormField>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formState.title}
                  onChange={handleInputChange}
                  placeholder="Summer Sale Spotlight"
                  required
                />
              </FormField>

              <FormField>
                <Label htmlFor="imageFile">Image</Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  required={!formState.imageUrl}
                />
                {imageFileName && (
                  <HelpText>Selected file: {imageFileName}</HelpText>
                )}
                {formState.imageUrl && (
                  <HelpText>
                    Uploaded URL: <code>{formState.imageUrl}</code>
                  </HelpText>
                )}
              </FormField>

              <FormField>
                <Label htmlFor="promotionKey">Promotion Key (optional)</Label>
                <Input
                  id="promotionKey"
                  name="promotionKey"
                  value={formState.promotionKey}
                  onChange={handleInputChange}
                  placeholder="back-to-school"
                />
                <HelpText>
                  Used to build promo pages like <code>/offers/back-to-school</code> and
                  to tag related products.
                </HelpText>
              </FormField>

              <FormField>
                <Label htmlFor="discountPercent">Discount (%)</Label>
                <Input
                  id="discountPercent"
                  name="discountPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formState.discountPercent}
                  onChange={handleInputChange}
                  placeholder="e.g. 10 for 10% off"
                />
                <HelpText>
                  Optional percentage discount applied to products linked to this promotion.
                </HelpText>
              </FormField>

              <FormField>
                <Label htmlFor="link">Destination Link</Label>
                <Input
                  id="link"
                  name="link"
                  value={formState.link}
                  onChange={handleInputChange}
                  placeholder="https://saiisai.com/offers/back-to-school or /offers/back-to-school"
                  required
                />
                <HelpText>
                  Enter a full URL or a path. When left as a path (e.g.{" "}
                  <code>/offers/back-to-school</code>), it will automatically point to{" "}
                  {import.meta.env.VITE_MAIN_SITE_URL || "the current domain"} in production.
                  If left empty but a Promotion Key is set, the link will default to{" "}
                  <code>/offers/&lt;promotionKey&gt;</code>.
                </HelpText>
              </FormField>

              <FormField>
                <Label htmlFor="type">Placement Type</Label>
                <Select
                  id="type"
                  name="type"
                  value={formState.type}
                  onChange={handleInputChange}
                >
                  {AD_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formState.startDate}
                  onChange={handleInputChange}
                />
              </FormField>

              <FormField>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formState.endDate}
                  onChange={handleInputChange}
                />
              </FormField>

              <FormField>
                <Label htmlFor="active">Status</Label>
                <CheckboxRow>
                  <input
                    id="active"
                    name="active"
                    type="checkbox"
                    checked={formState.active}
                    onChange={handleInputChange}
                  />
                  <span>{formState.active ? "Active" : "Inactive"}</span>
                </CheckboxRow>
              </FormField>
            </FormGrid>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<FaPlus />}
              disabled={isSubmitting}
            >
              {editingAd ? "Update Advertisement" : "Create Advertisement"}
            </Button>
          </Form>
        </Card>

        <Card>
          <SectionHeader>
            <SectionTitle>Active Campaigns</SectionTitle>
            <Badge>{ads.length} total</Badge>
          </SectionHeader>

          {isLoading ? (
            <SpinnerWrapper>
              <LoadingSpinner />
            </SpinnerWrapper>
          ) : isError ? (
            <EmptyState>
              <p>We couldn&apos;t load advertisements. Please refresh and try again.</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => queryClient.invalidateQueries(["admin-ads"])}
              >
                Retry
              </Button>
            </EmptyState>
          ) : ads.length === 0 ? (
            <EmptyState>
              <p>No advertisements found yet.</p>
              <p>Create your first campaign to highlight key promotions.</p>
            </EmptyState>
          ) : (
            <Table role="grid">
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Start</Th>
                  <Th>End</Th>
                  <Th>Discount</Th>
                  <Th>Link</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => {
                  const id = ad.id || ad._id;
                  return (
                    <tr key={id}>
                      <Td>{ad.title || "Untitled"}</Td>
                      <Td>{ad.type}</Td>
                      <Td>
                        <StatusPill $active={ad.active}>
                          {ad.active ? "Active" : "Inactive"}
                        </StatusPill>
                      </Td>
                      <Td>{ad.startDate ? toDateInputValue(ad.startDate) : "—"}</Td>
                      <Td>{ad.endDate ? toDateInputValue(ad.endDate) : "—"}</Td>
                      <Td>
                        {typeof ad.discountPercent === "number" && ad.discountPercent > 0
                          ? `${ad.discountPercent}%`
                          : "—"}
                      </Td>
                      <Td>
                        <LinkPreview href={ad.link} target="_blank" rel="noopener noreferrer">
                          {ad.link}
                        </LinkPreview>
                      </Td>
                      <Td align="right">
                        <ActionsRow>
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<FaEdit />}
                            onClick={() => handleEdit(ad)}
                            disabled={isSubmitting}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleToggleActive(ad)}
                            disabled={updateAdMutation.isPending}
                          >
                            {ad.active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="danger"
                            size="xs"
                            icon={<FaTrash />}
                            onClick={() => handleDelete(ad)}
                            disabled={deleteAdMutation.isPending}
                          >
                            Delete
                          </Button>
                        </ActionsRow>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      </GridLayout>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
`;

const PageTitle = styled.h1`
  font-size: 2.4rem;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
`;

const PageSubtitle = styled.p`
  color: #475569;
  margin: 8px 0 0;
  max-width: 560px;
`;

const GridLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Card = styled.section`
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
  color: #0f172a;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HelpText = styled.p`
  margin: 0;
  margin-top: 0.25rem;
  font-size: 0.825rem;
  color: #6b7280;
`;

const Label = styled.label`
  font-weight: 600;
  color: #1f2937;
`;

const Input = styled.input`
  border: 1px solid #d0d7e3;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
    outline: none;
  }
`;

const Select = styled.select`
  border: 1px solid #d0d7e3;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
    outline: none;
  }
`;

const CheckboxRow = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  color: #1f2937;

  input {
    width: 18px;
    height: 18px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
`;

const Th = styled.th`
  text-align: ${(props) => props.align || "left"};
  padding: 12px 16px;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
`;

const Td = styled.td`
  text-align: ${(props) => props.align || "left"};
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #0f172a;
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${(props) => (props.$active ? "rgba(16, 185, 129, 0.12)" : "rgba(248, 113, 113, 0.12)")};
  color: ${(props) => (props.$active ? "#047857" : "#b91c1c")};
`;

const LinkPreview = styled.a`
  display: inline-block;
  max-width: 240px;
  color: #2563eb;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`;

const ActionsRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const SpinnerWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 32px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  color: #334155;
  display: grid;
  gap: 12px;
`;

export default AdsManagementPage;
