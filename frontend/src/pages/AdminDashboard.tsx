import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Award, ShieldCheck, History, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getAdminUsers, grantPoints, getAdminHistory, getAdminSettings, toggleQR } from '../api';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [pointsInput, setPointsInput] = useState('');
  const [granting, setGranting] = useState(false);

  // QR Settings
  const [qrActive, setQrActive] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrPoints, setQrPoints] = useState(10);
  const [qrLoading, setQrLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [userData, histData, settingsData] = await Promise.all([
        getAdminUsers(),
        getAdminHistory(),
        getAdminSettings()
      ]);
      setUsers(userData);
      setHistory(histData);
      
      setQrActive(settingsData.qr_active === 'true');
      setQrToken(settingsData.qr_token || '');
      if (settingsData.qr_points) setQrPoints(parseInt(settingsData.qr_points));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !pointsInput) return;
    
    const points = parseInt(pointsInput);
    if (isNaN(points) || points <= 0) {
      alert('請輸入有效的點數');
      return;
    }

    setGranting(true);
    try {
      await grantPoints(selectedUser.id, points);
      alert(`成功為 ${selectedUser.username} 發放 ${points} 點！`);
      setPointsInput('');
      setSelectedUser(null);
      fetchData(); // refresh data
    } catch (err: any) {
      alert(err.message || '發放失敗');
    } finally {
      setGranting(false);
    }
  };

  const handleToggleQR = async (enable: boolean) => {
    setQrLoading(true);
    try {
      const res = await toggleQR(enable, qrPoints);
      setQrActive(res.active);
      if (res.active) {
        setQrToken(res.token);
      } else {
        setQrToken('');
      }
    } catch (err) {
      alert('QR 控制失敗');
    } finally {
      setQrLoading(false);
    }
  };

  const qrScanUrl = `${window.location.origin}/scan?token=${qrToken}`;

  if (loading) return <div>載入中...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 style={{ fontSize: '1.875rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldCheck color="var(--primary-color)" /> 管理員後台 - 綜合儀表板
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Users List */}
        <div className="card" style={{ maxHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} /> 會員列表與手動發點
          </h2>
          <div style={{ overflowY: 'auto', flexGrow: 1 }}>
            {users.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>目前沒有會員。</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', position: 'sticky', top: 0, background: 'white' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>會員帳號</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>點數</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{u.username}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{u.points}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => setSelectedUser(u)}
                        >
                          選擇
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Grant Points or QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {selectedUser && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card">
              <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="var(--primary-color)" /> 發放點數給 {selectedUser.username}
              </h2>
              <form onSubmit={handleGrant} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" min="1" required value={pointsInput} onChange={(e) => setPointsInput(e.target.value)}
                  placeholder="輸入點數" style={{ flexGrow: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                />
                <button type="submit" className="btn btn-primary" disabled={granting}>確定發放</button>
                <button type="button" className="btn" onClick={() => setSelectedUser(null)}>取消</button>
              </form>
            </motion.div>
          )}

          <div className="card" style={{ flexGrow: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '0.5rem' }}>
              <QrCode size={20} /> 動態 QR Code 掃碼送點
            </h2>
            
            {!qrActive ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>設定點數並開啟，讓會員親臨現場掃描獲取點數 (一天限一次)。</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span>每次掃描發放</span>
                  <input 
                    type="number" value={qrPoints} onChange={(e) => setQrPoints(parseInt(e.target.value) || 0)}
                    style={{ width: '80px', padding: '0.5rem', textAlign: 'center', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                  />
                  <span>點</span>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ background: 'var(--success-color)' }}
                  onClick={() => handleToggleQR(true)} disabled={qrLoading}
                >
                  {qrLoading ? '處理中...' : '開啟 QR Code 活動'}
                </button>
              </div>
            ) : (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '1rem', display: 'inline-block', border: '2px solid var(--border-color)', marginBottom: '1rem' }}>
                  <QRCodeSVG value={qrScanUrl} size={200} />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '1.5rem' }}>
                  掃描此條碼可獲取 {qrPoints} 點
                </div>
                <button 
                  className="btn" 
                  style={{ background: '#fef2f2', color: 'var(--danger-color)', border: '1px solid var(--danger-color)' }}
                  onClick={() => handleToggleQR(false)} disabled={qrLoading}
                >
                  {qrLoading ? '處理中...' : '關閉並註銷此條碼'}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card">
         <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} /> 系統點數異動總覽
        </h2>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>尚無任何紀錄。</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', position: 'sticky', top: 0, background: 'white' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>時間</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>會員</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>異動類型</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>點數變化</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {new Date(h.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{h.username}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {h.type === 'checkin' && <span style={{ color: 'var(--success-color)' }}>✅ 每日簽到</span>}
                      {h.type === 'admin_grant' && <span style={{ color: '#8b5cf6' }}>👑 管理員派發</span>}
                      {h.type === 'qr_scan' && <span style={{ color: '#f59e0b' }}>📱 QR掃碼</span>}
                      {h.type === 'redeem' && <span>🎁 兌換商品 ({h.product_name})</span>}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold', color: h.amount > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                      {h.amount > 0 ? '+' : ''}{h.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </motion.div>
  );
}
