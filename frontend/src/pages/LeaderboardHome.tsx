import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, QrCode, ClipboardCheck, Users, TrendingUp, Mic, CalendarDays, Star, Crown, CheckCircle2 } from 'lucide-react';
import { getProfile, getLeaderboard } from '../api';

const obfuscateName = (name: string) => {
  if (!name) return '***';
  if (name.length <= 2) return name[0] + '***';
  return name.slice(0, 1) + '***' + name.slice(-1);
};

export default function LeaderboardHome() {
  const [profile, setProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>({ weekly: [], monthly: [] });
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profData, leadData] = await Promise.all([getProfile(), getLeaderboard()]);
        setProfile(profData);
        setLeaderboard(leadData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>載入中...</div>;

  const currentList = activeTab === 'weekly' ? leaderboard.weekly : leaderboard.monthly;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Top Section: My Points & Scanner Hint */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <div>
          <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>您目前兌換點數</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={32} /> {profile.points}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '0.5rem', display: 'inline-flex', color: 'var(--primary-color)' }}>
            <QrCode size={32} />
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>請掃描現場提供的 QRCode 獲取點數</div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div>
        <h1 style={{ fontSize: '1.875rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trophy color="#fbbf24" /> 榮譽排行榜
        </h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            className="btn" 
            style={{ 
              flex: 1, 
              background: activeTab === 'monthly' ? 'var(--primary-color)' : 'rgba(30, 41, 59, 0.7)',
              color: activeTab === 'monthly' ? 'white' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('monthly')}
          >
            本月總排名
          </button>
          <button 
            className="btn" 
            style={{ 
              flex: 1, 
              background: activeTab === 'weekly' ? 'var(--primary-color)' : 'rgba(30, 41, 59, 0.7)',
              color: activeTab === 'weekly' ? 'white' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('weekly')}
          >
            本週排名
          </button>
        </div>

        {/* List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {currentList.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              本期目前尚無獲得點數的學員。
            </div>
          ) : (
            currentList.map((item: any, index: number) => {
              const isTop3 = index < 3;
              let medalColor = '';
              if (index === 0) medalColor = '#fbbf24'; // Gold
              else if (index === 1) medalColor = '#94a3b8'; // Silver
              else if (index === 2) medalColor = '#b45309'; // Bronze
              
              const isCurrentUser = item.username === profile.username;

              return (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '1rem 1.5rem', 
                    borderBottom: index === currentList.length - 1 ? 'none' : '1px solid var(--border-color)',
                    background: isCurrentUser ? 'rgba(139, 92, 246, 0.1)' : 'transparent'
                  }}
                >
                  {/* Rank */}
                  <div style={{ width: '40px', fontSize: '1.25rem', fontWeight: 'bold', color: isTop3 ? medalColor : 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                    {isTop3 ? <Trophy size={24} color={medalColor} /> : `#${index + 1}`}
                  </div>
                  
                  {/* User */}
                  <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                      {obfuscateName(item.username)}
                      {isCurrentUser && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'var(--primary-color)', color: 'white', borderRadius: '9999px' }}>我</span>}
                    </div>
                  </div>
                  
                  {/* Points */}
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    {item.total_points} <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>pt</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Rules Section - Premium Redesign */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#f8fafc', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star color="#fbbf24" fill="#fbbf24" size={24} /> 點數獲取指南
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Section 1: Basic */}
          <div>
            <h3 style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>一、基礎任務</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              
              <div className="rule-card" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(248, 250, 252, 0.05)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--text-secondary)' }}><ClipboardCheck size={24} /></div>
                <div style={{ flexGrow: 1 }}><div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>出席培訓會</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>完成現場掃描簽到</div></div>
                <div style={{ color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 'bold' }}>+1 點</div>
              </div>

              <div className="rule-card" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(248, 250, 252, 0.05)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--text-secondary)' }}><Users size={24} /></div>
                <div style={{ flexGrow: 1 }}><div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>帶新朋友出席</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>邀請並帶領新朋友參與活動</div></div>
                <div style={{ color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 'bold' }}>+10 點</div>
              </div>

              <div className="rule-card" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(248, 250, 252, 0.05)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--text-secondary)' }}><TrendingUp size={24} /></div>
                <div style={{ flexGrow: 1 }}><div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>新朋友完美成交</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>您帶來的新朋友成功完成簽約</div></div>
                <div style={{ color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 'bold' }}>+50 點</div>
              </div>

              <div className="rule-card" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(248, 250, 252, 0.05)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--text-secondary)' }}><Mic size={24} /></div>
                <div style={{ flexGrow: 1 }}><div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>上台分享 / 協助</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>主動上台分享心得或協助會場</div></div>
                <div style={{ color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 'bold' }}>+20~30 點</div>
              </div>

            </div>
          </div>

          {/* Section 2: Bonus */}
          <div>
            <h3 style={{ fontSize: '1.125rem', color: '#c084fc', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              二、尊榮加碼機制 <Award size={18} />
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              
              <div className="rule-card" style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.1) 0%, rgba(30,41,59,0.3) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '0.75rem', borderRadius: '0.75rem', color: '#c084fc' }}><CalendarDays size={24} /></div>
                <div style={{ flexGrow: 1 }}><div style={{ fontWeight: 600, color: '#e9d5ff', fontSize: '1.05rem' }}>連續出席滿 4 週</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>展現無與倫比的恆毅力</div></div>
                <div style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 'bold', fontSize: '0.875rem' }}>當月點數翻倍</div>
              </div>

              <div className="rule-card" style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.1) 0%, rgba(30,41,59,0.3) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '0.75rem', borderRadius: '0.75rem', color: '#c084fc' }}><Trophy size={24} /></div>
                <div style={{ flexGrow: 1 }}><div style={{ fontWeight: 600, color: '#e9d5ff', fontSize: '1.05rem' }}>當月有帶人＋成交</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>強烈的號召與影響力展現</div></div>
                <div style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 'bold', fontSize: '0.875rem' }}>額外加碼 +30 點</div>
              </div>

              <div className="rule-card" style={{ background: 'linear-gradient(145deg, rgba(251,191,36,0.1) 0%, rgba(30,41,59,0.3) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '0.75rem', borderRadius: '0.75rem', color: '#fbbf24' }}><Crown size={24} /></div>
                <div style={{ flexGrow: 1 }}><div style={{ fontWeight: 600, color: '#fde68a', fontSize: '1.05rem' }}>問鼎當月排行前 3 名</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>獲得全場最高榮耀評價</div></div>
                <div style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 'bold', fontSize: '0.875rem' }}>神祕特別獎勵</div>
              </div>

            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          {/* Section 3: Usage */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '1rem', padding: '2rem', border: '1px solid var(--border-color)' }}>
             <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>🔹 點數可以做什麼？</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 color="var(--primary-color)" size={20} /> 累積兌換精美精品卡片</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 color="var(--primary-color)" size={20} /> 抵免/兌換活動專案補助</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 color="var(--primary-color)" size={20} /> 參與每週與月度排行榜競賽</div>
            </div>
          </div>

        </div>
      </div>

    </motion.div>
  );
}
