import { useEffect, useState } from 'react';
import axios from 'axios';
import { BookOpen, Trash2, Edit3, Wine, Coffee, Utensils, X, PlusCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

export default function Cardapio() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('Prato Principal');
  const [tipoBebida, setTipoBebida] = useState('');
  const [safra, setSafra] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Paginação e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTarget, setSearchTarget] = useState('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchItens = async () => {
    try {
      const res = await api.get('/cardapio');
      setItens(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItens() }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !valor) return;
    
    try {
      const payload = { nome, valor: parseFloat(valor), categoria };
      if (categoria === 'Bebida') {
        payload.tipoBebida = tipoBebida || 'Outra';
        if (tiposDeVinho.includes(tipoBebida) && safra) {
           payload.safra = safra;
        }
      }
      
      await api.post('/cardapio', payload);
      // reset
      setNome(''); setValor(''); setCategoria('Prato Principal'); setTipoBebida(''); setSafra('');
      setIsModalOpen(false);
      fetchItens();
    } catch(err) {
      alert('Erro ao criar item.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Certeza que deseja remover do cardápio?")) return;
    try {
      await api.delete(`/cardapio/${id}`);
      fetchItens();
    } catch(err) {
      alert('Erro ao excluir.');
    }
  };

  const iconForCategory = (cat) => {
    if (cat === 'Bebida') return <Wine size={18} color="var(--accent-secondary)" style={{ flexShrink: 0 }} />;
    if (cat === 'Sobremesa') return <Coffee size={18} color="#fbbf24" style={{ flexShrink: 0 }} />;
    return <Utensils size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} />;
  };

  const tiposDeVinho = ['Vinho', 'Vinho Seco', 'Vinho Suave', 'Champagne'];

  // Funções Utilitárias para Paginação
  const handlePageChange = (newPage) => setCurrentPage(newPage);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, searchTarget]);

  let itensFiltrados = itens;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    itensFiltrados = itensFiltrados.filter(i => {
      switch(searchTarget) {
        case 'Nome': return i.nome.toLowerCase().includes(term);
        case 'Categoria': return i.categoria.toLowerCase().includes(term);
        default: return i.nome.toLowerCase().includes(term) || i.categoria.toLowerCase().includes(term);
      }
    });
  }

  const totalPages = Math.ceil(itensFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItens = itensFiltrados.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 style={{ margin: 0 }}>Gerenciar Cardápio</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={20} /> Cadastrar Item
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>
            <h2 className="mb-4" style={{ fontSize: '1.5rem', marginTop: '-0.5rem' }}>Novo Item</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nome do Prato/Bebida</label>
                <input type="text" className="form-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Risoto de Frutos do Mar" required />
              </div>
              
              <div className="grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Valor (R$)</label>
                  <input type="number" step="0.01" className="form-input" value={valor} onChange={e => setValor(e.target.value)} placeholder="15.50" required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-input" value={categoria} onChange={e => setCategoria(e.target.value)}>
                    <option value="Prato Principal">Prato Principal</option>
                    <option value="Acompanhamento">Acompanhamento</option>
                    <option value="Sobremesa">Sobremesa</option>
                    <option value="Bebida">Bebida</option>
                  </select>
                </div>
              </div>

              {categoria === 'Bebida' && (
                <div className="grid-2 gap-4 mt-2 mb-4" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="form-group">
                    <label className="form-label">Tipo de Bebida</label>
                    <select className="form-input" value={tipoBebida} onChange={e => setTipoBebida(e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="Suco">Suco</option>
                      <option value="Refrigerante">Refrigerante</option>
                      <option value="Cerveja">Cerveja</option>
                      <option value="Vinho">Vinho</option>
                    </select>
                  </div>
                  {tipoBebida === 'Vinho' && (
                    <div className="form-group">
                      <label className="form-label">Ano da Safra</label>
                      <input type="number" className="form-input" value={safra} onChange={e => setSafra(e.target.value)} placeholder="2018" />
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%', padding: '1rem' }}>
                <BookOpen size={18} /> Adicionar ao Cardápio
              </button>
            </form>
          </div>
        </div>
      )}
      
      <div className="glass-card mb-8 flex items-center justify-center p-8">
            <h1 style={{ fontSize: '3rem', margin: 0, opacity: 0.1 }}>BARATIE</h1>
        </div>

      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="m-0" style={{ fontSize: '1.25rem' }}>Itens Cadastrados ({itensFiltrados.length})</h2>
          <div className="flex items-center gap-2">
             <select className="form-input" style={{padding: '0.5rem'}} value={searchTarget} onChange={e => setSearchTarget(e.target.value)}>
               <option value="Todas">Nome ou Categoria</option>
               <option value="Nome">Nome</option>
               <option value="Categoria">Categoria</option>
             </select>
             <div className="flex items-center" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
               <Search size={18} className="text-muted ml-2" style={{marginLeft: '0.8rem'}}/>
               <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input border-0 bg-transparent" style={{boxShadow: 'none'}} />
             </div>
          </div>
        </div>

        {loading ? <p>Carregando cardápio...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Categoria</th>
                  <th>Detalhes Específicos</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItens.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {iconForCategory(item.categoria)}
                        <strong>{item.nome}</strong>
                      </div>
                    </td>
                    <td><span className="badge badge-info">{item.categoria}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {item.bebida ? `${item.bebida.tipo} ${item.bebida.safra ? `(Safra ${item.bebida.safra})` : ''}` : '-'}
                    </td>
                    <td>R$ {Number(item.valor).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${item.disponivel ? 'badge-success' : 'badge-warning'}`}>
                        {item.disponivel ? 'Disponível' : 'Indisponível'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(item.id)} className="btn btn-danger" style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedItens.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum item encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-muted">Apresentando {paginatedItens.length} resultados (Página {currentPage} de {totalPages})</span>
                <div className="flex gap-2">
                  <button className="btn btn-outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={{padding: '0.5rem'}}><ChevronLeft size={16}/></button>
                  <button className="btn btn-outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{padding: '0.5rem'}}><ChevronRight size={16}/></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
