const payload = document.getElementById('payload');
const btn = document.getElementById('generate');
const frame = document.getElementById('preview');
const choose = document.getElementById('choose');
const outDirEl = document.getElementById('outDir');

let outDir = null;

btn.onclick = async () => {
  const res = await window.api.render({
    payload: payload.value
  });

  const blob = new Blob([res.replacedSvg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  frame.src = url;
};

choose.onclick = async () => {
  outDir = await window.api.chooseFolder();
  outDirEl.textContent = outDir;
};