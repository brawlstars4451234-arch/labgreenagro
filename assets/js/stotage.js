// Storage Utility Helper
const Storage = {
    getZones: function() {
        const data = localStorage.getItem("greenhouseZones");
        return data ? JSON.parse(data) : initialZones;
    },
    saveZones: function(zones) {
        localStorage.setItem("greenhouseZones", JSON.stringify(zones));
    },
    getSettings: function() {
        const data = localStorage.getItem("greenhouseSettings");
        return data ? JSON.parse(data) : defaultSettings;
    },
    saveSettings: function(settings) {
        localStorage.setItem("greenhouseSettings", JSON.stringify(settings));
    },
    getEvents: function() {
        const data = localStorage.getItem("greenhouseEvents");
        return data ? JSON.parse(data) : initialEvents;
    },
    addEvent: function(event) {
        const events = this.getEvents();
        events.unshift(event);
        if (events.length > 50) events.pop();
        localStorage.setItem("greenhouseEvents", JSON.stringify(events));
    },
    clearEvents: function() {
        localStorage.setItem("greenhouseEvents", JSON.stringify([]));
    },
    resetAll: function() {
        localStorage.clear();
        location.reload();
    }
};
