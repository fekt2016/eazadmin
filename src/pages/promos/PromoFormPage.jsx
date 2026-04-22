import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import Button from '../../shared/components/Button';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import {
  useAdminPromo,
  useCreateAdminPromo,
  usePromoSlugAvailability,
  useUpdateAdminPromo,
  useUploadPromoBanner,
} from '../../shared/hooks/useAdminPromos';
import { getOptimizedImageUrl, IMAGE_SLOTS } from '../../shared/utils/cloudinaryConfig';

const PROMO_TYPES = [
  { value: 'flash', label: 'Flash Deal' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'seasonal', label: 'Seasonal' },
];

const toSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const toLocalDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toIsoDate = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
};

const durationLabel = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  if (end <= start) return 'End must be after start';

  const hoursTotal = Math.floor((end.getTime() - start.getTime()) / 3600000);
  const days = Math.floor(hoursTotal / 24);
  const hours = hoursTotal % 24;

  const dayLabel = days > 0 ? `${days} day${days > 1 ? 's' : ''}` : '';
  const hourLabel = `${hours} hour${hours !== 1 ? 's' : ''}`;
  return `Runs for ${dayLabel ? `${dayLabel}, ` : ''}${hourLabel}`;
};

const getPromoPayload = (formState) => ({
  name: formState.name.trim(),
  slug: formState.slug.trim(),
  description: formState.description.trim(),
  type: formState.type,
  startDate: toIsoDate(formState.startDate),
  endDate: toIsoDate(formState.endDate),
  minDiscountPercent: Number(formState.minDiscountPercent),
  maxProductsPerSeller: Number(formState.maxProductsPerSeller),
  showCountdown: Boolean(formState.showCountdown),
  showOnHomepage: Boolean(formState.showOnHomepage),
  featuredSlot:
    formState.featuredSlot === '' ? null : Number(formState.featuredSlot),
  eligibleCategories: formState.eligibleCategories
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  banner: formState.banner,
});

const initialState = {
  name: '',
  slug: '',
  description: '',
  type: 'campaign',
  startDate: '',
  endDate: '',
  minDiscountPercent: 10,
  maxProductsPerSeller: 5,
  eligibleCategories: '',
  showCountdown: false,
  showOnHomepage: false,
  featuredSlot: '',
  banner: { url: '', public_id: '' },
};

