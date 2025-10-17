// === Seleção de elementos ===
const opacidadeGrandeInput = document.getElementById("opacidadeGrande");
const opacidadeMediasInput = document.getElementById("opacidadeMedias");
const opacidadePequenasInput = document.getElementById("opacidadePequenas");
const opacidadeMicrosInput = document.getElementById("opacidadeMicros");
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
const velocidadeSistemaInput = document.getElementById("velocidadeSistema");
const raioSistemaInput = document.getElementById("raioSistema");
const controleOrbita = document.getElementById("modoOrbita");
const mostrarLinhasCheckbox = document.getElementById("mostrarLinhas");
const mostrarRastroCheckbox = document.getElementById("mostrarRastro");

// === Canvas de rastro (etéreo) ===
const canvas = document.createElement("canvas");
canvas.id = "rastroCanvas";
canvas.style.position = "absolute";
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.pointerEvents = "none";
canvas.style.zIndex = 0; // atrás do painel visual (o CSS do projeto já define z-indexs)
document.body.prepend(canvas);
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  // redimensiona e limpa totalmente (evita artefatos ao mudar tamanho)
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// === Variáveis globais ===
// se não houver checkbox no HTML, assumimos true por padrão
let mostrarRastro = mostrarRastroCheckbox ? !!mostrarRastroCheckbox.checked : true;

let opacidadeGrande = parseFloat(opacidadeGrandeInput?.value || 1);
let opacidadeMedias = parseFloat(opacidadeMediasInput?.value || 1);
let opacidadePequenas = parseFloat(opacidadePequenasInput?.value || 1);
let opacidadeMicros = parseFloat(opacidadeMicrosInput?.value || 1);
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

// Órbita entre sistemas
let anguloSistema = 0;
let velocidadeSistema = parseFloat(velocidadeSistemaInput?.value || 0.004);
let raioSistema = parseFloat(raioSistemaInput?.value || 500);
let modoOrbita = "s2-orbita-s1"; // padrão inicial

// Inércia suave
let velocidadeMediasAtual = velocidadeMedias;
let velocidadePequenasAtual = velocidadePequenas;
let velocidadeMicrosAtual = velocidadeMicros;
const suavizacao = 0.05;
let lastTime = performance.now();

// === Alternância do rastro (listener) ===
if (mostrarRastroCheckbox) {
  // sincroniza valor inicial (caso a checkbox esteja já configurada no HTML)
  mostrarRastro = !!mostrarRastroCheckbox.checked;

  mostrarRastroCheckbox.addEventListener("change", () => {
    mostrarRastro = !!mostrarRastroCheckbox.checked;
    if (!mostrarRastro) {
      // limpa totalmente o canvas quando desativar para remover rastros antigos
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      // se ativou novamente, começa com fundo limpo (pode pintar fundo preto se quiser)
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  });
}

// === Função para criar orbitantes ===
function criarOrbitantes(pai, qtd, classe, raio) {
  const orbitantes = [];
  for (let i = 0; i < qtd; i++) {
    const e = document.createElement("div");
    e.classList.add("esfera", classe);
    // garantir posicionamento inicial
    e.style.left = "0px";
    e.style.top = "0px";
    pai.appendChild(e);
    orbitantes.push({
      el: e,
      raio,
      angulo: (i / qtd) * 2 * Math.PI,
      posAnterior: null,
    });
  }
  return orbitantes;
}

// === Criação de sistema fractal (com linhas orbitais) ===
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

  // linhas orbitais (divs circulares posicionadas dentro do 'grande')
  const linhaMedias = document.createElement("div");
  linhaMedias.classList.add("linha-orbita");
  grande.appendChild(linhaMedias);

  const linhasPequenas = medias.map(() => {
    const l = document.createElement("div");
    l.classList.add("linha-orbita");
    grande.appendChild(l);
    return l;
  });

  const linhasMicros = pequenasPorMedia.map(grupo =>
    grupo.map(() => {
      const l = document.createElement("div");
      l.classList.add("linha-orbita");
      grande.appendChild(l);
      return l;
    })
  );

  return { grande, medias, pequenasPorMedia, microsPorPequena, linhaMedias, linhasPequenas, linhasMicros };
}

// === SISTEMAS ===
const container1 = document.querySelector(".container");
const sistema1 = criarSistema(container1, tamanhoGrande, raioMedias, raioPequenas, raioMicros);

