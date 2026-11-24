const $ = (id) => document.getElementById(id);

const provinces = {
  Skopje:       { name:"Skopje", code:"SK", capital:"Skopje", army:4, fort:1, income:38, terrain:"Metropolitan", population:620, owner:"macedonia", lat:41.996, lon:21.432 },
  Polog:        { name:"Polog", code:"PO", capital:"Tetovo", army:3, fort:0, income:28, terrain:"Mountain valley", population:300, owner:"macedonia", lat:42.010, lon:20.971 },
  Pelagonia:    { name:"Pelagonia", code:"PE", capital:"Bitola", army:3, fort:1, income:30, terrain:"Southern plain", population:210, owner:"macedonia", lat:41.032, lon:21.335 },
  Southwest:    { name:"Southwest", code:"SW", capital:"Ohrid", army:3, fort:1, income:34, terrain:"Lake district", population:220, owner:"macedonia", lat:41.117, lon:20.802 },
  Vardar:       { name:"Vardar", code:"VA", capital:"Veles", army:3, fort:0, income:26, terrain:"River basin", population:150, owner:"macedonia", lat:41.716, lon:21.775 },
  Southeast:    { name:"Southeast", code:"SE", capital:"Strumica", army:3, fort:0, income:24, terrain:"Agricultural", population:165, owner:"macedonia", lat:41.438, lon:22.646 },
  East:         { name:"East", code:"EA", capital:"Štip", army:2, fort:0, income:25, terrain:"Mining basin", population:165, owner:"macedonia", lat:41.747, lon:22.195 },
  Northeast:    { name:"Northeast", code:"NE", capital:"Kumanovo", army:3, fort:1, income:27, terrain:"Northern uplands", population:170, owner:"macedonia", lat:42.132, lon:21.714 },
  KosovoNorth:  { name:"Kosovo North", code:"KN", army:5, fort:1, income:18, terrain:"Border plateau", population:460, owner:"kosovo", lat:42.667, lon:21.166 },
  KosovoWest:   { name:"Metohija", code:"KW", army:4, fort:0, income:16, terrain:"Western valley", population:330, owner:"kosovo", lat:42.659, lon:20.287 },
  SerbiaSouth:  { name:"Southern Serbia", code:"SS", army:6, fort:2, income:22, terrain:"Southern Serbia", population:510, owner:"serbia", lat:43.320, lon:21.895 },
  SerbiaPresevo:{ name:"Preševo", code:"SP", army:4, fort:1, income:14, terrain:"Northern border", population:190, owner:"serbia", lat:42.310, lon:21.648 },
  AlbaniaWest:  { name:"Western Albania", code:"AW", army:5, fort:1, income:20, terrain:"Adriatic foothills", population:530, owner:"albania", lat:41.328, lon:19.819 },
  AlbaniaEast:  { name:"Eastern Albania", code:"AE", army:4, fort:1, income:17, terrain:"Mountain corridor", population:380, owner:"albania", lat:40.618, lon:20.779 },
  GreeceWest:   { name:"West Macedonia", code:"GW", army:5, fort:1, income:21, terrain:"Highland plain", population:460, owner:"greece", lat:40.781, lon:21.409 },
  GreeceEast:   { name:"Thessaly", code:"GE", army:6, fort:2, income:25, terrain:"Southern plain", population:720, owner:"greece", lat:40.640, lon:22.944 },
  BulgariaWest: { name:"Blagoevgrad", code:"BW", army:5, fort:1, income:19, terrain:"Mountain district", population:290, owner:"bulgaria", lat:42.020, lon:23.095 },
  BulgariaNorth:{ name:"Sofia Region", code:"BN", army:7, fort:2, income:28, terrain:"Capital district", population:1100, owner:"bulgaria", lat:42.697, lon:23.321 }
};

const relations = {
  kosovo: { name:"Kosovo", value:55, color:"#9f6f66" },
  serbia: { name:"Serbia", value:44, color:"#687e95" },
  albania:{ name:"Albania", value:58, color:"#8d704f" },
  greece: { name:"Greece", value:62, color:"#718a9a" },
  bulgaria:{name:"Bulgaria", value:51, color:"#7d8056" }
};

