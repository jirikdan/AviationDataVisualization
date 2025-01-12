/**
 * Generates an array of geoJSON-like data points with complex customization.
 * @param {Array} eventNames - List of event names to be used for events.
 * @param {Array} eventDatesWithHours - List of dates with hours as ISO strings.
 * @param {boolean} allSelected - If true, all points will be selected; if false, it will be random.
 * @param {boolean} allHighlighted - If true, all points will be highlighted; if false, it will be random.
 * @param {Object} proximityConfig - An object specifying areas with dense points.
 * @param {Object} eventOccurrenceConfig - An object specifying event names and their relative frequencies.
 * @param {Object} hotspotEventWeights - An object specifying event names and their relative frequencies within hotspots.
 * @param {Object} hotspotTimeWeights - An object specifying time weights for points in hotspots.
 * @param {Object} normalTimeWeights - An object specifying time weights for points outside of hotspots.
 * @param {number} totalPoints - Total number of points to generate.
 * @param {number} hotspotProbability - Probability that a point is generated in a hotspot.
 * @returns {Array} - Array of geoJSON-like objects.
 */
// Updated generateGeoJsonData to apply fillMissingDates only once during data generation
function generateGeoJsonData({
    eventNames,
    eventDatesWithHours,
    allSelected = true,
    allHighlighted = false,
    proximityConfig = { hotspots: [{ lat: 50.09, lng: 14.25, radius: 0.01, density: 10 }] },
    eventOccurrenceConfig = { Trash: 1, Wildlife: 1, Vandalism: 1, Weather: 1, Damage: 1, Other: 1 },
    hotspotEventWeights = { Trash: 2, Wildlife: 3, Vandalism: 1 },
    hotspotTimeWeights = { "2024-10-08T12:00:00Z": 2, "2024-10-05T12:00:00Z": 1 },
    normalTimeWeights = { "2024-10-02T12:00:00Z": 2, "2024-10-07T12:00:00Z": 1 },
    totalPoints = 50,
    hotspotProbability = 0.4,
    seed = 123456
}) {
    // Seeded random number generator
    let currentSeed = seed;
    const rng = () => {
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;
        currentSeed = (a * currentSeed + c) % m;
        return currentSeed / m;
    };

    const minLat = 50.08615648561272;
    const maxLat = 50.11815590532789;
    const minLng = 14.225240518215271;
    const maxLng = 14.288241809867836;

    const getRandomInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

    const eventWeights = Object.entries(eventOccurrenceConfig).map(([key, weight]) => ({ name: key, weight }));
    const totalWeight = eventWeights.reduce((acc, item) => acc + item.weight, 0);

    const hotspotWeights = Object.entries(hotspotEventWeights).map(([key, weight]) => ({ name: key, weight }));
    const totalHotspotWeight = hotspotWeights.reduce((acc, item) => acc + item.weight, 0);

    const hotspotTimes = Object.entries(hotspotTimeWeights).map(([time, weight]) => ({ time, weight }));
    const totalHotspotTimeWeight = hotspotTimes.reduce((acc, item) => acc + item.weight, 0);

    const normalTimes = Object.entries(normalTimeWeights).map(([time, weight]) => ({ time, weight }));
    const totalNormalTimeWeight = normalTimes.reduce((acc, item) => acc + item.weight, 0);

    const getRandomEventName = (weights, totalWeight) => {
        const randomValue = rng() * totalWeight;
        let cumulativeWeight = 0;
        for (const { name, weight } of weights) {
            cumulativeWeight += weight;
            if (randomValue <= cumulativeWeight) {
                return name;
            }
        }
        return eventNames[0];
    };

    const getRandomTime = (weights, totalWeight) => {
        const randomValue = rng() * totalWeight;
        let cumulativeWeight = 0;
        for (const { time, weight } of weights) {
            cumulativeWeight += weight;
            if (randomValue <= cumulativeWeight) {
                return time;
            }
        }
        return eventDatesWithHours[0];
    };

    const getRandomCoordsWithinBounds = () => {
        const randomLat = minLat + rng() * (maxLat - minLat);
        const randomLng = minLng + rng() * (maxLng - minLng);
        return [parseFloat(randomLng.toFixed(5)), parseFloat(randomLat.toFixed(5))];
    };

    const getRandomCoordsNear = (lat, lng, radius) => {
        const randomLat = lat + (rng() - 0.5) * radius * 2;
        const randomLng = lng + (rng() - 0.5) * radius * 2;
        return [parseFloat(randomLng.toFixed(5)), parseFloat(randomLat.toFixed(5))];
    };

    const data = [];
    for (let i = 0; i < totalPoints; i++) {
        const shouldBeInHotspot = rng() < hotspotProbability && proximityConfig.hotspots && proximityConfig.hotspots.length > 0;

        const eventName = shouldBeInHotspot
            ? getRandomEventName(hotspotWeights, totalHotspotWeight)
            : getRandomEventName(eventWeights, totalWeight);

        const eventTime = shouldBeInHotspot
            ? getRandomTime(hotspotTimes, totalHotspotTimeWeight)
            : getRandomTime(normalTimes, totalNormalTimeWeight);

        const eventDate = new Date(eventTime);
        const selected = true;
        const highlighted = allHighlighted;

        let coordinates = [];
        if (shouldBeInHotspot) {
            const hotspot = proximityConfig.hotspots[getRandomInt(0, proximityConfig.hotspots.length - 1)];
            coordinates = getRandomCoordsNear(hotspot.lat, hotspot.lng, hotspot.radius);
        } else {
            coordinates = getRandomCoordsWithinBounds();
        }

        const feature = {
            type: "Feature",
            properties: {
                name: eventName,
                date: eventDate,
                highlighted,
                selected,
                id: i
            },
            geometry: {
                type: "Point",
                coordinates
            }
        };
        data.push(feature);
    }

    return data;
}


