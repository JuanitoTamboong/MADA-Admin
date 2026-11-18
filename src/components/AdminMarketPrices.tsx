import React, { useEffect, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../supabase/supabase-client';

interface MarketPrice {
  id?: string;
  name: string;
  category: 'Crops' | 'Livestock';
  price_range: string;
  trend: string;
  is_positive: boolean;
  image_url: string;
}

export default function AdminMarketPrices() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for the form
  const [currentItem, setCurrentItem] = useState<MarketPrice>({
    category: 'Crops',
    is_positive: true,
    name: '',
    price_range: '',
    trend: '',
    image_url: '',
  });

  // State to hold the selected file and its local preview URL
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const fetchPrices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .order('name');
      
    if (data) setPrices(data);
    setLoading(false);
  };

  useEffect(() => {
    void fetchPrices();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let finalImageUrl = currentItem.image_url;

    try {
      // 1. If a new file is selected, upload it now
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('market-images')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('market-images')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      }

      // 2. Save the data to the database
      const payload = {
        name: currentItem.name,
        category: currentItem.category,
        price_range: currentItem.price_range,
        trend: currentItem.trend,
        is_positive: currentItem.is_positive,
        image_url: finalImageUrl,
      };

      if (currentItem.id) {
        await supabase.from('market_prices').update(payload).eq('id', currentItem.id);
      } else {
        await supabase.from('market_prices').insert([payload]);
      }
      
      closeModal();
      void fetchPrices();
    } catch (error) {
      console.error('Error saving item:', error);
      setUploadError('Failed to save. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this price?')) return;
    await supabase.from('market_prices').delete().eq('id', id);
    void fetchPrices();
  };

  const openNewForm = () => {
    setCurrentItem({
      category: 'Crops',
      is_positive: true,
      name: '',
      price_range: '',
      trend: '',
      image_url: '',
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadError('');
    setIsEditing(true);
  };

  const openEditForm = (item: MarketPrice) => {
    setCurrentItem(item);
    setSelectedFile(null);
    setPreviewUrl(item.image_url || '');
    setUploadError('');
    setIsEditing(true);
  };

  const closeModal = () => {
    setIsEditing(false);
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl); // Clean up memory
    }
    setPreviewUrl('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size must be less than 2MB.');
      return;
    }

    // Revoke old blob url if exists
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file)); // Instant local preview
    setUploadError('');
    
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentItem(prev => ({ ...prev, image_url: '' }));
  };

  return (
    <main className="dashboard-content">
      <div className="card-box">
        <div className="card-header" style={{ marginBottom: '20px' }}>
          <div className="card-title">
            <h3>Manage Market Prices</h3>
          </div>
          <button className="action-pill" onClick={openNewForm}>
            + Add New Price
          </button>
        </div>

        {loading ? (
          <p className="chart-empty-text">Loading...</p>
        ) : prices.length === 0 ? (
          <p className="chart-empty-text">No prices found. Click "Add New Price" to start.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price Range</th>
                <th>Trend</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((item) => (
                <tr key={item.id}>
                  <td className="user-cell">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="table-avatar table-avatar--img"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="table-avatar" style={{ backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={16} color="#94a3b8" />
                      </div>
                    )}
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${item.category === 'Crops' ? 'active' : 'inactive'}`}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{item.price_range}</td>
                  <td style={{ color: item.is_positive ? '#16834d' : '#e45c57', fontWeight: 600 }}>
                    {item.trend}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="view-btn" onClick={() => openEditForm(item)}>
                        Edit
                      </button>
                      <button
                        className="view-btn"
                        style={{ color: '#e45c57', borderColor: '#e45c57' }}
                        onClick={() => handleDelete(item.id!)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isEditing && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            zIndex: 1000, padding: '40px 20px', overflowY: 'auto',
          }}
        >
          <div
            style={{
              backgroundColor: 'white', padding: '24px', borderRadius: '12px',
              width: '100%', maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              margin: 'auto 0',
            }}
          >
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
                  {currentItem.id ? 'Edit' : 'Add'} Market Price
                </h3>
                <button type="button" onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Product Name</label>
                <input required placeholder="e.g. Palay" value={currentItem.name} onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Category</label>
                <select value={currentItem.category} onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value as 'Crops' | 'Livestock' })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}>
                  <option value="Crops">Crops</option>
                  <option value="Livestock">Livestock</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Price Range</label>
                <input required placeholder="e.g. ₱ 18 - 22 /kg" value={currentItem.price_range} onChange={(e) => setCurrentItem({ ...currentItem, price_range: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Trend (e.g. ↑ 2%)</label>
                <input required value={currentItem.trend} onChange={(e) => setCurrentItem({ ...currentItem, trend: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              {/* --- UPDATED IMAGE UPLOAD SECTION --- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Product Image</label>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  
                  {/* Image Preview Box */}
                  <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                    {previewUrl ? (
                      <>
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                        >
                          <X size={12} />
                        </button>
                        
                        {/* Unsaved Indicator */}
                        {selectedFile && (
                          <span style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: 'white', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                            Unsaved
                          </span>
                        )}
                      </>
                    ) : (
                      <div style={{ width: '100%', height: '100%', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94a3b8' }}>
                        <ImageIcon size={24} />
                        <span style={{ fontSize: '0.65rem', marginTop: '4px' }}>No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div style={{ flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{ width: '100%', padding: '10px 16px', borderRadius: '6px', border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontWeight: 500, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                    >
                      <Upload size={16} />
                      {previewUrl ? 'Change Image' : 'Upload Image'}
                    </button>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', margin: 0 }}>
                      Max size: 2MB. JPG, PNG.
                    </p>
                  </div>
                  
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                </div>
                {uploadError && <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px' }}>{uploadError}</span>}
              </div>
              {/* ------------------------------- */}

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer', marginTop: '8px' }}>
                <input type="checkbox" checked={currentItem.is_positive} onChange={(e) => setCurrentItem({ ...currentItem, is_positive: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: '#16834d' }} />
                Price went up (Positive trend)
              </label>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} disabled={uploading} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 500, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={uploading} style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: uploading ? '#9ca3af' : '#16834d', color: 'white', fontWeight: 500, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {uploading ? 'Saving...' : 'Save Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}