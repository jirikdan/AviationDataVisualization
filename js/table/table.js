const get = (obj, ...selectors) =>
    [...selectors].map(s =>
        s
            .replace(/\[([^\[\]]*)\]/g, '.$1.')
            .split('.')
            .filter(t => t !== '')
            .reduce((prev, cur) => prev && prev[cur], obj)
    );


function removeItem(index) {
    console.log(index);
    data.splice(index, 1);
    //data.pop();
    //vector.attr("d", path);
    zoomableMap.mapToSvg(data, glyphs);
    tabulate(data, tableInfo);
}

function formatDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(date).toLocaleDateString('en-US', options);
}

function formatCoordinates(coord) {
    const num = parseFloat(coord);
    return isNaN(num) ? coord : num.toFixed(5);  // Limit to 5 decimal places
}



function tabulate(data, columns) {
    //console.log("tabulate");
    var table = d3.select('table');
    var thead = table.select('thead');
    var tbody = table.select('tbody');

    // clear existing table headers and rows
    thead.selectAll('.firstTR').remove();
    thead.selectAll('.filter-row').remove();
    tbody.selectAll('tr').remove();

    // add "Remove" column to columns array
    var extendedColumns = columns.concat(["Remove"]);

    // append the header row with meaningful names
    thead.append('tr')
        .attr('class', 'firstTR')  // Add this line to assign the class
        .selectAll('th')
        .data(extendedColumns).enter()
        .append('th')
        .text(function (column) {
            switch (column) {
                case "properties.name": return "Name";
                case "properties.date": return "Date";
                case "geometry.coordinates[0]": return "Longitude";
                case "geometry.coordinates[1]": return "Latitude";
                default: return column;
            }
        });

    // append filter input row


    updateTableBody(data, columns);
}


function toggleHighlightData(d) {
    console.log("toggleHighlight");
    console.log(d);

    d.properties.highlighted = !d.properties.highlighted;
    d.properties.selected = d.properties.highlighted;
    lineChart.updateChartData(dataHandler.getHighlightedEventCounts().eventCounts);
    for (var i = 0; i < lineChart.subLineCharts.length; i++) {
        lineChart.subLineCharts[i].updateChartData(dataHandler.getHighlightedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
    }
    updateGlyphs();

}

function toggleHighlightRow(row) {
    // Check if the row has the 'highlighted' class
    if (d3.select(row).classed('highlighted')) {
        // If it does, remove the 'highlighted' class
        d3.select(row).classed('highlighted', false);
    } else {
        // If it doesn't, add the 'highlighted' class
        d3.select(row).classed('highlighted', true);
    }
}

function updateHighlightedPoints() {
    // Implement the logic to update the map visualization
    // based on the highlighted property of data points
    // For example:
    zoomableMap.mapToSvg(data, glyphs);
}

function updateTableBody(data, columns) {
    //console.log("Update table");
    var tbody = d3.select('table').select('tbody');

    var rows = tbody.selectAll('tr')
        .data(data, d => d && d.properties ? d.properties.name : null);

    rows.exit().remove();

    var addedRows = rows.enter().append('tr')
        .attr('id', function (d) { return d.properties.id; })
        .on('click', function (d, i) {
            console.log("click");
            console.log(i);
            toggleHighlightData(i);
            toggleHighlightRow(this);
        });

    // create a cell in each row for each column
    var cells = addedRows.selectAll('td')
        .data(function (row) {
            return columns.map(function (column) {
                let value = get(row, column);
                if (column === "properties.date") {
                    value = formatDate(value);
                } else if (column === "geometry.coordinates[0]" || column === "geometry.coordinates[1]") {
                    value = formatCoordinates(value);
                }
                return { column: column, value: value };
            });
        })
        .enter();

    cells.append('td')
        .text(function (d) { return d.value; });

    addedRows.append('td').append("button").attr("onclick", function (d, i) { return "removeItem(" + i + ");" }).text("Remove");

    // Reassign the event handlers for the rows and set the id attribute for the existing rows
    rows.attr('id', d => d.id)
        .select("button").attr("onclick", function (d, i) { return "removeItem(" + i + ");" }).text("Remove");

    // Apply the highlighted class to rows based on the highlighted property
    tbody.selectAll('tr').classed('highlighted', d => d && d.properties ? d.properties.highlighted : false);
}


