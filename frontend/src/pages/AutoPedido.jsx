import { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingCart, PlusCircle, Trash2, Utensils, Send } from 'lucide-react';
import AutocompleteSelect from '../components/AutocompleteSelect';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

export default function AutoPedido() {
  const [clientes, setClientes] = useState([]);
  const [cardapio, setCardapio] = useState([]);
  
  const [selectedCliente, setSelectedCliente] = useState('');
  const [mesa, setMesa] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cli, card] = await Promise.all([
          api.get('/clientes'),
          api.get('/cardapio')
        ]);
        setClientes(cli.data);
        setCardapio(card.data);
      } catch (err) {
        console.error("Erro", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddItem = (itemId) => {
    if(!itemId) return;
    setCarrinho([...carrinho, parseInt(itemId)]);
  };

  const handleRemoveItem = (indexToRemove) => {
    setCarrinho(carrinho.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCliente || !mesa || carrinho.length === 0) {
      alert("Oops! Você precisa se identificar, escolher uma mesa e separar pelo menos um item do cardápio marujo.");
      return;
    }
    
    try {
      await api.post('/comandas', {
        mesa: parseInt(mesa),
        clienteId: parseInt(selectedCliente),
        itens: carrinho,
        status: 'PENDENTE' // Status de autoatendimento (Aguardando Funcionário)
      });
      
      setSuccess(true);
      setCarrinho([]);
      setMesa('');
      setSelectedCliente('');
      setTimeout(() => setSuccess(false), 5000);
    } catch(err) {
      alert('Erro ao enviar pedido para a cozinha. Chame um garçom!');
    }
  };

  let totalSacola = 0;
  carrinho.forEach(itemId => {
    const item = cardapio.find(c => c.id === itemId);
    if(item) totalSacola += Number(item.valor);
  });

  const renderCategory = (categoryName, title) => {
    const items = cardapio.filter(c => c.disponivel && c.categoria === categoryName);
    if (items.length === 0) return null;
    return (
      <div key={categoryName} className="mb-4">
        <h3 className="mb-2 text-info" style={{borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '0.5rem'}}>{title}</h3>
        <table className="data-table" style={{ fontSize: '0.9rem' }}>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>
                  <strong>{item.nome}</strong>
                  {item.bebida && <span className="text-secondary text-sm d-block" style={{marginTop: '0.2rem'}}>{item.bebida.tipo}{item.bebida.safra ? ` - Safra ${item.bebida.safra}` : ''}</span>}
                </td>
                <td style={{ width: '100px' }}>R$ {Number(item.valor).toFixed(2)}</td>
                <td style={{ width: '50px', textAlign: 'right' }}>
                  <button className="btn btn-primary p-2" onClick={() => handleAddItem(item.id)} title="Pôr no Carrinho"><PlusCircle size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <h1 className="mb-4">Cardápio & Pedido 🍽️</h1>
      <p className="text-secondary mb-8">Monte seu carrinho selecionando os maravilhosos pratos do Mar no Baratie.</p>

      {success && (
        <div className="glass-card mb-8" style={{ borderLeft: '4px solid var(--success)', background: 'rgba(34, 197, 94, 0.1)' }}>
          <h3 className="m-0" style={{ color: 'var(--success)' }}>Pedido Enviado para a Cozinha!</h3>
          <p className="mt-2 text-muted">Aguarde. Nossa equipe já bipou seu pedido mágico e um garçom está a caminho de sua mesa para confirmar as escolhas.</p>
        </div>
      )}

      {loading ? <p>Carregando as delícias...</p> : (
        <div className="grid-2">
          
          {/* Cardápio Visual e Carrinho Rápido */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h2 className="mb-4 flex items-center gap-2"><Utensils size={24}/> Vitrine do Chef</h2>
            
            <div className="list-container mb-4" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {renderCategory('Prato Principal', 'Pratos Principais')}
              {renderCategory('Acompanhamento', 'Acompanhamentos')}
              {renderCategory('Sobremesa', 'Sobremesas')}
              {renderCategory('Bebida', 'Bebidas')}
            </div>
          </div>

          {/* Finalização do Carrinho */}
          <div className="glass-card" style={{ border: '2px dashed var(--accent-primary)', height: 'fit-content' }}>
            <h2 className="mb-4 flex items-center gap-2 text-primary"><ShoppingCart size={24}/> Minha Mesa</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Quem sou eu? (Busque pelo seu Nome)</label>
                <AutocompleteSelect
                  options={clientes}
                  value={selectedCliente}
                  onChange={setSelectedCliente}
                  placeholder="Buscar meu perfil pelo nome..."
                  subLabelFn={(cli) => `CPF: ${cli.cpf}`}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Nº da Mesa em que estou sentado</label>
                <input type="number" min="1" max="50" className="form-input" value={mesa} onChange={e => setMesa(e.target.value)} placeholder="Ex: 12" required />
              </div>

              <div className="list-container mb-4 px-3 py-2" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-glass-border)', borderRadius: 'var(--radius-sm)' }}>
                <strong className="text-secondary d-block mb-2">Pedidos Separados: {carrinho.length} itens</strong>
                {carrinho.length === 0 ? <p className="text-muted text-sm">Sacola vázia.</p> : (
                  <ul className="m-0 p-0" style={{listStyle: 'none', maxHeight: '180px', overflowY: 'auto'}}>
                    {carrinho.map((id, idx) => {
                      const obj = cardapio.find(c => c.id === id);
                      return (
                        <li key={idx} className="flex justify-between items-center mb-2 pb-1 border-bottom-dashed text-sm">
                          <span>{obj?.nome}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-primary font-bold">R$ {Number(obj?.valor||0).toFixed(2)}</span>
                             <button type="button" onClick={() => handleRemoveItem(idx)} className="text-danger bg-transparent border-0 cursor-pointer p-0"><Trash2 size={16} /></button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                
                {/* Total Preview */}
                <div className="flex justify-between items-center mt-4 pt-3 border-top-dashed text-sm text-info">
                   <span>*(1% OFF se você tiver as 3 insígnias vips)*   </span>
                   <span className="font-bold text-success" style={{ fontSize: '1.2rem' }}>Total: R$ {totalSacola.toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 py-3 mt-4" disabled={carrinho.length === 0} style={{ fontSize: '1.2rem'}}>
                <Send size={20} /> Fechar Pedido
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
