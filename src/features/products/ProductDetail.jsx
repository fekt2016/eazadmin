import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import styled from "styled-components";
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaImage,
  FaBox,
  FaTag,
  FaStore,
  FaUser,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import useProduct from "../../shared/hooks/useProduct";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import { PATHS } from "../../routes/routhPath";
import { toast } from "react-toastify";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useGetProductById, approveProduct, updateProduct } = useProduct();
  const { data: productData, isLoading, error } = useGetProductById(id);
  const approveMutation = approveProduct;
  const updatePromoMutation = updateProduct;
  const [selectedImage, setSelectedImage] = useState(0);
  const [promotionKey, setPromotionKey] = useState("");

  const product = useMemo(() => {
    if (!productData) return null;
    // Handle various response structures
    if (productData.data?.product) return productData.data.product;
    if (productData.product) return productData.product;
    if (productData.data?.data) return productData.data.data;
    return productData.data || productData;
  }, [productData]);

  // Sync local promotionKey state when product loads/changes
  useMemo(() => {
    if (product) {
      setPromotionKey(product.promotionKey || "");
    }
  }, [product?.id, product?._id, product?.promotionKey]);

  // Extract images
  const images = useMemo(() => {
    if (!product) return [];
    if (product.images && Array.isArray(product.images)) {
      return product.images;
    }
    if (product.imageCover) {
      return [product.imageCover];
    }
    return [];
  }, [product]);

  // Extract variants and attributes
  const variants = useMemo(() => {
    return product?.variants || [];
  }, [product]);

  // Check if product is pending approval
  const isPendingApproval = useMemo(() => {
    return product?.moderationStatus === 'pending' || product?.moderationStatus === 'PENDING';
  }, [product]);

  // Handle approve product
  const handleApproveProduct = async () => {
    if (window.confirm(`Approve product "${product.name}"?`)) {
      try {
        await approveMutation.mutateAsync({ productId: id, notes: "" });
        toast.success("Product approved successfully!");
      } catch (error) {
        toast.error("Failed to approve product: " + (error.response?.data?.message || error.message || "Unknown error"));
      }
    }
  };
  const handleSavePromotionKey = () => {
    const idToUpdate = product?.id || product?._id;
    if (!idToUpdate) {
      toast.error("Cannot update promotion key: missing product ID.");
      return;
    }
    const trimmed = promotionKey.trim();
    updatePromoMutation.mutate(
      {
        id: idToUpdate,
        data: { promotionKey: trimmed || null },
      },
      {
        onSuccess: () => {
          toast.success("Promotion key updated.");
        },
        onError: (error) => {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Failed to update promotion key."
          );
        },
      }
    );
  };

  const attributeKeys = useMemo(() => {
    if (!variants.length) return [];
    const keys = new Set();
    variants.forEach((variant) => {
      if (variant.attributes && Array.isArray(variant.attributes)) {
        variant.attributes.forEach((attr) => {
          if (attr.key) keys.add(attr.key);
        });
      }
    });
    return Array.from(keys);
  }, [variants]);

  if (isLoading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container>
        <ErrorState>
          <FaExclamationTriangle />
          <h3>Product Not Found</h3>
          <p>{error?.message || "The product you're looking for doesn't exist."}</p>
          <BackButton onClick={() => navigate(`/dashboard/${PATHS.PRODUCTS}`)}>
            <FaArrowLeft /> Back to Products
          </BackButton>
        </ErrorState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate(`/dashboard/${PATHS.PRODUCTS}`)}>
            <FaArrowLeft /> Back
          </BackButton>
          <TitleSection>
            <ProductTitle>{product.name}</ProductTitle>
            <ProductId>ID: {product.id || product._id}</ProductId>
          </TitleSection>
        </HeaderLeft>
        <HeaderActions>
          {isPendingApproval && (
            <ApproveButton 
              onClick={handleApproveProduct}
              disabled={approveMutation.isPending}
            >
              <FaCheck /> {approveMutation.isPending ? 'Approving...' : 'Approve Product'}
            </ApproveButton>
          )}
          <ActionButton onClick={() => navigate(`/dashboard/${PATHS.PRODUCTS}`)}>
            <FaEdit /> Edit
          </ActionButton>
          <DeleteButton>
            <FaTrash /> Delete
          </DeleteButton>
        </HeaderActions>
      </Header>

      <ContentGrid>
        {/* Left Column - Images */}
        <ImageSection>
          <MainImageContainer>
            <MainImage
              src={images[selectedImage] || images[0] || "/api/placeholder/600/600"}
              alt={product.name}
            />
          </MainImageContainer>
          {images.length > 1 && (
            <ThumbnailGrid>
              {images.map((img, index) => (
                <Thumbnail
                  key={index}
                  src={img}
                  alt={`${product.name} - Image ${index + 1}`}
                  $active={selectedImage === index}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </ThumbnailGrid>
          )}
        </ImageSection>

        {/* Right Column - Product Info */}
        <InfoSection>
          {/* Basic Info Card */}
          <InfoCard>
            <CardTitle>
              <FaBox /> Product Information
            </CardTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Status</InfoLabel>
                <StatusBadge status={product.status || "active"}>
                  {(product.status || "active").replace("-", " ")}
                </StatusBadge>
              </InfoItem>
              <InfoItem>
                <InfoLabel>SKU</InfoLabel>
                <InfoValue>{product.defaultSku || product.sku || "N/A"}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Price</InfoLabel>
                <InfoValue>GH₵{product.price?.toFixed(2) || "0.00"}</InfoValue>
              </InfoItem>
              {product.compareAtPrice && (
                <InfoItem>
                  <InfoLabel>Compare At Price</InfoLabel>
                  <InfoValue>GH₵{product.compareAtPrice.toFixed(2)}</InfoValue>
                </InfoItem>
              )}
              <InfoItem>
                <InfoLabel>Total Stock</InfoLabel>
                <StockValue $inStock={(product.totalStock || 0) > 0}>
                  {product.totalStock || 0} units
                </StockValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Category</InfoLabel>
                <InfoValue>
                  {product.parentCategory?.name || product.category?.name || "Uncategorized"}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Promotion Key</InfoLabel>
                <PromoRow>
                  <PromoInput
                    type="text"
                    value={promotionKey}
                    onChange={(e) => setPromotionKey(e.target.value)}
                    placeholder="e.g. back-to-school"
                  />
                  <PromoSaveButton
                    type="button"
                    onClick={handleSavePromotionKey}
                    disabled={updatePromoMutation.isPending}
                  >
                    {updatePromoMutation.isPending ? "Saving…" : "Save"}
                  </PromoSaveButton>
                </PromoRow>
                <PromoHelp>
                  Links this product to offers like{" "}
                  <code>/offers/{promotionKey || "<promotionKey>"}</code>.
                </PromoHelp>
              </InfoItem>
            </InfoGrid>
          </InfoCard>

          {/* Seller Info Card */}
          {product.seller && (
            <InfoCard>
              <CardTitle>
                <FaStore /> Seller Information
              </CardTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>Shop Name</InfoLabel>
                  <InfoValue>{product.seller.shopName || "N/A"}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Seller ID</InfoLabel>
                  <InfoValue>
                    {product.seller.id || product.seller._id || "N/A"}
                  </InfoValue>
                </InfoItem>
              </InfoGrid>
            </InfoCard>
          )}

          {/* Variants Section - Redesigned */}
          {attributeKeys.length > 0 && (
            <InfoCard>
              <CardTitle>
                <FaTag /> Product Variants
              </CardTitle>
              <VariantsContainer>
                {attributeKeys.map((attribute) => {
                  const values = [
                    ...new Set(
                      variants
                        .map((v) => v.attributes?.find((a) => a.key === attribute)?.value)
                        .filter(Boolean)
                    ),
                  ];

                  const isColor = attribute.toLowerCase().includes("color");

                  return (
                    <VariantSection key={attribute}>
                      <VariantHeader>
                        <VariantName>{attribute}</VariantName>
                        <VariantHelp>Select one option</VariantHelp>
                      </VariantHeader>
                      
                      <VariantOptionsContainer>
                        {values.map((value) => {
                          const variantStock = variants.find((variant) => {
                            return variant.attributes?.some(
                              (attr) => attr.key === attribute && attr.value === value
                            );
                          })?.stock || 0;

                          const isOutOfStock = variantStock <= 0;
                          const isLowStock = variantStock > 0 && variantStock <= 5;
                          const radioId = `${attribute}-${value}`;
                          const isColorValue = isColor && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);

                          return (
                            <VariantOption key={radioId}>
                              <RadioInput
                                type="radio"
                                id={radioId}
                                name={attribute}
                                value={value}
                                disabled={isOutOfStock}
                              />
                              <VariantLabel 
                                htmlFor={radioId}
                                $isColor={isColorValue}
                                $colorValue={isColorValue ? value : null}
                                $disabled={isOutOfStock}
                                $isLowStock={isLowStock}
                              >
                                {isColorValue ? (
                                  <ColorVariantContent>
                                    <ColorSwatch $color={value}>
                                      <ColorCheckmark>
                                        <FaCheck />
                                      </ColorCheckmark>
                                    </ColorSwatch>
                                    <VariantInfo>
                                      <VariantValue>Color</VariantValue>
                                      <StockIndicator $isOutOfStock={isOutOfStock} $isLowStock={isLowStock}>
                                        {isOutOfStock ? (
                                          <OutOfStock>
                                            <FaTimes /> Out of stock
                                          </OutOfStock>
                                        ) : isLowStock ? (
                                          <LowStock>
                                            <FaExclamationTriangle /> Only {variantStock} left
                                          </LowStock>
                                        ) : (
                                          <InStock>
                                            <FaCheck /> In stock
                                          </InStock>
                                        )}
                                      </StockIndicator>
                                    </VariantInfo>
                                  </ColorVariantContent>
                                ) : (
                                  <TextVariantContent>
                                    <VariantText>{value}</VariantText>
                                    <StockIndicator $isOutOfStock={isOutOfStock} $isLowStock={isLowStock}>
                                      {isOutOfStock ? (
                                        <OutOfStock>
                                          <FaTimes /> Out of stock
                                        </OutOfStock>
                                      ) : isLowStock ? (
                                        <LowStock>
                                          <FaExclamationTriangle /> Only {variantStock} left
                                        </LowStock>
                                      ) : (
                                        <InStock>
                                          <FaCheck /> {variantStock} available
                                        </InStock>
                                      )}
                                    </StockIndicator>
                                  </TextVariantContent>
                                )}
                                
                                <SelectionIndicator>
                                  <SelectionDot />
                                </SelectionIndicator>
                              </VariantLabel>
                            </VariantOption>
                          );
                        })}
                      </VariantOptionsContainer>
                    </VariantSection>
                  );
                })}
              </VariantsContainer>
            </InfoCard>
          )}

          {/* Description Card */}
          {product.description && (
            <InfoCard>
              <CardTitle>Description</CardTitle>
              <Description>{product.description}</Description>
            </InfoCard>
          )}
        </InfoSection>
      </ContentGrid>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
  flex-wrap: wrap;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
`;

const TitleSection = styled.div`
  flex: 1;
`;

const ProductTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
`;

const ProductId = styled.p`
  font-size: 1rem;
  color: #64748b;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #5568d3;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #dc2626;
  }
`;

const ApproveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #10b981;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ImageSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MainImageContainer = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const MainImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbnailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.75rem;
`;

const Thumbnail = styled.img`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  border: 3px solid ${(props) => (props.$active ? "#667eea" : "transparent")};
  transition: all 0.2s;
  object-fit: cover;

  &:hover {
    border-color: #667eea;
    opacity: 0.8;
  }
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InfoCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PromoRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PromoInput = styled.input`
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.6rem 0.85rem;
  font-size: 0.95rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
    outline: none;
  }
`;

const PromoSaveButton = styled.button`
  border: none;
  padding: 0.6rem 0.9rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  background: #111827;
  color: #f9fafb;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease, transform 0.1s ease;

  &:hover:enabled {
    background: #020617;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const PromoHelp = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
`;

const InfoLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  font-size: 1.125rem;
  font-weight: 500;
  color: #1e293b;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${(props) => {
    const status = (props.status || "").toLowerCase();
    if (status === "active") return "#d1fae5";
    if (status === "inactive") return "#fee2e2";
    return "#e0e7ff";
  }};
  color: ${(props) => {
    const status = (props.status || "").toLowerCase();
    if (status === "active") return "#065f46";
    if (status === "inactive") return "#991b1b";
    return "#3730a3";
  }};