const adjacency = {
  Skopje:["Polog","Vardar","Northeast","KosovoNorth","SerbiaPresevo"],
  Polog:["Skopje","Southwest","Northeast","KosovoWest","KosovoNorth"],
  Pelagonia:["Southwest","Vardar","GreeceWest","AlbaniaEast"],
  Southwest:["Polog","Pelagonia","Vardar","AlbaniaWest","AlbaniaEast","GreeceWest"],
  Vardar:["Skopje","Pelagonia","Southwest","Southeast","East"],
  Southeast:["Vardar","East","GreeceWest","GreeceEast","BulgariaWest"],
  East:["Vardar","Southeast","Northeast","BulgariaWest"],
  Northeast:["Skopje","Polog","East","KosovoNorth","SerbiaPresevo","SerbiaSouth","BulgariaWest"],
  KosovoNorth:["Skopje","Polog","Northeast","KosovoWest","SerbiaSouth","SerbiaPresevo"],
  KosovoWest:["Polog","Southwest","KosovoNorth","AlbaniaWest","AlbaniaEast"],
  SerbiaSouth:["Northeast","SerbiaPresevo","KosovoNorth","BulgariaNorth","BulgariaWest"],
  SerbiaPresevo:["Skopje","Northeast","SerbiaSouth","KosovoNorth"],
  AlbaniaWest:["Southwest","KosovoWest","AlbaniaEast"],
  AlbaniaEast:["Pelagonia","Southwest","KosovoWest","AlbaniaWest","GreeceWest"],
  GreeceWest:["Pelagonia","Southwest","Southeast","AlbaniaEast","GreeceEast"],
  GreeceEast:["Southeast","GreeceWest","BulgariaWest"],
  BulgariaWest:["East","Southeast","Northeast","SerbiaSouth","GreeceEast","BulgariaNorth"],
  BulgariaNorth:["SerbiaSouth","BulgariaWest"]
};

const macedonianCodes = ["SK","PO","PE","SW","VA","SE","EA","NE"];
const ownerNames = {
  macedonia:"Republic of Macedonia",
  kosovo:"Kosovo",
  serbia:"Serbia",
  albania:"Albania",
  greece:"Greece",
  bulgaria:"Bulgaria"
};

let state = null;
let projection = null;
let regionFeatures = [];
let saveTimer = null;

function newCampaign() {
  state = {
    turn:1,
    season:0,
    year:2026,
    gold:1200,
    food:860,
    renown:0,
    stability:76,
    actionPoints:3,
    actionsUsed:0,
    selected:"Skopje",
    territory:Object.fromEntries(Object.keys(provinces).map(id => [id, provinces[id].owner === "macedonia" ? "macedonia" : provinces[id].owner]))
  };
  Object.keys(provinces).forEach(id => {
    provinces[id].owner = state.territory[id];
  });
  saveGame(false);
  return state;
}

function loadCampaign() {
  try {
    const saved = JSON.parse(localStorage.getItem("macedonia-campaign-v2"));
    if (!saved || !saved.territory) return newCampaign();
    state = saved;
    Object.keys(provinces).forEach(id => {
      provinces[id].owner = state.territory[id] || provinces[id].owner;
    });
    return state;
  } catch (_) {
    return newCampaign();
  }
}

function saveGame(show=true) {
  if (!state) return;
  state.territory = Object.fromEntries(Object.keys(provinces).map(id => [id, provinces[id].owner]));
  localStorage.setItem("macedonia-campaign-v2", JSON.stringify(state));
  if (show) showBanner("Campaign saved");
}

async function init() {
  loadCampaign();
  bindEvents();
  const [regions, countries] = await Promise.all([
    fetch("regions.geojson").then(r => r.json()),
    fetch("countries.geojson").then(r => r.json())
  ]);
  regionFeatures = regions.features;
  drawMap(regions.features, countries.features);
  updateUI();
  addChronicle("The campaign begins. Select a province to issue orders.");
}

