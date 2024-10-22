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
    hotspotProbability = 0.4
}) {
    // Latitude and longitude boundaries for the general area
    const minLat = 50.08615648561272;
    const maxLat = 50.11815590532789;
    const minLng = 14.225240518215271;
    const maxLng = 14.288241809867836;

    // Helper function to get a random integer between min and max (inclusive)
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Helper function to get a random boolean value
    const getRandomBool = () => Math.random() < 0.5;

    // Calculate weights for event occurrence distribution
    const eventWeights = Object.entries(eventOccurrenceConfig).map(([key, weight]) => ({ name: key, weight }));
    const totalWeight = eventWeights.reduce((acc, item) => acc + item.weight, 0);

    // Calculate weights for event occurrence distribution inside hotspots
    const hotspotWeights = Object.entries(hotspotEventWeights).map(([key, weight]) => ({ name: key, weight }));
    const totalHotspotWeight = hotspotWeights.reduce((acc, item) => acc + item.weight, 0);

    // Calculate weights for time distribution in hotspots
    const hotspotTimes = Object.entries(hotspotTimeWeights).map(([time, weight]) => ({ time, weight }));
    const totalHotspotTimeWeight = hotspotTimes.reduce((acc, item) => acc + item.weight, 0);

    // Calculate weights for time distribution outside hotspots
    const normalTimes = Object.entries(normalTimeWeights).map(([time, weight]) => ({ time, weight }));
    const totalNormalTimeWeight = normalTimes.reduce((acc, item) => acc + item.weight, 0);

    // Function to get a random event name based on configured weights
    const getRandomEventName = (weights, totalWeight) => {
        const randomValue = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        for (const { name, weight } of weights) {
            cumulativeWeight += weight;
            if (randomValue <= cumulativeWeight) {
                return name;
            }
        }
        return eventNames[0]; // Fallback in case something goes wrong
    };

    // Function to get a random time based on configured weights
    const getRandomTime = (weights, totalWeight) => {
        const randomValue = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        for (const { time, weight } of weights) {
            cumulativeWeight += weight;
            if (randomValue <= cumulativeWeight) {
                return time;
            }
        }
        return eventDatesWithHours[0]; // Fallback in case something goes wrong
    };

    // Function to get random coordinates within defined bounds
    const getRandomCoordsWithinBounds = () => {
        const randomLat = minLat + Math.random() * (maxLat - minLat);
        const randomLng = minLng + Math.random() * (maxLng - minLng);
        return [parseFloat(randomLng.toFixed(5)), parseFloat(randomLat.toFixed(5))];
    };

    // Function to get random coordinates near a specified lat/lng within a radius
    const getRandomCoordsNear = (lat, lng, radius) => {
        const randomLat = lat + (Math.random() - 0.5) * radius * 2;
        const randomLng = lng + (Math.random() - 0.5) * radius * 2;
        return [parseFloat(randomLng.toFixed(5)), parseFloat(randomLat.toFixed(5))];
    };

    // Generate the data points
    const data = [];
    for (let i = 0; i < totalPoints; i++) {
        // Determine if the point should be placed in a hotspot based on probability
        const shouldBeInHotspot = Math.random() < hotspotProbability && proximityConfig.hotspots && proximityConfig.hotspots.length > 0;

        // Choose a random event name, with different weights if in a hotspot
        const eventName = shouldBeInHotspot
            ? getRandomEventName(hotspotWeights, totalHotspotWeight)
            : getRandomEventName(eventWeights, totalWeight);

        // Choose a random time, with different weights if in a hotspot
        const eventTime = shouldBeInHotspot
            ? getRandomTime(hotspotTimes, totalHotspotTimeWeight)
            : getRandomTime(normalTimes, totalNormalTimeWeight);
        
        const eventDate = new Date(eventTime);

        // Determine if the point is selected and highlighted
        const selected = allSelected || getRandomBool();
        const highlighted = allHighlighted || getRandomBool();

        // Determine coordinates, possibly in a dense area or within defined bounds
        let coordinates = [];
        if (shouldBeInHotspot) {
            const hotspot = proximityConfig.hotspots[getRandomInt(0, proximityConfig.hotspots.length - 1)];
            coordinates = getRandomCoordsNear(hotspot.lat, hotspot.lng, hotspot.radius);
        } else {
            coordinates = getRandomCoordsWithinBounds();
        }

        // Construct the geoJSON-like object
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

// Example usage
const generatedData = generateGeoJsonData({
    eventNames: ["Trash", "Wildlife", "Vandalism", "Weather", "Damage", "Other", "Dirt", "Fuel"],
    eventDatesWithHours: [
        "2024-10-08T12:00:00Z",
        "2024-10-05T12:00:00Z",
        "2024-10-02T12:00:00Z",
        "2024-10-07T12:00:00Z",
        "2024-10-01T12:00:00Z"
    ],
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
    hotspotTimeWeights: {
        "2024-10-01T12:00:00Z": 1,
        "2024-10-02T12:00:00Z": 1,
        "2024-10-05T12:00:00Z": 5,
        "2024-10-07T12:00:00Z": 1,
        "2024-10-08T12:00:00Z": 1
    },
    normalTimeWeights: {
        "2024-10-01T12:00:00Z": 1,
        "2024-10-02T12:00:00Z": 1,
        "2024-10-05T12:00:00Z": 1,
        "2024-10-07T12:00:00Z": 1,
        "2024-10-08T12:00:00Z": 1
    },
    totalPoints: 250,
    hotspotProbability: 0.2 // 40% of points will be in hotspots, 60% spread within the specified area
});

console.log(generatedData);
