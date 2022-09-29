const controlPresets = [
  {
    Left: ["ArrowLeft", "KeyA"],
    Right: ["ArrowRight", "KeyD"],
    Up: ["ArrowUp", "KeyW"],
    Down: ["ArrowDown", "KeyS"],
    Jump: ["KeyZ", "Period"],
    "Jump(Alt-Grav)": ["KeyZ", "Period"],
    Dash: ["KeyX", "Comma"],
    Interact: ["ShiftRight", "ShiftLeft"],
    Respawn: ["KeyR"]
  },
  {
    Left: ["ArrowLeft", "KeyA"],
    Right: ["ArrowRight", "KeyD"],
    Up: ["ArrowUp", "KeyW"],
    Down: ["ArrowDown", "KeyS"],
    Jump: ["ArrowUp", "ArrowDown", "KeyW", "KeyS"],
    "Jump(Alt-Grav)": ["ArrowLeft", "ArrowRight", "KeyA", "KeyD"],
    Dash: ["KeyX", "Comma"],
    Interact: ["ShiftRight", "ShiftLeft"],
    Respawn: ["KeyR"]
  }
];
const options = {
  autoSave: true,
  controlPreset: "0",
  controls: deepCopy(controlPresets[0]),
  theme: "default",
  useCustomPageBG: false,
  customPageBG: "#eeeeee",
  useCustomGameBG: false,
  customGameBG: "#ffffff",
  ...(JSON.parse(localStorage.getItem("just-some-options-2")) ?? {})
};
function saveOptions() {
  localStorage.setItem("just-some-options-2", JSON.stringify(options));
}
function updateControl() {
  let preset = controlPresets[options.controlPreset];
  options.controls = deepCopy(preset);
}
function pushControl(controlType, key) {
  if (!options.controls[controlType].includes(key))
    options.controls[controlType].push(key);
}
var unhid = false;
function unhide() {
  if (!unhid) {
    document.head.removeChild(id("hide.css"));
    unhid = true;
  }
}
var prevTheme = "default";
function updateTheme() {
  if (prevTheme !== "default") {
    document.head.removeChild(id(prevTheme + "Theme"));
  }
  if (options.theme !== "default") {
    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      (typeof editor === "undefined" ? "" : "../") + options.theme + ".css";
    link.id = options.theme + "Theme";
    link.onload = unhide;
    document.head.appendChild(link);
  }
  prevTheme = options.theme;
}
function updateCustomBG() {
  if (options.useCustomPageBG)
    document.body.style.background = options.customPageBG;
  if (id("background") && options.useCustomGameBG)
    id("background").style.background = options.customGameBG;
}
if (typeof editor === "undefined") {
  updateTheme();
  updateCustomBG();
}
