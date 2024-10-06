class DataClass {
    constructor(N, nameArray, latRange, lonRange) {
        this.N = N;
        this.nameArray = nameArray;
        this.latRange = latRange;
        this.lonRange = lonRange;
        this.data = this.generateRandomData();
    }

    generateRandomData() {
        var data = [];

        for (let i = 0; i < this.N; i++) {
            const name = this.nameArray[Math.floor(Math.random() * this.nameArray.length)];
            const lat = this.latRange[0] + Math.random() * (this.latRange[1] - this.latRange[0]);
            const lon = this.lonRange[0] + Math.random() * (this.lonRange[1] - this.lonRange[0]);

            const point = {
                type: "Feature",
                properties: {
                    name: name,
                    date: new Date(eventDatesWithHours[Math.floor(Math.random() * eventDatesWithHours.length)]),
                    highlighted: false,
                    selected: Math.random() < 0.5, // Randomly mark some events as selected for example purposes
                    id: i
                },
                geometry: {
                    type: "Point",
                    coordinates: [lon, lat]
                }
            };

            data.push(point);
        }

        return data;
    }



    getData() {
        return this.data;
    }

    getNames() {
        return this.nameArray;
    }

    getLatitudeRange() {
        return this.latRange;
    }

    getLongitudeRange() {
        return this.lonRange;
    }

    getSelectedEventCounts() {
        const selectedEvents = this.data.filter(event => event.properties.selected);
        const eventCounts = {};
        const activeEventTypes = new Set();

        selectedEvents.forEach(event => {
            const date = event.properties.date.toISOString().split('T')[0]; // Extract the date part
            if (eventCounts[date]) {
                eventCounts[date]++;
            } else {
                eventCounts[date] = 1;
            }
            activeEventTypes.add(event.properties.name);
        });

        const eventCountsArray = Object.keys(eventCounts).map(date => ({
            date: new Date(date),
            value: eventCounts[date]
        }));

        eventCountsArray.sort((a, b) => a.date - b.date);

        return {
            eventCounts: eventCountsArray,
            activeEventTypes: Array.from(activeEventTypes)
        };
    }

    getHighlightedEventCounts() {
        const highlightedEvents = this.data.filter(event => event.properties.highlighted);
        const eventCounts = {};
        const activeEventTypes = new Set();

        highlightedEvents.forEach(event => {
            const date = event.properties.date.toISOString().split('T')[0]; // Extract the date part
            if (eventCounts[date]) {
                eventCounts[date]++;
            } else {
                eventCounts[date] = 1;
            }
            activeEventTypes.add(event.properties.name);
        });

        const eventCountsArray = Object.keys(eventCounts).map(date => ({
            date: new Date(date),
            value: eventCounts[date]
        }));

        eventCountsArray.sort((a, b) => a.date - b.date);

        return {
            eventCounts: eventCountsArray,
            activeEventTypes: Array.from(activeEventTypes)
        };
    }

    getEventTypeData(eventType) {
        const filteredEvents = this.data.filter(event => event.properties.name === eventType);
        const eventCounts = {};

        filteredEvents.forEach(event => {
            const date = event.properties.date.toISOString().split('T')[0]; // Extract the date part
            if (eventCounts[date]) {
                eventCounts[date]++;
            } else {
                eventCounts[date] = 1;
            }
        });

        const eventCountsArray = Object.keys(eventCounts).map(date => ({
            date: new Date(date),
            value: eventCounts[date]
        }));

        eventCountsArray.sort((a, b) => a.date - b.date);

        return eventCountsArray;
    }


    getHighlightedEventCountsByType(eventType) {
        const highlightedEvents = this.data.filter(event => event.properties.highlighted && event.properties.name === eventType);
        const eventCounts = {};
        const activeEventTypes = new Set();

        highlightedEvents.forEach(event => {
            const date = event.properties.date.toISOString().split('T')[0]; // Extract the date part
            if (eventCounts[date]) {
                eventCounts[date]++;
            } else {
                eventCounts[date] = 1;
            }
            activeEventTypes.add(event.properties.name);
        });

        const eventCountsArray = Object.keys(eventCounts).map(date => ({
            date: new Date(date),
            value: eventCounts[date]
        }));

        eventCountsArray.sort((a, b) => a.date - b.date);

        return {
            eventCounts: eventCountsArray,
            activeEventTypes: Array.from(activeEventTypes)
        };
    }

    getSelectedEventCountsByType(eventType) {
        const selectedEvents = this.data.filter(event => event.properties.selected && event.properties.name === eventType);
        const eventCounts = {};
        const activeEventTypes = new Set();

        selectedEvents.forEach(event => {
            const date = event.properties.date.toISOString().split('T')[0]; // Extract the date part
            if (eventCounts[date]) {
                eventCounts[date]++;
            } else {
                eventCounts[date] = 1;
            }
            activeEventTypes.add(event.properties.name);
        });

        const eventCountsArray = Object.keys(eventCounts).map(date => ({
            date: new Date(date),
            value: eventCounts[date]
        }));

        eventCountsArray.sort((a, b) => a.date - b.date);

        return {
            eventCounts: eventCountsArray,
            activeEventTypes: Array.from(activeEventTypes)
        };
    }


    getAvailableEventTypes() {
        // Return a unique list of event types from nameArray
        return [...new Set(this.nameArray)];
    }
}
