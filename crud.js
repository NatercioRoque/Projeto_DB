const { PrismaClient } = require('@prisma/client');
const readline = require('readline-sync');
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function inserir() {
  console.log('\n--- Inserir Registro ---');
  console.log('O que você deseja inserir?');
  console.log('1. Cliente');
  console.log('2. Item no Cardápio / Bebida');
  console.log('0. Cancelar');
  const tipoRegistro = readline.questionInt('Opcao: ');

  switch (tipoRegistro) {
    case 1: {
      console.log('\n--- Inserir Cliente ---');
      const nome = readline.question('Nome do cliente: ');
      const cpfInput = readline.question('CPF: ');
      const telefoneInput = readline.question('Telefone: ');
      const cpf = cpfInput.replace(/\D/g, '');
      const telefone = telefoneInput.replace(/\D/g, '');
      try {
        const cliente = await prisma.cliente.create({
          data: { nome, cpf, telefone }
        });
        console.log(`\n✅ Cliente ${cliente.nome} inserido com sucesso!`);
      } catch (error) {
        console.error('\n❌ Erro ao inserir cliente:', error.message);
      }
      break;
    }
    case 2: {
      console.log('\n--- Inserir Item no Cardapio ---');
      const nome = readline.question('Nome do item: ');
      const valorInput = readline.question('Valor (ex: 15.50): ');
      const valor = parseFloat(valorInput.replace(',', '.')); // Aceita ponto ou vírgula

      if (isNaN(valor)) {
        console.error('\n❌ Erro: O valor digitado é inválido.');
        break;
      }

      console.log('\nEscolha a Categoria:');
      console.log('1. Bebida');
      console.log('2. Prato Principal');
      console.log('3. Sobremesa');
      console.log('4. Acompanhamento');
      const catOpcao = readline.questionInt('Opcao: ');
      let categoria = '';
      switch (catOpcao) {
        case 1: categoria = 'Bebida'; break;
        case 2: categoria = 'Prato Principal'; break;
        case 3: categoria = 'Sobremesa'; break;
        case 4: categoria = 'Acompanhamento'; break;
        default:
          console.log('Opcao invalida, definindo como Outros.');
          categoria = 'Outros';
      }

      const disponivel = true; // Por padrão, o item adicionado já está disponível

      try {
        const cardapioItem = await prisma.cardapio.create({
          data: {
            nome,
            valor,
            categoria,
            disponivel
          }
        });

        console.log(`\n✅ Item base '${cardapioItem.nome}' inserido com sucesso no cardápio!`);

        if (categoria === 'Bebida') {
          console.log('\nEscolha o Tipo de Bebida:');
          console.log('1. Vinho');
          console.log('2. Refrigerante');
          console.log('3. Cerveja');
          console.log('4. Suco');
          console.log('5. Água');
          const tipoOpcao = readline.questionInt('Opcao: ');
          let tipo = '';
          switch (tipoOpcao) {
            case 1: tipo = 'Vinho'; break;
            case 2: tipo = 'Refrigerante'; break;
            case 3: tipo = 'Cerveja'; break;
            case 4: tipo = 'Suco'; break;
            case 5: tipo = 'Água'; break;
            default: tipo = 'Outro'; break;
          }

          let safra = null;
          if (tipo === 'Vinho') { // A safra faz mais sentido para Vinhos
            const anoSafraStr = readline.question('Ano da Safra (ex: 2018): ');
            if (anoSafraStr.trim() !== '') {
              safra = parseInt(anoSafraStr);
            }
          }

          const bebida = await prisma.bebida.create({
            data: {
              id: cardapioItem.id,
              tipo,
              safra
            }
          });
          console.log(`✅ Extensão Bebida ('${bebida.tipo}') atrelada ao item com sucesso!`);
        }
      } catch (error) {
        console.error('\n❌ Erro ao inserir item:', error.message);
      }
      break;
    }
  }
}

