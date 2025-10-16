// === Seleção de elementos ===
const esferaGrande = document.getElementById("grande");
const brilhoInput = document.getElementById("brilho");
const intensidadeInput = document.getElementById("intensidade");
const escalaInput = document.getElementById("escala");
const modoCorCheckbox = document.getElementById("modoCor");
const cor1Input = document.getElementById("cor1");
const cor2Input = document.getElementById("cor2");
const pauseBtn = document.getElementById("pauseBtn");
const tamanhoGrandeInput = document.getElementById("tamanhoGrande");

const velocidadeMediasInput = document.getElementById("velocidadeMedias");
const velocidadePequenasInput = document.getElementById("velocidadePequenas");
const velocidadeMicrosInput = document.getElementById("velocidadeMicros");
const raioMediasInput = document.getElementById("raioMedias");
const raioPequenasInput = document.getElementById("raioPequenas");
const raioMicrosInput = document.getElementById("raioMicros");

// Controles do sistema secundário
const velocidadeSistemaInput = document.getElementById("velocidadeSistema");
const raioSistemaInput = document.getElementById("raioSistema");

// === Variáveis globais ===
let brilho = parseFloat(brilhoInput?.value || 1);
let intensidade = parseFloat(intensidadeInput?.value || 0.5);
let escala = parseFloat(escalaInput?.value || 1);
let cosmosAtivo = false;
let rodando = true;
let hue = 0;
let tamanhoGrande = parseFloat(tamanhoGrandeInput?.value || 250);

// Velocidades
let velocidadeMedias = parseFloat(velocidadeMediasInput?.value || 0.02);
let velocidadePequenas = parseFloat(velocidadePequenasInput?.value || 0.03);
let velocidadeMicros = parseFloat(velocidadeMicrosInput?.value || 0.05);

// Raios
let raioMedias = parseFloat(raioMediasInput?.value || 180);
let raioPequenas = parseFloat(raioPequenasInput?.value || 60);
let raioMicros = parseFloat(raioMicrosInput?.value || 25);

// === Função para criar orbitantes ===
function criarOrbitantes(pai, qtd, classe, raio) {
  const orbitantes = [];
  for (let i = 0; i < qtd; i++) {
    const e = document.createElement("div");
    e.classList.add("esfera", classe);
    pai.appendChild(e);
    orbitantes.push({
      el: e,
      raio,
      angulo: (i / qtd) * 2 * Math.PI,
    });
  }
  return orbitantes;
}

// === Criação de sistema fractal (reutilizável) ===
function criarSistema(container, tamanho, raioM, raioP, raioMi) {
  const grande = document.createElement("div");
  grande.classList.add("esfera", "grande");
  grande.style.width = `${tamanho}px`;
  grande.style.height = `${tamanho}px`;
  container.appendChild(grande);

  const medias = criarOrbitantes(grande, 3, "media", raioM);
  const pequenasPorMedia = medias.map(m => criarOrbitantes(m.el, 3, "pequena", raioP));
  const microsPorPequena = pequenasPorMedia.map(grupo =>
    grupo.map(p => criarOrbitantes(p.el, 3, "micro", raioMi))
  );

  return { grande, medias, pequenasPorMedia, microsPorPequena };
}

// === SISTEMA PRINCIPAL ===
const container1 = document.querySelector(".container");
const sistema1 = criarSistema(container1, tamanhoGrande, raioMedias, raioPequenas, raioMicros);

// === SISTEMA SECUNDÁRIO ===
const container2 = document.createElement("div");
container2.classList.add("container");
document.querySelector(".janela-visual").appendChild(container2);

const sistema2 = criarSistema(container2, tamanhoGrande * 0.6, 130, 40, 15);

// === Órbita entre sistemas ===
let anguloSistema = 0;
let velocidadeSistema = parseFloat(velocidadeSistemaInput?.value || 0.004);
let raioSistema = parseFloat(raioSistemaInput?.value || 500);

