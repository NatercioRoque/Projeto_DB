import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, ReceiptText, BookOpen } from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

export default function Dashboard() {
  const [stats, setStats] = useState({ clientes: 0, cardapio: 0, comandas: 0, revenue: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [cliRes, cardRes, comRes] = await Promise.all([
          api.get('/clientes'),
          api.get('/cardapio'),
          api.get('/comandas')
        ]);
        
        const totalRev = comRes.data.reduce((acc, curr) => acc + Number(curr.total), 0);

        setStats({
          clientes: cliRes.data.length,
          cardapio: cardRes.data.length,
          comandas: comRes.data.length,
          revenue: totalRev
        });
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="mb-8">Dashboard Overview</h1>
      
      <div className="grid-3 mb-8">
        <div className="glass-card flex items-center gap-4">
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <Users size={32} color="var(--accent-primary)" />
          </div>
          <div>
            <h3 style={{ marginBottom: 0 }}>{stats.clientes}</h3>
            <span style={{ color: 'var(--text-muted)' }}>Total Clientes</span>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div style={{ background: 'rgba(192, 132, 252, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <ReceiptText size={32} color="var(--accent-secondary)" />
          </div>
          <div>
            <h3 style={{ marginBottom: 0 }}>{stats.comandas}</h3>
            <span style={{ color: 'var(--text-muted)' }}>Comandas Abertas</span>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div style={{ background: 'rgba(34, 197, 94, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <BookOpen size={32} color="var(--success)" />
          </div>
          <div>
            <h3 style={{ marginBottom: 0 }}>{stats.cardapio}</h3>
            <span style={{ color: 'var(--text-muted)' }}>Itens no Cardápio</span>
          </div>
        </div>
      </div>

    </div>
  );
}