const container2 = document.createElement("div");
container2.classList.add("container");
document.querySelector(".janela-visual").appendChild(container2);
const sistema2 = criarSistema(container2, tamanhoGrande * 0.6, 130, 40, 15);

// === Desenha linha suave no canvas (rastro etéreo) ===
function desenharRastroCanvas(x1, y1, x2, y2, color, width = 1, alpha = 0.08) {
  // Se o rastro estiver desativado, não desenha nada
  if (!mostrarRastro) return;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// === Função genérica para animar fractal ===
function animarFractal(sistema, delta, reverso = false) {
  const { grande, medias, pequenasPorMedia, microsPorPequena, linhaMedias, linhasPequenas, linhasMicros } = sistema;
  const cx = grande.offsetWidth / 2;
  const cy = grande.offsetHeight / 2;
  const sinal = reverso ? -1 : 1;

  // ajustar raios dinamicamente (opcional suavização)
  medias.forEach(m => (m.raio = raioMedias));
  pequenasPorMedia.forEach(grupo => grupo.forEach(p => (p.raio = raioPequenas)));
  microsPorPequena.forEach(grupo => grupo.forEach(sub => sub.forEach(mi => (mi.raio = raioMicros))));

  // atualiza círculo das médias
  linhaMedias.style.width = `${raioMedias * 2}px`;
  linhaMedias.style.height = `${raioMedias * 2}px`;
  linhaMedias.style.left = `${cx - raioMedias}px`;
  linhaMedias.style.top = `${cy - raioMedias}px`;

  medias.forEach((m, i) => {
    m.angulo += sinal * velocidadeMediasAtual * delta * 10;
    const x = cx + m.raio * Math.cos(m.angulo) - m.el.offsetWidth / 2;
    const y = cy + m.raio * Math.sin(m.angulo) - m.el.offsetHeight / 2;

    // desenha rastro etéreo no canvas (convertendo coords locais para coords de tela)
    const rectGrande = grande.getBoundingClientRect();
    const centerOffsetX = rectGrande.left;
    const centerOffsetY = rectGrande.top;
    if (m.posAnterior) {
      desenharRastroCanvas(
        m.posAnterior.x + centerOffsetX,
        m.posAnterior.y + centerOffsetY,
        x + centerOffsetX,
        y + centerOffsetY,
        cosmosAtivo ? `hsl(${hue}, 100%, 70%)` : cor2Input?.value || "rgba(255,255,255,0.8)",
        2,
        0.06
      );
    }
    m.posAnterior = { x, y };

    m.el.style.left = `${x}px`;
    m.el.style.top = `${y}px`;

    const cx2 = m.el.offsetWidth / 2;
    const cy2 = m.el.offsetHeight / 2;

    // linha da órbita pequena relativa à média
    const lp = linhasPequenas[i];
    lp.style.width = `${raioPequenas * 2}px`;
    lp.style.height = `${raioPequenas * 2}px`;
    lp.style.left = `${x + cx2 - raioPequenas}px`;
    lp.style.top = `${y + cy2 - raioPequenas}px`;

    pequenasPorMedia[i].forEach((p, j) => {
      p.angulo -= sinal * velocidadePequenasAtual * delta * 10;
      const x2 = cx2 + p.raio * Math.cos(p.angulo) - p.el.offsetWidth / 2;
      const y2 = cy2 + p.raio * Math.sin(p.angulo) - p.el.offsetHeight / 2;

      // rastro para pequena (pos global)
      const globalX2 = x + x2;
      const globalY2 = y + y2;
      if (p.posAnterior) {
        desenharRastroCanvas(
          p.posAnterior.x + centerOffsetX,
          p.posAnterior.y + centerOffsetY,
          globalX2 + centerOffsetX,
          globalY2 + centerOffsetY,
          cosmosAtivo ? `hsl(${(hue + 60) % 360}, 100%, 70%)` : cor1Input?.value || "rgba(255,255,255,0.8)",
          1.5,
          0.05
        );
      }
      p.posAnterior = { x: globalX2, y: globalY2 };

      p.el.style.left = `${x2}px`;
      p.el.style.top = `${y2}px`;

      const lm = linhasMicros[i][j];
      lm.style.width = `${raioMicros * 2}px`;
      lm.style.height = `${raioMicros * 2}px`;
      lm.style.left = `${x + x2 + cx2 - raioMicros}px`;
      lm.style.top = `${y + y2 + cy2 - raioMicros}px`;

      const cx3 = p.el.offsetWidth / 2;
      const cy3 = p.el.offsetHeight / 2;

      microsPorPequena[i][j].forEach(micro => {
        micro.angulo += sinal * velocidadeMicrosAtual * delta * 10;
        const x3 = cx3 + micro.raio * Math.cos(micro.angulo) - micro.el.offsetWidth / 2;
        const y3 = cy3 + micro.raio * Math.sin(micro.angulo) - micro.el.offsetHeight / 2;

        const globalX3 = x + x2 + x3;
        const globalY3 = y + y2 + y3;

        if (micro.posAnterior) {
          desenharRastroCanvas(
            micro.posAnterior.x + centerOffsetX,
            micro.posAnterior.y + centerOffsetY,
            globalX3 + centerOffsetX,
            globalY3 + centerOffsetY,
            "rgba(255,255,255,0.06)",
            1,
            0.03
          );
        }
        micro.posAnterior = { x: globalX3, y: globalY3 };

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

  // dissipação suave do canvas (ou limpeza total se rastro estiver desativado)
  if (mostrarRastro) {
    ctx.fillStyle = "rgba(0,0,0,0.08)"; // rastro etéreo que decai
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // limpa totalmente quando desativado
  }

  if (rodando) {
    // suavização de velocidades
    velocidadeMediasAtual += (velocidadeMedias - velocidadeMediasAtual) * suavizacao;
    velocidadePequenasAtual += (velocidadePequenas - velocidadePequenasAtual) * suavizacao;
    velocidadeMicrosAtual += (velocidadeMicros - velocidadeMicrosAtual) * suavizacao;

    // aplica opacidades
    sistema1.grande.style.opacity = opacidadeGrande;
    sistema2.grande.style.opacity = opacidadeGrande;
    document.querySelectorAll(".media").forEach(e => (e.style.opacity = opacidadeMedias));
    document.querySelectorAll(".pequena").forEach(e => (e.style.opacity = opacidadePequenas));
    document.querySelectorAll(".micro").forEach(e => (e.style.opacity = opacidadeMicros));

    // redimensionamento das esferas grandes
    sistema1.grande.style.width = `${tamanhoGrande}px`;
    sistema1.grande.style.height = `${tamanhoGrande}px`;
    container1.style.transform = `scale(${escala})`;
    container2.style.transform = `scale(${escala})`;

    // anima fractais (isto desenha os rastros localmente para cada sistema)
    animarFractal(sistema1, delta);
    animarFractal(sistema2, delta, true);

    // movimento orbital entre sistemas
    anguloSistema += velocidadeSistema * delta * 60;

    const centroJanela = {
      x: window.innerWidth * 0.375,
      y: window.innerHeight / 2,
    };

    let pos1 = { x: centroJanela.x, y: centroJanela.y };
    let pos2 = { x: centroJanela.x, y: centroJanela.y };

    if (modoOrbita === "s2-orbita-s1") {
      const rect1 = sistema1.grande.getBoundingClientRect();
      const cx1 = rect1.left + rect1.width / 2;
      const cy1 = rect1.top + rect1.height / 2;
      pos2.x = cx1 + Math.cos(anguloSistema) * raioSistema;
      pos2.y = cy1 + Math.sin(anguloSistema) * raioSistema;
    } else if (modoOrbita === "s1-orbita-s2") {
      const rect2 = sistema2.grande.getBoundingClientRect();
      const cx2 = rect2.left + rect2.width / 2;
      const cy2 = rect2.top + rect2.height / 2;
      pos1.x = cx2 + Math.cos(anguloSistema) * raioSistema;
      pos1.y = cy2 + Math.sin(anguloSistema) * raioSistema;
    } else if (modoOrbita === "ambos-centro") {
      pos1.x = centroJanela.x + Math.cos(anguloSistema) * (raioSistema * 0.5);
      pos1.y = centroJanela.y + Math.sin(anguloSistema) * (raioSistema * 0.5);
      pos2.x = centroJanela.x - Math.cos(anguloSistema) * (raioSistema * 0.5);
      pos2.y = centroJanela.y - Math.sin(anguloSistema) * (raioSistema * 0.5);
    }

    container1.style.position = "absolute";
    container2.style.position = "absolute";
    container1.style.left = `${pos1.x - container1.offsetWidth / 2}px`;
    container1.style.top = `${pos1.y - container1.offsetHeight / 2}px`;
    container2.style.left = `${pos2.x - container2.offsetWidth / 2}px`;
    container2.style.top = `${pos2.y - container2.offsetHeight / 2}px`;

    // cores e brilho
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
        // glow suave mesmo quando opacidade = 0:
        const baseGlow = 20 * (1 - parseFloat(e.style.opacity || 1));
        e.style.boxShadow = `0 0 ${baseGlow}px ${baseGlow / 2}px rgba(255,255,255,0.18)`;
      });
    } else {
      const c1 = cor1Input?.value || "#ffffff";
      const c2 = cor2Input?.value || "#999999";
      sistema1.grande.style.background = `radial-gradient(circle at 40% 40%, ${c1}, ${c2}, #000)`;
      sistema2.grande.style.background = `radial-gradient(circle at 40% 40%, ${c2}, ${c1}, #000)`;
      document.querySelectorAll(".esfera").forEach(e => {
        e.style.filter = `brightness(${brilho})`;
        const baseGlow = 20 * (1 - parseFloat(e.style.opacity || 1));
        e.style.boxShadow = `0 0 ${baseGlow}px ${baseGlow / 2}px ${c2}`;
      });
    }

    // mostra/oculta linhas orbitais baseado no checkbox (classe no body facilita CSS)
    document.body.classList.toggle("linhas-ocultas", !mostrarLinhasCheckbox?.checked);
  }

  requestAnimationFrame(animar);
}

requestAnimationFrame(animar);

// === Controles (inputs) ===
[
  [opacidadeGrandeInput, v => (opacidadeGrande = parseFloat(v))],
  [opacidadeMediasInput, v => (opacidadeMedias = parseFloat(v))],
  [opacidadePequenasInput, v => (opacidadePequenas = parseFloat(v))],
  [opacidadeMicrosInput, v => (opacidadeMicros = parseFloat(v))],
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
  [raioSistemaInput, v => (raioSistema = parseFloat(v))]
].forEach(([input, fn]) => input?.addEventListener("input", e => fn(e.target.value)));

// controle de checkboxes / botões
opacidadeGrandeInput?.addEventListener("input", e => opacidadeGrande = parseFloat(e.target.value));
opacidadeMediasInput?.addEventListener("input", e => opacidadeMedias = parseFloat(e.target.value));
opacidadePequenasInput?.addEventListener("input", e => opacidadePequenas = parseFloat(e.target.value));
opacidadeMicrosInput?.addEventListener("input", e => opacidadeMicros = parseFloat(e.target.value));

modoCorCheckbox?.addEventListener("change", e => (cosmosAtivo = e.target.checked));
pauseBtn?.addEventListener("click", () => {
  rodando = !rodando;
  pauseBtn.textContent = rodando ? "⏸️ Pausar" : "▶️ Retomar";
});
controleOrbita?.addEventListener("change", e => modoOrbita = e.target.value);
mostrarLinhasCheckbox?.addEventListener("change", () => {
  document.body.classList.toggle("linhas-ocultas", !mostrarLinhasCheckbox.checked);
});

// === Alternância entre abas (robusto) ===
document.addEventListener("DOMContentLoaded", () => {
  // sincroniza estado inicial das checkboxes (caso venham do HTML)
  if (mostrarLinhasCheckbox) {
    document.body.classList.toggle("linhas-ocultas", !mostrarLinhasCheckbox.checked);
  }
  if (mostrarRastroCheckbox) {
    mostrarRastro = !!mostrarRastroCheckbox.checked;
    if (!mostrarRastro) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  const abas = document.querySelectorAll(".aba");
  const conteudos = document.querySelectorAll(".conteudo-aba");

  abas.forEach(aba => {
    aba.addEventListener("click", () => {
      abas.forEach(a => a.classList.remove("ativa"));
      aba.classList.add("ativa");

      conteudos.forEach(c => {
        if (c.id === aba.dataset.alvo) {
          c.style.display = "block";
          requestAnimationFrame(() => c.classList.add("ativa"));
        } else {
          c.classList.remove("ativa");
          setTimeout(() => (c.style.display = "none"), 400);
        }
      });
    });
  });
});
