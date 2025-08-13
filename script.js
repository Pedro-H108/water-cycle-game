"use strict";

/* =========================================================
 * Jogo: Ciclo da Água (JS puro)
 * Drag-and-drop com mouse + toque (touch) + teclado/click acessível
 * ========================================================= */

(function () {
  /*** Estado global simples ***/
  const state = {
    data: null,
    score: 0,
    remaining: 0,
    startedAt: null,
    timerInterval: null,
    selectedId: null,
    audioOn: true,
    touch: {
      draggingId: null,
      ghost: null,
      currentZone: null,
      offsetX: 0,
      offsetY: 0,
    },
  };

  /*** Elementos ***/
  const el = {
    body: document.body,
    title: document.getElementById("game-title"),
    subtitle: document.getElementById("game-subtitle"),
    screenStart: document.getElementById("screen-start"),
    screenGame: document.getElementById("screen-game"),
    screenEnd: document.getElementById("screen-end"),
    btnStart: document.getElementById("btn-start"),
    btnPlayAgain: document.getElementById("btn-play-again"),
    btnReiniciar: document.getElementById("btn-reiniciar"),
    btnContrast: document.getElementById("btn-contrast"),
    btnAudio: document.getElementById("btn-audio"),
    targets: document.querySelector(".targets"),
    pool: document.querySelector(".pool"),
    score: document.getElementById("score"),
    remaining: document.getElementById("remaining"),
    timer: document.getElementById("timer"),
    finalScore: document.getElementById("final-score"),
    finalTime: document.getElementById("final-time"),
    liveFeedback: document.getElementById("live-feedback"),
  };

  /*** Utilitários ***/
  const pad2 = (n) => String(n).padStart(2, "0");
  const formatMMSS = (ms) => {
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${pad2(mm)}:${pad2(ss)}`;
  };

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /*** Sons (WebAudio API) sem arquivos externos ***/
  let audioCtx = null;
  function playBeep(ok = true) {
    if (!state.audioOn) return;
    try {
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = ok ? "triangle" : "sawtooth";
      o.frequency.value = ok ? 660 : 180;
      g.gain.value = 0.06;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      setTimeout(
        () => {
          o.stop();
        },
        ok ? 140 : 220
      );
    } catch {
      /* noop */
    }
  }

  /*** Acessibilidade - feedback ***/
  function speak(msg) {
    el.liveFeedback.textContent = msg;
  }

  /*** Timer ***/
  function startTimer() {
    state.startedAt = Date.now();
    el.timer.textContent = "00:00";
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      el.timer.textContent = formatMMSS(Date.now() - state.startedAt);
    }, 300);
  }
  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  /*** Navegação de telas ***/
  function showScreen(id) {
    for (const sec of document.querySelectorAll(".screen")) {
      sec.classList.toggle("active", sec.id === id);
    }
  }

  /*** Montagem dinâmica ***/
  function buildGame(data) {
    // Reset
    state.data = data;
    state.score = 0;
    el.score.textContent = "0";
    el.targets.innerHTML = "";
    el.pool.innerHTML = "";
    state.selectedId = null;

    // UI cabeçalho
    el.title.textContent = data.titulo || "Jogo";
    el.subtitle.textContent = data.titulo || "";

    // Targets (etapas)
    const etapas = data.etapas.slice();
    state.remaining = etapas.length;
    el.remaining.textContent = String(state.remaining);

    etapas.forEach((etapa) => {
      const target = document.createElement("div");
      target.className = "target";
      target.dataset.nome = etapa.nome;

      const header = document.createElement("div");
      header.className = "target-header";
      header.textContent = etapa.nome;

      const zone = document.createElement("div");
      zone.className = "dropzone";
      zone.textContent = "Solte aqui";
      zone.dataset.accept = etapa.nome;
      zone.tabIndex = 0; // foco para teclado
      zone.setAttribute("role", "button");
      zone.setAttribute("aria-label", `Alvo ${etapa.nome}. Solte aqui.`);

      // DnD: mouse
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("highlight");
      });
      zone.addEventListener("dragleave", () =>
        zone.classList.remove("highlight")
      );
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("highlight");
        const id = e.dataTransfer.getData("text/plain");
        tryPlace(id, zone);
      });

      // Clique/Teclado: se há um cartão selecionado, tenta posicionar
      zone.addEventListener("click", () => {
        if (state.selectedId) tryPlace(state.selectedId, zone);
      });
      zone.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && state.selectedId) {
          e.preventDefault();
          tryPlace(state.selectedId, zone);
        }
      });

      target.append(header, zone);
      el.targets.appendChild(target);
    });

    // Draggables (descrições) - embaralhados
    const cards = shuffle(
      etapas.map((e, idx) => ({
        id: `card-${idx}`,
        nome: e.nome,
        descricao: e.descricao,
      }))
    );

    for (const c of cards) {
      const d = document.createElement("button");
      d.className = "draggable";
      d.id = c.id;
      d.type = "button";
      d.textContent = c.descricao;
      d.draggable = true; // mouse/desktop
      d.setAttribute("aria-pressed", "false");
      d.dataset.nome = c.nome;
      d.setAttribute(
        "aria-label",
        `Descrição: ${c.descricao}. Pressione Enter para selecionar.`
      );

      // Drag (mouse)
      d.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", c.id);
        setTimeout(() => d.classList.add("dragging"), 0);
      });
      d.addEventListener("dragend", () => d.classList.remove("dragging"));

      // Touch drag
      d.addEventListener(
        "touchstart",
        (e) => {
          if (e.touches.length !== 1) return;
          startTouchDrag(e, d);
        },
        { passive: false }
      );
      d.addEventListener(
        "touchmove",
        (e) => {
          if (!state.touch.draggingId) return;
          moveTouchDrag(e);
        },
        { passive: false }
      );
      d.addEventListener("touchend", (e) => {
        if (!state.touch.draggingId) return;
        endTouchDrag(e);
      });

      // Clique/teclado para seleção/associação
      d.addEventListener("click", () => toggleSelect(d));
      d.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleSelect(d);
        }
      });

      el.pool.appendChild(d);
    }
  }

  /*** Touch drag helpers ***/
  function startTouchDrag(e, btn) {
    e.preventDefault(); // evita scroll
    const touch = e.touches[0];
    state.selectedId = btn.id;
    state.touch.draggingId = btn.id;

    // criar ghost
    const rect = btn.getBoundingClientRect();
    const ghost = btn.cloneNode(true);
    ghost.removeAttribute("id");
    ghost.classList.add("drag-ghost");
    ghost.style.position = "fixed";
    ghost.style.left = rect.left + "px";
    ghost.style.top = rect.top + "px";
    ghost.style.width = rect.width + "px";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "9999";
    document.body.appendChild(ghost);
    state.touch.ghost = ghost;
    state.touch.offsetX = touch.clientX - rect.left;
    state.touch.offsetY = touch.clientY - rect.top;

    btn.classList.add("dragging");
  }

  function moveTouchDrag(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const g = state.touch.ghost;
    if (!g) return;

    const x = touch.clientX - state.touch.offsetX;
    const y = touch.clientY - state.touch.offsetY;
    g.style.left = x + "px";
    g.style.top = y + "px";

    // Detectar dropzone sob o dedo
    const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    const zone = elUnder ? elUnder.closest(".dropzone") : null;

    // Atualizar highlight
    if (state.touch.currentZone && state.touch.currentZone !== zone) {
      state.touch.currentZone.classList.remove("highlight");
      state.touch.currentZone = null;
    }
    if (zone && zone.closest(".target").dataset.filled !== "true") {
      zone.classList.add("highlight");
      state.touch.currentZone = zone;
    }
  }

  function endTouchDrag(e) {
    e.preventDefault();
    const draggingId = state.touch.draggingId;
    const btn = document.getElementById(draggingId);
    if (!btn) return;

    // Se houver zona atual, tentar posicionar
    const zone = state.touch.currentZone;
    if (zone) {
      zone.classList.remove("highlight");
      tryPlace(draggingId, zone);
    } else {
      speak("Solte sobre um alvo.");
      playBeep(false);
    }

    // limpar ghost
    if (state.touch.ghost && state.touch.ghost.parentNode) {
      state.touch.ghost.parentNode.removeChild(state.touch.ghost);
    }
    state.touch.ghost = null;
    state.touch.draggingId = null;
    state.touch.currentZone = null;
    btn.classList.remove("dragging");
  }

  function toggleSelect(btn) {
    // desmarca outro selecionado
    for (const other of el.pool.querySelectorAll(".draggable")) {
      if (other !== btn) other.setAttribute("aria-pressed", "false");
    }
    const now = btn.getAttribute("aria-pressed") === "true";
    if (now) {
      btn.setAttribute("aria-pressed", "false");
      state.selectedId = null;
      speak("Seleção cancelada");
    } else {
      btn.setAttribute("aria-pressed", "true");
      state.selectedId = btn.id;
      speak("Descrição selecionada. Escolha um alvo.");
    }
  }

  /*** Validação e colocação ***/
  function tryPlace(cardId, zone) {
    const card = document.getElementById(cardId);
    if (!card || zone.closest(".target").dataset.filled === "true") {
      playBeep(false);
      return;
    }
    const expected = zone.dataset.accept;
    const got = card.dataset.nome;
    if (expected === got) {
      // correto
      zone.textContent = "";
      zone.appendChild(card);
      zone.closest(".target").dataset.filled = "true";
      card.classList.add("correct");
      card.draggable = false;
      card.setAttribute("disabled", "disabled");
      card.setAttribute("aria-pressed", "false");
      state.selectedId = null;

      state.score += 1;
      state.remaining -= 1;
      el.score.textContent = String(state.score);
      el.remaining.textContent = String(state.remaining);
      playBeep(true);
      speak("Correto!");

      if (state.remaining === 0) {
        finishGame();
      }
    } else {
      // incorreto
      card.classList.add("incorrect");
      setTimeout(() => card.classList.remove("incorrect"), 260);
      playBeep(false);
      speak("Tente novamente.");
    }
  }

  /*** Fluxo de jogo ***/
  function startGame() {
    state.score = 0;
    el.score.textContent = "0";
    state.remaining = state.data?.etapas?.length || 0;
    el.remaining.textContent = String(state.remaining);
    showScreen("screen-game");
    startTimer();
  }

  function finishGame() {
    stopTimer();
    const elapsed = formatMMSS(Date.now() - state.startedAt);
    el.finalScore.textContent = String(state.score);
    el.finalTime.textContent = elapsed;
    showScreen("screen-end");
  }

  function resetGame() {
    if (!state.data) return;
    buildGame(state.data);
    startGame();
  }

  /*** Eventos globais ***/
  el.btnStart.addEventListener("click", startGame);
  el.btnPlayAgain.addEventListener("click", resetGame);
  el.btnReiniciar.addEventListener("click", resetGame);

  el.btnContrast.addEventListener("click", () => {
    const on = !document.body.classList.contains("contrast");
    document.body.classList.toggle("contrast", on);
    el.btnContrast.setAttribute("aria-pressed", String(on));
  });

  el.btnAudio.addEventListener("click", () => {
    state.audioOn = !state.audioOn;
    el.btnAudio.setAttribute("aria-pressed", String(state.audioOn));
    el.btnAudio.textContent = `Sons: ${state.audioOn ? "on" : "off"}`;
  });

  /*** Bootstrap: carregar JSON e montar ***/
  async function init() {
    try {
      const res = await fetch("jogo.json", { cache: "no-cache" });
      if (!res.ok) throw new Error("Falha ao carregar jogo.json");
      const data = await res.json();
      if (
        !data?.etapas ||
        !Array.isArray(data.etapas) ||
        data.etapas.length === 0
      ) {
        throw new Error("Conteúdo inválido em jogo.json");
      }
      buildGame(data);
    } catch (err) {
      console.error(err);
      alert(
        "Não foi possível carregar os dados do jogo. Verifique o arquivo jogo.json."
      );
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
