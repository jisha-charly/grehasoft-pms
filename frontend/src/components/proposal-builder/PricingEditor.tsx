import React from 'react';
import { useProposalBuilderContext } from './ProposalBuilderContext';

const PricingEditor: React.FC = () => {
  const { builderConfig, setBuilderConfig, setUnsavedChanges, validationErrors } = useProposalBuilderContext();
  const pricing = builderConfig.pricing || { items: [], subtotal: 0, discount: 0, amount: 0 };
  const items = pricing.items || [];

  const handleItemChange = (index: number, field: string, value: any) => {
    const list = [...items];
    list[index] = {
      ...list[index],
      [field]: value
    };

    // Calculate item cost
    const qty = Number(list[index].qty) || 1;
    const rate = Number(list[index].rate || list[index].cost) || 0;
    const itemDisc = Number(list[index].discount) || 0;
    const itemTax = Number(list[index].tax) || 0;
    list[index].cost = (qty * rate) - itemDisc + itemTax;

    const sub = list.reduce((sum, item) => sum + ((Number(item.qty) || 1) * (Number(item.rate || item.cost) || 0)), 0);
    const amt = sub - Number(pricing.discount || 0);

    setBuilderConfig((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        items: list,
        subtotal: sub,
        amount: amt
      }
    }));
    setUnsavedChanges(true);
  };

  const handleAddItem = () => {
    const list = [...items, { service: '', description: '', cost: 0, qty: 1, rate: 0, discount: 0, tax: 0 }];
    const sub = list.reduce((sum, item) => sum + ((Number(item.qty) || 1) * (Number(item.rate || item.cost) || 0)), 0);
    const amt = sub - Number(pricing.discount || 0);

    setBuilderConfig((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        items: list,
        subtotal: sub,
        amount: amt
      }
    }));
    setUnsavedChanges(true);
  };

  const handleRemoveItem = (index: number) => {
    const list = items.filter((_, i) => i !== index);
    const sub = list.reduce((sum, item) => sum + ((Number(item.qty) || 1) * (Number(item.rate || item.cost) || 0)), 0);
    const amt = sub - Number(pricing.discount || 0);

    setBuilderConfig((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        items: list,
        subtotal: sub,
        amount: amt
      }
    }));
    setUnsavedChanges(true);
  };

  const handleDiscountChange = (val: number) => {
    const sub = pricing.subtotal || 0;
    setBuilderConfig((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        discount: val,
        amount: sub - val
      }
    }));
    setUnsavedChanges(true);
  };

  return (
    <div className="text-start">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label small fw-bold text-dark mb-0">Pricing Items</label>
        <button type="button" className="btn btn-xs btn-outline-primary py-1 text-dark" onClick={handleAddItem}>
          + Add Row
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-sm align-middle mb-0">
          <thead>
            <tr className="table-light smaller text-center">
              <th>Service / Item</th>
              <th style={{ width: '65px' }}>Qty</th>
              <th style={{ width: '65px' }}>Unit</th>
              <th style={{ width: '100px' }}>Rate (₹)</th>
              <th style={{ width: '90px' }}>Disc (₹)</th>
              <th style={{ width: '90px' }}>Tax (₹)</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm border-0 bg-transparent fw-bold text-dark p-1"
                    value={item.service || ''}
                    onChange={(e) => handleItemChange(idx, 'service', e.target.value)}
                    placeholder="e.g. Frontend Development"
                  />
                  <input
                    type="text"
                    className="form-control border-0 bg-transparent text-muted smaller py-0 px-1 mt-0.5"
                    value={item.description || ''}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    placeholder="Details..."
                    style={{ fontSize: '11px' }}
                  />
                  {validationErrors[`pricing_item_${idx}_service`] && (
                    <div className="text-danger small px-1">{validationErrors[`pricing_item_${idx}_service`]}</div>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm border-0 bg-transparent text-center text-dark p-1"
                    value={item.qty ?? 1}
                    onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm border-0 bg-transparent text-center text-dark p-1"
                    value={item.unit || 'hr'}
                    placeholder="Unit"
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm border-0 bg-transparent text-end text-dark p-1"
                    value={item.rate ?? item.cost ?? 0}
                    onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                  />
                  {validationErrors[`pricing_item_${idx}_cost`] && (
                    <div className="text-danger small px-1">{validationErrors[`pricing_item_${idx}_cost`]}</div>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm border-0 bg-transparent text-end text-dark p-1"
                    value={item.discount ?? 0}
                    onChange={(e) => handleItemChange(idx, 'discount', Number(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm border-0 bg-transparent text-end text-dark p-1"
                    value={item.tax ?? 0}
                    onChange={(e) => handleItemChange(idx, 'tax', Number(e.target.value))}
                  />
                </td>
                <td className="text-center">
                  <button type="button" className="btn btn-link text-danger p-0" onClick={() => handleRemoveItem(idx)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-light">
              <td colSpan={6} className="text-end fw-bold smaller">Subtotal:</td>
              <td className="text-end fw-bold smaller">₹{(pricing.subtotal || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td colSpan={6} className="text-end fw-bold smaller">Discount:</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm border-0 bg-transparent text-end text-dark font-monospace fw-bold p-1"
                  value={pricing.discount ?? 0}
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                />
                {validationErrors.pricing_discount && (
                  <div className="text-danger small text-end">{validationErrors.pricing_discount}</div>
                )}
              </td>
            </tr>
            <tr className="table-primary fw-bold text-primary-emphasis">
              <td colSpan={6} className="text-end">Grand Total:</td>
              <td className="text-end">₹{(pricing.amount || 0).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PricingEditor;
