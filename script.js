let dataAtiva = new Date();

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

    const antigaQtd = venda.quantidade;
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

function zerarVendas() {
    const chave = chaveDia();
    const dados = JSON.parse(localStorage.getItem(chave));
    dados.vendasDia = 0;
    salvarDados(dados);
    carregarDados();
}

function editarVendasDoDia() {
    const valor = prompt("Novo valor das vendas do dia:");
    if (valor === null) return;

    const chave = chaveDia();
    const dados = JSON.parse(localStorage.getItem(chave));
    dados.vendasDia = parseFloat(valor) || 0;

    salvarDados(dados);
    carregarDados();
}

function gerarPDFMensal() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const mes = parseInt(document.getElementById("mes").value);
    const ano = parseInt(document.getElementById("ano").value);

    let y = 10;
    doc.text(`Relatório ${mes}/${ano}`, 10, y);
    y += 10;

    for (let dia = 1; dia <= 31; dia++) {
        const data = new Date(ano, mes - 1, dia);
        if (data.getMonth() !== mes - 1) break;

        const chave = data.toISOString().split("T")[0];
        const dados = JSON.parse(localStorage.getItem(chave));

        if (dados && dados.vendasDia > 0) {
            doc.text(`${dia}/${mes}: R$ ${dados.vendasDia.toFixed(2)}`, 10, y);
            y += 8;
        }
    }

    doc.save(`relatorio-${mes}-${ano}.pdf`);
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
