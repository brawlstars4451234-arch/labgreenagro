// Initial Mock Data and Model Definitions
const defaultSettings = {
    tempMin: 20,
    tempMax: 28,
    soilMin: 35,
    soilMax: 75,
    lightMin: 12000,
    waterCritical: 15
};

const initialZones = [
    {
        id: "ZONE-01",
        name: "Томаты (Sector A)",
        crop: "Томаты Черри",
        temperature: 24.8,
        humidity: 67,
        soil: 42,
        light: 18400,
        co2: 820,
        waterLevel: 72,
        mode: "auto",
        actuators: {
            pump: false,
            fan: false,
            growLight: false,
            humidifier: false,
            heater: false,
            vent: false
        },
        history: {
            timestamps: ["10:00", "10:05", "10:10", "10:15", "10:20"],
            temperature: [23.1, 23.8, 24.2, 24.8, 25.1],
            soil: [48, 46, 44, 42, 41],
            light: [15000, 16200, 17500, 18400, 18900],
            co2: [750, 780, 800, 820, 810]
        }
    },
    {
        id: "ZONE-02",
        name: "Огурцы (Sector B)",
        crop: "Огурцы Тепличные",
        temperature: 26.2,
        humidity: 74,
        soil: 32,
        light: 14200,
        co2: 910,
        waterLevel: 72,
        mode: "auto",
        actuators: {
            pump: false,
            fan: false,
            growLight: false,
            humidifier: false,
            heater: false,
            vent: false
        },
        history: {
            timestamps: ["10:00", "10:05", "10:10", "10:15", "10:20"],
            temperature: [25.0, 25.5, 25.8, 26.2, 26.5],
            soil: [38, 36, 35, 33, 32],
            light: [13000, 13500, 13900, 14200, 14500],
            co2: [850, 870, 890, 910, 905]
        }
    },
    {
        id: "ZONE-03",
        name: "Зелень & Салат (Sector C)",
        crop: "Салат Латук & Базилик",
        temperature: 19.5,
        humidity: 58,
        soil: 65,
        light: 9800,
        co2: 650,
        waterLevel: 72,
        mode: "manual",
        actuators: {
            pump: false,
            fan: false,
            growLight: true,
            humidifier: false,
            heater: false,
            vent: false
        },
        history: {
            timestamps: ["10:00", "10:05", "10:10", "10:15", "10:20"],
            temperature: [20.1, 19.8, 19.6, 19.5, 19.4],
            soil: [68, 67, 66, 65, 65],
            light: [8500, 8900, 9200, 9800, 10100],
            co2: [620, 630, 640, 650, 660]
        }
    }
];

const initialEvents = [
    {
        id: 101,
        zoneId: "ZONE-01",
        source: "system",
        action: "SYS_START",
        message: "Система Smart Greenhouse успешно запущенa",
        timestamp: "2026-10-22 10:00"
    }
];