function bindEvents() {
  $("endTurnButton").addEventListener("click", endTurn);
  $("saveButton").addEventListener("click", () => saveGame(true));
  $("resetButton").addEventListener("click", () => {
    if (confirm("Restart the entire campaign?")) {
      localStorage.removeItem("macedonia-campaign-v2");
      newCampaign();
      location.reload();
    }
  });
  $("modalClose").addEventListener("click", () => $("modal").hidden = true);
}

function projectionForRegion(lon, lat) {
  const bounds = { west:19.0, east:24.3, south:40.45, north:43.25 };
  const width = 900, height = 620;
  const scale = Math.min((width-40)/(bounds.east-bounds.west), (height-40)/(bounds.north-bounds.south));
  const offsetX = (width-(bounds.east-bounds.west)*scale)/2;
  const offsetY = (height-(bounds.north-bounds.south)*scale)/2;
  return [offsetX+(lon-bounds.west)*scale, offsetY+(bounds.north-lat)*scale];
}

function drawMap(regionFeatures, countryFeatures) {
  const scene = $("mapScene");
  scene.innerHTML = "";

  const countryNames = ["Kosovo","Serbia","Bulgaria","Greece","Albania"];
  countryNames.forEach(name => {
    const feature = countryFeatures.find(f => f.properties.name === name);
    if (!feature) return;
    geometryPolygons(feature.geometry).forEach(polygon => {
      const path = geometryToPath(polygon);
      if (!path) return;
      const el = svgEl("path", { d:path, class:"country", fill: countryBaseFill(name) });
      scene.appendChild(el);
    });
  });

  drawPhysicalMap(scene);

  regionFeatures.forEach(feature => {
    const name = feature.properties.shapeName;
    geometryPolygons(feature.geometry).forEach(polygon => {
      const path = geometryToPath(polygon);
      const province = provinces[name];
      if (!province) return;
      const el = svgEl("path", {
        d:path,
        class:"province",
        fill:provinceFill(name),
        "data-id":name
      });
      el.addEventListener("click", () => provinceClick(name));
      el.addEventListener("mouseenter", e => showTooltip(e, name));
      el.addEventListener("mousemove", e => moveTooltip(e));
      el.addEventListener("mouseleave", hideTooltip);
      scene.appendChild(el);
    });

    const center = geometryCenter(feature.geometry);
    if (center) {
      const [x,y] = projectionForRegion(center[0], center[1]);
      scene.appendChild(svgEl("text", {x,y,class:"province-label"}, name.toUpperCase()));
    }
  });

  Object.keys(provinces).filter(id => !macedonianCodes.includes(provinces[id].code)).forEach(id => {
    const province = provinces[id];
    const [x,y] = projectionForRegion(province.lon, province.lat);
    const el = svgEl("circle", {
      cx:x, cy:y, r:22, class:"province",
      fill:provinceFill(id),
      "data-id":id
    });
    el.addEventListener("click", () => provinceClick(id));
    el.addEventListener("mouseenter", e => showTooltip(e,id));
    el.addEventListener("mousemove", e => moveTooltip(e));
    el.addEventListener("mouseleave", hideTooltip);
    scene.appendChild(el);
    scene.appendChild(svgEl("text", {x:x,y:y-28,class:"province-label","font-size":11}, province.name.toUpperCase()));
  });

  drawArmyMarkers(scene);
  refreshMapClasses();
}

function drawPhysicalMap(scene) {
  const lakes = [
    ["Lake Ohrid",20.80,41.05,42,90],
    ["Lake Prespa",21.02,40.91,28,42],
    ["Lake Dojran",22.75,41.18,24,13]
  ];
  lakes.forEach(([name,lon,lat,rx,ry]) => {
    const [x,y] = projectionForRegion(lon,lat);
    scene.appendChild(svgEl("ellipse",{cx:x,cy:y,rx,ry,class:"lake"}));
    scene.appendChild(svgEl("text",{x,y:y+ry+14,class:"lake-label"},name.replace("Lake ","")));
  });

  const river = [[21.32,42.19],[21.43,41.95],[21.55,41.62],[21.78,41.28],[22.13,41.10],[22.50,41.05]];
  const path = river.map((p,i) => {
    const [x,y] = projectionForRegion(p[0],p[1]);
    return `${i?"L":"M"}${x},${y}`;
  }).join(" ");
  scene.appendChild(svgEl("path",{d:path,class:"river"}));

  [["KOSOVO",20.80,42.55],["SERBIA",21.90,43.05],["BULGARIA",23.35,41.75],["GREECE",22.35,40.55],["ALBANIA",19.65,41.15]].forEach(([name,lon,lat])=>{
    const [x,y] = projectionForRegion(lon,lat);
    scene.appendChild(svgEl("text",{x,y,class:"border-name"},name));
  });
}

