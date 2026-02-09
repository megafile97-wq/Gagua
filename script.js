let dataAtiva = new Date();
let grafico = null;

function chaveDia() {
    return dataAtiva.toISOString().split("T")[0];
}

function carregarDados() {
    const chave = chaveDia();
    const dados = JSON.parse(localStorage.getItem(chave)) || {
        clientes: [],
        vendasDia: 0
    };

    atualizarTela(dados);
}

function salvarDados(dados) {
    const chave = chaveDia();
    localStorage.setItem(chave, JSON.stringify(dados));
}

/* =====================
   TELA CLIENTES
===================== */
function atualizarTela(dados) {
    const lista = document.getElementById("listaClientes");
    const vendasDia = document.getElementById("vendasDia");

    if (vendasDia) {
        vendasDia.textContent = "R$ " + dados.vendasDia.toFixed(2);
    }

    if (!lista) return;

    lista.innerHTML = "";

    dados.clientes.forEach((cliente, index) => {
        let totalDivida = 0;
        const historico = cliente.vendas.map((v, i) => {
            if (!v.paga) totalDivida += v.total;
            return { ...v, i };
        });

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
            </div>

            <div id="hist-${cliente.nome}" style="display:none; margin-top:10px">
                ${historico.length === 0 ? "<em>Sem vendas</em>" : ""}
                ${historico.map(v => `
                    <div style="margin-bottom:6px">
                        ${v.data} • ${v.forma}
                        • Qtd:
                        <input type="number" min="1" value="${v.quantidade}"
                            onchange="editarQuantidadeVenda(${index}, ${v.i}, this.value)">
                        • R$ ${v.total.toFixed(2)}
                        ${v.paga ? " ✅" : `<button onclick="marcarComoPago(${index}, ${v.i})">Pagar</button>`}
                        <button onclick="excluirVenda(${index}, ${v.i})">❌</button>
                    </div>
                `).join("")}
            </div>
        </div>`;
    });
}

/* =====================
   CLIENTES E VENDAS
===================== */
function adicionarCliente() {
    const nome = document.getElementById("nome").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);

    if (!nome) return;

    const chave = chaveDia();
    const dados = JSON.parse(localStorage.getItem(chave)) || {
        clientes: [],
        vendasDia: 0
    };

    dados.clientes.push({
        nome,
        preco,
        vendas: []
    });

    salvarDados(dados);
    carregarDados();

    document.getElementById("nome").value = "";
}

function registrarVenda(index, forma) {
    const chave = chaveDia();
    const dados = JSON.parse(localStorage.getItem(chave));

    const cliente = dados.clientes[index];
    const total = cliente.preco;

    const venda = {
        data: new Date().toLocaleDateString(),
        forma,
        quantidade: 1,
        total,
        paga: forma !== "fiado"
    };

    cliente.vendas.push(venda);

    if (forma !== "fiado") {
        dados.vendasDia += total;
    }

    salvarDados(dados);
    carregarDados();
}

function editarQuantidadeVenda(clienteIndex, vendaIndex, novaQtd) {
    const chave = chaveDia();
    const dados = JSON.parse(localStorage.getItem(chave));

    const venda = dados.clientes[clienteIndex].vendas[vendaIndex];
    const cliente = dados.clientes[clienteIndex];

    const antigaTotal = venda.total;
    const novaQuantidade = parseInt(novaQtd);
    if (novaQuantidade < 1) return;

    venda.quantidade = novaQuantidade;
    venda.total = novaQuantidade * cliente.preco;

    if (venda.forma !== "fiado") {
        dados.vendasDia -= antigaTotal;
        dados.vendasDia += venda.total;
    }

    salvarDados(dados);
    carregarDados();
}

function editarPrecoCliente(index, novoPreco) {
    const chave = chaveDia();
    const dados = JSON.parse(localStorage.getItem(chave));
    dados.clientes[index].preco = parseFloat(novoPreco);
    salvarDados(dados);
}

function alternarHistorico(nome) {
    const el = document.getElementById("hist-" + nome);
    el.style.display = el.style.display === "none" ? "block" : "none";
}

function excluirCliente(index) {
    const chave = chaveDia();
    const dados = JSON.parse(localStorage.getItem(chave));
    dados.clientes.splice(index, 1);
    salvarDados(dados);
    carregarDados();
}

function excluirVenda(clienteIndex, vendaIndex) {
    const chave = chaveDia();
    const dados = JSON.parse(localStorage.getItem(chave));

    const venda = dados.clientes[clienteIndex].vendas[vendaIndex];

    if (venda.forma !== "fiado") {
        dados.vendasDia -= venda.total;
    }

    dados.clientes[clienteIndex].vendas.splice(vendaIndex, 1);

    salvarDados(dados);
    carregarDados();
}

function marcarComoPago(clienteIndex, vendaIndex) {
    const chave = chaveDia();
    const dados = JSON.parse(localStorage.getItem(chave));

    const venda = dados.clientes[clienteIndex].vendas[vendaIndex];

    if (!venda.paga) {
        venda.paga = true;
        dados.vendasDia += venda.total;
    }

    salvarDados(dados);
    carregarDados();
}

function pagarFiadoDoMenu(chave, clienteNome, vendaIndex) {
    const dados = JSON.parse(localStorage.getItem(chave));
    if (!dados) return;

    const cliente = dados.clientes.find(c => c.nome === clienteNome);
    if (!cliente) return;

    const venda = cliente.vendas[vendaIndex];
    if (!venda || venda.paga) return;

    venda.paga = true;
    dados.vendasDia += venda.total;

    localStorage.setItem(chave, JSON.stringify(dados));

    atualizarListaFiados();

    if (chave === chaveDiaAtiva()) {
        carregarDados();
    }
}

function chaveDiaAtiva() {
    return dataAtiva.toISOString().split("T")[0];
}

/* =====================
   LISTA DE FIADOS DO MÊS
===================== */
function atualizarListaFiados() {
    const lista = document.getElementById("listaFiados");
    if (!lista) return;

    const mes = parseInt(document.getElementById("mes").value);
    const ano = parseInt(document.getElementById("ano").value);

    lista.innerHTML = "";
    let encontrou = false;

    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (!chave.match(/^\d{4}-\d{2}-\d{2}$/)) continue;

        let [a, m, d] = chave.split("-");
        if (parseInt(m) === mes && parseInt(a) === ano) {
            const dadosDia = JSON.parse(localStorage.getItem(chave));

            dadosDia.clientes.forEach((cliente, ci) => {
                cliente.vendas.forEach((v, vi) => {
                    if (v.forma === "fiado" && !v.paga) {
                        encontrou = true;
                        lista.innerHTML += `
                        <div class="fiado-card">
                            <div class="fiado-bola">${d}</div>

                            <div class="fiado-dados">
                                <div class="fiado-nome">${cliente.nome}</div>
                                <div class="fiado-info">
                                    ${v.quantidade} garrafões • R$ ${v.total.toFixed(2)}
                                </div>
                            </div>

                            <button class="fiado-pagar"
                                onclick="pagarFiadoDoMenu('${chave}', '${cliente.nome}', ${vi})">
                                Pagar
                            </button>
                        </div>
                        `;
                    }
                });
            });
        }
    }

    if (!encontrou) {
        lista.innerHTML = "<em>Nenhum fiado neste mês</em>";
    }
}

/* =====================
   GRÁFICO
===================== */
function atualizarGrafico() {
    const mes = parseInt(document.getElementById("mes").value);
    const ano = parseInt(document.getElementById("ano").value);

    let totais = [];
    const diasNoMes = new Date(ano, mes, 0).getDate();

    for (let d = 1; d <= diasNoMes; d++) {
        const chave = `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dados = JSON.parse(localStorage.getItem(chave));
        totais.push(dados ? dados.vendasDia : 0);
    }

    const ctx = document.getElementById("graficoMes");
    if (!ctx) return;

    if (grafico) {
        grafico.destroy();
    }

    grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: totais.map((_, i) => i + 1),
            datasets: [{
                label: "Vendas por dia (R$)",
                data: totais
            }]
        }
    });
}

