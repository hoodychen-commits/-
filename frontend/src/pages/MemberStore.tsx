import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Award, AlertCircle, Gift } from 'lucide-react';
import { getProducts, redeemProduct, getProfile } from '../api';

export default function MemberStore() {
  const [products, setProducts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      const [prodRes, profRes] = await Promise.all([getProducts(), getProfile()]);
      setProducts(prodRes);
      setProfile(profRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = async (productId: number, productName: string, requiredPoints: number) => {
    if (profile.points < requiredPoints) {
      setMessage({ text: '點數不足，無法兌換！', type: 'error' });
      return;
    }

    if (!window.confirm(`確定要花費 ${requiredPoints} 點兌換「${productName}」嗎？`)) return;

    setRedeemingId(productId);
    setMessage({ text: '', type: '' });
    try {
      await redeemProduct(productId);
      setMessage({ text: `成功兌換「${productName}」！`, type: 'success' });
      fetchData(); // Refresh points and products
    } catch (err: any) {
      setMessage({ text: err.message || '兌換失敗', type: 'error' });
    } finally {
      setRedeemingId(null);
    }
  };

  if (loading) return <div>載入中...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag color="var(--primary-color)" /> 點數商城
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>挑選您喜愛的商品進行兌換</p>
        </div>
        <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>您的點數</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Award size={24} /> {profile.points}
          </span>
        </div>
      </div>

      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', background: message.type === 'error' ? '#fef2f2' : '#d1fae5', color: message.type === 'error' ? '#b91c1c' : '#047857' }}
        >
          <AlertCircle size={20} /> {message.text}
        </motion.div>
      )}

      {products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          目前沒有可兌換的商品。
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <AnimatePresence>
            {products.map(product => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                key={product.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ height: '200px', width: '100%', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {product.image_base64 ? (
                    <img src={product.image_base64} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Gift size={48} color="#cbd5e1" />
                  )}
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{product.name}</h3>
                  <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
                    <Award size={20} /> {product.points_required} 點
                  </div>
                  <div style={{ marginTop: 'auto' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                      disabled={redeemingId === product.id || profile.points < product.points_required}
                      onClick={() => handleRedeem(product.id, product.name, product.points_required)}
                    >
                      {redeemingId === product.id ? '兌換中...' : (profile.points >= product.points_required ? '立即兌換' : '點數不足')}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
