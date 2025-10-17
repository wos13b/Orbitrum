// =========================================================
// Fractal Cósmico — script.js (versão corrigida e otimizada)
// =========================================================

/* Seleção de elementos (defensiva: podem ser null até o DOM carregar) */
const aparenciaEl = document.getElementById("aparencia") || document.getElementById("aba-aparencia");

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

/* Estado inicial com fallbacks */
let opacidadeGrande = parseFloat(opacidadeGrandeInput?.value ?? 1);
let opacidadeMedias = parseFloat(opacidadeMediasInput?.value ?? 1);
let opacidadePequenas = parseFloat(opacidadePequenasInput?.value ?? 1);
let opacidadeMicros = parseFloat(opacidadeMicrosInput?.value ?? 1);
let brilho = parseFloat(brilhoInput?.value ?? 1);
let intensidade = parseFloat(intensidadeInput?.value ?? 0.5);
let escala = parseFloat(escalaInput?.value ?? 1);
let cosmosAtivo = false;
let rodando = true;
let hue = 0;
let tamanhoGrande = parseFloat(tamanhoGrandeInput?.value ?? 250);

let velocidadeMedias = parseFloat(velocidadeMediasInput?.value ?? 0.02);
let velocidadePequenas = parseFloat(velocidadePequenasInput?.value ?? 0.03);
let velocidadeMicros = parseFloat(velocidadeMicrosInput?.value ?? 0.05);

let raioMedias = parseFloat(raioMediasInput?.value ?? 180);
let raioPequenas = parseFloat(raioPequenasInput?.value ?? 60);
let raioMicros = parseFloat(raioMicrosInput?.value ?? 25);

let anguloSistema = 0;
let velocidadeSistema = parseFloat(velocidadeSistemaInput?.value ?? 0.004);
let raioSistema = parseFloat(raioSistemaInput?.value ?? 500);
let modoOrbita = "s2-orbita-s1";

let velocidadeMediasAtual = velocidadeMedias;
let velocidadePequenasAtual = velocidadePequenas;
let velocidadeMicrosAtual = velocidadeMicros;
const suavizacao = 0.05;
let lastTime = performance.now();

/* Referências a DOM criadas dinamicamente */
let container1 = null;
let container2 = null;
let sistema1 = null;
let sistema2 = null;

/* UTIL */
function aplicarFilterOpacity(el, op, bri) {
  if (!el) return;
  el.style.filter = `opacity(${op}) brightness(${bri})`;
}
function obterOpacidadePorElemento(el) {
  if (!el) return 1;
  if (el.classList.contains("grande")) return opacidadeGrande;
  if (el.classList.contains("media")) return opacidadeMedias;
  if (el.classList.contains("pequena")) return opacidadePequenas;
  if (el.classList.contains("micro")) return opacidadeMicros;
  return 1;
}

/* cria N orbitantes como filhos do pai e retorna objetos de controle */
function criarOrbitantes(pai, qtd, classe, raio) {
  const orbitantes = [];
  for (let i = 0; i < qtd; i++) {
    const e = document.createElement("div");
    e.classList.add("esfera", classe);
    e.style.left = "0px";
    e.style.top = "0px";
    pai.appendChild(e);
    orbitantes.push({
      el: e,
      raio,
      angulo: (i / qtd) * 2 * Math.PI,
      posAnterior: null
    });
  }
  return orbitantes;
}

/* criar um sistema completo (grande -> medias -> pequenas -> micros) */
function criarSistema(container, tamanho, raioM, raioP, raioMi) {
  const grande = document.createElement("div");
  grande.classList.add("esfera", "grande");
  grande.style.width = `${tamanho}px`;
  grande.style.height = `${tamanho}px`;
  container.appendChild(grande);

  // médias (filhas do grande)
  const medias = criarOrbitantes(grande, 3, "media", raioM);

  // pequenas: para cada média criamos 3 pequenas como filhas da própria média
  const pequenasPorMedia = medias.map(m => criarOrbitantes(m.el, 3, "pequena", raioP));

  // micros: para cada pequena, criamos 3 micros filhas daquela pequena
  const microsPorPequena = pequenasPorMedia.map(grupo =>
    grupo.map(p => criarOrbitantes(p.el, 3, "micro", raioMi))
  );

  // linhas orbitais (anexadas ao 'grande' para centralização visual)
  const linhaMedias = document.createElement("div");
  linhaMedias.classList.add("linha-orbita");
  grande.appendChild(linhaMedias);

  const linhasPequenas = medias.map(() => {
    const l = document.createElement("div");
    l.classList.add("linha-orbita");
    grande.appendChild(l);
    return l;
  });

  // linhasMicros: mesma forma da estrutura microsPorPequena
  const linhasMicros = microsPorPequena.map((grupo, i) =>
    grupo.map((arr, j) => {
      const l = document.createElement("div");
      l.classList.add("linha-orbita");
      grande.appendChild(l);
      return l;
    })
  );

  return { grande, medias, pequenasPorMedia, microsPorPequena, linhaMedias, linhasPequenas, linhasMicros };
}