`;

const StockValue = styled.span`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${(props) => (props.$inStock ? "#059669" : "#dc2626")};
`;

const Description = styled.p`
  font-size: 1rem;
  line-height: 1.7;
  color: #475569;
  margin: 0;
`;

// New styled components for variants section
const VariantsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const VariantSection = styled.div`
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const VariantHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const VariantName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const VariantHelp = styled.span`
  font-size: 0.875rem;
  color: #64748b;
`;

const VariantOptionsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const VariantOption = styled.div`
  position: relative;
`;

const VariantLabel = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  background: white;
  border: 2px solid ${props => props.$disabled ? '#e2e8f0' : '#e2e8f0'};
  border-radius: 10px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.$disabled ? 0.6 : 1};
  overflow: hidden;

  &:hover {
    border-color: ${props => props.$disabled ? '#e2e8f0' : '#667eea'};
    transform: ${props => props.$disabled ? 'none' : 'translateY(-1px)'};
    box-shadow: ${props => props.$disabled ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.1)'};
  }

  ${props => props.$isLowStock && !props.$disabled && `
    border-left: 4px solid #f59e0b;
  `}

  ${props => props.$disabled && `
    background: #f8fafc;
  `}

  input:checked + & {
    border-color: #667eea;
    background: #f0f4ff;
    
    ${props => props.$isColor && `
      background: white;
    `}
  }
