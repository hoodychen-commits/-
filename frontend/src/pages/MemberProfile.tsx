import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, History, ArrowDownToLine, Gift } from 'lucide-react';
import { getProfile, getHistory } from '../api';

export default function MemberProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profData, histData] = await Promise.all([getProfile(), getHistory()]);
        setProfile(profData);
        setHistory(histData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>載入中...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 style={{ fontSize: '1.875rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <User color="var(--primary-color)" /> 個人中心
      </h1>

      <div className="card" style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
          {profile.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{profile.username}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>您目前的點數總餘額為 <strong style={{ color: 'var(--primary-color)' }}>{profile.points}</strong> 點</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} /> 點數異動紀錄
        </h3>

        {history.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>目前尚未有任何紀錄。</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((record) => (
              <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {record.amount > 0 ? (
                    <div style={{ padding: '0.5rem', background: '#d1fae5', borderRadius: '50%', color: '#047857' }}><ArrowDownToLine size={20} /></div>
                  ) : (
                    <div style={{ padding: '0.5rem', background: '#fef2f2', borderRadius: '50%', color: '#b91c1c' }}><Gift size={20} /></div>
                  )}
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {record.type === 'checkin' && '每日簽到'}
                      {record.type === 'admin_grant' && '業績點數發放'}
                      {record.type === 'redeem' && `兌換商品: ${record.product_name}`}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {new Date(record.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: record.amount > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  {record.amount > 0 ? '+' : ''}{record.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