export default function PromoFormPage({ mode = 'create' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === 'edit';

  const [formState, setFormState] = useState(initialState);
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState(null);

  const { data: promo, isLoading: isPromoLoading } = useAdminPromo(id);
  const createPromoMutation = useCreateAdminPromo();
  const updatePromoMutation = useUpdateAdminPromo();
  const checkSlugMutation = usePromoSlugAvailability();
  const uploadBannerMutation = useUploadPromoBanner();

  useEffect(() => {
    if (!isEdit || !promo) return;
    setFormState({
      name: promo.name || '',
      slug: promo.slug || '',
      description: promo.description || '',
      type: promo.type || 'campaign',
      startDate: toLocalDateTime(promo.startDate),
      endDate: toLocalDateTime(promo.endDate),
      minDiscountPercent: promo.minDiscountPercent ?? 10,
      maxProductsPerSeller: promo.maxProductsPerSeller ?? 5,
      eligibleCategories: Array.isArray(promo.eligibleCategories)
        ? promo.eligibleCategories
            .map((cat) => (typeof cat === 'string' ? cat : cat?._id))
            .filter(Boolean)
            .join(', ')
        : '',
      showCountdown:
        typeof promo.showCountdown === 'boolean'
          ? promo.showCountdown
          : promo.type === 'flash',
      showOnHomepage: Boolean(promo.showOnHomepage),
      featuredSlot: promo.featuredSlot ?? '',
      banner: {
        url: promo?.banner?.url || '',
        public_id: promo?.banner?.public_id || '',
      },
    });
    setIsSlugEdited(true);
  }, [isEdit, promo]);

  const duration = useMemo(
    () => durationLabel(formState.startDate, formState.endDate),
    [formState.startDate, formState.endDate],
  );

  const isSubmitting =
    createPromoMutation.isPending || updatePromoMutation.isPending;

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormState((prev) => {
      const next = { ...prev, [name]: nextValue };
      if (name === 'name' && !isSlugEdited) {
        next.slug = toSlug(value);
      }
      if (name === 'type' && !isEdit) {
        next.showCountdown = value === 'flash';
      }
      return next;
    });
  };

  const handleSlugChange = (event) => {
    setIsSlugEdited(true);
    setIsSlugAvailable(null);
    setFormState((prev) => ({
      ...prev,
      slug: toSlug(event.target.value),
    }));
  };

  const handleSlugBlur = async () => {
    const slug = formState.slug.trim();
    if (!slug) return;
    try {
      const response = await checkSlugMutation.mutateAsync(slug);
      const available =
        response?.available ??
        response?.isAvailable ??
        response?.data?.available ??
        true;
      setIsSlugAvailable(Boolean(available));
      if (!available) {
        toast.error('Slug already exists. Try another one.');
      }
    } catch (error) {
      setIsSlugAvailable(null);
    }
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadBannerMutation.mutateAsync(file);
      const bannerUrl =
        response?.banner?.url ||
        response?.url ||
        response?.imageUrl ||
        response?.data?.banner?.url;
      const publicId =
        response?.banner?.public_id ||
        response?.public_id ||
        response?.data?.banner?.public_id ||
        '';

      if (!bannerUrl) {
        toast.error('Banner upload failed. Please try again.');
        return;
      }

      setFormState((prev) => ({
        ...prev,
        banner: { url: bannerUrl, public_id: publicId },
      }));
      toast.success('Banner uploaded successfully');
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to upload banner',
      );
    } finally {
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      toast.error('Promo name is required');
      return;
    }
    if (!formState.slug.trim()) {
      toast.error('Promo slug is required');
      return;
    }
    if (!formState.startDate || !formState.endDate) {
      toast.error('Start and end date are required');
      return;
    }
    if (new Date(formState.endDate) <= new Date(formState.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    const payload = getPromoPayload(formState);
    try {
      if (isEdit) {
        await updatePromoMutation.mutateAsync({ id, payload });
        toast.success('Promo updated successfully');
      } else {
        await createPromoMutation.mutateAsync(payload);
        toast.success('Promo created successfully');
      }
      navigate('/dashboard/promos');
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEdit ? 'update' : 'create'} promo`,
      );
    }
  };

  if (isEdit && isPromoLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Page>
      <HeaderRow>
        <div>
          <Title>{isEdit ? 'Edit Promo' : 'Create Promo'}</Title>
          <Subtitle>
            Configure campaign details, schedule, and promo rules.
          </Subtitle>
        </div>
      </HeaderRow>

      <Card as='form' onSubmit={handleSubmit}>
        <Section>
          <SectionTitle>Basics</SectionTitle>
          <Grid>
            <Field>
              <Label htmlFor='promo-name'>Name</Label>
              <Input
                id='promo-name'
                name='name'
                value={formState.name}
                onChange={handleFieldChange}
                placeholder='Easter Mega Campaign'
                required
              />
            </Field>
            <Field>
              <Label htmlFor='promo-slug'>Slug</Label>
              <Input
                id='promo-slug'
                name='slug'
                value={formState.slug}
                onChange={handleSlugChange}
                onBlur={handleSlugBlur}
                placeholder='easter-mega-campaign'
                required
              />
              {isSlugAvailable === false && (
                <HelperText $variant='danger'>Slug is already taken.</HelperText>
              )}
              {isSlugAvailable === true && (
                <HelperText $variant='success'>Slug is available.</HelperText>
              )}
            </Field>
          </Grid>

          <Field>
            <Label htmlFor='promo-description'>Description</Label>
            <TextArea
              id='promo-description'
              name='description'
              value={formState.description}
              onChange={handleFieldChange}
              placeholder='Short details about this promo campaign'
            />
          </Field>

          <RadioGroup>
            {PROMO_TYPES.map((option) => (
              <RadioLabel key={option.value}>
                <input
                  type='radio'
                  name='type'
                  value={option.value}
                  checked={formState.type === option.value}
                  onChange={handleFieldChange}
                />
                {option.label}
              </RadioLabel>
            ))}
          </RadioGroup>
        </Section>

        <Section>
          <SectionTitle>Schedule</SectionTitle>
          <Grid>
            <Field>
              <Label htmlFor='promo-start-date'>Start date and time</Label>
              <Input
                id='promo-start-date'
                name='startDate'
                type='datetime-local'
                value={formState.startDate}
                onChange={handleFieldChange}
                required
              />
            </Field>
            <Field>
              <Label htmlFor='promo-end-date'>End date and time</Label>
              <Input
                id='promo-end-date'
                name='endDate'
                type='datetime-local'
                value={formState.endDate}
                onChange={handleFieldChange}
                required
              />
            </Field>
          </Grid>
          {duration && <HelperText>{duration}</HelperText>}
        </Section>

        <Section>
          <SectionTitle>Rules</SectionTitle>
          <Grid>
            <Field>
              <Label htmlFor='promo-min-discount'>Min discount (%)</Label>
              <Input
                id='promo-min-discount'
                name='minDiscountPercent'
                type='number'
                min='1'
                max='90'
                value={formState.minDiscountPercent}
                onChange={handleFieldChange}
              />
            </Field>
            <Field>
              <Label htmlFor='promo-max-products'>Max products per seller</Label>
              <Input
                id='promo-max-products'
                name='maxProductsPerSeller'
                type='number'
                min='1'
                value={formState.maxProductsPerSeller}
                onChange={handleFieldChange}
              />
            </Field>
          </Grid>
          <Field>
            <Label htmlFor='promo-eligible-categories'>
              Eligible category IDs
            </Label>
            <TextArea
              id='promo-eligible-categories'
              name='eligibleCategories'
              value={formState.eligibleCategories}
              onChange={handleFieldChange}
              placeholder='Comma-separated category IDs. Leave empty for all.'
            />
          </Field>
          <Grid>
            <CheckboxRow>
              <input
                type='checkbox'
                name='showCountdown'
                checked={formState.showCountdown}
                onChange={handleFieldChange}
              />
              Show countdown
            </CheckboxRow>
            <CheckboxRow>
              <input
                type='checkbox'
                name='showOnHomepage'
                checked={formState.showOnHomepage}
                onChange={handleFieldChange}
              />
              Show on homepage
            </CheckboxRow>
          </Grid>
          <Field>
            <Label htmlFor='promo-featured-slot'>Featured slot (optional)</Label>
            <Input
              id='promo-featured-slot'
              name='featuredSlot'
              type='number'
              min='1'
              value={formState.featuredSlot}
              onChange={handleFieldChange}
              placeholder='1'
            />
          </Field>
        </Section>

        <Section>
          <SectionTitle>Banner</SectionTitle>
          <Field>
            <Label htmlFor='promo-banner-upload'>Upload banner image</Label>
            <Input
              id='promo-banner-upload'
              type='file'
              accept='image/*'
              onChange={handleBannerUpload}
            />
          </Field>
          {formState.banner?.url && (
            <BannerPreview
              src={getOptimizedImageUrl(
                formState.banner.url,
                IMAGE_SLOTS.HOME_HERO,
              )}
              alt={formState.name || 'Promo banner'}
            />
          )}
        </Section>

        <ActionRow>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate('/dashboard/promos')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='submit' loading={isSubmitting}>
            {isEdit ? 'Update Promo' : 'Create Promo'}
          </Button>
        </ActionRow>
      </Card>
    </Page>
  );
}

const Page = styled.div`
  display: grid;
  gap: 1rem;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.35rem;
  color: #111827;
`;

const Subtitle = styled.p`
  margin: 0.3rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

const Card = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  display: grid;
  gap: 1rem;
`;

const Section = styled.div`
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
  display: grid;
  gap: 0.75rem;

  &:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: #111827;
`;

const Grid = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const Field = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const Label = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #111827;
  font-size: 0.85rem;
  padding: 0.6rem 0.75rem;

  &:focus {
    outline: none;
    border-color: #e8920a;
    box-shadow: 0 0 0 3px rgba(232, 146, 10, 0.15);
  }
`;

const TextArea = styled.textarea`
  min-height: 80px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #111827;
  font-size: 0.85rem;
  padding: 0.6rem 0.75rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #e8920a;
    box-shadow: 0 0 0 3px rgba(232, 146, 10, 0.15);
  }
`;

const HelperText = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${({ $variant }) =>
    $variant === 'danger'
      ? '#b91c1c'
      : $variant === 'success'
        ? '#047857'
        : '#6b7280'};
`;

const RadioGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const RadioLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #374151;
`;

const CheckboxRow = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: #374151;
`;

const BannerPreview = styled.img`
  width: 100%;
  max-height: 180px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
`;
