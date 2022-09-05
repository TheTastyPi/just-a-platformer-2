const option = new Vue({
  el: "#options",
  data: {
    optionsOpen: false,
    options: options,
    addControl: false
  }
});
if (options.theme === "default") unhide();