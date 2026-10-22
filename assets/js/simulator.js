// Real-time IoT Sensor Simulator Engine
function randomFloat(min, max, decimals = 1) {
    const val = Math.random() * (max - min) + min;
    return parseFloat(val.toFixed(decimals));
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function simulateZoneData(zone) {
    // Temperature fluctuation (-0.4 to +0.4)
    zone.temperature = parseFloat(Math.max(15, Math.min(38, zone.temperature + randomFloat(-0.4, 0.4))).toFixed(1));
    
    // Soil moisture reduction slowly unless pump is ON
    if (zone.actuators.pump) {
        zone.soil = Math.min(90, zone.soil + randomInt(2, 5));
        zone.waterLevel = Math.max(0, parseFloat((zone.waterLevel - 0.5).toFixed(1)));
    } else {
        zone.soil = Math.max(10, zone.soil - randomInt(0, 1));
    }

    // Light and CO2 subtle variations
    zone.light = Math.max(2000, Math.min(40000, zone.light + randomInt(-300, 300)));
    zone.co2 = Math.max(400, Math.min(1800, zone.co2 + randomInt(-20, 20)));

    // Push telemetry to historical window
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    zone.history.timestamps.push(timeStr);
    zone.history.temperature.push(zone.temperature);
    zone.history.soil.push(zone.soil);
    zone.history.light.push(zone.light);
    zone.history.co2.push(zone.co2);

    // Keep max 15 points
    if (zone.history.timestamps.length > 15) {
        zone.history.timestamps.shift();
        zone.history.temperature.shift();
        zone.history.soil.shift();
        zone.history.light.shift();
        zone.history.co2.shift();
    }
}
