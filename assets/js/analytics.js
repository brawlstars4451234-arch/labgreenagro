// Smart Analytics & Risk Calculation Engine
function calculateRiskScore(zone, settings) {
    let score = 0;

    if (zone.temperature > settings.tempMax) score += 25;
    if (zone.temperature < settings.tempMin) score += 20;

    if (zone.soil < settings.soilMin) score += 25;
    if (zone.waterLevel <= settings.waterCritical) score += 30;

    if (zone.co2 > 1500) score += 15;

    return Math.min(score, 100);
}

function detectAnomalies(zone) {
    const history = zone.history.temperature;
    if (history.length < 2) return false;

    const prev = history[history.length - 2];
    const curr = history[history.length - 1];
    
    if (prev === 0) return false;
    const change = Math.abs(((curr - prev) / prev) * 100);

    return change >= 15; // 15% sharp jump anomaly
}

function generateRecommendations(zone, settings) {
    const recs = [];

    if (zone.soil < settings.soilMin) {
        recs.push("🚨 Почва слишком сухая. Рекомендуется активировать полив.");
    }
    if (zone.waterLevel <= settings.waterCritical) {
        recs.push("⚠️ Запас воды в баке критический! Заполните резервуар.");
    }
    if (zone.temperature > settings.tempMax) {
        recs.push("🔥 Превышен температурный порог. Проверьте работу вентиляторов и форточки.");
    }
    if (zone.temperature < settings.tempMin) {
        recs.push("❄️ Температура ниже нормы. Требуется дополнительный обогрев.");
    }
    if (zone.light < settings.lightMin) {
        recs.push("💡 Недостаток освещённости. Рекомендуется включить досветку.");
    }

    if (recs.length === 0) {
        recs.push("✅ Климатические показатели зоны находятся в оптимальной норме.");
    }

    return recs;
}
