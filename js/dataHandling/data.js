class DataClass {
    constructor(N, nameArray, latRange, lonRange, nameWeights = null, latLonWeights = null, seed = null) {
        this.N = N;
        this.nameArray = nameArray;
        this.latRange = latRange;
        this.lonRange = lonRange;
        this.nameWeights = nameWeights || new Array(nameArray.length).fill(1); // Default equal weighting if none provided
        this.latLonWeights = latLonWeights || [1, 1]; // Default equal weight for lat/lon ranges
        this.seed = seed || Math.random().toString(); // Generate random seed if not provided
        this.dateSpan = dateSpan; // Add dateSpan as a class property
        this.rng = new Math.seedrandom(this.seed); // Create a seeded random number generator
        this.data = generatedData;
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


    generateDateRange() {
        const dates = [];
        let currentDate = new Date(this.dateSpan[0]);
        const endDate = new Date(this.dateSpan[1]);

        while (currentDate <= endDate) {
            dates.push(new Date(currentDate)); // Add a copy of the date
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    }

    fillMissingDates(eventCounts) {
        const dateRange = this.generateDateRange();
        console.log("Date range:", dateRange);
        dateRange.forEach(date => {
            const dateString = date.toISOString().split('T')[0];
            if (!eventCounts.some(count => count.date.toISOString().split('T')[0] === dateString)) {
                eventCounts.push({ date, value: 0 });
            }
        });

        eventCounts.sort((a, b) => a.date - b.date); // Ensure the array is sorted by date
        console.log("Filled missing dates:", eventCounts);
        return eventCounts;
    }



    getSelectedEventCounts() {
        const selectedEvents = this.data.filter(event => event.properties.selected);
        const eventCounts = {};

        selectedEvents.forEach(event => {
            const date = event.properties.date.toISOString().split('T')[0];
            eventCounts[date] = (eventCounts[date] || 0) + 1;
        });

        const eventCountsArray = Object.keys(eventCounts).map(date => ({
            date: new Date(date),
            value: eventCounts[date]
        }));

        return {
            eventCounts: this.fillMissingDates(eventCountsArray),
            activeEventTypes: Array.from(new Set(selectedEvents.map(event => event.properties.name)))
        };
    }

   

    getHighlightedEventCounts() {
        const highlightedEvents = this.data.filter(event => event.properties.highlighted);
        const eventCounts = {};

        highlightedEvents.forEach(event => {
            const date = event.properties.date.toISOString().split('T')[0];
            eventCounts[date] = (eventCounts[date] || 0) + 1;
        });

        const eventCountsArray = Object.keys(eventCounts).map(date => ({
            date: new Date(date),
            value: eventCounts[date]
        }));

        return {
            eventCounts: this.fillMissingDates(eventCountsArray),
            activeEventTypes: Array.from(new Set(highlightedEvents.map(event => event.properties.name)))
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


    loadJSONFromFile(filePath) {
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json(); // Parse the JSON from the response
            })
            .then(data => {
                // Assuming the loaded data is in the same format as generated by `generateRandomData()`
                console.log("Data loaded successfully:", data);
                this.data = data.map((event, index) => ({
                    type: "Feature",
                    properties: {
                        ...event.properties,
                        date: new Date(event.properties.date), // Convert the date string back to Date object
                        id: index // Regenerate IDs in case we want to maintain a sequence
                    },
                    geometry: {
                        ...event.geometry
                    }
                }));
            })
            .catch(error => {
                console.error("Error loading the JSON file:", error);
            });
    }
    

    //function to return if any data are highlighted at this moment
    isAnythingHighlighted() {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].properties.highlighted) {
                return true;
            }
        }
        return false;
    }

}