function drawArmyMarkers(scene) {
  document.querySelectorAll(".army-marker").forEach(el => el.remove());
  Object.entries(provinces).forEach(([id,province])=>{
    const [x,y] = provinceMarkerPosition(id, province);
    const marker = svgEl("g",{class:"army-marker","data-army-id":id});
    marker.appendChild(svgEl("circle",{cx:x,cy:y,r:12,class:"army-badge"}));
    marker.appendChild(svgEl("text",{x,y,class:"army-text"},province.army));
    scene.appendChild(marker);
  });
}

function provinceMarkerPosition(id, province) {
  if (macedonianCodes.includes(province.code)) {
    const feature = regionFeatures.find(f => f.properties.shapeName === id);
    if (feature) {
      const center = geometryCenter(feature.geometry);
      if (center) return projectionForRegion(center[0],center[1]);
    }
  }
  return projectionForRegion(province.lon,province.lat);
}

function refreshMapClasses() {
  document.querySelectorAll(".province").forEach(el => {
    const id = el.dataset.id;
    el.classList.toggle("selected", id === state.selected);
    el.classList.toggle("reachable", state.selected && adjacency[state.selected]?.includes(id) && provinces[id].owner !== "macedonia");
  });
  drawArmyMarkers($("mapScene"));
}

function provinceFill(id) {
  const owner = provinces[id].owner;
  if (owner === "macedonia") return "#71885f";
  if (owner === "serbia") return "#7e91a1";
  if (owner === "greece") return "#6f91a0";
  if (owner === "albania") return "#a18868";
  if (owner === "bulgaria") return "#9a9a65";
  return "#a17a70";
}

function countryBaseFill(name) {
  return {Kosovo:"#d2cbbb",Serbia:"#cbc8b2",Bulgaria:"#c8c4a8",Greece:"#c1c4ad",Albania:"#d1c4a9"}[name] || "#ccc";
}

function provinceClick(id) {
  if (!state.selected) {
    state.selected = id;
  } else if (id === state.selected) {
    state.selected = id;
  } else if (provinces[state.selected].owner === "macedonia" && adjacency[state.selected]?.includes(id)) {
    if (provinces[id].owner === "macedonia") {
      moveArmy(state.selected, id);
    } else {
      attackProvince(state.selected, id);
    }
  } else if (provinces[id].owner === "macedonia") {
    state.selected = id;
  } else {
    state.selected = id;
  }
  updateUI();
  refreshMapClasses();
}

function moveArmy(from, to) {
  if (state.actionPoints < 1) return addChronicle("No action points remain this turn.");
  const source = provinces[from], target = provinces[to];
  if (source.army <= 1) return addChronicle(`${source.name} must keep at least one unit behind.`);
  source.army--;
  target.army++;
  state.actionPoints--;
  state.actionsUsed++;
  addChronicle(`One army moved from ${source.name} to ${target.name}.`);
  showBanner("Movement complete");
  saveGame(false);
  state.selected = to;
}