// Random number generator with seed
let currentSeed = 12345;  // Use your desired seed value
const rng = () => {
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;
    currentSeed = (a * currentSeed + c) % m;
    return currentSeed / m;
};

// Helper function to generate random dates within the last 30 days using rng
// Ensure dates are at full hours (minute, second, and millisecond set to 0)
function generateRandomDates(count) {
    const currentDate = new Date();
    const last30DaysTimestamp = currentDate.getTime() - (30 * 24 * 60 * 60 * 1000);  // Timestamp for 30 days ago
    
    const randomDates = [];
    
    // Generate 'count' number of random dates
    for (let i = 0; i < count; i++) {
        const randomTime = last30DaysTimestamp + rng() * (currentDate.getTime() - last30DaysTimestamp);  // Random time within the last 30 days
        const randomDate = new Date(randomTime);
        
        // Adjust the date to the top of the hour (set minutes, seconds, and milliseconds to 0)
        randomDate.setMinutes(0);
        randomDate.setSeconds(0);
        randomDate.setMilliseconds(0);
        
        randomDates.push(randomDate.toISOString());  // Convert to ISO string format
    }
    
    return randomDates;
}

// Helper function to generate random weights using rng
function generateRandomWeights(count, min = 1, max = 5) {
    const weights = [];
    for (let i = 0; i < count; i++) {
        const randomWeight = Math.floor(rng() * (max - min + 1)) + min;
        weights.push(randomWeight);
    }
    return weights;
}

// Example usage
const generatedData = generateGeoJsonData({
    eventNames: ["Trash", "Wildlife", "Vandalism", "Weather", "Damage", "Other", "Dirt", "Fuel"],
    
    // Generate dates in the last 30 days using rng and ensure full hours
    eventDatesWithHours: generateRandomDates(50),

    allSelected: false,
    allHighlighted: false,
    
    proximityConfig: {
        hotspots: [
            { lat: 50.108958845453124, lng: 14.265167657637676, radius: 0.001, density: 15 },
            { lat: 50.1, lng: 14.26, radius: 0.001, density: 10 },
            { lat: 50.11, lng: 14.24, radius: 0.001, density: 10 }
        ]
    },
    
    eventOccurrenceConfig: {
        Trash: 0.5,
        Wildlife: 1,
        Vandalism: 1,
        Weather: 1,
        Damage: 1,
        Other: 0.5,
        Dirt: 1,
        Fuel: 1
    },
    
    hotspotEventWeights: {
        Trash: 0.5,
        Wildlife: 1,
        Vandalism: 50,
        Weather: 1,
        Damage: 1,
        Other: 0.5,
        Dirt: 1,
        Fuel: 1
    },
    
    // Generate random dates for hotspot time weights using rng (same as event dates)
    hotspotTimeWeights: generateRandomDates(3).reduce((acc, date, index) => {
        const weight = Math.floor(rng() * 5) + 1;
        acc[date] = weight;
        return acc;
    }, {}),
    
    // Generate random dates for normal time weights (same as hotspotTimeWeights logic)
    normalTimeWeights: generateRandomDates(10).reduce((acc, date, index) => {
        const weight = Math.floor(rng() * 2) + 1;
        acc[date] = weight;
        return acc;
    }, {}),
    
    totalPoints: 150,
    hotspotProbability: 0.25
});

