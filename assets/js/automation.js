// Automatic Controller Logic & Safety Mechanisms
function runAutomationRules(zone, settings) {
    if (zone.mode !== "auto") return [];

    const actions = [];
    const timestamp = new Date().toLocaleTimeString();

    // 1. Irrigation Safety & Control
    if (zone.soil < settings.soilMin) {
        if (zone.waterLevel > settings.waterCritical) {
            if (!zone.actuators.pump) {
                zone.actuators.pump = true;
                actions.push(`[${zone.id}] Включен насос (Влажность почвы ${zone.soil}% < ${settings.soilMin}%)`);
            }
        } else {
            if (zone.actuators.pump) {
                zone.actuators.pump = false;
                actions.push(`[${zone.id}] БЛОКИРОВКА НАСОСА: Низкий уровень воды (${zone.waterLevel}%)!`);
            }
        }
    } else if (zone.soil >= settings.soilMax) {
        if (zone.actuators.pump) {
            zone.actuators.pump = false;
            actions.push(`[${zone.id}] Выключен насос (Почва достаточно увлажнена: ${zone.soil}%)`);
        }
    }

    // 2. Ventilation Control (Fan)
    if (zone.temperature > settings.tempMax) {
        if (!zone.actuators.fan) {
            zone.actuators.fan = true;
            actions.push(`[${zone.id}] Включена вентиляция (Перегрев: ${zone.temperature}°C)`);
        }
    } else if (zone.temperature <= settings.tempMax - 2) { // Hysteresis 2 degrees
        if (zone.actuators.fan) {
            zone.actuators.fan = false;
            actions.push(`[${zone.id}] Выключена вентиляция (Температура нормализована: ${zone.temperature}°C)`);
        }
    }

    // 3. Heating Control
    if (zone.temperature < settings.tempMin) {
        if (!zone.actuators.heater) {
            zone.actuators.heater = true;
            actions.push(`[${zone.id}] Включен обогреватель (Охлаждение: ${zone.temperature}°C)`);
        }
    } else if (zone.temperature >= settings.tempMin + 2) {
        if (zone.actuators.heater) {
            zone.actuators.heater = false;
            actions.push(`[${zone.id}] Выключен обогреватель (${zone.temperature}°C)`);
        }
    }

    // 4. Grow Light Control
    if (zone.light < settings.lightMin) {
        if (!zone.actuators.growLight) {
            zone.actuators.growLight = true;
            actions.push(`[${zone.id}] Включена фитолампа (Низкий свет: ${zone.light} Lux)`);
        }
    } else {
        if (zone.actuators.growLight) {
            zone.actuators.growLight = false;
            actions.push(`[${zone.id}] Выключена фитолампа (Свет в норме)`);
        }
    }

    return actions;
}