// === Inércia suave ===
let velocidadeMediasAtual = velocidadeMedias;
let velocidadePequenasAtual = velocidadePequenas;
let velocidadeMicrosAtual = velocidadeMicros;
const suavizacao = 0.05;
let lastTime = performance.now();

// === Função genérica para animar fractal ===
function animarFractal(sistema, delta, reverso = false) {
  const { grande, medias, pequenasPorMedia, microsPorPequena } = sistema;
  const cx = grande.offsetWidth / 2;
  const cy = grande.offsetHeight / 2;
  const sinal = reverso ? -1 : 1;

  // 🔧 Atualiza dinamicamente os raios conforme os sliders
  // e aproxima as esferas quando os raios estão pequenos
  function ajustarRaio(r, baseMinimo = 30) {
    // quanto menor o raio, mais as esferas se aproximam
    const fator = 0.5 + 0.5 * Math.tanh((r - baseMinimo) / baseMinimo);
    return r * fator;
  }

  medias.forEach(m => (m.raio = ajustarRaio(raioMedias, 120)));
  pequenasPorMedia.forEach(grupo =>
    grupo.forEach(p => (p.raio = ajustarRaio(raioPequenas, 50)))
  );
  microsPorPequena.forEach(grupo =>
    grupo.forEach(sub => sub.forEach(mi => (mi.raio = ajustarRaio(raioMicros, 20))))
  );

  medias.forEach((m, i) => {
    m.angulo += sinal * velocidadeMediasAtual * delta * 10;
    const x = cx + m.raio * Math.cos(m.angulo) - m.el.offsetWidth / 2;
    const y = cy + m.raio * Math.sin(m.angulo) - m.el.offsetHeight / 2;
    m.el.style.left = `${x}px`;
    m.el.style.top = `${y}px`;

    const cx2 = m.el.offsetWidth / 2;
    const cy2 = m.el.offsetHeight / 2;

    pequenasPorMedia[i].forEach((p, j) => {
      p.angulo -= sinal * velocidadePequenasAtual * delta * 10;
      const x2 = cx2 + p.raio * Math.cos(p.angulo) - p.el.offsetWidth / 2;
      const y2 = cy2 + p.raio * Math.sin(p.angulo) - p.el.offsetHeight / 2;
      p.el.style.left = `${x2}px`;
      p.el.style.top = `${y2}px`;

      const cx3 = p.el.offsetWidth / 2;
      const cy3 = p.el.offsetHeight / 2;

      microsPorPequena[i][j].forEach(micro => {
        micro.angulo += sinal * velocidadeMicrosAtual * delta * 10;
        const x3 = cx3 + micro.raio * Math.cos(micro.angulo) - micro.el.offsetWidth / 2;
        const y3 = cy3 + micro.raio * Math.sin(micro.angulo) - micro.el.offsetHeight / 2;
        micro.el.style.left = `${x3}px`;
        micro.el.style.top = `${y3}px`;
      });
    });
  });
}