/* anima um único sistema (reverso para o segundo sistema opcional) */
function animarFractal(sistema, delta, reverso = false) {
  if (!sistema) return;
  const { grande, medias, pequenasPorMedia, microsPorPequena, linhaMedias, linhasPequenas, linhasMicros } = sistema;
  const cx = grande.offsetWidth / 2;
  const cy = grande.offsetHeight / 2;
  const sinal = reverso ? -1 : 1;

  // atualizar raios dinamicamente
  medias.forEach(m => (m.raio = raioMedias));
  pequenasPorMedia.forEach(grupo => grupo.forEach(p => (p.raio = raioPequenas)));
  microsPorPequena.forEach(grupo => grupo.forEach(arr => arr.forEach(mi => (mi.raio = raioMicros))));

  // linha das médias
  linhaMedias.style.width = `${raioMedias * 2}px`;
  linhaMedias.style.height = `${raioMedias * 2}px`;
  linhaMedias.style.left = `${cx - raioMedias}px`;
  linhaMedias.style.top = `${cy - raioMedias}px`;

  medias.forEach((m, i) => {
    m.angulo += sinal * velocidadeMediasAtual * delta * 10;
    const x = cx + m.raio * Math.cos(m.angulo) - m.el.offsetWidth / 2;
    const y = cy + m.raio * Math.sin(m.angulo) - m.el.offsetHeight / 2;

    m.posAnterior = { x, y };
    m.el.style.left = `${x}px`;
    m.el.style.top = `${y}px`;

    const cx2 = m.el.offsetWidth / 2;
    const cy2 = m.el.offsetHeight / 2;

    const lp = linhasPequenas[i];
    if (lp) {
      lp.style.width = `${raioPequenas * 2}px`;
      lp.style.height = `${raioPequenas * 2}px`;
      lp.style.left = `${x + cx2 - raioPequenas}px`;
      lp.style.top = `${y + cy2 - raioPequenas}px`;
    }

    pequenasPorMedia[i].forEach((p, j) => {
      p.angulo -= sinal * velocidadePequenasAtual * delta * 10;
      const x2 = cx2 + p.raio * Math.cos(p.angulo) - p.el.offsetWidth / 2;
      const y2 = cy2 + p.raio * Math.sin(p.angulo) - p.el.offsetHeight / 2;

      const globalX2 = x + x2;
      const globalY2 = y + y2;

      p.posAnterior = { x: globalX2, y: globalY2 };

      p.el.style.left = `${x2}px`;
      p.el.style.top = `${y2}px`;

      const lm = (linhasMicros[i] && linhasMicros[i][j]) || null;
      if (lm) {
        lm.style.width = `${raioMicros * 2}px`;
        lm.style.height = `${raioMicros * 2}px`;
        lm.style.left = `${x + x2 + cx2 - raioMicros}px`;
        lm.style.top = `${y + y2 + cy2 - raioMicros}px`;
      }

      const cx3 = p.el.offsetWidth / 2;
      const cy3 = p.el.offsetHeight / 2;

      const microsArr = (microsPorPequena[i] && microsPorPequena[i][j]) || [];
      microsArr.forEach(micro => {
        micro.angulo += sinal * velocidadeMicrosAtual * delta * 10;
        const x3 = cx3 + micro.raio * Math.cos(micro.angulo) - micro.el.offsetWidth / 2;
        const y3 = cy3 + micro.raio * Math.sin(micro.angulo) - micro.el.offsetHeight / 2;

        const globalX3 = x + x2 + x3;
        const globalY3 = y + y2 + y3;

        micro.posAnterior = { x: globalX3, y: globalY3 };

        micro.el.style.left = `${x3}px`;
        micro.el.style.top = `${y3}px`;
      });
    });
  });
}

