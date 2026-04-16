import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Gift, Image as ImageIcon, Plus, Trash2, PowerOff, Power } from 'lucide-react';
import { getAdminProducts, addProduct, updateProductStatus, deleteProduct } from '../api';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Product State
  const [name, setName] = useState('');
  const [pointsReq, setPointsReq] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [adding, setAdding] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('圖片大小不能超過 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pointsReq || !imageBase64) {
      alert('請填寫完整資訊並上傳圖片');
      return;
    }

    setAdding(true);
    try {
      await addProduct({ name, points_required: parseInt(pointsReq), image_base64: imageBase64 });
      alert('商品上架成功！');
      setName('');
      setPointsReq('');
      setImageBase64('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchProducts();
    } catch (err: any) {
      alert(err.message || '上架失敗');
    } finally {
      setAdding(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: number) => {
    try {
      await updateProductStatus(id, currentStatus === 1 ? false : true);
      fetchProducts();
    } catch (err) {
      alert('狀態更新失敗');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要永久刪除此商品嗎？')) return;
    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (err) {
      alert('刪除失敗');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 style={{ fontSize: '1.875rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Gift color="var(--primary-color)" /> 商品管理 (上架/下架)
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> 新增商品
          </h2>
          <form onSubmit={handleAddProduct}>
            <div className="input-group">
              <label>商品名稱</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="例如：星巴克咖啡兌換券" />
            </div>
            <div className="input-group">
              <label>所需兌換點數</label>
              <input type="number" min="1" required value={pointsReq} onChange={e => setPointsReq(e.target.value)} placeholder="例如：100" />
            </div>
            <div className="input-group">
              <label>上傳商品圖片 (將轉換為 Base64 永久儲存)</label>
              <div 
                style={{ border: '2px dashed var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', position: 'relative' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imageBase64 ? (
                  <img src={imageBase64} alt="Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>
                    <ImageIcon size={32} style={{ margin: '0 auto 0.5rem' }} />
                    <p>點擊選擇圖片 (建議比例 1:1, 小於 2MB)</p>
                  </div>
                )}
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={adding}>
              {adding ? '上架中...' : '確認上架商品'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>已建檔商品列表</h2>
          {loading ? (
            <div>載入中...</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>目前尚無商品。</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {products.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: p.is_active === 1 ? 'white' : '#f8fafc', opacity: p.is_active === 1 ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img src={p.image_base64} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                    <div>
                      <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                        {p.name}
                        {p.is_active === 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--danger-color)', color: 'white', borderRadius: '9999px' }}>已下架</span>}
                      </h3>
                      <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{p.points_required} 點</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => toggleStatus(p.id, p.is_active)}
                      className="btn" 
                      style={{ padding: '0.5rem', background: p.is_active === 1 ? '#fff1f2' : '#ecfdf5', color: p.is_active === 1 ? 'var(--danger-color)' : 'var(--success-color)', border: `1px solid ${p.is_active === 1 ? '#fecdd3' : '#a7f3d0'}` }}
                      title={p.is_active === 1 ? '設為下架' : '重新上架'}
                    >
                      {p.is_active === 1 ? <PowerOff size={18} /> : <Power size={18} />}
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="btn" style={{ padding: '0.5rem', background: '#f1f5f9', color: 'var(--text-secondary)' }}
                      title="永久刪除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
