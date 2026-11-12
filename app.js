const glass = document.getElementById("glass");
const ctx = glass.getContext("2d", { alpha: false });
const scenes = document.getElementById("scenes");
const langBtn = document.getElementById("lang");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

let mod = null;

function frame() {
  const ptr = mod._desk_rgba();
  const n = mod._desk_rgba_bytes();
  const copy = new Uint8ClampedArray(mod.HEAPU8.subarray(ptr, ptr + n));
  ctx.putImageData(new ImageData(copy, 480, 480), 0, 0);
}

function text(ptr) {
  return mod.UTF8ToString(ptr);
}

function mark() {
  const cur = mod._desk_scene();
  for (const button of scenes.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.scene) === cur));
  }
  const en = langBtn.dataset.en === "1";
  prevBtn.disabled = !mod._desk_can_prev();
  nextBtn.disabled = !mod._desk_can_next();
  prevBtn.textContent = en ? "Previous" : "Précédent";
  nextBtn.textContent = en ? "Next" : "Suivant";
  langBtn.textContent = en ? "Language" : "Langue";
}

function build() {
  scenes.replaceChildren();
  const n = mod._desk_scene_count();
  for (let i = 0; i < n; i++) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.scene = String(i);
    button.textContent = text(mod._desk_label(i));
    button.addEventListener("click", () => {
      mod._desk_show(i);
      frame();
      mark();
    });
    scenes.appendChild(button);
  }
  mark();
}

prevBtn.addEventListener("click", () => {
  if (!mod || !mod._desk_menu_step(-1)) return;
  frame();
  mark();
});

nextBtn.addEventListener("click", () => {
  if (!mod || !mod._desk_menu_step(1)) return;
  frame();
  mark();
});

langBtn.addEventListener("click", () => {
  if (!mod) return;
  const en = langBtn.dataset.en === "1" ? 0 : 1;
  langBtn.dataset.en = String(en);
  mod._desk_set_lang(en);
  build();
  frame();
});

createDesk().then((ready) => {
  mod = ready;
  mod._desk_init();
  frame();
  build();
  const start = performance.now();
  const loop = (t) => {
    mod._desk_tick(t - start);
    frame();
    mark();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