/* =====================
   CALENDÁRIO
===================== */
function gerarDias() {
    const mes = parseInt(document.getElementById("mes").value);
    const ano = parseInt(document.getElementById("ano").value);

    const diasNoMes = new Date(ano, mes, 0).getDate();
    const container = document.getElementById("dias");

    container.innerHTML = "";

    for (let i = 1; i <= diasNoMes; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = "dia";
        btn.onclick = () => selecionarDia(i, mes, ano);
        container.appendChild(btn);
    }

    atualizarGrafico();
    atualizarListaFiados();
}

function selecionarDia(dia, mes, ano) {
    dataAtiva = new Date(ano, mes - 1, dia);

    document.querySelector(".calendario").style.display = "none";
    document.querySelector(".form").style.display = "block";
    document.querySelector(".vendas").style.display = "block";
    document.querySelector(".lista").style.display = "block";

    carregarDados();
}

function mostrarCalendario() {
    document.querySelector(".calendario").style.display = "block";
    document.querySelector(".form").style.display = "none";
    document.querySelector(".vendas").style.display = "none";
    document.querySelector(".lista").style.display = "none";

    atualizarGrafico();
    atualizarListaFiados();
}

/* =====================
   INICIALIZAÇÃO
===================== */
window.onload = function () {
    const hoje = new Date();
    document.getElementById("mes").value = hoje.getMonth() + 1;
    document.getElementById("ano").value = hoje.getFullYear();

    gerarDias();
    mostrarCalendario();
};
function gerarPDFMensal() {
    const { jsPDF } = window.jspdf;

    const mes = parseInt(document.getElementById("mes").value);
    const ano = parseInt(document.getElementById("ano").value);

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Relatório de Vendas - ${mes}/${ano}`, 14, 15);

    let tabela = [];

    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (!chave.match(/^\d{4}-\d{2}-\d{2}$/)) continue;

        let [a, m, d] = chave.split("-");
        if (parseInt(m) === mes && parseInt(a) === ano) {
            const dadosDia = JSON.parse(localStorage.getItem(chave));

            dadosDia.clientes.forEach(cliente => {
                cliente.vendas.forEach(v => {
                    tabela.push([
                        d + "/" + m + "/" + a,
                        cliente.nome,
                        v.quantidade,
                        v.forma,
                        "R$ " + v.total.toFixed(2)
                    ]);
                });
            });
        }
    }

    if (tabela.length === 0) {
        doc.text("Nenhuma venda neste mês.", 14, 30);
    } else {
        doc.autoTable({
            startY: 25,
            head: [["Data", "Cliente", "Qtd", "Forma", "Valor"]],
            body: tabela
        });
    }

    doc.save(`relatorio-${mes}-${ano}.pdf`);
        }