async function buscar(modelo, termoBusca) {
  const resultados = await prisma[modelo].findMany({
    where: {
      nome: {
        contains: termoBusca,
        mode: 'insensitive'
      }
    }
  });

  if (resultados.length === 0) {
    console.log(`❌ Nenhum registro encontrado para "${termoBusca}".`);
    return null;
  }

  console.log(`\nEncontrados ${resultados.length} registro(s):`);
  resultados.forEach((item, index) => {
    let extra = '';
    if (modelo === 'cliente') extra = `(CPF: ${item.cpf})`;
    if (modelo === 'cardapio') extra = `(R$ ${item.valor} - ${item.categoria})`;
    console.log(`${index + 1}. ${item.nome} ${extra}`);
  });
  console.log('0. Cancelar');

  const opcao = readline.questionInt('Selecione o registro pelo número da lista: ');
  if (opcao > 0 && opcao <= resultados.length) {
    return resultados[opcao - 1].id;
  } else {
    return null;
  }
}

async function inserirComanda() {
  console.log('\n--- Inserir Comanda ---');
  const mesa = readline.questionInt('Digite o numero da mesa: ');
  
  console.log('\nDeseja informar uma data para a comanda?');
  console.log('1. Usar a data atual do momento da criacao');
  console.log('2. Informar uma data anterior');
  const opcaoData = readline.questionInt('Opcao: ');
  
  let dataComanda;
  if (opcaoData === 2) {
    const dataInput = readline.question('Digite a data (DD/MM/AAAA): ');
    const partesData = dataInput.split('/');
    if (partesData.length === 3) {
      const dia = partesData[0].padStart(2, '0');
      const mes = partesData[1].padStart(2, '0');
      const ano = partesData[2];
      dataComanda = new Date(`${ano}-${mes}-${dia}T12:00:00.000Z`);
    } else {
      console.log('Formato de data inválido. Usando a data atual...');
    }
  }

  console.log('\nBuscando o Cliente associado...');
  const termoCliente = readline.question('Digite pelo menos parte do nome do Cliente: ');
  const clienteId = await buscar('cliente', termoCliente);
  
  if (!clienteId) {
    console.log('❌ É obrigatório informar um cliente válido para a comanda.');
    return;
  }

  const itens = [];
  let total = 0;
  let adicionandoItens = true;

  while (adicionandoItens) {
    console.log('\n--- Adicionar Item à Comanda ---');
    const termoItem = readline.question('Digite pelo menos parte do nome do Item (ou enter para finalizar): ');
    
    if (termoItem.trim() === '') {
      adicionandoItens = false;
      continue;
    }

    const itemId = await buscar('cardapio', termoItem);
    
    if (itemId) {
      const itemAdicionado = await prisma.cardapio.findUnique({ where: { id: itemId } });
      
      if (itemAdicionado) {
        itens.push(itemId);
        total += Number(itemAdicionado.valor);
        console.log(`✅ Item '${itemAdicionado.nome}' adicionado à comanda. Subtotal parcial: R$ ${total.toFixed(2)}`);
      }
    }
    
    const continuar = readline.question('\nDeseja adicionar mais um item a esta comanda? (S/N): ');
    if (continuar.trim().toUpperCase() !== 'S') {
      adicionandoItens = false;
    }
  }

  if (itens.length === 0) {
    console.log('❌ A comanda não pode ser criada sem itens. Operação cancelada.');
    return;
  }

  try {
    const dataToCreate = {
      mesa,
      clienteId,
      itens,
      total
    };
    
    if (dataComanda) {
      dataToCreate.data = dataComanda;
    }

    const novaComanda = await prisma.comanda.create({
      data: dataToCreate
    });
    console.log(`\n✅ Comanda de ID ${novaComanda.id} criada com sucesso para a mesa ${novaComanda.mesa} no valor total de R$ ${novaComanda.total}!`);
  } catch (error) {
    console.error('\n❌ Erro ao criar comanda:', error.message);
  }
}

