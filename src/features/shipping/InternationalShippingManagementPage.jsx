import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaCheck,
  FaGlobeAmericas,
  FaBoxOpen,
  FaPercent,
} from 'react-icons/fa';
import { internationalShippingManagementService } from '../../shared/services/internationalShippingManagementApi';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0;
`;

const TabButton = styled.button`
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 500;
  border: none;
  background: ${({ $active }) => ($active ? '#fff' : 'transparent')};
  color: ${({ $active }) => ($active ? '#4361ee' : '#6b7280')};
  border-bottom: 2px solid ${({ $active }) => ($active ? '#4361ee' : 'transparent')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #4361ee;
  }
`;

const PageContainer = styled.div`
  padding: 1.5rem;
  max-width: 900px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  label {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.35rem;
  }
  input, select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  input:focus, select:focus {
    outline: none;
    border-color: #4361ee;
    box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;

  &.primary {
    background: #4361ee;
    color: #fff;
    &:hover { background: #3651d4; }
  }
  &.secondary {
    background: #e5e7eb;
    color: #374151;
    &:hover { background: #d1d5db; }
  }
  &.danger {
    background: #ef4444;
    color: #fff;
    &:hover { background: #dc2626; }
  }
  &.sm {
    padding: 0.35rem 0.6rem;
    font-size: 0.8rem;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }
  th {
    font-weight: 600;
    color: #374151;
    background: #f9fafb;
  }
  tr:hover td {
    background: #f9fafb;
  }
`;

const ToggleSwitch = styled.label`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  input {
    width: 2.5rem;
    height: 1.25rem;
    margin-right: 0.5rem;
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const SuccessMessage = styled.div`
  color: #059669;
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const WeightRangeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 0.75rem;
  align-items: end;
  margin-bottom: 0.75rem;
`;

const DEFAULT_WEIGHT_RANGE = { minWeight: 0, maxWeight: 1, shippingCost: 0 };

const CountryForm = ({ country, config, onSave, isLoading, error }) => {
  const [form, setForm] = useState({
    weightRanges: [DEFAULT_WEIGHT_RANGE],
    defaultImportDutyRate: 0.3,
    clearingFee: 0,
    localDeliveryFee: 0,
    customsBufferPercent: 5,
    isActive: true,
  });

  useEffect(() => {
    if (config) {
      setForm({
        weightRanges: config.weightRanges?.length
          ? config.weightRanges
          : [DEFAULT_WEIGHT_RANGE],
        defaultImportDutyRate: config.defaultImportDutyRate ?? 0.3,
        clearingFee: config.clearingFee ?? 0,
        localDeliveryFee: config.localDeliveryFee ?? 0,
        customsBufferPercent: config.customsBufferPercent ?? 5,
        isActive: config.isActive !== false,
      });
    } else {
      setForm({
        weightRanges: [DEFAULT_WEIGHT_RANGE],
        defaultImportDutyRate: 0.3,
        clearingFee: 0,
        localDeliveryFee: 0,
        customsBufferPercent: 5,
        isActive: true,
      });
    }
  }, [config]);

  const updateWeightRange = (idx, field, value) => {
    const next = [...form.weightRanges];
    next[idx] = { ...next[idx], [field]: Number(value) || 0 };
    setForm((f) => ({ ...f, weightRanges: next }));
  };

  const addWeightRange = () => {
    const last = form.weightRanges[form.weightRanges.length - 1];
    const nextMin = last ? (last.maxWeight || 0) + 0.1 : 0;
    setForm((f) => ({
      ...f,
      weightRanges: [...f.weightRanges, { minWeight: nextMin, maxWeight: nextMin + 5, shippingCost: 0 }],
    }));
  };

  const removeWeightRange = (idx) => {
    if (form.weightRanges.length <= 1) return;
    setForm((f) => ({
      ...f,
      weightRanges: f.weightRanges.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <h3 style={{ marginBottom: '1rem' }}>Weight Ranges (kg → GH₵)</h3>
        {form.weightRanges.map((r, idx) => (
          <WeightRangeRow key={idx}>
            <FormGroup>
              <label>Min (kg)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={r.minWeight}
                onChange={(e) => updateWeightRange(idx, 'minWeight', e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <label>Max (kg)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={r.maxWeight}
                onChange={(e) => updateWeightRange(idx, 'maxWeight', e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <label>Shipping Cost (GH₵)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={r.shippingCost}
                onChange={(e) => updateWeightRange(idx, 'shippingCost', e.target.value)}
              />
            </FormGroup>
            <Button type="button" className="secondary sm" onClick={() => removeWeightRange(idx)} disabled={form.weightRanges.length <= 1}>
              <FaTrash />
            </Button>
          </WeightRangeRow>
        ))}
        <Button type="button" className="secondary" onClick={addWeightRange} style={{ marginBottom: '1rem' }}>
          <FaPlus /> Add range
        </Button>

        <FormRow>
          <FormGroup>
            <label>Default Import Duty Rate (0–1, e.g. 0.3 = 30%)</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={form.defaultImportDutyRate}
              onChange={(e) => setForm((f) => ({ ...f, defaultImportDutyRate: Number(e.target.value) || 0 }))}
            />
          </FormGroup>
          <FormGroup>
            <label>Clearing Fee (GH₵)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.clearingFee}
              onChange={(e) => setForm((f) => ({ ...f, clearingFee: Number(e.target.value) || 0 }))}
            />
          </FormGroup>
          <FormGroup>
            <label>Local Delivery Fee (GH₵)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.localDeliveryFee}
              onChange={(e) => setForm((f) => ({ ...f, localDeliveryFee: Number(e.target.value) || 0 }))}
            />
          </FormGroup>
          <FormGroup>
            <label>Customs Buffer %</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={form.customsBufferPercent}
              onChange={(e) => setForm((f) => ({ ...f, customsBufferPercent: Number(e.target.value) || 0 }))}
            />
          </FormGroup>
        </FormRow>

        <FormGroup>
          <ToggleSwitch>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span>Active (enable shipping from {country})</span>
          </ToggleSwitch>
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div style={{ marginTop: '1rem' }}>
          <Button type="submit" className="primary" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : <FaSave />}
            Save {country} Settings
          </Button>
        </div>
      </Card>
    </form>
  );
};

const DutyByCategoryTab = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editRate, setEditRate] = useState(0);
  const [newCategory, setNewCategory] = useState('');
  const [newRate, setNewRate] = useState(0.3);
  const [message, setMessage] = useState({ type: null, text: '' });

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['international-shipping-duty'],
    queryFn: internationalShippingManagementService.getDutyByCategory,
  });

  const createMutation = useMutation({
    mutationFn: (data) => internationalShippingManagementService.createDutyByCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['international-shipping-duty']);
      setNewCategory('');
      setNewRate(0.3);
      setMessage({ type: 'success', text: 'Category added' });
      setTimeout(() => setMessage({ type: null, text: '' }), 3000);
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to add' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dutyRate }) => internationalShippingManagementService.updateDutyByCategory(id, { dutyRate }),
    onSuccess: () => {
      queryClient.invalidateQueries(['international-shipping-duty']);
      setEditingId(null);
      setMessage({ type: 'success', text: 'Updated' });
      setTimeout(() => setMessage({ type: null, text: '' }), 3000);
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to update' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: internationalShippingManagementService.deleteDutyByCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['international-shipping-duty']);
      setMessage({ type: 'success', text: 'Deleted' });
      setTimeout(() => setMessage({ type: null, text: '' }), 3000);
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to delete' });
    },
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    createMutation.mutate({ category: newCategory.trim(), dutyRate: Number(newRate) });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <Card>
        <h3 style={{ marginBottom: '1rem' }}>Add Category Duty Rate</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
          <FormGroup>
            <label>Category (e.g. electronics, fashion)</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="electronics"
            />
          </FormGroup>
          <FormGroup>
            <label>Duty Rate (0–1)</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={newRate}
              onChange={(e) => setNewRate(Number(e.target.value))}
            />
          </FormGroup>
          <Button type="submit" className="primary" disabled={createMutation.isPending || !newCategory.trim()}>
            <FaPlus /> Add
          </Button>
        </form>
        {message.text && (
          message.type === 'error' ? <ErrorMessage>{message.text}</ErrorMessage> : <SuccessMessage>{message.text}</SuccessMessage>
        )}
      </Card>

      <Card>
        <h3 style={{ marginBottom: '1rem' }}>Category Duty Rates</h3>
        {rates.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No category-specific duty rates. Default rate from country config will be used.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Duty Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r._id}>
                  <td>{r.category}</td>
                  <td>
                    {editingId === r._id ? (
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={editRate}
                        onChange={(e) => setEditRate(Number(e.target.value))}
                        style={{ width: 80 }}
                      />
                    ) : (
                      `${((r.dutyRate || 0) * 100).toFixed(1)}%`
                    )}
                  </td>
                  <td>
                    {editingId === r._id ? (
                      <>
                        <Button className="primary sm" onClick={() => updateMutation.mutate({ id: r._id, dutyRate: editRate })}>
                          <FaCheck />
                        </Button>
                        <Button className="secondary sm" onClick={() => setEditingId(null)}>
                          <FaTimes />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button className="secondary sm" onClick={() => { setEditingId(r._id); setEditRate(r.dutyRate || 0); }}>
                          <FaEdit />
                        </Button>
                        <Button className="danger sm" onClick={() => deleteMutation.mutate(r._id)}>
                          <FaTrash />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};

const InternationalShippingManagementPage = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState('china');
  const [message, setMessage] = useState({ type: null, text: '' });

  const queryClient = useQueryClient();

  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['international-shipping-configs'],
    queryFn: internationalShippingManagementService.getConfigs,
  });

  const chinaConfig = configs.find((c) => c.country === 'China');
  const usaConfig = configs.find((c) => c.country === 'USA');

  const updateMutation = useMutation({
    mutationFn: ({ country, data }) =>
      internationalShippingManagementService.updateConfig(country, data),
    onSuccess: (_, { country }) => {
      queryClient.invalidateQueries(['international-shipping-configs']);
      setMessage({ type: 'success', text: `${country} settings saved` });
      setTimeout(() => setMessage({ type: null, text: '' }), 3000);
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to save' });
    },
  });

  const createMutation = useMutation({
    mutationFn: ({ country, data }) =>
      internationalShippingManagementService.createConfig({ country, ...data }),
    onSuccess: (_, { country }) => {
      queryClient.invalidateQueries(['international-shipping-configs']);
      setMessage({ type: 'success', text: `${country} config created` });
      setTimeout(() => setMessage({ type: null, text: '' }), 3000);
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to create' });
    },
  });

  const handleSave = useCallback(
    (country, formData) => {
      const config = country === 'China' ? chinaConfig : usaConfig;
      if (config) {
        updateMutation.mutate({ country, data: formData });
      } else {
        createMutation.mutate({ country, data: formData });
      }
    },
    [chinaConfig, usaConfig, updateMutation, createMutation]
  );

  if (configsLoading && activeTab !== 'duty') {
    return <LoadingSpinner />;
  }

  return (
    <PageContainer>
      {!embedded && (
        <>
          <h1 style={{ marginBottom: '0.5rem' }}>International Shipping Management</h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Configure shipping from China/USA to Ghana: weight-based pricing, import duty, fees, and customs buffer.
          </p>
        </>
      )}

      <TabsContainer>
        <TabButton $active={activeTab === 'china'} onClick={() => setActiveTab('china')}>
          <FaGlobeAmericas /> China Settings
        </TabButton>
        <TabButton $active={activeTab === 'usa'} onClick={() => setActiveTab('usa')}>
          <FaGlobeAmericas /> USA Settings
        </TabButton>
        <TabButton $active={activeTab === 'duty'} onClick={() => setActiveTab('duty')}>
          <FaPercent /> Import Duty by Category
        </TabButton>
      </TabsContainer>

      {message.text && (
        message.type === 'error' ? (
          <ErrorMessage>{message.text}</ErrorMessage>
        ) : (
          <SuccessMessage>{message.text}</SuccessMessage>
        )
      )}

      {activeTab === 'china' && (
        <CountryForm
          country="China"
          config={chinaConfig}
          onSave={(form) => handleSave('China', form)}
          isLoading={updateMutation.isPending || createMutation.isPending}
          error={message.type === 'error' ? message.text : null}
        />
      )}
      {activeTab === 'usa' && (
        <CountryForm
          country="USA"
          config={usaConfig}
          onSave={(form) => handleSave('USA', form)}
          isLoading={updateMutation.isPending || createMutation.isPending}
          error={message.type === 'error' ? message.text : null}
        />
      )}
      {activeTab === 'duty' && <DutyByCategoryTab />}
    </PageContainer>
  );
};

export default InternationalShippingManagementPage;
