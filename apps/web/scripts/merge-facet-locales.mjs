#!/usr/bin/env node
/**
 * Merge facet translation catalogs into en/es/it locale files.
 * Run: node scripts/enumerate-facet-values.mjs && node scripts/merge-facet-locales.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "../i18n/locales");
const inventoryPath = join(__dirname, "facet-value-inventory.json");

const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));

const TRANSLATIONS = {
  es: {
    climate_impacts: {
      Flooding: "Inundaciones",
      "Extreme Temperatures": "Temperaturas extremas",
      "Extreme heat": "Calor extremo",
      "Extreme cold": "Frío extremo",
      Droughts: "Sequías",
      Storms: "Tormentas",
      "Water Scarcity": "Escasez de agua",
      "Sea Level Rise": "Aumento del nivel del mar",
      "Ice and Snow": "Hielo y nieve",
      "Non specific": "No específico",
      Wildfires: "Incendios forestales",
      "Adaptation Measures and Actions": "Medidas y acciones de adaptación",
      "Environmental aspects": "Aspectos ambientales",
      MRE: "MRE",
      "Nature-based solutions": "Soluciones basadas en la naturaleza",
      "Sector Policies": "Políticas sectoriales",
      "Societal aspects": "Aspectos sociales",
    },
    adaptation_approaches: {
      "Adaptation Measures and Actions": "Medidas y acciones de adaptación",
      "Societal aspects": "Aspectos sociales",
      "Environmental aspects": "Aspectos ambientales",
      "Nature-based solutions": "Soluciones basadas en la naturaleza",
      "Adaptation Plans and Strategies": "Planes y estrategias de adaptación",
      "Mitigation aspects": "Aspectos de mitigación",
      MRE: "MRE",
      "Cost-benefit analysis and maintenance costs":
        "Análisis coste-beneficio y costes de mantenimiento",
      "Economic aspects": "Aspectos económicos",
      "Replication/upscaling potential": "Potencial de replicación/ampliación",
      "Climate services": "Servicios climáticos",
      "Vulnerability Assessment": "Evaluación de vulnerabilidad",
      "Just Resilience": "Resiliencia justa",
      "Observations and Scenarios": "Observaciones y escenarios",
      "Sector Policies": "Políticas sectoriales",
    },
    sectors: {
      Agriculture: "Agricultura",
      Biodiversity: "Biodiversidad",
      "Biodiversity protection": "Protección de la biodiversidad",
      Buildings: "Edificios",
      "Business and industry": "Negocios e industria",
      "Coastal areas": "Zonas costeras",
      "Cultural heritage": "Patrimonio cultural",
      "Disaster Risk Reduction": "Reducción del riesgo de desastres",
      Energy: "Energía",
      Financial: "Financiero",
      Forestry: "Silvicultura",
      Health: "Salud",
      "Land use planning": "Planificación del uso del suelo",
      "Marine and Fisheries": "Marino y pesca",
      "Mountain areas": "Zonas de montaña",
      "Non specific": "No específico",
      Tourism: "Turismo",
      Transport: "Transporte",
      Urban: "Urbano",
      "Water management": "Gestión del agua",
    },
    biogeographical_regions: {
      Alpine: "Alpino",
      Arctic: "Ártico",
      Atlantic: "Atlántico",
      Boreal: "Boreal",
      Continental: "Continental",
      Mediterranean: "Mediterráneo",
      Pannonian: "Panónico",
      "no-identificados": "No identificados",
    },
    keywords: {
      "green infrastructure": "infraestructura verde",
      "green roofs": "cubiertas verdes",
      heatwave: "ola de calor",
      "early warning system": "sistema de alerta temprana",
      "water retention": "retención de agua",
      "water quality": "calidad del agua",
      "early warning": "alerta temprana",
      wetlands: "humedales",
      "heat island effect": "efecto isla de calor",
      Governance: "Gobernanza",
      Wildfires: "Incendios forestales",
      drought: "sequía",
      flooding: "inundaciones",
    },
  },
  it: {
    climate_impacts: {
      Flooding: "Alluvioni",
      "Extreme Temperatures": "Temperature estreme",
      "Extreme heat": "Calore estremo",
      "Extreme cold": "Freddo estremo",
      Droughts: "Siccità",
      Storms: "Tempeste",
      "Water Scarcity": "Scarsità d'acqua",
      "Sea Level Rise": "Innalzamento del livello del mare",
      "Ice and Snow": "Ghiaccio e neve",
      "Non specific": "Non specifico",
      Wildfires: "Incendi boschivi",
      "Adaptation Measures and Actions": "Misure e azioni di adattamento",
      "Environmental aspects": "Aspetti ambientali",
      MRE: "MRE",
      "Nature-based solutions": "Soluzioni basate sulla natura",
      "Sector Policies": "Politiche settoriali",
      "Societal aspects": "Aspetti sociali",
    },
    adaptation_approaches: {
      "Adaptation Measures and Actions": "Misure e azioni di adattamento",
      "Societal aspects": "Aspetti sociali",
      "Environmental aspects": "Aspetti ambientali",
      "Nature-based solutions": "Soluzioni basate sulla natura",
      "Adaptation Plans and Strategies": "Piani e strategie di adattamento",
      "Mitigation aspects": "Aspetti di mitigazione",
      MRE: "MRE",
      "Cost-benefit analysis and maintenance costs":
        "Analisi costi-benefici e costi di manutenzione",
      "Economic aspects": "Aspetti economici",
      "Replication/upscaling potential": "Potenziale di replicazione/ampliamento",
      "Climate services": "Servizi climatici",
      "Vulnerability Assessment": "Valutazione della vulnerabilità",
      "Just Resilience": "Giusta resilienza",
      "Observations and Scenarios": "Osservazioni e scenari",
      "Sector Policies": "Politiche settoriali",
    },
    sectors: {
      Agriculture: "Agricoltura",
      Biodiversity: "Biodiversità",
      "Biodiversity protection": "Protezione della biodiversità",
      Buildings: "Edifici",
      "Business and industry": "Affari e industria",
      "Coastal areas": "Aree costiere",
      "Cultural heritage": "Patrimonio culturale",
      "Disaster Risk Reduction": "Riduzione del rischio di disastri",
      Energy: "Energia",
      Financial: "Finanziario",
      Forestry: "Selvicoltura",
      Health: "Salute",
      "Land use planning": "Pianificazione del uso del suolo",
      "Marine and Fisheries": "Marino e pesca",
      "Mountain areas": "Aree montane",
      "Non specific": "Non specifico",
      Tourism: "Turismo",
      Transport: "Trasporti",
      Urban: "Urbano",
      "Water management": "Gestione delle acque",
    },
    biogeographical_regions: {
      Alpine: "Alpino",
      Arctic: "Artico",
      Atlantic: "Atlantico",
      Boreal: "Boreale",
      Continental: "Continentale",
      Mediterranean: "Mediterraneo",
      Pannonian: "Pannonico",
      "no-identificados": "Non identificati",
    },
    keywords: {
      "green infrastructure": "infrastruttura verde",
      "green roofs": "tetti verdi",
      heatwave: "ondata di calore",
      "early warning system": "sistema di allerta precoce",
      "water retention": "ritenzione idrica",
      "water quality": "qualità dell'acqua",
      "early warning": "allerta precoce",
      wetlands: "zone umide",
      "heat island effect": "effetto isola di calore",
      Governance: "Governance",
      Wildfires: "Incendi boschivi",
      drought: "siccità",
      flooding: "alluvioni",
    },
  },
};

const CATEGORY_FALLBACK_ORDER = {
  adaptation_approaches: ["adaptation_approaches", "sectors", "climate_impacts"],
  climate_impacts: ["climate_impacts", "adaptation_approaches"],
  sectors: ["sectors"],
  biogeographical_regions: ["biogeographical_regions"],
  keywords: ["keywords"],
};

function lookupTranslation(locale, category, value) {
  const order = CATEGORY_FALLBACK_ORDER[category] ?? [category];
  for (const cat of order) {
    const hit = TRANSLATIONS[locale]?.[cat]?.[value];
    if (hit) return hit;
  }
  return undefined;
}

function buildFacets(locale) {
  const facets = {};
  for (const category of Object.keys(inventory)) {
    facets[category] = {};
    for (const value of inventory[category]) {
      if (locale === "en") {
        facets[category][value] = value;
        continue;
      }
      const translated = lookupTranslation(locale, category, value);
      if (translated) facets[category][value] = translated;
    }
  }
  return facets;
}

for (const locale of ["en", "es", "it"]) {
  const path = join(localesDir, `${locale}.json`);
  const data = JSON.parse(readFileSync(path, "utf8"));
  data.facets = buildFacets(locale);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Updated ${path}`);
}