function attackProvince(from, to) {
  if (state.actionPoints < 1) return addChronicle("No action points remain this turn.");
  const attacker = provinces[from], defender = provinces[to];
  if (attacker.army < 2) return addChronicle("The attacking army needs at least 2 units.");

  const relation = relations[defender.owner]?.value ?? 50;
  const defenderOwner = defender.owner;
  const attackRoll = attacker.army + 4 + randomBonus();
  const defenseRoll = defender.army + defender.fort + Math.floor((60-relation)/12) + randomBonus();
  state.actionPoints--;
  state.actionsUsed++;

  if (attackRoll >= defenseRoll) {
    const losses = Math.max(1, Math.floor(defender.army/3));
    attacker.army = Math.max(1, attacker.army-losses);
    defender.owner = "macedonia";
    defender.army = Math.max(1, attacker.army);
    defender.fort = 0;
    attacker.army = Math.max(1, attacker.army-defender.army+1);
    provinces[from].owner = "macedonia";
    state.renown += 40;
    state.stability = Math.min(100, state.stability+2);
    relations[defenderOwner] && (relations[defenderOwner].value = Math.max(0,relation-8));
    addChronicle(`${attacker.name} captured ${defender.name}.`);
    showModal("Province captured", `${defender.name} is now under Macedonian control.`, "Victory report");
  } else {
    attacker.army = Math.max(1, attacker.army-1);
    defender.army = Math.max(1, defender.army-1);
    state.stability = Math.max(20, state.stability-2);
    addChronicle(`The assault on ${defender.name} failed.`);
    showBanner("Attack repelled");
  }
  saveGame(false);
  state.selected = from;
  checkVictory();
}

function randomBonus() {
  return Math.floor(Math.random()*5);
}

function endTurn() {
  if (state.actionPoints > 0 && state.actionsUsed === 0) {
    if (!confirm("End the turn without issuing an order?")) return;
  }
  state.turn++;
  state.season = (state.season+1)%4;
  if (state.season===0) state.year++;

  let income = 0;
  let food = 0;
  Object.values(provinces).forEach(p=>{
    if (p.owner==="macedonia") {
      income += p.income;
      food += Math.max(5,Math.floor(p.population/14));
      p.army = Math.min(p.army+1, 12);
    }
  });
  state.gold += income;
  state.food = Math.min(3000,state.food+food);
  state.actionPoints=3;
  state.actionsUsed=0;
  state.stability=Math.min(100,state.stability+(state.season===3?-1:1));

  runEnemyTurn();
  addChronicle(`Turn ${state.turn}: treasury +${income} gold, food +${food}.`);
  showBanner(`${["Spring","Summer","Autumn","Winter"][state.season]} ${state.year}`);
  saveGame(false);
  updateUI();
  refreshMapClasses();
  checkVictory();
}

function runEnemyTurn() {
  const enemies = ["kosovo","serbia","albania","greece","bulgaria"];
  const enemy = enemies[state.turn%enemies.length];
  const enemyProvinces = Object.keys(provinces).filter(id=>provinces[id].owner===enemy);
  const frontier = enemyProvinces.map(id => ({id, targets:(adjacency[id]||[]).filter(t=>provinces[t].owner==="macedonia")})).find(x=>x.targets.length);
  if (!frontier) return;
  const targetId = frontier.targets[(state.turn+frontier.targets.length)%frontier.targets.length];
  const target = provinces[targetId], source = provinces[frontier.id];
  if (source.army >= target.army+2 && Math.random()<.72) {
    if (source.army >= target.army+5 && Math.random()<0.28) {
      target.owner=enemy;
      target.army=Math.max(2,source.army-3);
      source.army=Math.max(2,source.army-2);
      state.stability=Math.max(20,state.stability-8);
      addChronicle(`${relations[enemy].name} conquered ${target.name}.`);
    } else {
      target.army=Math.max(1,target.army-1);
      target.stability=(target.stability||70)-8;
      state.stability=Math.max(20,state.stability-3);
      addChronicle(`${relations[enemy].name} attacked ${target.name}. The defenders held the province.`);
    }
  } else {
    source.army=Math.max(2,source.army-1);
  }
}

function recruitSelected() {
  const province = provinces[state.selected];
  if (province.owner !== "macedonia") return addChronicle("You can recruit only in Macedonian provinces.");
  if (state.actionPoints<1) return addChronicle("No action points remain.");
  if (state.gold<90) return addChronicle("You need 90 gold to recruit.");
  if (province.army>=12) return addChronicle("This province is already at its army limit.");
  state.gold-=90;
  province.army++;
  state.actionPoints--;
  state.actionsUsed++;
  addChronicle(`A new unit joined the garrison at ${province.name}.`);
  showBanner("Recruitment complete");
  saveGame(false);
  updateUI();
  refreshMapClasses();
}

