// Build native code for arm64-v8a only. Compiling Skia + other C++ for all four
// ABIs exhausts the EAS build worker's RAM (the Gradle daemon gets OOM-killed).
// Every modern Android phone is arm64-v8a; the other ABIs are 32-bit/emulator.
const { withGradleProperties } = require("@expo/config-plugins");

module.exports = function withArm64Only(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const set = (key, value) => {
      const i = props.findIndex((p) => p.type === "property" && p.key === key);
      const entry = { type: "property", key, value };
      if (i >= 0) props[i] = entry;
      else props.push(entry);
    };
    set("reactNativeArchitectures", "arm64-v8a");
    return cfg;
  });
};
