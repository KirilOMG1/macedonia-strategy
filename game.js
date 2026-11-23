const $ = (selector) => document.querySelector(selector);

const regionMeta = {
  Skopje: { code: "SK", capital: "Skopje", population: 620000, economy: "High", stability: 76, army: 4 },
  Polog: { code: "PO", capital: "Tetovo", population: 300000, economy: "Medium", stability: 68, army: 3 },
  Pelagonia: { code: "PE", capital: "Bitola", population: 210000, economy: "Medium", stability: 74, army: 3 },
  Southwest: { code: "SW", capital: "Ohrid", population: 220000, economy: "Tourism", stability: 79, army: 2 },
  Vardar: { code: "VA", capital: "Veles", population: 150000, economy: "Medium", stability: 71, army: 2 },
  Southeast: { code: "SE", capital: "Strumica", population: 165000, economy: "Agriculture", stability: 73, army: 2 },
  East: { code: "EA", capital: "Štip", population: 165000, economy: "Industry", stability: 70, army: 1 },
  Northeast: { code: "NE", capital: "Kumanovo", population: 170000, economy: "Border trade", stability: 65, army: 1 }
};

const regionColors = {
  Skopje: "#9aa17a",
  Polog: "#b7ad78",
  Pelagonia: "#9d9f67",
  Southwest: "#93a879",
  Vardar: "#aaa66d",
  Southeast: "#82966c",
  East: "#a5a56f",
  Northeast: "#b29a68"
};

const cities = [
  ["Skopje", 21.4317, 41.9961, 422540],
  ["Kumanovo", 21.7144, 42.1322, 70842],
  ["Tetovo", 20.9714, 42.0103, 63176],
  ["Gostivar", 20.9089, 41.7961, 50926],
  ["Veles", 21.7750, 41.7156, 46716],
  ["Prilep", 21.5528, 41.3451, 63308],
  ["Bitola", 21.3347, 41.0319, 69287],
  ["Ohrid", 20.8016, 41.1231, 38850],
  ["Kičevo", 20.9586, 41.5120, 31100],
  ["Štip", 22.1954, 41.7466, 42119],
  ["Strumica", 22.6463, 41.4375, 35311],
  ["Kavadarci", 22.0112, 41.4326, 30790],
  ["Kočani", 22.4117, 41.9164, 28300]
];

const state = {
  turn: 1,
  year: 2026,
  season: 0,
  denars: 820,
  influence: 42,
  army: 18,
  stability: 72,
  diplomacy: "Balanced",
  selected: "Skopje",
  regions: Object.fromEntries(Object.entries(regionMeta).map(([name, data]) => [name, { ...data, level: 0 }])),
  muted: false
};

const seasons = ["SPRING", "SUMMER", "AUTUMN", "WINTER"];
let projection;
let regionFeatures = [];

function project([lon, lat]) {
  return [projection(lon, lat)];
}

async function init() {
  await Promise.all([
    fetch("regions.geojson").then(r => r.json()),
    fetch("countries.geojson").then(r => r.json())
  ]).then(([regions, countries]) => {
    regionFeatures = regions.features;
    drawMap(regions.features, countries.features);
  });
  bindEvents();
  updateUI();
}

function drawMap(features, countryFeatures) {
  const map = $("#map");
  const bounds = getBounds(features);
  const width = 640;
  const height = 540;
  const padding = 40;
  const scale = Math.min(
    (width - padding * 2) / (bounds.maxLon - bounds.minLon),
    (height - padding * 2) / (bounds.maxLat - bounds.minLat)
  );
  projection = (lon, lat) => [
    (lon - bounds.minLon) * scale + (width - (bounds.maxLon - bounds.minLon) * scale) / 2 + 0,
    (bounds.maxLat - lat) * scale + (height - (bounds.maxLat - bounds.minLat) * scale) / 2 + 0
  ];

  map.setAttribute("viewBox", "0 0 640 540");
  const scene = $("#mapScene");
  scene.innerHTML = "";

  const neighboringNames = ["Kosovo", "Serbia", "Bulgaria", "Greece", "Albania"];
  for (const name of neighboringNames) {
    const feature = countryFeatures.find(f => f.properties.name === name);
    if (!feature) continue;
    for (const polygon of geometryPolygons(feature.geometry)) {
      const path = polygonToPath(polygon);
      if (!path) continue;
      const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
      el.setAttribute("d", path);
      el.setAttribute("fill", "#c9c5af");
      el.setAttribute("stroke", "#9e9b87");
      el.setAttribute("stroke-width", ".7");
      scene.appendChild(el);
    }
  }

  for (const feature of features) {
    const name = feature.properties.shapeName;
    const polygonPaths = geometryPolygons(feature.geometry);
    for (const polygon of polygonPaths) {
      const path = polygonToPath(polygon);
      const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
      el.setAttribute("d", path);
      el.setAttribute("fill", regionColors[name] || "#9b9f75");
      el.setAttribute("class", "region" + (name === state.selected ? " selected" : ""));
      el.dataset.region = name;
      el.addEventListener("mouseenter", showTooltip);
      el.addEventListener("mousemove", showTooltip);
      el.addEventListener("mouseleave", hideTooltip);
      el.addEventListener("click", () => selectRegion(name));
      scene.appendChild(el);
    }
  }

  drawPhysicalDetails(scene);
  for (const feature of features) {
    const name = feature.properties.shapeName;
    const center = polygonCenter(feature.geometry);
    if (!center) continue;
    const [x, y] = projection(center[0], center[1]);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", y);
    label.setAttribute("class", "region-label");
    label.textContent = name === "Northeast" ? "N. EAST" : name.toUpperCase();
    scene.appendChild(label);
  }

  for (const [name, lon, lat] of cities) {
    const [x, y] = projection(lon, lat);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x); dot.setAttribute("cy", y); dot.setAttribute("r", name === "Skopje" ? 4 : 2.5);
    dot.setAttribute("class", "city-dot");
    scene.appendChild(dot);
    if (["Skopje", "Bitola", "Ohrid", "Tetovo", "Kumanovo", "Prilep", "Veles", "Štip", "Strumica"].includes(name)) {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x + 5); label.setAttribute("y", y - 4); label.setAttribute("class", "city-label");
      label.textContent = name;
      scene.appendChild(label);
    }
  }
}

