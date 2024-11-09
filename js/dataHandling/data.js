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
        console.log("generatedData: ", generatedData);
        //this.enrichData();
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

    enrichData() {
        this.data = this.fillMissingDates(this.data);
    }

    // Modified fillMissingDates to handle eventCounts directly
    fillMissingDates(eventCounts, eventType, eventTypeProportions = null) {
        const dateRange = this.generateDateRange();
        //console.log("eventCounts: ", eventCounts);
    
        const optimizedEventCounts = [];
        let previousValue = 0;
        let previousEventTypeProportions = {};
    
        dateRange.forEach(date => {
            const dateString = date.toISOString().split('T')[0];
            const event = eventCounts.find(count => count.date.toISOString().split('T')[0] === dateString);
    
            let currentTime = new Date(date);
            currentTime.setHours(0, 0, 0, 0); // Start at the beginning of the day
    
            const eventValue = event ? event.value : 0;
            const currentEventTypeProportions = eventTypeProportions ? eventTypeProportions.find(e => e.date.toISOString().split('T')[0] === dateString)?.types || {} : {};
    
            // Check for transitions in value or event type proportions
            if (eventValue !== previousValue || JSON.stringify(currentEventTypeProportions) !== JSON.stringify(previousEventTypeProportions)) {
                // Add a transition point right before the change for sharpness
                optimizedEventCounts.push({
                    date: new Date(currentTime.getTime() - 1),
                    value: previousValue,
                    eventType: eventType,
                    eventTypeProportions: previousEventTypeProportions
                });
    
                optimizedEventCounts.push({
                    date: new Date(currentTime),
                    value: eventValue,
                    eventType: eventType,
                    eventTypeProportions: currentEventTypeProportions
                });
            }
    
            // Keep value the same throughout the day with start and end points
            optimizedEventCounts.push({
                date: new Date(currentTime),
                value: eventValue,
                eventType: eventType,
                eventTypeProportions: currentEventTypeProportions
            });
    
            let endOfDay = new Date(currentTime);
            endOfDay.setHours(23, 59, 59, 999);
            optimizedEventCounts.push({
                date: endOfDay,
                value: eventValue,
                eventType: eventType,
                eventTypeProportions: currentEventTypeProportions
            });
    
            previousValue = eventValue;
            previousEventTypeProportions = currentEventTypeProportions;
        });
    
        // Remove leading and trailing zero-value data points for cleaner output
        let start = 0;
        while (start < optimizedEventCounts.length && optimizedEventCounts[start].value === 0) {
            start++;
        }
    
        let end = optimizedEventCounts.length - 1;
        while (end >= 0 && optimizedEventCounts[end].value === 0) {
            end--;
        }
    
        //console.log(`Optimized event counts for eventType "${eventType}":`, optimizedEventCounts);
        return optimizedEventCounts.slice(start, end + 1);
    }
    
    
    

    getSelectedEventCounts() {
        const selectedEvents = this.data.filter(event => event.properties.selected);
        const eventCounts = {};
        const eventTypeCounts = {}; // Object to store counts per event type
    
        selectedEvents.forEach(event => {
            const date = event.properties.date.toISOString().split('T')[0];
            const eventType = event.properties.name;
    
            // Initialize the count for the date if not already done
            if (!eventCounts[date]) {
                eventCounts[date] = 0;
                eventTypeCounts[date] = {};
            }
    
            // Increment the total count for the date
            eventCounts[date]++;
    
            // Increment the count for the specific event type
            eventTypeCounts[date][eventType] = (eventTypeCounts[date][eventType] || 0) + 1;
        });
    
        // Convert eventCounts and eventTypeCounts to arrays
        const eventCountsArray = Object.keys(eventCounts).map(date => ({
            date: new Date(date),
            value: eventCounts[date]
        }));
    
        const eventTypeProportions = Object.keys(eventTypeCounts).map(date => ({
            date: new Date(date),
            types: eventTypeCounts[date] // Contains counts for each event type
        }));
    
        return {
            eventCounts: this.fillMissingDates(eventCountsArray, "All events", eventTypeProportions),
            eventTypeProportions: eventTypeProportions,
            activeEventTypes: Array.from(new Set(selectedEvents.map(event => event.properties.name)))
        };
    }
    

   

    getHighlightedEventCounts() {
        updateGlyphs();
        const highlightedEvents = this.data.filter(event => event.properties.highlighted);
        const eventCounts = {};
        const eventTypeCounts = {}; // Object to store counts per event type
    
        highlightedEvents.forEach(event => {
            const date = event.properties.date.toISOString().split('T')[0];
            const eventType = event.properties.name;
    
            // Initialize the count for the date if not already done
            if (!eventCounts[date]) {
                eventCounts[date] = 0;
                eventTypeCounts[date] = {};
            }
    
            // Increment the total count for the date
            eventCounts[date]++;
    
            // Increment the count for the specific event type
            eventTypeCounts[date][eventType] = (eventTypeCounts[date][eventType] || 0) + 1;
        });
    
        // Convert eventCounts and eventTypeCounts to arrays
        const eventCountsArray = Object.keys(eventCounts).map(date => ({
            date: new Date(date),
            value: eventCounts[date]
        }));
    
        const eventTypeProportions = Object.keys(eventTypeCounts).map(date => ({
            date: new Date(date),
            types: eventTypeCounts[date] // Contains counts for each event type
        }));
    
        return {
            eventCounts: this.fillMissingDates(eventCountsArray, "All events", eventTypeProportions),
            eventTypeProportions: eventTypeProportions,
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

        return this.fillMissingDates(eventCountsArray, eventType);
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
            eventCounts: this.fillMissingDates(eventCountsArray, eventType),
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
            eventCounts: this.fillMissingDates(eventCountsArray, eventType),
            activeEventTypes: Array.from(activeEventTypes)
        };
    }


    getAvailableEventTypes() {
        // Return a unique list of event types from nameArray
        return [...new Set(this.nameArray)];
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