/* loop principal */
function animar(tempoAtual) {
  const delta = (tempoAtual - lastTime) / 1000;
  lastTime = tempoAtual;

  if (rodando) {
    velocidadeMediasAtual += (velocidadeMedias - velocidadeMediasAtual) * suavizacao;
    velocidadePequenasAtual += (velocidadePequenas - velocidadePequenasAtual) * suavizacao;
    velocidadeMicrosAtual += (velocidadeMicros - velocidadeMicrosAtual) * suavizacao;

    let brilhoAtual = brilho;
    if (cosmosAtivo) {
      hue = (hue + 15 * delta) % 360;
      brilhoAtual = brilho * (1 + intensidade * Math.sin(tempoAtual * 0.004));
    }

    document.querySelectorAll(".grande").forEach(e => {
      e.style.width = `${tamanhoGrande}px`;
      e.style.height = `${tamanhoGrande}px`;
      aplicarFilterOpacity(e, opacidadeGrande, brilhoAtual);
    });
    document.querySelectorAll(".media").forEach(e => aplicarFilterOpacity(e, opacidadeMedias, brilhoAtual));
    document.querySelectorAll(".pequena").forEach(e => aplicarFilterOpacity(e, opacidadePequenas, brilhoAtual));
    document.querySelectorAll(".micro").forEach(e => aplicarFilterOpacity(e, opacidadeMicros, brilhoAtual));

    if (container1) container1.style.transform = `scale(${escala})`;
    if (container2) container2.style.transform = `scale(${escala})`;

    animarFractal(sistema1, delta);
    animarFractal(sistema2, delta, true);

    anguloSistema += velocidadeSistema * delta * 60;
    const centroJanela = { x: window.innerWidth * 0.375, y: window.innerHeight / 2 };

    let pos1 = { x: centroJanela.x, y: centroJanela.y };
    let pos2 = { x: centroJanela.x, y: centroJanela.y };

    if (modoOrbita === "s2-orbita-s1" && sistema1 && sistema2) {
      const rect1 = sistema1.grande.getBoundingClientRect();
      const cx1 = rect1.left + rect1.width / 2;
      const cy1 = rect1.top + rect1.height / 2;
      pos2.x = cx1 + Math.cos(anguloSistema) * raioSistema;
      pos2.y = cy1 + Math.sin(anguloSistema) * raioSistema;
    } else if (modoOrbita === "s1-orbita-s2" && sistema1 && sistema2) {
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

    if (container1 && container2) {
      container1.style.position = "absolute";
      container2.style.position = "absolute";
      container1.style.left = `${pos1.x - container1.offsetWidth / 2}px`;
      container1.style.top = `${pos1.y - container1.offsetHeight / 2}px`;
      container2.style.left = `${pos2.x - container2.offsetWidth / 2}px`;
      container2.style.top = `${pos2.y - container2.offsetHeight / 2}px`;
    }

    if (cosmosAtivo) {
      const cor1 = `hsl(${hue}, 100%, 55%)`;
      const cor2 = `hsl(${(hue + 180) % 360}, 100%, 45%)`;
      const cor3 = `hsl(${(hue + 90) % 360}, 100%, 60%)`;

      if (sistema1 && !sistema1.grande.dataset.individualColor) sistema1.grande.style.background = `radial-gradient(circle at 40% 40%, ${cor1}, ${cor2}, #000)`;
      if (sistema2 && !sistema2.grande.dataset.individualColor) sistema2.grande.style.background = `radial-gradient(circle at 40% 40%, ${cor3}, ${cor1}, #000)`;

      document.querySelectorAll(".media").forEach(e => { if (!e.dataset.individualColor) e.style.background = `radial-gradient(circle at 30% 30%, ${cor2}, #000)`; });
      document.querySelectorAll(".pequena").forEach(e => { if (!e.dataset.individualColor) e.style.background = `radial-gradient(circle at 30% 30%, ${cor3}, #000)`; });
      document.querySelectorAll(".micro").forEach(e => { if (!e.dataset.individualColor) e.style.background = `radial-gradient(circle at 30% 30%, ${cor1}, #000)`; });
    } else {
      const c1 = cor1Input?.value || "#ffffff";
      const c2 = cor2Input?.value || "#999999";

      if (sistema1 && !sistema1.grande.dataset.individualColor) sistema1.grande.style.background = `radial-gradient(circle at 40% 40%, ${c1}, ${c2}, #000)`;
      if (sistema2 && !sistema2.grande.dataset.individualColor) sistema2.grande.style.background = `radial-gradient(circle at 40% 40%, ${c2}, ${c1}, #000)`;

      document.querySelectorAll(".esfera").forEach(e => {
        if (!e.dataset.individualColor) {
          if (e.classList.contains("media")) e.style.background = `radial-gradient(circle at 30% 30%, ${c2}, #000)`;
          else if (e.classList.contains("pequena")) e.style.background = `radial-gradient(circle at 30% 30%, ${c1}, #000)`;
          else if (e.classList.contains("micro")) e.style.background = `radial-gradient(circle at 30% 30%, ${c2}, #000)`;
        }
      });
    }

    document.querySelectorAll(".esfera").forEach(e => {
      const op = obterOpacidadePorElemento(e);
      const baseGlow = 20 * (1 - op);
      const glowColor = cosmosAtivo ? "rgba(255,255,255,0.18)" : (cor2Input?.value || "#999");
      e.style.boxShadow = `0 0 ${baseGlow}px ${Math.max(1, baseGlow / 2)}px ${glowColor}`;
    });
  }

  requestAnimationFrame(animar);
}

/* Sincronização inputs -> variáveis (adiciona event listener apenas se input existir) */
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

modoCorCheckbox?.addEventListener("change", e => (cosmosAtivo = e.target.checked));
pauseBtn?.addEventListener("click", () => {
  rodando = !rodando;
  if (pauseBtn) pauseBtn.textContent = rodando ? "⏸️ Pausar" : "▶️ Retomar";
});
controleOrbita?.addEventListener("change", e => modoOrbita = e.target.value);

/* Aba switcher (compatível com a lógica HTML existente) */
document.addEventListener("DOMContentLoaded", () => {
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

/* ===== CONTROLES DE CORES INDIVIDUAIS ===== */
const DEFAULTS = {
  grande: ["#ffffff"],
  medias: ["#00ffff", "#ff00ff", "#ffff00"],
  pequenas: [
    "#ff8800", "#44ff44", "#4488ff",
    "#ff8800", "#44ff44", "#4488ff",
    "#ff8800", "#44ff44", "#4488ff"
  ],
  micros: new Array(27).fill("#ffffff")
};

const coresInputs = []; // { key, id, input }

function criarColorInput(initialColor, onInput) {
  const input = document.createElement("input");
  input.type = "color";
  input.value = initialColor;
  input.addEventListener("input", e => onInput(e.target.value));
  return input;
}

function aplicarCorIndividualPorId(id, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.background = `radial-gradient(circle at 30% 30%, ${color}, #000)`;
  el.dataset.individualColor = "true";
  el.style.boxShadow = `0 0 14px ${color}`;
}

function gerarPainelCoresOrganizado(mapping) {
  const containerA = aparenciaEl || document.body;
  if (!containerA) return;
  if (document.getElementById("cores-individuais-wrapper")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "cores-individuais-wrapper";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "10px";
  wrapper.style.marginTop = "8px";

  function criaBlocoSistema(tag, mapa) {
    const bloco = document.createElement("div");
    bloco.className = "bloco-cores";
    bloco.style.padding = "8px";
    bloco.style.display = "flex";
    bloco.style.flexDirection = "column";
    bloco.style.gap = "8px";

    const titulo = document.createElement("h4");
    titulo.textContent = tag === "s1" ? "Sistema 1" : "Sistema 2";
    bloco.appendChild(titulo);

    const criaGrade = (labelText, ids, defaults, tipoKey) => {
      const tituloEl = document.createElement("div");
      tituloEl.className = "subtitulo";
      tituloEl.textContent = labelText;
      bloco.appendChild(tituloEl);

      const grade = document.createElement("div");
      grade.className = "grade-cores";
      bloco.appendChild(grade);

      ids.forEach((id, idx) => {
        const init = defaults[idx % defaults.length];
        const input = criarColorInput(init, color => aplicarCorIndividualPorId(id, color));
        grade.appendChild(input);
        coresInputs.push({ key: `${tag}:${tipoKey}:${idx}`, id, input });
        aplicarCorIndividualPorId(id, init);
      });
    };

    criaGrade("🎇 Grande", mapa.grande, DEFAULTS.grande, "grande");
    criaGrade("🌕 Médias", mapa.medias, DEFAULTS.medias, "media");
    criaGrade("🔹 Pequenas", mapa.pequenas, DEFAULTS.pequenas, "pequena");
    criaGrade("✨ Micros", mapa.micros, DEFAULTS.micros, "micro");

    return bloco;
  }

  const blocoS1 = criaBlocoSistema("s1", mapping.s1);
  const blocoS2 = criaBlocoSistema("s2", mapping.s2);
  wrapper.appendChild(blocoS1);
  wrapper.appendChild(blocoS2);

  const footer = document.createElement("div");
  footer.style.display = "flex";
  footer.style.gap = "8px";
  footer.style.justifyContent = "flex-end";
  footer.style.marginTop = "6px";

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "🔄 Resetar cores";
  resetBtn.className = "btn-secundario";
  resetBtn.addEventListener("click", resetarCoresParaPadrao);

  const salvarBtn = document.createElement("button");
  salvarBtn.textContent = "💾 Salvar preset";
  salvarBtn.className = "btn-secundario";
  salvarBtn.addEventListener("click", salvarPresetAtivo);

  const carregarBtn = document.createElement("button");
  carregarBtn.textContent = "📂 Carregar preset";
  carregarBtn.className = "btn-secundario";
  carregarBtn.addEventListener("click", carregarPresetDaStorage);

  footer.appendChild(resetBtn);
  footer.appendChild(salvarBtn);
  footer.appendChild(carregarBtn);
  wrapper.appendChild(footer);

  (aparenciaEl || document.body).appendChild(wrapper);
}

function resetarCoresParaPadrao() {
  coresInputs.forEach(ref => {
    const parts = ref.key.split(":");
    const tipo = parts[1];
    const idx = parseInt(parts[2], 10) || 0;
    let def = "#ffffff";
    if (tipo === "grande") def = DEFAULTS.grande[0];
    else if (tipo === "media") def = DEFAULTS.medias[idx % DEFAULTS.medias.length];
    else if (tipo === "pequena") def = DEFAULTS.pequenas[idx % DEFAULTS.pequenas.length];
    else if (tipo === "micro") def = DEFAULTS.micros[idx % DEFAULTS.micros.length];

    ref.input.value = def;
    aplicarCorIndividualPorId(ref.id, def);
  });
}

/* Presets */
const PRESET_KEY = "fractal_cosmico_preset_v1";

function salvarPresetAtivo() {
  const preset = {
    cores: {},
    opacidades: {
      grande: opacidadeGrande,
      medias: opacidadeMedias,
      pequenas: opacidadePequenas,
      micros: opacidadeMicros
    },
    brilho, intensidade, escala
  };
  coresInputs.forEach(ref => {
    preset.cores[ref.key] = ref.input.value;
  });
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(preset));
    alert("Preset salvo em localStorage.");
  } catch (err) {
    console.warn("Erro salvando preset:", err);
    alert("Erro ao salvar preset (ver console).");
  }
}

function carregarPresetDaStorage() {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    if (!raw) {
      alert("Nenhum preset salvo encontrado no localStorage.");
      return;
    }
    const preset = JSON.parse(raw);
    if (preset.opacidades) {
      opacidadeGrande = parseFloat(preset.opacidades.grande ?? opacidadeGrande);
      opacidadeMedias = parseFloat(preset.opacidades.medias ?? opacidadeMedias);
      opacidadePequenas = parseFloat(preset.opacidades.pequenas ?? opacidadePequenas);
      opacidadeMicros = parseFloat(preset.opacidades.micros ?? opacidadeMicros);
      if (opacidadeGrandeInput) opacidadeGrandeInput.value = opacidadeGrande;
      if (opacidadeMediasInput) opacidadeMediasInput.value = opacidadeMedias;
      if (opacidadePequenasInput) opacidadePequenasInput.value = opacidadePequenas;
      if (opacidadeMicrosInput) opacidadeMicrosInput.value = opacidadeMicros;
    }
    if (preset.cores) {
      coresInputs.forEach(ref => {
        const val = preset.cores[ref.key];
        if (val) {
          ref.input.value = val;
          aplicarCorIndividualPorId(ref.id, val);
        }
      });
    }
    if (typeof preset.brilho !== "undefined") {
      brilho = parseFloat(preset.brilho);
      if (brilhoInput) brilhoInput.value = brilho;
    }
    if (typeof preset.intensidade !== "undefined") {
      intensidade = parseFloat(preset.intensidade);
      if (intensidadeInput) intensidadeInput.value = intensidade;
    }
    if (typeof preset.escala !== "undefined") {
      escala = parseFloat(preset.escala);
      if (escalaInput) escalaInput.value = escala;
    }
    alert("Preset carregado.");
  } catch (err) {
    console.warn("Erro carregando preset:", err);
    alert("Erro ao carregar preset (ver console).");
  }
}

/* Inicialização completa quando DOM estiver pronto */
document.addEventListener("DOMContentLoaded", () => {
  try {
    container1 = document.querySelector(".container");
    if (!container1) {
      container1 = document.createElement("div");
      container1.classList.add("container");
      document.body.appendChild(container1);
    }

    const janelaVisual = document.querySelector(".janela-visual") || document.body;

    sistema1 = criarSistema(container1, tamanhoGrande, raioMedias, raioPequenas, raioMicros);

    container2 = document.createElement("div");
    container2.classList.add("container");
    janelaVisual.appendChild(container2);
    sistema2 = criarSistema(container2, tamanhoGrande * 0.6, 130, 40, 15);

    // atribuir IDs coerentes (evita colisões)
    sistema1.grande.id = sistema1.grande.id || "grande-0";
    sistema1.medias.forEach((m, i) => m.el.id = m.el.id || `media-${i}`);
    let pequenaCounter = 0;
    sistema1.pequenasPorMedia.forEach((grupo) => {
      grupo.forEach(p => {
        p.el.id = p.el.id || `pequena-${pequenaCounter++}`;
      });
    });
    let microCounter = 0;
    sistema1.microsPorPequena.forEach((grupo) => {
      groupLoop:
      for (let i = 0; i < grupo.length; i++) {
        const arr = grupo[i];
        arr.forEach(mic => {
          mic.el.id = mic.el.id || `micro-${microCounter++}`;
        });
      }
    });

    sistema2.grande.id = sistema2.grande.id || "grande-0-s2";
    sistema2.medias.forEach((m, i) => m.el.id = m.el.id || `media-${i}-s2`);
    pequenaCounter = 0;
    sistema2.pequenasPorMedia.forEach((grupo) => {
      grupo.forEach(p => {
        p.el.id = p.el.id || `pequena-${pequenaCounter++}-s2`;
      });
    });
    microCounter = 0;
    sistema2.microsPorPequena.forEach((grupo) => {
      for (let i = 0; i < grupo.length; i++) {
        const arr = grupo[i];
        arr.forEach(mic => {
          mic.el.id = mic.el.id || `micro-${microCounter++}-s2`;
        });
      }
    });

    // mapping coerente com a estrutura criada
    const mapping = {
      s1: {
        grande: [sistema1.grande.id],
        medias: sistema1.medias.map((m, i) => m.el.id),
        pequenas: Array.from({ length: 9 }, (_, i) => `pequena-${i}`),
        micros: Array.from({ length: 27 }, (_, i) => `micro-${i}`)
      },
      s2: {
        grande: [sistema2.grande.id],
        medias: sistema2.medias.map((m, i) => m.el.id),
        pequenas: Array.from({ length: 9 }, (_, i) => `pequena-${i}-s2`),
        micros: Array.from({ length: 27 }, (_, i) => `micro-${i}-s2`)
      }
    };

    gerarPainelCoresOrganizado(mapping);

    lastTime = performance.now();
    requestAnimationFrame(animar);
  } catch (err) {
    console.warn("Erro na inicialização do Fractal Cósmico:", err);
  }
});
