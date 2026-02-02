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

    if (clientesSalvos) {
        clientes = JSON.parse(clientesSalvos);
    }

    if (vendasSalvas) {
        vendasDoDia = parseFloat(vendasSalvas);
    }

    atualizarTela();
}

/* ---------- CLIENTES ---------- */

function adicionarCliente() {
    const nome = document.getElementById("nome").value;
    const preco = parseFloat(document.getElementById("preco").value);

    if (nome === "") {
        alert("Digite um nome");
        return;
    }

    clientes.push({
        nome: nome,
        garrafoes: 0,
        preco: preco
    });

    document.getElementById("nome").value = "";
    salvarDados();
    atualizarTela();
}

function adicionarGarrafa(index) {
    clientes[index].garrafoes++;
    vendasDoDia += clientes[index].preco;

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

/* ---------- VENDAS ---------- */

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
    const lista = document.getElementById("listaClientes");
    lista.innerHTML = "";

    clientes.forEach((cliente, index) => {
        const total = cliente.garrafoes * cliente.preco;

        lista.innerHTML += `
            <div class="cliente">
                <strong>${cliente.nome}</strong>
                <span>Garrafões: ${cliente.garrafoes}</span><br>
                <span>Valor devido: R$ ${total.toFixed(2)}</span>

                <div class="botoes">
                    <button onclick="adicionarGarrafa(${index})">+ Garrafão</button>
                    <button onclick="removerGarrafa(${index})">- Garrafão</button>
                </div>
            </div>
        `;
    });

    atualizarVendas();
}

/* ---------- INICIALIZA ---------- */

window.onload = carregarDados;