`;

const ColorVariantContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`;

const TextVariantContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const ColorSwatch = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  background-color: ${props => props.$color};
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;

  input:checked + ${VariantLabel} & {
    border-color: #667eea;
    transform: scale(1.05);
  }
`;

const ColorCheckmark = styled.div`
  opacity: 0;
  color: white;
  font-size: 0.75rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  transition: opacity 0.2s ease;

  input:checked + ${VariantLabel} & {
    opacity: 1;
  }
`;

const VariantInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const VariantValue = styled.span`
  font-weight: 500;
  color: #1e293b;
`;

const VariantText = styled.span`
  font-weight: 500;
  color: #1e293b;
  font-size: 0.95rem;
`;

const StockIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
`;

const InStock = styled.span`
  color: #059669;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const LowStock = styled.span`
  color: #d97706;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const OutOfStock = styled.span`
  color: #dc2626;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const SelectionIndicator = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
`;

const SelectionDot = styled.div`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: #e2e8f0;
  transition: all 0.2s ease;

  input:checked + ${VariantLabel} & {
    background: #667eea;
    transform: scale(1.2);
  }
`;

const RadioInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;

  &:focus-visible + label {
    outline: 3px solid #667eea;
    outline-offset: 2px;
  }
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;

  svg {
    font-size: 4rem;
    color: #ef4444;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  p {
    margin: 0 0 2rem 0;
  }
`;