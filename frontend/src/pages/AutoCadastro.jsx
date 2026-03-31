import { useState } from 'react';
import axios from 'axios';
import { UserPlus, CheckCircle } from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

export default function AutoCadastro() {
  const [formData, setFormData] = useState({ nome: '', cpf: '', telefone: '', e_flamengo: false, fa_OP: false, souseano: false });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.cpf) return;
    try {
      await api.post('/clientes', formData);
      setSuccess(true);
      setFormData({ nome: '', cpf: '', telefone: '', e_flamengo: false, fa_OP: false, souseano: false });
      setTimeout(() => setSuccess(false), 5000);
    } catch(err) {
      alert('Erro ao realizar o cadastro. Tente novamente.');
    }
  };

  return (
    <div>
      <h1 className="mb-4">Seja bem-vindo ao Baratie! ⚓</h1>
      <p className="text-secondary mb-8">Faça o seu cadastro rapidamente para realizar autoatendimento no nosso restaurante.</p>

      {success && (
        <div className="glass-card mb-8" style={{ borderLeft: '4px solid var(--success)', background: 'rgba(34, 197, 94, 0.1)' }}>
          <div className="flex items-center gap-3">
            <CheckCircle size={24} color="var(--success)" />
            <h3 className="m-0" style={{ color: 'var(--success)' }}>Cadastro realizado com sucesso!</h3>
          </div>
          <p className="mt-2 text-muted">Você já pode prosseguir para a aba de fazer pedidos e desfrutar do nosso cardápio.</p>
        </div>
      )}

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="mb-6">Seus Dados Pessoais</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome Completo</label>
            <input type="text" className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Sanji Vinsmoke" required />
          </div>
          <div className="grid-2 gap-4">
            <div className="form-group">
              <label className="form-label">CPF</label>
              <input type="text" className="form-input" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} placeholder="Apenas números" required />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone (Opcional)</label>
              <input type="text" className="form-input" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="Apenas números" />
            </div>
          </div>
          
          <div className="form-group mt-6">
            <label className="form-label mb-2 d-block">Preferências (Você pode ganhar até 1% de Desconto VIP)</label>
            <div className="flex flex-col gap-3 p-4" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input type="checkbox" checked={formData.e_flamengo} onChange={e => setFormData({...formData, e_flamengo: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                <span>Sou torcedor nato do Flamengo.</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input type="checkbox" checked={formData.fa_OP} onChange={e => setFormData({...formData, fa_OP: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                <span>Sou fã de carteirinha de One Piece.</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input type="checkbox" checked={formData.souseano} onChange={e => setFormData({...formData, souseano: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                <span>Sou cidadão de Sousa (Paraíba).</span>
              </label>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary mt-8" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
            <UserPlus size={20} /> Entrar para a Tripulação Baratie
          </button>
        </form>
      </div>
    </div>
  );
}
