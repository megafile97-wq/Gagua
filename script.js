/* ---------- VARIÁVEIS ---------- */
let dadosPorDia = {};
let clientes = [];
let vendas = [];
let vendasDoDia = 0;
let dataSelecionada = null;

/* ---------- UTILIDADES ---------- */
function formatarData(d, m, a) {
    return `${d.toString().padStart(2, '0')}/${(m + 1).toString().padStart(2, '0')}/${a}`;
}

function salvarDados() {
    localStorage.setItem("dadosPorDia", JSON.stringify(dadosPorDia));
}

function carregarDados() {
    dadosPorDia = JSON.parse(localStorage.getItem("dadosPorDia")) || {};
}

/* ---------- CALENDÁRIO ---------- */
function mostrarCalendario() {
    const app = document.querySelector(".app");
    app.innerHTML = `
        <section class="card calendario">
            <h2>Escolha a data</h2>
            <div>
                Mês: <input type="number" id="mes" min="1" max="12" value="${new Date().getMonth() + 1}" onchange="gerarDias()">
                Ano: <input type="number" id="ano" min="2000" max="2100" value="${new Date().getFullYear()}" onchange="gerarDias()">
            </div>
            <div id="dias" style="margin-top:10px"></div>
            <button class="btn-primary" onclick="gerarPDFMensal()">📄 Gerar PDF do mês</button>
        </section>
    `;
    gerarDias();
}

function gerarDias() {
    const diasDiv = document.getElementById("dias");
    const mes = parseInt(document.getElementById("mes").value) - 1;
    const ano = parseInt(document.getElementById("ano").value);
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    diasDiv.innerHTML = "";
    for (let d = 1; d <= totalDias; d++) {
        const btn = document.createElement("button");
        btn.innerText = d;
        btn.style.margin = "2px";
        btn.onclick = () => abrirDia(d, mes, ano);
        diasDiv.appendChild(btn);
    }
}

/* ---------- DIA ---------- */
function abrirDia(dia, mes, ano) {
    dataSelecionada = formatarData(dia, mes, ano);

    if (!dadosPorDia[dataSelecionada]) {
        dadosPorDia[dataSelecionada] = {
            clientes: [],
            vendas: [],
            vendasDoDia: 0
        };
    }

    clientes = dadosPorDia[dataSelecionada].clientes;
    vendas = dadosPorDia[dataSelecionada].vendas;
    vendasDoDia = dadosPorDia[dataSelecionada].vendasDoDia;

    const app = document.querySelector(".app");
    app.innerHTML = `
        <header class="header">
            <h1>Controle de Garrafões - ${dataSelecionada}</h1>
        </header>

        <section class="card form">
            <div class="field">
                <label>Nome do cliente</label>
                <input type="text" id="nome" placeholder="Ex: João Silva">
            </div>
            <div class="field">
                <label>Preço do garrafão (R$)</label>
                <input type="number" id="preco" value="0">
            </div>
            <button class="btn-primary" onclick="adicionarCliente()">Cadastrar cliente</button>
        </section>

        <section class="card vendas">
            <h2>Vendas do dia</h2>
            <p class="valor" id="vendasDia" onclick="editarVendasDoDia()" style="cursor:pointer">
                R$ ${vendasDoDia.toFixed(2)}
            </p>
            <button class="btn-danger" onclick="zerarVendas()">Zerar vendas do dia</button>
            <button class="btn-primary" onclick="mostrarCalendario()">⬅ Voltar</button>
        </section>

        <section id="listaClientes" class="lista"></section>
    `;
    atualizarTela();
}

/* ---------- CLIENTES ---------- */
function adicionarCliente() {
    const nome = document.getElementById("nome").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);

    if (!nome || isNaN(preco) || preco <= 0) {
        alert("Preencha corretamente");
        return;
    }

    clientes.push({ nome, preco });
    document.getElementById("nome").value = "";
    salvarDadosDia();
    atualizarTela();
}

function excluirCliente(index) {
    if (confirm("Excluir cliente e histórico?")) {
        const nome = clientes[index].nome;
        clientes.splice(index, 1);
        vendas = vendas.filter(v => v.cliente !== nome);
        salvarDadosDia();
        atualizarTela();
    }
}

function editarPrecoCliente(index, novoPreco) {
    novoPreco = parseFloat(novoPreco);
    if (isNaN(novoPreco) || novoPreco <= 0) {
        atualizarTela();
        return;
    }
    clientes[index].preco = novoPreco;
    salvarDadosDia();
}

/* ---------- VENDAS ---------- */
function registrarVenda(index, forma) {
    const cliente = clientes[index];
    const paga = forma !== "fiado";

    const vendaExistente = vendas.find(v =>
        v.cliente === cliente.nome &&
        v.forma === forma &&
        v.preco === cliente.preco
    );

    if (vendaExistente) {
        vendaExistente.quantidade++;
        vendaExistente.total = vendaExistente.quantidade * vendaExistente.preco;
    } else {
        vendas.push({
            cliente: cliente.nome,
            preco: cliente.preco,
            quantidade: 1,
            total: cliente.preco,
            forma,
            data: dataSelecionada,
            paga
        });
    }

    if (paga) vendasDoDia += cliente.preco;
    salvarDadosDia();
    atualizarTela();
}

