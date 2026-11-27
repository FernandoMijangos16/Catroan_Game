// ================= GAME MODES: Clásico (base game only) or Catroan (everything), and first-person on/off =================
const GAME_OPTS = { mode: 'catroan', firstPerson: true, online: false, botLevel: 'normal' };
const isClassic = () => GAME_OPTS.mode === 'clasico';
const scenesOn = () => GAME_OPTS.firstPerson;          // 3D close-up scenes and village walks
function applyGameOpts(){
  document.body.classList.toggle('clasico', isClassic());
  document.body.classList.toggle('noscenes', !scenesOn());
}