function drawPhysicalDetails(scene) {
  const lakes = [
    ["Lake Ohrid", 20.7, 41.0, 11, 26],
    ["Lake Prespa", 21.0, 40.92, 9, 11],
    ["Lake Dojran", 22.73, 41.18, 9, 4]
  ];
  for (const [name, lon, lat, rx, ry] of lakes) {
    const [x, y] = projection(lon, lat);
    const lake = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    lake.setAttribute("cx", x); lake.setAttribute("cy", y); lake.setAttribute("rx", rx); lake.setAttribute("ry", ry);
    lake.setAttribute("class", "lake"); scene.appendChild(lake);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x); label.setAttribute("y", y + ry + 9); label.setAttribute("class", "lake-label");
    label.setAttribute("text-anchor", "middle"); label.textContent = name.replace("Lake ", "");
    scene.appendChild(label);
  }

  const riverPoints = [[21.35,42.03],[21.43,41.96],[21.40,41.72],[21.58,41.38],[21.78,41.18],[22.12,41.10],[22.50,41.05]];
  const riverPath = riverPoints.map((p, i) => {
    const [x,y] = projection(p[0],p[1]); return (i ? "L" : "M") + x + "," + y;
  }).join(" ");
  const river = document.createElementNS("http://www.w3.org/2000/svg", "path");
  river.setAttribute("d", riverPath); river.setAttribute("class", "river"); scene.appendChild(river);

  [[20.54,41.79,"Korab"],[21.20,41.01,"Pelister"],[20.80,41.90,"Šar"]].forEach(([lon,lat,name])=>{
    const [x,y] = projection(lon,lat);
    const mark = document.createElementNS("http://www.w3.org/2000/svg", "text");
    mark.setAttribute("x",x); mark.setAttribute("y",y); mark.setAttribute("class","terrain-mark");
    mark.setAttribute("text-anchor","middle"); mark.textContent="▲";
    scene.appendChild(mark);
  });

  const labels = [["SERBIA",21.72,42.42],["KOSOVO",20.75,42.38],["BULGARIA",22.92,41.78],["GREECE",22.15,40.72],["ALBANIA",20.12,41.35]];
  labels.forEach(([text,lon,lat])=>{
    const [x,y]=projection(lon,lat); const el=document.createElementNS("http://www.w3.org/2000/svg","text");
    el.setAttribute("x",x);el.setAttribute("y",y);el.setAttribute("class","border-label");el.setAttribute("text-anchor","middle");el.textContent=text;scene.appendChild(el);
  });
}

