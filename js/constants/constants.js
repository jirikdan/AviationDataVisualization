
const url = (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

const eventNames = ["Trash", "Wildlife", "Vandalism", "Weather", "Damage", "Other", "Dirt", "Fuel"];
const eventDatesWithHours = ["2024-10-18T12:00:00Z", "2024-10-15T12:00:00Z", "2024-10-12T12:00:00Z", "2024-10-17T12:00:00Z", "2024-10-11T12:00:00Z"];
const tableInfo = ["properties.name", "properties.date", "geometry.coordinates[1]", "geometry.coordinates[0]"];
var dateSpan = [new Date("2023-10-11T12:00:00Z"), new Date("2024-11-18T22:00:00Z")];
const latitudeRange = [50.08, 50.12];
const longitudeRange = [14.23, 14.28];
const nameWeights = [0.1, 0.1, 0.5, 0.1, 0.05, 0.35, 0.05, 0.05];
const latLonWeights = [1, 0.3];
const seed = '12345';
var dataHandler = new DataClass(300, eventNames, latitudeRange, longitudeRange, nameWeights, latLonWeights, seed);
var data = dataHandler.getData();
var chartData = [];
var linechart;
var chartName = dataHandler.getSelectedEventCounts().activeEventTypes;

//these colors get overriden by the colors in the css
const dataHighlightBackground = "rgb(236, 96, 96)";
const dataHighlightBrushBackground = "rgb(84, 124, 255, 0.5)";
const dataBrushEdges = "rgb(84, 124, 255, 0.1)";

const predefinedColors = d3.schemeCategory10;
const colorMapping = {};

const uniqueNames = [...new Set(data.map(d => d.properties.name))];
uniqueNames.forEach((name, index) => {
    colorMapping[name] = predefinedColors[index % predefinedColors.length];
});



var lineChartWidth = 0;
if (window.innerWidth == 1920) {
    //console.log("Setting line chart width to 1150");
    lineChartWidth = 1150;
}
else if (window.innerWidth > 1920) {
    //console.log("Setting line chart width to 1010");
    lineChartWidth = 1250;
}
else if (window.innerWidth < 1750) {
    //console.log("Setting line chart width to 850");
    lineChartWidth = 930;
}
else {
    lineChartWidth = 950;
}



const lineChartNumberOfDashedLines = 5;
var gridLineDistanceGlobal = 0;


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
var featureId = 6;

const startColor = "#ff0000";
const endColor = "#00ff00";

var colorScale = d3.scaleSequential(d3.interpolateHcl(startColor, endColor))
    .domain(dateSpan);
