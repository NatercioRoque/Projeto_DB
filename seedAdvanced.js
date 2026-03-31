const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Apagando registros antigos...");
  // Sequência segura para não violar chaves estrangeiras
  await prisma.comanda.deleteMany();
  await prisma.bebida.deleteMany();
  await prisma.cardapio.deleteMany();
  await prisma.garcom.deleteMany();
  await prisma.cliente.deleteMany();

  // 5 Garçons
  console.log("Criando 5 Garçons...");
  const nomesGarcons = ['Sanji', 'Zeff', 'Patty', 'Carne', 'Luffy'];
  const garcons = [];
  for (let i = 0; i < 5; i++) {
    garcons.push(await prisma.garcom.create({
      data: {
        nome: nomesGarcons[i],
        data_admicao: new Date(2023, i, 10),
        salario: 1500 + i * 100
      }
    }));
  }

  // Cardápio (5 de cada: prato principal, sobremesa, acompanhamento, cerveja, refrigerante, vinho, agua)
  console.log("Criando Itens de Cardápio (pelo menos 5 de cada categoria solicitada)...");
  const cardapioItens = [];

  const addCardapio = async (nome, valor, categoria) => {
    const item = await prisma.cardapio.create({ data: { nome, valor, categoria, disponivel: true } });
    cardapioItens.push(item);
    return item;
  };

  const addBebida = async (nome, valor, tipo) => {
    const item = await prisma.cardapio.create({ data: { nome, valor, categoria: 'Bebida', disponivel: true } });
    await prisma.bebida.create({ data: { id: item.id, tipo } });
    cardapioItens.push({ ...item, tipo });
    return item;
  };

  for (let i = 1; i <= 5; i++) {
    await addCardapio(`Prato Principal ${i}`, 40 + i*5, 'Prato Principal');
    await addCardapio(`Sobremesa ${i}`, 15 + i*2, 'Sobremesa');
    await addCardapio(`Acompanhamento ${i}`, 10 + i, 'Acompanhamento');
    
    await addBebida(`Cerveja ${i}`, 12 + i, 'Cerveja');
    await addBebida(`Refrigerante ${i}`, 8 + i, 'Refrigerante');
    await addBebida(`Vinho ${i}`, 80 + i*10, 'Vinho');
    await addBebida(`Água ${i}`, 5 + i, 'Agua');
  }

  // 20 Clientes (5 com os requisitos de desconto)
  console.log("Criando 20 Clientes...");
  const clientes = [];
  for (let i = 1; i <= 20; i++) {
    const temDesconto = i <= 5;
    clientes.push(await prisma.cliente.create({
      data: {
        nome: `Cliente ${i}`,
        cpf: `111222333${i.toString().padStart(2, '0')}`,
        telefone: `839888877${i.toString().padStart(2, '0')}`,
        e_flamengo: temDesconto,
        fa_OP: temDesconto,
        souseano: temDesconto
      }
    }));
  }

  console.log("Criando 30 Comandas e distribuindo igualmente entre os 5 garçons...");
  let comandaConfigs = [];

  // Requisito: 3 não pagas ainda (status: ATIVA), 1 delas de um VIP (clienteIdx: 0, 1 ou 2)
  comandaConfigs.push({ status: 'ATIVA', finalizada: false, clienteIdx: 0 }); // VIP
  comandaConfigs.push({ status: 'ATIVA', finalizada: false, clienteIdx: 6 }); // Normal
  comandaConfigs.push({ status: 'ATIVA', finalizada: false, clienteIdx: 7 }); // Normal

  // Requisito: 2 feitas porém não confirmadas (status: PENDENTE)
  comandaConfigs.push({ status: 'PENDENTE', finalizada: false, clienteIdx: 8 });
  comandaConfigs.push({ status: 'PENDENTE', finalizada: false, clienteIdx: 9 });

  // Restante: 25 comandas normais e pagas
  for (let i = 0; i < 25; i++) {
     comandaConfigs.push({ status: 'FECHADA', finalizada: true, clienteIdx: (10 + i) % 20 });
  }

  // Dividindo as 30 comandas igualmente entre os 5 garçons (6 para cada)
  for (let g = 0; g < garcons.length; g++) {
    const garcom = garcons[g];
    
    for (let c = 0; c < 6; c++) {
      const configIdx = g * 6 + c;
      const config = comandaConfigs[configIdx];
      const cl = clientes[config.clienteIdx];

      // Requisito: Cada comanda deve ter pelo menos 2 itens
      const numItens = 2 + Math.floor(Math.random() * 3); // 2 a 4 itens
      const itensSelecionados = [];
      let total = 0;

      for (let k = 0; k < numItens; k++) {
        const randomItem = cardapioItens[Math.floor(Math.random() * cardapioItens.length)];
        itensSelecionados.push(randomItem.id);
        total += Number(randomItem.valor);
      }

      // Aplica desconto caso o cliente cumpra os requisitos
      if (cl.e_flamengo && cl.fa_OP && cl.souseano) {
          total = total * 0.99;
      }

      // Requisito: datas variadas
      const dataComanda = new Date();
      dataComanda.setDate(dataComanda.getDate() - (configIdx * 2)); // vai jogando pra trás

      await prisma.comanda.create({
        data: {
          data: dataComanda,
          mesa: 1 + configIdx, // numeração de mesas variadas
          clienteId: cl.id,
          id_garcom: garcom.Id_garcom,
          itens: itensSelecionados,
          total: total,
          status: config.status,
          finalizada: config.finalizada,
          pagamento: config.status === 'FECHADA' ? (c % 2 === 0 ? 'Pix' : 'Cartão') : null
        }
      });
    }
  }

  console.log("=== BANCO REPOVOADO COM SUCESSO! ===");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