async function alterar() {
  console.log('\n--- Alterar Registro ---');
  console.log('O que você deseja alterar?');
  console.log('1. Cliente');
  console.log('2. Item no Cardápio / Bebida');
  console.log('0. Cancelar');
  const tipoRegistro = readline.questionInt('Opcao: ');

  switch (tipoRegistro) {
    case 1: {
      console.log('\n--- Alterar Cliente ---');
      const termo = readline.question('Digite pelo menos parte do nome do Cliente: ');
      const id = await buscar('cliente', termo);
      if (!id) break;
      const cliente = await prisma.cliente.findUnique({ where: { id } });

      if (!cliente) {
        console.log('❌ Cliente não encontrado.');
        break;
      }

      let alterando = true;

      while (alterando) {
        console.log(`\nCliente selecionado: ${cliente.nome} (CPF: ${cliente.cpf})`);
        console.log('Qual campo deseja alterar?');
        console.log('1. Nome');
        console.log('2. Telefone');
        console.log('0. Voltar');
        const opcaoCampo = readline.questionInt('Opcao: ');

        let dadoAtualizado = {};
        if (opcaoCampo === 1) {
          dadoAtualizado.nome = readline.question('Novo Nome: ');
        } else if (opcaoCampo === 2) {
          const telefoneInput = readline.question('Novo Telefone: ');
          dadoAtualizado.telefone = telefoneInput.replace(/\D/g, '');
        } else if (opcaoCampo === 0) {
          alterando = false;
          continue;
        } else {
          console.log('Opcao invalida.');
          continue;
        }

        try {
          await prisma.cliente.update({
            where: { id },
            data: dadoAtualizado
          });
          console.log('✅ Cliente atualizado com sucesso!');

          // Atualiza a variável local para exibir o nome mais recente na próxima iteração
          if (dadoAtualizado.nome) cliente.nome = dadoAtualizado.nome;

        } catch (error) {
          console.error('❌ Erro ao atualizar cliente:', error.message);
        }

        const continuar = readline.question('\nDeseja alterar outro campo deste cliente? (S/N): ');
        if (continuar.trim().toUpperCase() !== 'S') {
          alterando = false;
        }
      }
      break;
    }
    case 2: {
      console.log('\n--- Alterar Item no Cardápio / Bebida ---');
      const termo = readline.question('Digite pelo menos parte do nome do Item: ');
      const id = await buscar('cardapio', termo);
      if (!id) break;
      const item = await prisma.cardapio.findUnique({
        where: { id },
        include: { bebida: true }
      });

      if (!item) {
        console.log('❌ Item não encontrado.');
        break;
      }

      let alterandoItem = true;

      while (alterandoItem) {
        console.log(`\nItem selecionado: ${item.nome} - R$ ${item.valor} (${item.categoria})`);
        console.log(`Status de Disponibilidade: ${item.disponivel ? 'Sim' : 'Não'}`);
        if (item.bebida) {
          console.log(`Tipo de Bebida: ${item.bebida.tipo}`);
          if (item.bebida.safra) console.log(`Safra: ${item.bebida.safra}`);
        }

        console.log('\nQual campo deseja alterar?');
        console.log('1. Valor');
        console.log('2. Disponibilidade');

        if (item.bebida && item.bebida.tipo === 'Vinho') {
          console.log('3. Safra');
        }
        console.log('0. Voltar');

        const opcaoCampo = readline.questionInt('Opcao: ');

        if (opcaoCampo === 0) {
          alterandoItem = false;
          continue;
        }

        let dadoAtualizadoCardapio = {};
        let dadoAtualizadoBebida = null;

        switch (opcaoCampo) {
          case 1:
            const valorInput = readline.question('Novo Valor (ex: 15.50): ');
            const valor = parseFloat(valorInput.replace(',', '.'));
            if (isNaN(valor)) {
              console.error('❌ Erro: O valor digitado é inválido.');
              continue;
            }
            dadoAtualizadoCardapio.valor = valor;
            break;
          case 2:
            console.log('\nNova Disponibilidade:');
            console.log('1. Disponivel');
            console.log('2. Encerrado');
            const dispOpcao = readline.questionInt('Opcao: ');
            dadoAtualizadoCardapio.disponivel = dispOpcao === 1;
            break;
          case 3:
            if (item.bebida && item.bebida.tipo === 'Vinho') {
              const anoSafraStr = readline.question('Novo Ano da Safra (ex: 2018) ou enter para remover: ');
              dadoAtualizadoBebida = { safra: anoSafraStr.trim() !== '' ? parseInt(anoSafraStr) : null };
            } else {
              console.log('Opcao invalida.');
              continue;
            }
            break;
          default:
            console.log('Opcao invalida.');
            continue;
        }

        try {
          if (Object.keys(dadoAtualizadoCardapio).length > 0) {
            await prisma.cardapio.update({
              where: { id },
              data: dadoAtualizadoCardapio
            });
            // Atualiza os dados do item exibidos
            Object.assign(item, dadoAtualizadoCardapio);
          }

          if (dadoAtualizadoBebida) {
            await prisma.bebida.update({
              where: { id },
              data: dadoAtualizadoBebida
            });
            // Atualiza os dados da bebida exibidos
            Object.assign(item.bebida, dadoAtualizadoBebida);
          }
          console.log('✅ Item atualizado com sucesso!');
        } catch (error) {
          console.error('❌ Erro ao atualizar item:', error.message);
        }

        const continuarItem = readline.question('\nDeseja alterar outro campo deste item? (S/N): ');
        if (continuarItem.trim().toUpperCase() !== 'S') {
          alterandoItem = false;
        }
      }
      break;
    }
    case 0:
      console.log('Operação cancelada.');
      break;
    default:
      console.log('Opcao invalida.');
  }
}