function removerUltimaVenda(index) {
    const nome = clientes[index].nome;

    const venda = [...vendas].reverse().find(v => v.cliente === nome);
    if (!venda) return;

    if (venda.quantidade > 1) {
        venda.quantidade--;
        venda.total = venda.quantidade * venda.preco;
    } else {
        vendas.splice(vendas.indexOf(venda), 1);
    }

    salvarDadosDia();
    atualizarTela();
}

function excluirVenda(i) {
    if (confirm("Excluir esta venda?")) {
        vendas.splice(i, 1);
        salvarDadosDia();
        atualizarTela();
    }
}

function marcarComoPago(i) {
    if (!vendas[i].paga) {
        vendas[i].paga = true;
        vendasDoDia += vendas[i].total;
    }
    salvarDadosDia();
    atualizarTela();
}

/* ---------- VENDAS DO DIA ---------- */
function zerarVendas() {
    if (confirm("Zerar vendas do dia?")) {
        vendasDoDia = 0;
        salvarDadosDia();
        atualizarTela();
    }
}

function editarVendasDoDia() {
    const novo = prompt(
        "Editar valor das vendas do dia:",
        vendasDoDia.toFixed(2)
    );
    if (novo === null) return;

    const valor = parseFloat(novo.replace(",", "."));
    if (isNaN(valor) || valor < 0) {
        alert("Valor inválido");
        return;
    }

    vendasDoDia = valor;
    salvarDadosDia();
    atualizarTela();
}

/* ---------- HISTÓRICO ---------- */
function alternarHistorico(nome) {
    const div = document.getElementById("hist-" + nome);
    div.style.display = div.style.display === "none" ? "block" : "none";
}

/* ---------- TELA ---------- */
function atualizarTela() {
    const lista = document.getElementById("listaClientes");
    if (!lista) return;
    lista.innerHTML = "";

    clientes.forEach((cliente, index) => {
        const historico = vendas
            .map((v, i) => ({ ...v, i }))
            .filter(v => v.cliente === cliente.nome);

        const totalDivida = historico
            .filter(v => !v.paga)
            .reduce((s, v) => s + v.total, 0);

        lista.innerHTML += `
        <div class="cliente">
            <div class="topo-cliente">
                <strong onclick="alternarHistorico('${cliente.nome}')" style="cursor:pointer">
                    ${cliente.nome} — R$ ${totalDivida.toFixed(2)}
                </strong>
                <button class="btn-excluir" onclick="excluirCliente(${index})">✖</button>
            </div>

            Preço:
            <input type="number" step="0.01" value="${cliente.preco}"
                onchange="editarPrecoCliente(${index}, this.value)">

            <div class="botoes">
                <button onclick="registrarVenda(${index}, 'dinheiro')">💵 Dinheiro</button>
                <button onclick="registrarVenda(${index}, 'pix')">📱 Pix</button>
                <button onclick="registrarVenda(${index}, 'fiado')">🧾 Fiado</button>
                <button onclick="removerUltimaVenda(${index})">- Garrafão</button>
            </div>

            <div id="hist-${cliente.nome}" style="display:none; margin-top:10px">
                ${historico.length === 0 ? "<em>Sem vendas</em>" : ""}
                ${historico.map(v => `
                    <div style="margin-bottom:6px">
                        ${v.forma}
                        • Qtd:
                        <input type="number" min="1" value="${v.quantidade}">
                        • R$ ${v.total.toFixed(2)}
                        ${v.paga ? " ✅" : `<button onclick="marcarComoPago(${v.i})">Pagar</button>`}
                        <button onclick="excluirVenda(${v.i})">❌</button>
                    </div>
                `).join("")}
            </div>
        </div>`;
    });

    const vendasDiaEl = document.getElementById("vendasDia");
    if (vendasDiaEl) vendasDiaEl.innerText = `R$ ${vendasDoDia.toFixed(2)}`;
}

/* ---------- SALVAR DIA ---------- */
function salvarDadosDia() {
    dadosPorDia[dataSelecionada] = {
        clientes,
        vendas,
        vendasDoDia
    };
    salvarDados();
}

/* ---------- PDF ---------- */
function gerarPDFMensal() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const mes = parseInt(document.getElementById("mes").value) - 1;
    const ano = parseInt(document.getElementById("ano").value);

    let vendasMes = [];

    Object.values(dadosPorDia).forEach(dia => {
        dia.vendas.forEach(v => {
            const [d, m, a] = v.data.split("/").map(Number);
            if ((m - 1) === mes && a === ano) {
                vendasMes.push(v);
            }
        });
    });

    if (vendasMes.length === 0) {
        alert("Não há vendas neste mês.");
        return;
    }

    doc.setFontSize(14);
    doc.text(`Relatório de Vendas - ${mes + 1}/${ano}`, 14, 15);

    let totalMes = 0;

    const tabela = vendasMes.map(v => {
        totalMes += v.total;
        return [
            v.data,
            v.cliente,
            v.forma,
            v.quantidade,
            `R$ ${v.preco.toFixed(2)}`,
            `R$ ${v.total.toFixed(2)}`,
            v.paga ? "Pago" : "Fiado"
        ];
    });

    doc.autoTable({
        startY: 25,
        head: [["Data","Cliente","Forma","Qtd","Valor Unit.","Total","Status"]],
        body: tabela,
        styles: { fontSize: 9, cellPadding: 3 }
    });

    const yFinal = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total geral do mês: R$ ${totalMes.toFixed(2)}`, 14, yFinal);

    doc.save(`vendas_${mes + 1}_${ano}.pdf`);
}

/* ---------- INIT ---------- */
window.onload = () => {
    carregarDados();
    mostrarCalendario();
};