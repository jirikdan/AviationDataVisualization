
function updateChartWithNewData(selectedRegion) {
    // Function logic will be defined later
}

const url = (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

const eventNames = ["Trash", "Wildlife", "Vandalism", "Weather", "Damage", "Other", "Dirt", "Fuel"];
const eventDatesWithHours = ["2024-10-08T12:00:00Z", "2024-10-05T12:00:00Z", "2024-10-02T12:00:00Z","2024-10-07T12:00:00Z", "2024-10-01T12:00:00Z" ];
const tableInfo = ["properties.name", "properties.date", "geometry.coordinates[1]", "geometry.coordinates[0]"];
var dateSpan = [new Date("2024-10-01T12:00:00Z"), new Date("2024-10-12T12:00:00Z")];
//var startDate = dateSpan[0];
//var endDate = dateSpan[1];
//var globalStartDate = startDate;
//var globalEndDate = endDate;
// Define start and end colors
const startColor = "#ff0000"; // Red
const endColor = "#00ff00"; // Green
const lineChartWidth = 1630;
const lineChartNumberOfDashedLines = 4;
var gridLineDistanceGlobal = 0;


const deltas = [-3, -1, 0, 1];


var zoomableMap;

var pi = Math.PI,
    tau = 2 * pi;

const initX = -144144.5305263423;
const initY = 589275.2242183866;
const initScale = 3651353.7098351927;
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
var colorScale = d3.scaleSequential(d3.interpolateHcl(startColor, endColor))
    .domain(dateSpan);

/*var colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain(d3.extent(data, d => d.properties.date));*/
