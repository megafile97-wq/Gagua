let clientes = [];
let vendasDoDia = 0;

/* ---------- SALVAR E CARREGAR ---------- */

function salvarDados() {
    localStorage.setItem("clientes", JSON.stringify(clientes));
    localStorage.setItem("vendasDoDia", vendasDoDia);
}

function carregarDados() {
    const clientesSalvos = localStorage.getItem("clientes");
    const vendasSalvas = localStorage.getItem("vendasDoDia");

    if (clientesSalvos) clientes = JSON.parse(clientesSalvos);
    if (vendasSalvas) vendasDoDia = parseFloat(vendasSalvas);

    atualizarTela();
}

/* ---------- CLIENTES ---------- */

function adicionarCliente() {
    const nome = document.getElementById("nome").value;
    const preco = parseFloat(document.getElementById("preco").value);

    if (!nome || isNaN(preco) || preco <= 0) {
        alert("Preencha corretamente");
        return;
    }

    clientes.push({
        nome,
        garrafoes: 0,
        preco
    });

    document.getElementById("nome").value = "";
    salvarDados();
    atualizarTela();
}

function adicionarGarrafa(index) {
    clientes[index].garrafoes++; // ✅ apenas uma vez
    salvarDados();
    atualizarTela();
}

function removerGarrafa(index) {
    if (clientes[index].garrafoes > 0) {
        clientes[index].garrafoes--;
        salvarDados();
        atualizarTela();
    }
}

function excluirCliente(index) {
    if (confirm("Deseja excluir este cliente?")) {
        clientes.splice(index, 1);
        salvarDados();
        atualizarTela();
    }
}

/* ---------- PREÇO ---------- */

function editarPreco(index, novoPreco) {
    novoPreco = parseFloat(novoPreco);

    if (isNaN(novoPreco) || novoPreco <= 0) {
        alert("Preço inválido");
        atualizarTela();
        return;
    }

    clientes[index].preco = novoPreco;
    salvarDados();
    atualizarTela();
}

/* ---------- VENDAS ---------- */

function recalcularVendas() {
    vendasDoDia = 0;
    clientes.forEach(cliente => {
        vendasDoDia += cliente.garrafoes * cliente.preco;
    });
}

function zerarVendas() {
    if (confirm("Deseja zerar as vendas do dia?")) {
        vendasDoDia = 0;
        salvarDados();
        atualizarVendas();
    }
}

function atualizarVendas() {
    document.getElementById("vendasDia").innerText =
        `R$ ${vendasDoDia.toFixed(2)}`;
}

/* ---------- TELA ---------- */

function atualizarTela() {
    recalcularVendas();

    const lista = document.getElementById("listaClientes");
    lista.innerHTML = "";

    clientes.forEach((cliente, index) => {
        const total = cliente.garrafoes * cliente.preco;

        lista.innerHTML += `
            <div class="cliente">
                <div class="topo-cliente">
                    <strong>${cliente.nome}</strong>
                    <button class="btn-excluir" onclick="excluirCliente(${index})">✖</button>
                </div>

                <span>Garrafões: ${cliente.garrafoes}</span><br>

                <span>
                    Preço: R$
                    <input 
                        type="number"
                        value="${cliente.preco}"
                        step="0.01"
                        onchange="editarPreco(${index}, this.value)"
                    >
                </span><br>

                <span>Valor devido: R$ ${total.toFixed(2)}</span>

                <div class="botoes">
                    <button class="add" onclick="adicionarGarrafa(${index})">+ Garrafão</button>
                    <button class="rem" onclick="removerGarrafa(${index})">- Garrafão</button>
                </div>
            </div>
        `;
    });

    atualizarVendas();
}

/* ---------- INICIALIZA ---------- */

window.onload = carregarDados;