async function deletar() {
  console.log('\n--- Excluir Registro ---');
  console.log('O que você deseja excluir?');
  console.log('1. Cliente');
  console.log('2. Item no Cardápio / Bebida');
  console.log('3. Comanda');
  console.log('0. Cancelar');
  const tipoRegistro = readline.questionInt('Opcao: ');

  switch (tipoRegistro) {
    case 1: {
      console.log('\n--- Excluir Cliente ---');
      const termo = readline.question('Digite pelo menos parte do nome do Cliente: ');
      const id = await buscar('cliente', termo);
      if (!id) break;
      const cliente = await prisma.cliente.findUnique({ where: { id } });

      if (!cliente) {
        console.log('❌ Cliente não encontrado.');
        break;
      }

      console.log(`\nVocê está prestes a excluir o seguinte cliente:`);
      console.log(`Nome: ${cliente.nome}`);
      console.log(`CPF: ${cliente.cpf}`);
      console.log(`Telefone: ${cliente.telefone}`);

      const confirmacao = readline.question('\nTem certeza que deseja DELETAR este cliente? (S/N): ');
      if (confirmacao.trim().toUpperCase() === 'S') {
        try {
          await prisma.cliente.delete({ where: { id } });
          console.log('✅ Cliente excluído com sucesso!');
        } catch (error) {
          console.error('❌ Erro ao excluir cliente:', error.message);
        }
      } else {
        console.log('Operação cancelada.');
      }
      break;
    }
    case 2: {
      console.log('\n--- Excluir Item no Cardápio / Bebida ---');
      const termo = readline.question('Digite pelo menos parte do nome do Item: ');
      const id = await buscar('cardapio', termo);
      if (!id) break;
      const item = await prisma.cardapio.findUnique({
        where: { id },
        include: { bebida: true }
      });

      if (!item) {
        console.log('❌ Item não encontrado.');
        break;
      }

      console.log(`\nVocê está prestes a excluir o seguinte item do cardápio:`);
      console.log(`Nome: ${item.nome}`);
      console.log(`Valor: R$ ${item.valor}`);
      console.log(`Categoria: ${item.categoria}`);
      if (item.bebida) {
        console.log(`Tipo de Bebida: ${item.bebida.tipo}`);
        if (item.bebida.safra) console.log(`Safra: ${item.bebida.safra}`);
      }

      const confirmacao = readline.question('\nTem certeza que deseja DELETAR este item inteiro? (S/N): ');
      if (confirmacao.trim().toUpperCase() === 'S') {
        try {
          // Se for bebida, deletar a relação na tabela Bebida primeiro (pois tem FK apontando pra Cardapio)
          if (item.bebida) {
            await prisma.bebida.delete({ where: { id } });
          }
          await prisma.cardapio.delete({ where: { id } });
          console.log('✅ Item excluído com sucesso!');
        } catch (error) {
          console.error('❌ Erro ao excluir item do cardápio:', error.message);
        }
      } else {
        console.log('Operação cancelada.');
      }
      break;
    }
    case 3: {
      console.log('\n--- Excluir Comanda ---');
      const id = readline.questionInt('Digite o ID da Comanda que deseja excluir: ');
      const comanda = await prisma.comanda.findUnique({
        where: { id },
        include: { cliente: true }
      });

      if (!comanda) {
        console.log('❌ Comanda não encontrada.');
        break;
      }

      console.log(`\nVocê está prestes a excluir a seguinte comanda:`);
      console.log(`ID Comanda: ${comanda.id}`);
      console.log(`Mesa associada: ${comanda.mesa}`);
      console.log(`Cliente associado: ${comanda.cliente.nome}`);
      console.log(`Data: ${comanda.data}`);
      console.log(`Total: R$ ${comanda.total}`);

      const confirmacao = readline.question('\nTem certeza que deseja DELETAR esta comanda? (S/N): ');
      if (confirmacao.trim().toUpperCase() === 'S') {
        try {
          await prisma.comanda.delete({ where: { id } });
          console.log('✅ Comanda excluída com sucesso!');
        } catch (error) {
          console.error('❌ Erro ao excluir comanda:', error.message);
        }
      } else {
        console.log('Operação cancelada.');
      }
      break;
    }
    case 0:
      console.log('Operação cancelada.');
      break;
    default:
      console.log('Opcao invalida.');
  }
}

