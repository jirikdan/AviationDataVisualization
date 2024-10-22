// You need to include the seedrandom library for this to work
// Include this in your HTML or install it via npm
// <script src="https://cdnjs.cloudflare.com/ajax/libs/seedrandom/3.0.5/seedrandom.min.js"></script>
const dataArray = [
    {
        "type": "Feature",
        "properties": {
            "name": "Trash",
            "date": new Date("2024-10-08T12:00:00Z"),
            "highlighted": false,
            "selected": true,
            "id": 0
        },
        "geometry": {
            "type": "Point",
            "coordinates": [14.25, 50.09]
        }
    },
    {
        "type": "Feature",
        "properties": {
            "name": "Wildlife",
            "date": new Date("2024-10-05T12:00:00Z"),
            "highlighted": true,
            "selected": true,
            "id": 1
        },
        "geometry": {
            "type": "Point",
            "coordinates": [14.24, 50.11]
        }
    },
    {
        "type": "Feature",
        "properties": {
            "name": "Vandalism",
            "date": new Date("2024-10-02T12:00:00Z"),
            "highlighted": false,
            "selected": true,
            "id": 2
        },
        "geometry": {
            "type": "Point",
            "coordinates": [14.26, 50.10]
        }
    },
    {
        "type": "Feature",
        "properties": {
            "name": "Weather",
            "date": new Date("2024-10-07T12:00:00Z"),
            "highlighted": true,
            "selected": true,
            "id": 3
        },
        "geometry": {
            "type": "Point",
            "coordinates": [14.23, 50.08]
        }
    },
    {
        "type": "Feature",
        "properties": {
            "name": "Damage",
            "date": new Date("2024-10-01T12:00:00Z"),
            "highlighted": false,
            "selected": true,
            "id": 4
        },
        "geometry": {
            "type": "Point",
            "coordinates": [14.27, 50.12]
        }
    }
];



class DataClass {
    constructor(N, nameArray, latRange, lonRange, nameWeights = null, latLonWeights = null, seed = null) {
        this.N = N;
        this.nameArray = nameArray;
        this.latRange = latRange;
        this.lonRange = lonRange;
        this.nameWeights = nameWeights || new Array(nameArray.length).fill(1); // Default equal weighting if none provided
        this.latLonWeights = latLonWeights || [1, 1]; // Default equal weight for lat/lon ranges
        this.seed = seed || Math.random().toString(); // Generate random seed if not provided

        this.rng = new Math.seedrandom(this.seed); // Create a seeded random number generator
        //this.data = this.generateRandomData();
        this.data = generatedData;
    }

    // Helper function for weighted random selection
    weightedRandomChoice(array, weights) {
        const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
        const random = this.rng() * totalWeight;
        let cumulativeWeight = 0;
        for (let i = 0; i < array.length; i++) {
            cumulativeWeight += weights[i];
            if (random < cumulativeWeight) {
                return array[i];
            }
        }
    }

    generateRandomData() {
        var data = [];
    
        // Create weighted latitude/longitude selection
        const latZones = [
            { range: [this.latRange[0], (this.latRange[0] + this.latRange[1]) / 2], weight: this.latLonWeights[0] }, // More weight in the lower half
            { range: [(this.latRange[0] + this.latRange[1]) / 2, this.latRange[1]], weight: this.latLonWeights[1] }   // Less weight in the upper half
        ];
    
        const lonZones = [
            { range: [this.lonRange[0], (this.lonRange[0] + this.lonRange[1]) / 2], weight: this.latLonWeights[0] }, // More weight in the lower half
            { range: [(this.lonRange[0] + this.lonRange[1]) / 2, this.lonRange[1]], weight: this.latLonWeights[1] }  // Less weight in the upper half
        ];
    
        
        for (let i = 0; i < this.N; i++) {
            const name = this.weightedRandomChoice(this.nameArray, this.nameWeights);
    
            // Weighted random choice for latitude
            const selectedLatZone = this.weightedRandomChoice(latZones, latZones.map(zone => zone.weight));
            const lat = selectedLatZone.range[0] + this.rng() * (selectedLatZone.range[1] - selectedLatZone.range[0]);
    
            // Weighted random choice for longitude
            const selectedLonZone = this.weightedRandomChoice(lonZones, lonZones.map(zone => zone.weight));
            const lon = selectedLonZone.range[0] + this.rng() * (selectedLonZone.range[1] - selectedLonZone.range[0]);
    
            const point = {
                type: "Feature",
                properties: {
                    name: name,
                    date: new Date(eventDatesWithHours[Math.floor(this.rng() * eventDatesWithHours.length)]),
                    highlighted: false,
                    selected: this.rng() < 0.5, // Randomly mark some events as selected for example purposes
                    id: i
                },
                geometry: {
                    type: "Point",
                    coordinates: [lon, lat]
                }
            };
    
            data.push(point);
        }
        //print all damage data
        
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
