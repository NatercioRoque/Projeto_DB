import { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, UserCheck, Calendar } from 'lucide-react';
import AutocompleteSelect from '../components/AutocompleteSelect';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

export default function Relatorios() {
  const [garcons, setGarcons] = useState([]);
  const [comandas, setComandas] = useState([]);
  const [selectedGarcomId, setSelectedGarcomId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [gRes, cRes] = await Promise.all([
          api.get('/garcons'),
          api.get('/comandas') // traz todas as comandas do banco
        ]);
        setGarcons(gRes.data);
        // Aplica validação imposta pelo gerente: apenas vendas que foram pagas (finalizada === true)
        setComandas(cRes.data.filter(c => c.finalizada === true));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const garcomSelecionado = garcons.find(g => g.Id_garcom === selectedGarcomId);

  // Calcular agrupamento mensal iterativo
  const relatorioMensal = [];
  
  if (garcomSelecionado) {
    // Isolar as vendas dele
    const comandasAtendidas = comandas.filter(c => c.id_garcom === selectedGarcomId);
    
    // Período de tempo para o relatório (da admissão até o mês atual em vigência)
    const dataAdmissao = new Date(garcomSelecionado.data_admicao);
    const dataAtual = new Date();
    
    let atual = new Date(dataAdmissao.getFullYear(), dataAdmissao.getMonth(), 1);
    const fim = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
    
    // Percorre cada mês existindo venda ou não, gerando a tabela exata de presença do funcionário
    while (atual <= fim) {
      const mes = atual.getMonth();
      const ano = atual.getFullYear();
      
      const comandasDoMes = comandasAtendidas.filter(c => {
        const d = new Date(c.data);
        return d.getMonth() === mes && d.getFullYear() === ano;
      });
      
      const totalVendido = comandasDoMes.reduce((acc, c) => acc + Number(c.total), 0);
      
      // Deixar nome do mês bonito (Ex: Janeiro de 2026)
      const nomeMes = atual.toLocaleString('pt-BR', { month: 'long' });
      const tituloMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1) + ' de ' + ano;
      
      relatorioMensal.push({
        mesAno: tituloMes,
        total: totalVendido,
        qtdComandas: comandasDoMes.length
      });
      
      // Pula pro próximo mês
      atual.setMonth(atual.getMonth() + 1);
    }
    
    // Inverter para o mês mais fresquinho de todos aparecer no topo do relatório
    relatorioMensal.reverse();
  }

  return (
    <div>
      <h1 className="mb-4">Relatório de Comissão</h1>
      <p className="text-secondary mb-8">Consulte o faturamento consolidado cruzando mesas fechadas ao garçom.</p>
      
      {loading ? <p>Mapeando dados do mês financeiro...</p> : (
        <div className="glass-card mb-8">
          <div className="form-group mb-0">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} /> Selecione a Ficha do Garçom
            </label>
            <AutocompleteSelect
              options={garcons}
              value={selectedGarcomId}
              onChange={setSelectedGarcomId}
              keyFn={(g) => g.Id_garcom}
              labelFn={(g) => g.nome}
              placeholder="Digite o nome do garçom para ver sua ficha financeira..."
            />
          </div>
        </div>
      )}

      {selectedGarcomId && garcomSelecionado && (
        <div className="glass-card" style={{ border: '1px solid var(--accent-primary)', animation: 'fadeIn 0.4s ease' }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="mb-1 text-primary">Relatório Individual</h2>
              <p className="text-secondary mb-0"><strong>Agente:</strong> {garcomSelecionado.nome}</p>
            </div>
            <div className="text-right">
              <span className="badge badge-primary flex items-center gap-1" style={{ width: 'fit-content', marginLeft: 'auto' }}>
                <TrendingUp size={14} /> Histórico Mensal
              </span>
              <p className="text-sm mt-2 mb-0 text-muted">A partir de {new Date(garcomSelecionado.data_admicao).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          
          {relatorioMensal.length === 0 ? (
            <p className="text-muted text-center py-4">Nenhum mês listado.</p>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '450px' }}>
              <table className="data-table">
                <thead style={{ position: 'sticky', top: 0, background: 'rgba(30,30,45,0.95)', backdropFilter: 'blur(5px)' }}>
                  <tr>
                    <th><Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }}/> Mês / Ano</th>
                    <th>Comandas Finalizadas (Pagas)</th>
                    <th>Valor Consolidado (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorioMensal.map((rel, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500' }}>{rel.mesAno}</td>
                      <td>
                         <span className={rel.qtdComandas === 0 ? 'text-muted' : ''}>
                           {rel.qtdComandas} {rel.qtdComandas === 1 ? 'pedido' : 'pedidos'}
                         </span>
                      </td>
                      <td className={rel.total === 0 ? 'text-muted' : 'text-success font-bold'} style={{ fontSize: '1.1rem' }}>
                         R$ {rel.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
