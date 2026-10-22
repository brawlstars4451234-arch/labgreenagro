// Main Application UI & Controller Logic
let charts = {};
let simInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initTheme();
    initCharts();
    initSettingsForm();

    // Start Simulation Loop
    startSimulator(5000);

    document.getElementById("sim-speed-select").addEventListener("change", (e) => {
        startSimulator(parseInt(e.target.value));
    });

    document.getElementById("sensor-search").addEventListener("input", renderSensorsTable);
    document.getElementById("alert-severity-filter").addEventListener("change", renderAlertsAndLogs);
    document.getElementById("clear-events-btn").addEventListener("click", () => {
        Storage.clearEvents();
        renderAlertsAndLogs();
    });
});

function startSimulator(intervalMs) {
    if (simInterval) clearInterval(simInterval);

    runCycle(); // Immediate
    simInterval = setInterval(runCycle, intervalMs);
}

function runCycle() {
    let zones = Storage.getZones();
    let settings = Storage.getSettings();

    zones.forEach(zone => {
        simulateZoneData(zone);
        
        // Execute Automation
        const logActions = runAutomationRules(zone, settings);
        logActions.forEach(msg => {
            Storage.addEvent({
                id: Date.now() + Math.random(),
                zoneId: zone.id,
                source: "automation",
                action: "AUTO_RULE",
                message: msg,
                timestamp: new Date().toLocaleTimeString()
            });
        });
    });

    Storage.saveZones(zones);
    updateUI();
}

function updateUI() {
    const zones = Storage.getZones();
    const settings = Storage.getSettings();

    document.getElementById("last-update").innerText = `Обновлено: ${new Date().toLocaleTimeString()}`;

    renderKPI(zones, settings);
    updateCharts(zones);
    renderZones(zones);
    renderSensorsTable();
    renderControl(zones);
    renderAlertsAndLogs();
    renderAnalytics(zones, settings);
}

// Navigation Tab Switcher
function initNavigation() {
    const navBtns = document.querySelectorAll(".nav-btn");
    const views = document.querySelectorAll(".tab-view");

    navBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.dataset.tab;
            navBtns.forEach(b => b.classList.remove("active"));
            views.forEach(v => v.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(`view-${tab}`).classList.add("active");
            document.getElementById("current-title").innerText = btn.innerText.trim();
        });
    });
}

function initTheme() {
    const btn = document.getElementById("theme-toggle");
    btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        btn.innerText = next === "dark" ? "🌙" : "☀️";
    });
}

// KPI Dashboard
function renderKPI(zones, settings) {
    const avgTemp = (zones.reduce((s, z) => s + z.temperature, 0) / zones.length).toFixed(1);
    const avgHum = (zones.reduce((s, z) => s + z.humidity, 0) / zones.length).toFixed(0);
    const avgSoil = (zones.reduce((s, z) => s + z.soil, 0) / zones.length).toFixed(0);
    const minWater = Math.min(...zones.map(z => z.waterLevel));

    document.getElementById("kpi-temp").innerText = `${avgTemp} °C`;
    document.getElementById("kpi-humidity").innerText = `${avgHum} %`;
    document.getElementById("kpi-soil").innerText = `${avgSoil} %`;
    document.getElementById("kpi-water").innerText = `${minWater}%`;

    const waterStatus = document.getElementById("kpi-water-status");
    if (minWater <= settings.waterCritical) {
        waterStatus.innerText = "Критический уровень!";
        waterStatus.className = "kpi-sub warning-text";
    } else {
        waterStatus.innerText = "Запас в норме";
        waterStatus.className = "kpi-sub";
    }

    // Active Alerts Count
    let alertCount = 0;
    zones.forEach(z => {
        if (z.soil < settings.soilMin || z.temperature > settings.tempMax || z.waterLevel <= settings.waterCritical) alertCount++;
    });
    document.getElementById("kpi-alerts-count").innerText = alertCount;
}

