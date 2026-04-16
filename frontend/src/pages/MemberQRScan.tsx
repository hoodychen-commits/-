import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { scanQR } from '../api';

export default function MemberQRScan() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    if (!token) {
      setStatus('error');
      setMessage('無效的掃描連結！未偵測到條碼參數。');
      setLoading(false);
      return;
    }

    const processScan = async () => {
      try {
        const res = await scanQR(token);
        setStatus('success');
        setMessage(`掃描成功！恭喜獲得 ${res.pointsEarned} 點！`);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || '掃描失敗，代碼可能已過期或您今天已經領取過了。');
      } finally {
        setLoading(false);
      }
    };

    processScan();
  }, [location.search]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}
      >
        {loading ? (
          <div>
            <QrCode size={48} color="var(--primary-color)" style={{ margin: '0 auto 1rem', animation: 'spin 2s linear infinite' }} />
            <h2>正在驗證條碼...</h2>
          </div>
        ) : (
          <div>
            {status === 'success' ? (
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <div style={{ display: 'inline-flex', padding: '1rem', background: '#d1fae5', borderRadius: '50%', marginBottom: '1.5rem', color: '#047857' }}>
                  <CheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#047857' }}>獲取成功！</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{message}</p>
              </motion.div>
            ) : (
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <div style={{ display: 'inline-flex', padding: '1rem', background: '#fef2f2', borderRadius: '50%', marginBottom: '1.5rem', color: '#b91c1c' }}>
                  <AlertCircle size={48} />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#b91c1c' }}>獲取失敗</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{message}</p>
              </motion.div>
            )}

            <button className="btn btn-primary" onClick={() => navigate('/')} style={{ width: '100%' }}>
              返回首頁
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
