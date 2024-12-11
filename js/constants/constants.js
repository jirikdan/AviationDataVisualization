
const url = (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

const numberOfDataPoints = 10;
// Define a hash map to store loaded tiles globally or within the class
var loadedTileData = {};

//All possible event names
const eventNames = ["Trash", "Wildlife", "Vandalism", "Weather", "Damage", "Other", "Dirt", "Fuel"];
//Table columns data
const tableInfo = ["properties.name", "properties.date", "geometry.coordinates[1]", "geometry.coordinates[0]"];
//Initial date spam
var dateSpan = [new Date("2023-10-11T12:00:00Z"), new Date("2025-11-28T22:00:00Z")];

//Generate data
var dataHandler = new DataClass();
var data = dataHandler.getData();

//Colors mapped to event types
const predefinedColors = d3.schemeCategory10;
const colorMapping = {};

const uniqueNames = [...new Set(data.map(d => d.properties.name))];
uniqueNames.forEach((name, index) => {
    colorMapping[name] = predefinedColors[index % predefinedColors.length];
});


//Setting linechart width for different resolutions
var lineChartWidth = 0;
if (window.innerWidth == 1920) {
    //console.log("Setting line chart width to 1150");
    lineChartWidth = 1200;
}
else if (window.innerWidth > 1920) {
    //console.log("Setting line chart width to 1010");
    lineChartWidth = 1500;
}
else if (window.innerWidth < 1750) {
    //console.log("Setting line chart width to 850");
    lineChartWidth = 980;
}
else {
    lineChartWidth = 1000;
}


//grid lines set up
const lineChartNumberOfDashedLines = 5;
var gridLineDistanceGlobal = 0;

//deltas for loading map tiles in different quality to fix white tile glitching
const deltas = [-3, -1, 0, 1];


//MAP Variables/Constants
var zoomableMap;

var pi = Math.PI,
    tau = 2 * pi;

const initX = -218505.76580430535;
const initY = 893059.666352264;
const initScale = 5534417.308186406;
var glyphs;
var data;
var svg;
var regions;
var rects;
var path = d3.geoPath().projection(projection);
var projection = d3.geoMercator()
    .scale(1 / tau)
    .translate([0, 0]);


//Constants for time color scale
const startColor = "#ff0000";
const endColor = "#00ff00";
var colorScale = d3.scaleSequential(d3.interpolateHcl(startColor, endColor))
    .domain(dateSpan);