async function consultarRegistro() {
  console.log('\n--- Consultar Registro ---');
  console.log('O que você deseja consultar?');
  console.log('1. Cliente');
  console.log('2. Item no Cardápio / Bebida');
  console.log('3. Categoria de Produto');
  console.log('0. Cancelar');
  const tipoRegistro = readline.questionInt('Opcao: ');

  switch (tipoRegistro) {
    case 1: {
      console.log('\n--- Consultar Cliente ---');
      const termo = readline.question('Digite pelo menos parte do nome do Cliente: ');
      const id = await buscar('cliente', termo);
      if (!id) break;
      const cliente = await prisma.cliente.findUnique({ 
        where: { id },
        include: { comandas: true }
      });

      if (cliente) {
        console.log(`\n--- Dados do Cliente ---`);
        console.log(`Nome: ${cliente.nome}`);
        console.log(`CPF: ${cliente.cpf}`);
        console.log(`Telefone: ${cliente.telefone}`);
        
        if (cliente.comandas && cliente.comandas.length > 0) {
          console.log(`\n--- Histórico de Comandas ---`);
          cliente.comandas.forEach(comanda => {
            const dataFormatada = comanda.data.toLocaleString('pt-BR');
            console.log(`- ID: ${comanda.id} | Data: ${dataFormatada} | Mesa: ${comanda.mesa} | Total: R$ ${Number(comanda.total).toFixed(2)}`);
          });
        } else {
          console.log(`\nEste cliente não possui comandas registradas.`);
        }
      }
      break;
    }
    case 2: {
      console.log('\n--- Consultar Item do Cardápio ---');
      const termo = readline.question('Digite pelo menos parte do nome do Item: ');
      const id = await buscar('cardapio', termo);
      if (!id) break;
      const item = await prisma.cardapio.findUnique({
        where: { id },
        include: { bebida: true }
      });

      if (item) {
        console.log(`\n--- Dados do Item ---`);
        console.log(`Nome: ${item.nome}`);
        console.log(`Valor: R$ ${Number(item.valor).toFixed(2)}`);
        console.log(`Categoria: ${item.categoria}`);
        console.log(`Disponível: ${item.disponivel ? 'Sim' : 'Não'}`);
        if (item.bebida) {
          console.log(`Tipo de Bebida: ${item.bebida.tipo}`);
          if (item.bebida.safra) console.log(`Safra: ${item.bebida.safra}`);
        }
      }
      break;
    }
    case 3: {
      console.log('\n--- Consultar Produtos por Categoria ---');
      console.log('Escolha a Categoria:');
      console.log('1. Bebida');
      console.log('2. Prato Principal');
      console.log('3. Sobremesa');
      console.log('4. Acompanhamento');
      console.log('0. Cancelar');
      const catOpcao = readline.questionInt('Opcao: ');
      
      let categoriaBusca = '';
      switch (catOpcao) {
        case 1: categoriaBusca = 'Bebida'; break;
        case 2: categoriaBusca = 'Prato Principal'; break;
        case 3: categoriaBusca = 'Sobremesa'; break;
        case 4: categoriaBusca = 'Acompanhamento'; break;
        case 0: break;
        default: console.log('Opcao invalida.'); break;
      }

      if (categoriaBusca) {
        const itensCategoria = await prisma.cardapio.findMany({
          where: { categoria: categoriaBusca },
          include: { bebida: true }
        });

        if (itensCategoria.length === 0) {
          console.log(`\n❌ Nenhum item encontrado na categoria "${categoriaBusca}".`);
        } else {
          // Se for bebida, ordena as bebidas por Tipo antes de exibir
          if (categoriaBusca === 'Bebida') {
            itensCategoria.sort((a, b) => {
              const tipoA = a.bebida ? a.bebida.tipo : '';
              const tipoB = b.bebida ? b.bebida.tipo : '';
              
              // Se os tipos forem iguais, pode ordenar pelo nome da bebida
              if (tipoA === tipoB) {
                return a.nome.localeCompare(b.nome);
              }
              return tipoA.localeCompare(tipoB);
            });
          }

          console.log(`\nEncontrados ${itensCategoria.length} item(ns) na categoria "${categoriaBusca}":`);
          
          let tipoAtualExibido = '';
          
          itensCategoria.forEach((item, index) => {
            if (categoriaBusca === 'Bebida' && item.bebida) {
              if (item.bebida.tipo !== tipoAtualExibido) {
                tipoAtualExibido = item.bebida.tipo;
                console.log(`\n▼ --- ${tipoAtualExibido.toUpperCase()}S --- ▼`);
              }
            }
            
            console.log(`\n${index + 1}. Nome: ${item.nome} | Valor: R$ ${Number(item.valor).toFixed(2)}`);
            console.log(`   Disponível: ${item.disponivel ? 'Sim' : 'Não'}`);
            if (item.bebida) {
              const bebidaDetalhe = item.bebida.safra ? `${item.bebida.tipo} (Safra: ${item.bebida.safra})` : item.bebida.tipo;
              console.log(`   Detalhe Bebida: ${bebidaDetalhe}`);
            }
          });
        }
      }
      break;
    }
    case 0:
      console.log('Operação cancelada.');
      break;
    default:
      console.log('Opcao invalida.');
  }
}

