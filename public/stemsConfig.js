// stemsConfig.js

// Configuración por defecto para STEMS (por variedad y longitudes)
const defaultStemsConfig = {
    "ROSA": { "70": 1.2, "60": 1.3, "55": 1.1, "50": 1.0, "40": 0.9 },
    "LILY": { "70": 1.0, "60": 1.1, "55": 1.2, "50": 1.3, "40": 1.4 },
    "TULIP": { "70": 1.1, "60": 1.2, "55": 1.0, "50": 0.95, "40": 0.85 }
    // Agrega más variedades según necesites...
  };
  
  // Cargar la configuración desde localStorage o usar la por defecto
  function loadStemsConfig() {
    const configStr = localStorage.getItem("stemsConfig");
    if (configStr) {
      try {
        return JSON.parse(configStr);
      } catch (error) {
        console.error("Error al parsear stemsConfig:", error);
        return { ...defaultStemsConfig };
      }
    }
    return { ...defaultStemsConfig };
  }
  
  // Guardar la configuración en localStorage
  function saveStemsConfig(config) {
    localStorage.setItem("stemsConfig", JSON.stringify(config));
  }
  
  // Actualizar un valor específico en la configuración
  function updateStemsConfig(variety, length, value) {
    const config = loadStemsConfig();
    if (!config[variety]) {
      config[variety] = {};
    }
    config[variety][length] = parseFloat(value);
    saveStemsConfig(config);
    return config;
  }
  
  // Exponer la configuración de forma global
  window.stemsConfig = loadStemsConfig();
  window.updateStemsConfig = updateStemsConfig;
  