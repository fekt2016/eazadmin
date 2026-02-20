import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { useEazShop } from "../../shared/hooks/useEazShop";
import { generateSKU } from "../../shared/utils/helpers";
import ProductForm from "./components/forms/ProductForm";
import { PATHS } from "../../routes/routhPath";

const DASHBOARD_BASE = "/dashboard";
const basePath = `${DASHBOARD_BASE}/${PATHS.EAZSHOP}`;
const EAZSHOP_SELLER = { id: "eazshop" };

export default function EazShopCreateProductPage() {
  const navigate = useNavigate();
  const { useCreateEazShopProduct } = useEazShop();
  const createMutation = useCreateEazShopProduct();

  const handleSubmit = async (data) => {
    const formData = new FormData();

    try {
      if (data.imageCover) {
        formData.append("imageCover", data.imageCover);
      }
      if (data.images && data.images.length > 0) {
        data.images.forEach((file) => {
          if (file instanceof File) formData.append("newImages", file);
        });
      }

      formData.append("name", data.name || "");
      formData.append("brand", data.brand || "");
      formData.append("description", data.description || "");
      formData.append("parentCategory", data.parentCategory || "");
      formData.append("subCategory", data.subCategory || "");

      const totalStock = (data.variants || []).reduce(
        (sum, v) => sum + (parseInt(v.stock, 10) || 0),
        0
      );
      const variantPrices = (data.variants || [])
        .map((v) => parseFloat(v.price) || 0)
        .filter((p) => p > 0);
      if (variantPrices.length === 0) {
        toast.error("At least one variant must have a price greater than 0");
        return;
      }
      const productPrice = Math.min(...variantPrices);
      formData.append("price", productPrice.toString());
      formData.append("totalStock", totalStock.toString());

      const formattedVariants = (data.variants || []).map((variant) => {
        const attributes = (variant.attributes || []).map((attr) => ({
          key: attr.key || "",
          value: attr.value || "N/A",
        }));
        const variantObj = (variant.attributes || []).reduce((acc, attr) => {
          if (attr.key) acc[attr.key] = attr.value || "";
          return acc;
        }, {});
        return {
          ...variant,
          attributes,
          price: variant.price ? Number(variant.price) : 0,
          stock: variant.stock ? Number(variant.stock) : 0,
          sku:
            variant.sku ||
            generateSKU({
              seller: EAZSHOP_SELLER,
              category: data.subCategory || "UNK",
              variants: variantObj,
            }),
          condition: variant.condition || "new",
          images: (variant.images || []).filter((img) => typeof img === "string"),
        };
      });
      formData.append("variants", JSON.stringify(formattedVariants));

      const specifications = {
        material: (data.specifications?.material || []).map((mat) => ({
          value: Array.isArray(mat.value) ? mat.value[0] || "" : (mat.value || ""),
          hexCode: mat.hexCode || "",
        })).filter((mat) => mat.value || mat.hexCode),
        weight: data.specifications?.weight || "",
        dimension: data.specifications?.dimension || "",
      };
      formData.append("specifications", JSON.stringify(specifications));
      formData.append("manufacturer", data.manufacturer || "");

      let warrantyValue = "";
      if (data.warranty != null && data.warranty !== "") {
        if (typeof data.warranty === "string") warrantyValue = data.warranty.trim();
        else if (typeof data.warranty === "object")
          warrantyValue = data.warranty.details || (data.warranty.duration && data.warranty.type ? `${data.warranty.duration} ${data.warranty.type}`.trim() : "") || "";
        else warrantyValue = String(data.warranty).trim();
      }
      formData.append("warranty", warrantyValue);
      formData.append("condition", data.variants?.[0]?.condition || "new");

      await createMutation.mutateAsync(formData);
      toast.success("Saiisai product created");
      navigate(`${basePath}/products`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create product";
      toast.error(msg);
    }
  };

  return (
    <PageContainer>
      <HeaderContainer>
        <BackButton type="button" onClick={() => navigate(`${basePath}/products`)}>
          <FaArrowLeft /> Back to Saiisai products
        </BackButton>
        <PageTitle>Add Saiisai product</PageTitle>
        <HeaderDescription>
          Use the same form as the seller: basic info, category, variants, images, and specifications.
        </HeaderDescription>
      </HeaderContainer>
      <FormContainer>
        <ProductForm
          mode="add"
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          seller={EAZSHOP_SELLER}
        />
      </FormContainer>
    </PageContainer>
  );
}

const PageContainer = styled.div`
  padding: 1.2rem 1.6rem;
  background-color: #f8fafc;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeaderContainer = styled.div`
  margin-bottom: 2.5rem;
  position: relative;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: 400;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e0;
    transform: translateY(-1px);
  }
  svg { font-size: 0.9rem; }
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 500;
  color: #1a202c;
  margin: 1.5rem 0 0.5rem;
`;

const HeaderDescription = styled.p`
  font-size: 1.125rem;
  font-weight: 400;
  color: #718096;
  max-width: 700px;
  line-height: 1.5;
`;

const FormContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;