async function consultarComandas() {
  console.log('\n--- Consultar Comandas por Mesa ---');
  const mesa = readline.questionInt('Digite o numero da mesa: ');

  const apenasHoje = readline.question('Deseja ver apenas as comandas de hoje? (S/N): ');
  
  let whereClause = { mesa };

  if (apenasHoje.trim().toUpperCase() === 'S') {
    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);
    
    const hojeFim = new Date();
    hojeFim.setHours(23, 59, 59, 999);

    whereClause.data = {
      gte: hojeInicio,
      lte: hojeFim
    };
  }

  const comandas = await prisma.comanda.findMany({
    where: whereClause,
    orderBy: { data: 'desc' },
    include: { cliente: true }
  });

  if (comandas.length === 0) {
    console.log(`❌ Nenhuma comanda encontrada para a mesa ${mesa}.`);
    return;
  }

  console.log(`\nForam encontradas ${comandas.length} comanda(s) para a mesa ${mesa}:`);
  comandas.forEach((comanda, index) => {
    const dataFormatada = comanda.data.toLocaleString('pt-BR');
    console.log(`${index + 1}. Data: ${dataFormatada} - Cliente: ${comanda.cliente.nome}`);
  });
  console.log('0. Voltar');

  const opcao = readline.questionInt('Indique uma comanda para visualizar os detalhes (numero): ');

  if (opcao > 0 && opcao <= comandas.length) {
    const comandaSelecionada = comandas[opcao - 1];
    
    // Buscar os detalhes dos itens do cardápio para listar os nomes
    const itensCardapio = await prisma.cardapio.findMany({
      where: {
        id: { in: comandaSelecionada.itens }
      }
    });

    console.log('\n--- Detalhes da Comanda ---');
    const dataFormatada = comandaSelecionada.data.toLocaleString('pt-BR');
    console.log(`Data: ${dataFormatada}`);
    console.log(`Mesa: ${comandaSelecionada.mesa}`);
    console.log(`Cliente: ${comandaSelecionada.cliente.nome} (CPF: ${comandaSelecionada.cliente.cpf})`);
    
    console.log('Itens consumidos:');
    comandaSelecionada.itens.forEach(itemId => {
      const itemDetalhe = itensCardapio.find(i => i.id === itemId);
      if (itemDetalhe) {
        console.log(`  - ${itemDetalhe.nome} (R$ ${Number(itemDetalhe.valor).toFixed(2)})`);
      } else {
        console.log(`  - Item ID ${itemId} (não encontrado no cardápio)`);
      }
    });
    
    console.log(`Total: R$ ${Number(comandaSelecionada.total).toFixed(2)}`);
  } else if (opcao !== 0) {
    console.log('Opcao invalida.');
  }
}

async function main() {
  let rodando = true;

  while (rodando) {
    console.log('\n==================================');
    console.log('       BARATIE - SISTEMA CRUD      ');
    console.log('==================================');
    console.log('1. Inserir Registro');
    console.log('2. Alterar Registro');
    console.log('3. Deletar Registro');
    console.log('4. Inserir Comanda');
    console.log('5. Consultar Registro');
    console.log('6. Consultar Comandas');
    console.log('0. Sair');
    console.log('==================================');

    const opcao = readline.questionInt('Escolha uma opcao: ');

    switch (opcao) {
      case 1:
        await inserir();
        break;
      case 2:
        await alterar();
        break;
      case 3:
        await deletar();
        break;
      case 4:
        await inserirComanda();
        break;
      case 5:
        await consultarRegistro();
        break;
      case 6:
        await consultarComandas();
        break;
      case 0:
        console.log('Saindo...');
        rodando = false;
        break;
      default:
        console.log('Opçao invalida. Tente novamente.');
    }
  }

  // Fechando a conexão ao sair
  await prisma.$disconnect();
}

// Inicia o programa
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