function fortifySelected() {
  const province = provinces[state.selected];
  if (province.owner !== "macedonia") return addChronicle("Fortifications require Macedonian control.");
  if (state.actionPoints<1) return addChronicle("No action points remain.");
  if (state.gold<140) return addChronicle("You need 140 gold.");
  if (province.fort>=3) return addChronicle("This province is fully fortified.");
  state.gold-=140;
  province.fort++;
  state.actionPoints--;
  state.actionsUsed++;
  addChronicle(`Defenses improved in ${province.name}.`);
  showBanner("Fortification complete");
  saveGame(false);
  updateUI();
  refreshMapClasses();
}

function improveRelations() {
  if (state.actionPoints<1) return addChronicle("No action points remain.");
  if (state.gold<60) return addChronicle("Diplomacy requires 60 gold.");
  const province = provinces[state.selected];
  if (province.owner==="macedonia") {
    addChronicle("Select a province across a border to improve relations.");
    return;
  }
  state.gold-=60;
  relations[province.owner].value=Math.min(100,relations[province.owner].value+8);
  state.actionPoints--;
  state.actionsUsed++;
  addChronicle(`Relations with ${relations[province.owner].name} improved.`);
  saveGame(false);
  updateUI();
}

function updateUI() {
  $("goldValue").textContent=state.gold.toLocaleString();
  $("foodValue").textContent=state.food.toLocaleString();
  $("armyValue").textContent=totalArmy();
  $("renownValue").textContent=state.renown;
  $("stabilityValue").textContent=state.stability+"%";
  $("actionValue").textContent=state.actionPoints;
  $("turnValue").textContent="Turn "+state.turn;
  $("yearValue").textContent=["Spring","Summer","Autumn","Winter"][state.season]+" "+state.year;
  const controlled=Object.values(provinces).filter(p=>p.owner==="macedonia").length;
  $("provinceValue").textContent=controlled+" / "+Object.keys(provinces).length;

  updateObjectives(controlled);
  updateDiplomacy();
  updateProvincePanel();
  updateAdjacentPanel();

  $("endTurnButton").disabled=state.ended;
  refreshMapClasses();
}

function totalArmy() {
  return Object.values(provinces).filter(p=>p.owner==="macedonia").reduce((sum,p)=>sum+p.army,0);
}

function updateObjectives(controlled) {
  const goals=[
    ["Control 12 provinces",controlled>=12],
    ["Hold 85 stability",state.stability>=85],
    ["Field 45 army",totalArmy()>=45],
    ["Earn 1,500 gold",state.gold>=1500]
  ];
  $("objectives").innerHTML=goals.map(([text,done])=>`<div class="objective ${done?"done":""}"><span class="objective-check">${done?"✓":""}</span><span>${text}</span></div>`).join("");
}

function updateDiplomacy() {
  $("diplomacyList").innerHTML=Object.entries(relations).map(([id,r])=>`
    <div class="dip-row"><span>${r.name}</span><span>${r.value}</span><div class="dip-bar"><i style="width:${r.value}%"></i></div></div>
  `).join("");
}

function updateProvincePanel() {
  const province=provinces[state.selected];
  if (!province) return;
  $("provinceName").textContent=province.name;
  $("provinceOwner").textContent=ownerNames[province.owner];
  $("provinceEmblem").textContent=province.code;
  $("provinceEmblem").style.background=provinceFill(state.selected);
  $("provinceArmy").textContent=province.army;
  $("provinceIncome").textContent=province.owner==="macedonia" ? "+"+province.income : "—";
  $("provinceFort").textContent=province.fort;
  $("provinceTerrain").textContent=province.terrain;
  $("selectedLabel").textContent=province.name;

  const owned=province.owner==="macedonia";
  $("provinceActions").innerHTML="";
  if (owned) {
    $("provinceActions").appendChild(orderButton("▲","Recruit unit","90 gold · +1 army",recruitSelected,state.gold<90||province.army>=12));
    $("provinceActions").appendChild(orderButton("◆","Fortify province","140 gold · +1 defense",fortifySelected,state.gold<140||province.fort>=3));
  } else {
    $("provinceActions").appendChild(orderButton("◎","Improve relations","60 gold · +8 relation",improveRelations,state.gold<60));
  }
  $("mapHint").textContent=owned
    ? "Select this province, then click an adjacent friendly or enemy province."
    : "This province is controlled by "+ownerNames[province.owner]+".";
}