function geometryPolygons(geometry) {
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function polygonToPath(polygon) {
  if (!polygon || !polygon[0]) return "";
  return polygon.map(ring => {
    const points = ring.map(point => projection(point[0], point[1]));
    return "M" + points.map(p => p[0].toFixed(2) + "," + p[1].toFixed(2)).join("L") + "Z";
  }).join("");
}

function getBounds(features) {
  let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
  const visit = (coords) => {
    if (typeof coords[0] === "number") {
      minLon = Math.min(minLon, coords[0]); maxLon = Math.max(maxLon, coords[0]);
      minLat = Math.min(minLat, coords[1]); maxLat = Math.max(maxLat, coords[1]);
    } else coords.forEach(visit);
  };
  features.forEach(f => visit(f.geometry.coordinates));
  return { minLon, maxLon, minLat, maxLat };
}

function polygonCenter(geometry) {
  let minLon=180,maxLon=-180,minLat=90,maxLat=-90;
  const visit = coords => { if(typeof coords[0]==="number"){minLon=Math.min(minLon,coords[0]);maxLon=Math.max(maxLon,coords[0]);minLat=Math.min(minLat,coords[1]);maxLat=Math.max(maxLat,coords[1]);}else coords.forEach(visit); };
  visit(geometry.coordinates);
  return [(minLon+maxLon)/2,(minLat+maxLat)/2];
}

function showTooltip(event) {
  const name = event.currentTarget.dataset.region;
  const data = state.regions[name];
  const tooltip = $("#tooltip");
  tooltip.innerHTML = `<strong>${name} Region</strong>${data.population.toLocaleString()} population<br>Stability ${data.stability}% · Army ${data.army}`;
  tooltip.hidden = false;
  const rect = $("#map").getBoundingClientRect();
  tooltip.style.left = Math.min(event.clientX - rect.left + 12, rect.width - 180) + "px";
  tooltip.style.top = Math.max(event.clientY - rect.top - 55, 35) + "px";
}
function hideTooltip() { $("#tooltip").hidden = true; }

function selectRegion(name) {
  state.selected = name;
  document.querySelectorAll(".region").forEach(el => el.classList.toggle("selected", el.dataset.region === name));
  updateUI();
}

function bindEvents() {
  $("#nextTurn").addEventListener("click", nextTurn);
  $("#closeModal").addEventListener("click", () => $("#eventModal").hidden = true);
  $("#muteButton").addEventListener("click", () => { state.muted = !state.muted; $("#muteButton").textContent = state.muted ? "×" : "♪"; });
  $("#buildEconomy").addEventListener("click", () => takeAction("economy"));
  $("#buildGarrison").addEventListener("click", () => takeAction("garrison"));
  $("#hostFestival").addEventListener("click", () => takeAction("festival"));
}

function takeAction(action) {
  const region = state.regions[state.selected];
  if (action === "economy" && state.denars >= 180) {
    state.denars -= 180; region.level++; state.stability += 2;
    setNews(`Industry investment approved in ${state.selected}.`);
  } else if (action === "garrison" && state.denars >= 120) {
    state.denars -= 120; region.army++; state.army++;
    setNews(`A new garrison was raised in ${state.selected}.`);
  } else if (action === "festival" && state.influence >= 90) {
    state.influence -= 90; state.stability += 5; region.stability += 4;
    setNews(`A national festival strengthened unity in ${state.selected}.`);
  } else {
    setNews("The treasury cannot support that action yet.");
  }
  updateUI();
}

function nextTurn() {
  state.turn++;
  state.season = (state.season + 1) % 4;
  if (state.season === 0) state.year++;

  let income = 0;
  Object.values(state.regions).forEach(r => {
    income += 34 + r.level * 18 + (r.economy === "High" ? 28 : r.economy === "Tourism" ? 16 : 8);
  });
  state.denars += income;
  state.influence += 7 + Math.floor(state.stability / 30);
  state.stability = Math.max(30, Math.min(100, state.stability + (state.season === 3 ? -1 : 1)));

  const events = [
    ["A record harvest", "Strong regional yields have expanded the national treasury.", "economy"],
    ["Lake renewal", "Tourism and environmental investment lift confidence in the southwest.", "southwest"],
    ["Border open day", "New trade links improve influence across the north.", "trade"],
    ["Winter congress", "Regional leaders reach a rare consensus on infrastructure.", "stability"]
  ];
  const event = events[state.season];
  if (event[2] === "economy") state.denars += 55;
  if (event[2] === "southwest") state.regions.Southwest.stability = Math.min(100, state.regions.Southwest.stability + 3);
  if (event[2] === "trade") state.influence += 8;
  if (event[2] === "stability") state.stability = Math.min(100, state.stability + 4);

  setNews(event[1]);
  showEvent(event);
  updateUI();
}

function showEvent(event) {
  $("#eventSeason").textContent = `${seasons[state.season]} REPORT · ${state.year}`;
  $("#eventTitle").textContent = event[0];
  $("#eventText").textContent = event[1];
  $("#eventModal").hidden = false;
}

function setNews(text) { $("#newsText").textContent = text; }

function updateUI() {
  $("#denars").textContent = state.denars;
  $("#influence").textContent = state.influence;
  $("#army").textContent = state.army;
  $("#population").textContent = "1.82m";
  $("#control").textContent = "8 / 8";
  $("#stability").textContent = state.stability + "%";
  $("#diplomacy").textContent = state.diplomacy;
  $("#turnLabel").textContent = `TURN ${state.turn} · ${seasons[state.season]} ${state.year}`;

  const region = state.regions[state.selected];
  $("#regionTitle").textContent = state.selected.toUpperCase() + " REGION";
  $("#regionCapital").textContent = "Capital: " + region.capital;
  $("#regionStatus").textContent = "Macedonian control";
  $("#regionPopulation").textContent = region.population >= 1000000 ? (region.population/1000000).toFixed(2)+"m" : Math.round(region.population/1000)+"k";
  $("#regionEconomy").textContent = region.economy;
  $("#regionArmy").textContent = region.army;
  $("#regionStability").textContent = region.stability + "%";

  $("#buildEconomy").disabled = state.denars < 180;
  $("#buildGarrison").disabled = state.denars < 120;
  $("#hostFestival").disabled = state.influence < 90;
  $("#goalEconomy").checked = state.denars >= 1500;
  $("#goalStability").checked = state.stability >= 85;
  $("#goalArmy").checked = state.army >= 30;
}

init();