// === Loop principal ===
function animar(tempoAtual) {
  const delta = (tempoAtual - lastTime) / 1000;
  lastTime = tempoAtual;

  if (rodando) {
    velocidadeMediasAtual += (velocidadeMedias - velocidadeMediasAtual) * suavizacao;
    velocidadePequenasAtual += (velocidadePequenas - velocidadePequenasAtual) * suavizacao;
    velocidadeMicrosAtual += (velocidadeMicros - velocidadeMicrosAtual) * suavizacao;

    // Atualiza tamanho e escala
    sistema1.grande.style.width = `${tamanhoGrande}px`;
    sistema1.grande.style.height = `${tamanhoGrande}px`;
    container1.style.transform = `scale(${escala})`;
    container2.style.transform = `scale(${escala})`;

    // === Fractais ===
    animarFractal(sistema1, delta);
    animarFractal(sistema2, delta, true);

    // === Movimento orbital do sistema 2 ===
    anguloSistema += velocidadeSistema * delta * 60;
    const rect1 = sistema1.grande.getBoundingClientRect();
    const centroX = rect1.left + rect1.width / 2;
    const centroY = rect1.top + rect1.height / 2;
    const offsetX = Math.cos(anguloSistema) * (raioSistema + tamanhoGrande * 0.6);
    const offsetY = Math.sin(anguloSistema) * (raioSistema + tamanhoGrande * 0.6);
    container2.style.position = "absolute";
    container2.style.left = `${centroX + offsetX - container2.offsetWidth / 2}px`;
    container2.style.top = `${centroY + offsetY - container2.offsetHeight / 2}px`;

    // === Cores e brilho ===
    if (cosmosAtivo) {
      hue = (hue + 15 * delta) % 360;
      const cor1 = `hsl(${hue}, 100%, 55%)`;
      const cor2 = `hsl(${(hue + 180) % 360}, 100%, 45%)`;
      const cor3 = `hsl(${(hue + 90) % 360}, 100%, 60%)`;

      sistema1.grande.style.background = `radial-gradient(circle at 40% 40%, ${cor1}, ${cor2}, #000)`;
      sistema2.grande.style.background = `radial-gradient(circle at 40% 40%, ${cor3}, ${cor1}, #000)`;

      const brilhoPulse = 1 + intensidade * Math.sin(tempoAtual * 0.004);
      document.querySelectorAll(".esfera").forEach(e => {
        e.style.filter = `brightness(${brilho * brilhoPulse})`;
      });
    } else {
      const c1 = cor1Input.value;
      const c2 = cor2Input.value;
      sistema1.grande.style.background = `radial-gradient(circle at 40% 40%, ${c1}, ${c2}, #000)`;
      sistema2.grande.style.background = `radial-gradient(circle at 40% 40%, ${c2}, ${c1}, #000)`;
      document.querySelectorAll(".esfera").forEach(e => {
        e.style.filter = `brightness(${brilho})`;
      });
    }
  }

  requestAnimationFrame(animar);
}

requestAnimationFrame(animar);

// === Controles ===
[
  [velocidadeMediasInput, v => (velocidadeMedias = parseFloat(v))],
  [velocidadePequenasInput, v => (velocidadePequenas = parseFloat(v))],
  [velocidadeMicrosInput, v => (velocidadeMicros = parseFloat(v))],
  [raioMediasInput, v => (raioMedias = parseFloat(v))],
  [raioPequenasInput, v => (raioPequenas = parseFloat(v))],
  [raioMicrosInput, v => (raioMicros = parseFloat(v))],
  [brilhoInput, v => (brilho = parseFloat(v))],
  [intensidadeInput, v => (intensidade = parseFloat(v))],
  [escalaInput, v => (escala = parseFloat(v))],
  [tamanhoGrandeInput, v => (tamanhoGrande = parseFloat(v))],
  [velocidadeSistemaInput, v => (velocidadeSistema = parseFloat(v))],
  [raioSistemaInput, v => (raioSistema = parseFloat(v))],
].forEach(([input, fn]) => input?.addEventListener("input", e => fn(e.target.value)));

modoCorCheckbox.addEventListener("change", e => (cosmosAtivo = e.target.checked));
pauseBtn.addEventListener("click", () => {
  rodando = !rodando;
  pauseBtn.textContent = rodando ? "⏸️ Pausar" : "▶️ Retomar";
});

// === Alternância entre abas ===
const abas = document.querySelectorAll(".aba");
const conteudos = document.querySelectorAll(".conteudo-aba");

abas.forEach(aba => {
  aba.addEventListener("click", () => {
    abas.forEach(a => a.classList.remove("ativa"));
    conteudos.forEach(c => c.classList.remove("ativa"));
    aba.classList.add("ativa");
    document.getElementById(aba.dataset.alvo).classList.add("ativa");
  });
});