function orderButton(icon,title,detail,handler,disabled=false) {
  const button=document.createElement("button");
  button.className="order-button";
  button.disabled=disabled||state.actionPoints<1;
  button.innerHTML=`<span class="order-icon">${icon}</span><span><strong>${title}</strong><small>${detail}</small></span>`;
  button.addEventListener("click",handler);
  return button;
}

function updateAdjacentPanel() {
  const list=$("adjacentList");
  list.innerHTML="";
  (adjacency[state.selected]||[]).forEach(id=>{
    const province=provinces[id];
    const row=document.createElement("div");
    row.className="adjacent-row";
    const button=document.createElement("button");
    button.className=province.owner==="macedonia"?"friend":"enemy";
    button.textContent=(province.owner==="macedonia"?"Move: ":"Attack: ")+" "+province.name;
    button.addEventListener("click",()=>provinceClick(id));
    row.appendChild(button);
    row.appendChild(spanEl(province.army+""));
    list.appendChild(row);
  });
}

function spanEl(text) {
  const span=document.createElement("span");
  span.textContent=text;
  return span;
}

function checkVictory() {
  const controlled=Object.values(provinces).filter(p=>p.owner==="macedonia").length;
  if (controlled>=18 && state.stability>=85) {
    showModal("A united Macedonia","You control 18 provinces and have secured a stable, prosperous realm.","Campaign victory");
  }
  if (state.stability<=20) {
    showModal("The crown has fallen","Macedonia's stability collapsed before the campaign could succeed.","Campaign lost");
  }
}

function showModal(title,text,kicker) {
  $("modalTitle").textContent=title;
  $("modalText").textContent=text;
  $("modalKicker").textContent=kicker;
  $("modal").hidden=false;
}

function showBanner(text) {
  const banner=$("battleBanner");
  banner.textContent=text;
  banner.hidden=false;
  clearTimeout(showBanner.timer);
  showBanner.timer=setTimeout(()=>banner.hidden=true,1800);
}

function addChronicle(text) {
  $("chronicle").textContent=text;
}

function showTooltip(event,id) {
  const province=provinces[id];
  $("tooltip").innerHTML=`<strong>${province.name}</strong>${ownerNames[province.owner]}<br>Army ${province.army} · Income ${province.owner==="macedonia"?province.income:"—"} · Fort ${province.fort}`;
  $("tooltip").hidden=false;
  moveTooltip(event);
}
function moveTooltip(event) {
  const viewport=$("mapViewport").getBoundingClientRect();
  const tooltip=$("tooltip");
  tooltip.style.left=Math.max(8,Math.min(event.clientX-viewport.left+12,viewport.width-tooltip.offsetWidth-8))+"px";
  tooltip.style.top=Math.max(8,event.clientY-viewport.top-60)+"px";
}
function hideTooltip() { $("tooltip").hidden=true; }

function geometryPolygons(geometry) {
  if (!geometry) return [];
  if (geometry.type==="Polygon") return [geometry.coordinates];
  if (geometry.type==="MultiPolygon") return geometry.coordinates;
  return [];
}

function geometryToPath(polygon) {
  if (!polygon?.[0]) return "";
  return polygon.map(ring=>{
    const points=ring.map(([lon,lat])=>projectionForRegion(lon,lat));
    return "M"+points.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join("L")+"Z";
  }).join("");
}

function geometryCenter(geometry) {
  let west=180,east=-180,south=90,north=-90;
  function visit(value) {
    if (typeof value[0]==="number") {
      west=Math.min(west,value[0]); east=Math.max(east,value[0]);
      south=Math.min(south,value[1]); north=Math.max(north,value[1]);
    } else value.forEach(visit);
  }
  visit(geometry.coordinates);
  return [(west+east)/2,(south+north)/2];
}

function svgEl(tag,attrs,text) {
  const el=document.createElementNS("http://www.w3.org/2000/svg",tag);
  Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));
  if (text!==undefined) el.textContent=text;
  return el;
}

init();