// Chart.js Setup
function initCharts() {
    const ctxTemp = document.getElementById("chart-temp").getContext("2d");
    const ctxSoil = document.getElementById("chart-soil").getContext("2d");
    const ctxLC = document.getElementById("chart-light-co2").getContext("2d");
    const ctxRisk = document.getElementById("chart-risk").getContext("2d");

    charts.temp = new Chart(ctxTemp, {
        type: "line",
        data: { labels: [], datasets: [] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    charts.soil = new Chart(ctxSoil, {
        type: "line",
        data: { labels: [], datasets: [] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    charts.lightCo2 = new Chart(ctxLC, {
        type: "line",
        data: { labels: [], datasets: [] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    charts.risk = new Chart(ctxRisk, {
        type: "bar",
        data: { labels: [], datasets: [{ label: "Risk Score (%)", data: [], backgroundColor: "#ef4444" }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { max: 100, min: 0 } } }
    });
}

function updateCharts(zones) {
    if (!zones.length || !zones[0].history) return;

    const timestamps = zones[0].history.timestamps;
    const colors = ["#10b981", "#3b82f6", "#f59e0b"];

    // Update Temp
    charts.temp.data.labels = timestamps;
    charts.temp.data.datasets = zones.map((z, i) => ({
        label: z.name,
        data: z.history.temperature,
        borderColor: colors[i],
        fill: false,
        tension: 0.3
    }));
    charts.temp.update();

    // Update Soil
    charts.soil.data.labels = timestamps;
    charts.soil.data.datasets = zones.map((z, i) => ({
        label: z.name,
        data: z.history.soil,
        borderColor: colors[i],
        fill: false,
        tension: 0.3
    }));
    charts.soil.update();

    // Update Light/CO2
    charts.lightCo2.data.labels = timestamps;
    charts.lightCo2.data.datasets = [
        { label: "Свет (Lux / 10)", data: zones[0].history.light.map(v => v / 10), borderColor: "#f59e0b" },
        { label: "CO2 (PPM)", data: zones[0].history.co2, borderColor: "#8b5cf6" }
    ];
    charts.lightCo2.update();

    // Risk Chart
    const settings = Storage.getSettings();
    charts.risk.data.labels = zones.map(z => z.name);
    charts.risk.data.datasets[0].data = zones.map(z => calculateRiskScore(z, settings));
    charts.risk.update();
}

// Render Zones Cards
function renderZones(zones) {
    const container = document.getElementById("zones-container");
    container.innerHTML = zones.map(z => `
        <div class="card">
            <div class="card-title">
                <h3>${z.name}</h3>
                <span class="badge">${z.mode.toUpperCase()}</span>
            </div>
            <div class="card-body">
                <div class="data-row"><span>Культура:</span> <strong>${z.crop}</strong></div>
                <div class="data-row"><span>Температура:</span> <strong>${z.temperature} °C</strong></div>
                <div class="data-row"><span>Влажность воздуха:</span> <strong>${z.humidity} %</strong></div>
                <div class="data-row"><span>Влажность почвы:</span> <strong>${z.soil} %</strong></div>
                <div class="data-row"><span>Освещённость:</span> <strong>${z.light} Lux</strong></div>
                <div class="data-row"><span>Запас воды:</span> <strong>${z.waterLevel} %</strong></div>
            </div>
        </div>
    `).join("");
}

// Sensors Table
function renderSensorsTable() {
    const zones = Storage.getZones();
    const filter = document.getElementById("sensor-search").value.toLowerCase();
    const tbody = document.getElementById("sensors-table-body");

    let rows = [];
    zones.forEach(z => {
        const list = [
            { id: `${z.id}-TEMP`, name: "Датчик температуры", val: `${z.temperature} °C`, type: "Temperature" },
            { id: `${z.id}-SOIL`, name: "Датчик влажности почвы", val: `${z.soil} %`, type: "Soil" },
            { id: `${z.id}-HUM`, name: "Датчик влажности воздуха", val: `${z.humidity} %`, type: "Air Humidity" },
            { id: `${z.id}-LIGHT`, name: "Датчик освещенности", val: `${z.light} Lux`, type: "Light" },
            { id: `${z.id}-CO2`, name: "Датчик CO2", val: `${z.co2} PPM`, type: "CO2" },
            { id: `${z.id}-WATER`, name: "Датчик уровня воды", val: `${z.waterLevel} %`, type: "Water Level" }
        ];

        list.forEach(s => {
            if (s.name.toLowerCase().includes(filter) || z.name.toLowerCase().includes(filter) || s.type.toLowerCase().includes(filter)) {
                rows.push(`
                    <tr>
                        <td><code>${s.id}</code></td>
                        <td>${z.name}</td>
                        <td>${s.type}</td>
                        <td><strong>${s.val}</strong></td>
                        <td><span class="status-indicator online"><span class="dot"></span> Online</span></td>
                        <td>${new Date().toLocaleTimeString()}</td>
                    </tr>
                `);
            }
        });
    });

    tbody.innerHTML = rows.join("");
}

// Control Actuators View
function renderControl(zones) {
    const container = document.getElementById("control-container");
    container.innerHTML = zones.map(z => `
        <div class="card">
            <div class="card-title">
                <h3>Управление: ${z.name}</h3>
                <div>
                    <label>Режим AUTO:</label>
                    <label class="switch">
                        <input type="checkbox" ${z.mode === 'auto' ? 'checked' : ''} onchange="toggleMode('${z.id}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            <div class="card-body">
                <div class="actuator-row">
                    <span>💧 Поливочный насос</span>
                    <label class="switch">
                        <input type="checkbox" ${z.actuators.pump ? 'checked' : ''} ${z.mode === 'auto' ? 'disabled' : ''} onchange="toggleActuator('${z.id}', 'pump', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="actuator-row">
                    <span>💨 Вентиляция / Вентилятор</span>
                    <label class="switch">
                        <input type="checkbox" ${z.actuators.fan ? 'checked' : ''} ${z.mode === 'auto' ? 'disabled' : ''} onchange="toggleActuator('${z.id}', 'fan', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="actuator-row">
                    <span>💡 Фитолампа Досветки</span>
                    <label class="switch">
                        <input type="checkbox" ${z.actuators.growLight ? 'checked' : ''} ${z.mode === 'auto' ? 'disabled' : ''} onchange="toggleActuator('${z.id}', 'growLight', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="actuator-row">
                    <span>🔥 Система Обогрева</span>
                    <label class="switch">
                        <input type="checkbox" ${z.actuators.heater ? 'checked' : ''} ${z.mode === 'auto' ? 'disabled' : ''} onchange="toggleActuator('${z.id}', 'heater', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        </div>
    `).join("");
}

function toggleMode(zoneId, isAuto) {
    const zones = Storage.getZones();
    const target = zones.find(z => z.id === zoneId);
    if (target) {
        target.mode = isAuto ? "auto" : "manual";
        Storage.saveZones(zones);
        updateUI();
    }
}

function toggleActuator(zoneId, actuator, value) {
    const zones = Storage.getZones();
    const target = zones.find(z => z.id === zoneId);
    if (target) {
        target.actuators[actuator] = value;
        Storage.saveZones(zones);
        Storage.addEvent({
            id: Date.now(),
            zoneId: target.id,
            source: "manual",
            action: `MANUAL_${actuator.toUpperCase()}`,
            message: `Ручной переключатель ${actuator}: ${value ? 'ON' : 'OFF'}`,
            timestamp: new Date().toLocaleTimeString()
        });
        updateUI();
    }
}

// Alerts and Log Engine
function renderAlertsAndLogs() {
    const zones = Storage.getZones();
    const settings = Storage.getSettings();
    const events = Storage.getEvents();
    const filter = document.getElementById("alert-severity-filter").value;

    const alertsList = document.getElementById("alerts-list");
    let alerts = [];

    zones.forEach(z => {
        if (z.soil < settings.soilMin) {
            alerts.push({ zone: z.name, sev: "warning", msg: `Низкая влажность почвы (${z.soil}%)` });
        }
        if (z.waterLevel <= settings.waterCritical) {
            alerts.push({ zone: z.name, sev: "critical", msg: `Критически низкий запас воды (${z.waterLevel}%)` });
        }
        if (z.temperature > settings.tempMax) {
            alerts.push({ zone: z.name, sev: "critical", msg: `Превышение температуры (${z.temperature} °C)` });
        }
    });

    alertsList.innerHTML = alerts
        .filter(a => filter === "all" || a.sev === filter)
        .map(a => `
            <div class="log-item" style="border-left-color: ${a.sev === 'critical' ? '#ef4444' : '#f59e0b'};">
                <span class="alert-badge alert-${a.sev}">${a.sev.toUpperCase()}</span>
                <strong>${a.zone}:</strong> ${a.msg}
            </div>
        `).join("") || "<p class='subtitle'>Активных аварийных тревог нет</p>";

    // Render Event Log
    const logContainer = document.getElementById("events-log-list");
    logContainer.innerHTML = events.map(e => `
        <div class="log-item">
            <small style="color: var(--text-secondary);">${e.timestamp} [${e.source.toUpperCase()}]</small><br>
            ${e.message}
        </div>
    `).join("");
}

// Smart Analytics Page
function renderAnalytics(zones, settings) {
    const container = document.getElementById("analytics-container");
    container.innerHTML = zones.map(z => {
        const risk = calculateRiskScore(z, settings);
        const anomaly = detectAnomalies(z);
        const recs = generateRecommendations(z, settings);

        return `
            <div class="card">
                <div class="card-title">
                    <h3>Аналитика: ${z.name}</h3>
                    <span class="badge" style="background-color: ${risk > 40 ? '#ef4444' : '#10b981'};">Risk: ${risk}%</span>
                </div>
                <div class="card-body">
                    <div class="data-row">
                        <span>Статус Аномалий:</span>
                        <strong>${anomaly ? '⚠️ Резкое изменение параметров!' : '✅ Аномалий не обнаружено'}</strong>
                    </div>
                    <div style="margin-top:0.5rem;">
                        <strong>Рекомендации системы:</strong>
                        <ul style="margin-left: 1.2rem; font-size: 0.85rem; margin-top:0.4rem;">
                            ${recs.map(r => `<li style="margin-bottom:0.2rem;">${r}</li>`).join("")}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// Settings Form Handling
function initSettingsForm() {
    const form = document.getElementById("settings-form");
    const settings = Storage.getSettings();

    document.getElementById("setting-temp-min").value = settings.tempMin;
    document.getElementById("setting-temp-max").value = settings.tempMax;
    document.getElementById("setting-soil-min").value = settings.soilMin;
    document.getElementById("setting-soil-max").value = settings.soilMax;
    document.getElementById("setting-light-min").value = settings.lightMin;
    document.getElementById("setting-water-critical").value = settings.waterCritical;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const updated = {
            tempMin: parseFloat(document.getElementById("setting-temp-min").value),
            tempMax: parseFloat(document.getElementById("setting-temp-max").value),
            soilMin: parseFloat(document.getElementById("setting-soil-min").value),
            soilMax: parseFloat(document.getElementById("setting-soil-max").value),
            lightMin: parseFloat(document.getElementById("setting-light-min").value),
            waterCritical: parseFloat(document.getElementById("setting-water-critical").value)
        };
        Storage.saveSettings(updated);
        alert("Настройки успешно сохранены!");
        updateUI();
    });

    document.getElementById("reset-data-btn").addEventListener("click", () => {
        if (confirm("Вы уверены, что хотите сбросить все данные к дефолтным?")) {
            Storage.resetAll();
        }
    });
}
