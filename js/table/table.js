const get = (obj, ...selectors) =>
    [...selectors].map(s =>
        s
            .replace(/\[([^\[\]]*)\]/g, '.$1.')
            .split('.')
            .filter(t => t !== '')
            .reduce((prev, cur) => prev && prev[cur], obj)
    );



function removeItem(index) {
    //console.log(index);
    data.splice(index, 1);
    //data.pop();
    //vector.attr("d", path);
    zoomableMap.mapToSvg(data, glyphs);
    tabulate(data, tableInfo);
    updateHighlightedSubcharts();
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
    const table = d3.select('table');
    const thead = table.select('thead');
    const tbody = table.select('tbody');

    // Clear existing table headers and rows
    thead.selectAll('.firstTR').remove();
    thead.selectAll('.filter-row').remove();
    tbody.selectAll('tr').remove();

    // Append the header row with meaningful names
    const headerRow = thead.append('tr')
        .attr('class', 'firstTR')
        .selectAll('th')
        .data(columns)
        .enter()
        .append('th')
        .attr('data-column', column => column)
        .text(column => {
            switch (column) {
                case "properties.name": return "Type";
                case "properties.date": return "Date";
                case "geometry.coordinates[0]": return "Longitude";
                case "geometry.coordinates[1]": return "Latitude";
                default: return column;
            }
        })
        .on('click', function (event, column) {
            sortTableByColumn(column);
        });

    // Add empty sort icons initially
    headerRow.append('span')
        .attr('class', 'sort-icon')
        .text('');

    updateTableBody(data, columns);
}

let sortOrder = {}; // Track sort order for each column

function sortTableByColumn(column) {
    console.log(`Sorting by column: ${column}`);

    // Determine the current sort order for the column
    if (!sortOrder[column]) {
        sortOrder[column] = 'asc'; // Default to ascending if not sorted before
    } else {
        sortOrder[column] = sortOrder[column] === 'asc' ? 'desc' : 'asc';
    }

    //console.log(`Sort order for column "${column}": ${sortOrder[column]}`);

    // Remove previous highlights and icons
    d3.selectAll('th')
        .classed('sorted', false)
        .select('.sort-icon')
        .text('');

    // Highlight the active column and update the icon
    d3.select(`th[data-column="${column}"]`)
        .classed('sorted', true)
        .select('.sort-icon')
        .text(sortOrder[column] === 'asc' ? ' ▲' : ' ▼'); // Unicode for up/down arrows

    // Sort the data based on the selected column and order
    data.sort((a, b) => {
        const aValue = get(a, column);
        const bValue = get(b, column);

        let aComparable = aValue;
        let bComparable = bValue;

        // Check if the column is the "properties.date" column and parse the date
        if (column === "properties.date") {
            aComparable = new Date(aValue);
            bComparable = new Date(bValue);
        }

        //console.log(`Comparing values: a="${aComparable}", b="${bComparable}"`);

        if (aComparable < bComparable) {
            return sortOrder[column] === 'asc' ? -1 : 1;
        }
        if (aComparable > bComparable) {
            return sortOrder[column] === 'asc' ? 1 : -1;
        }
        return 0;
    });

    //console.log('Sorted data:', data);

    updateTableBody(data, tableInfo);
}






function toggleHighlightData(d) {
    //console.log("toggleHighlight");
    //console.log(d);

    d.properties.highlighted = !d.properties.highlighted;
    //d.properties.selected = d.properties.highlighted;
    lineChart.updateChartDataHighlight(dataHandler.getHighlightedEventCounts().eventCounts);
    for (var i = 0; i < lineChart.subLineCharts.length; i++) {
        lineChart.subLineCharts[i].updateChartDataHighlight(dataHandler.getHighlightedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
    }
    updateGlyphs();
}

function toggleHighlightRow(row) {
    console.log("toggleHighlightRow");
    // Check if the row has the 'highlighted' class
    if (d3.select(row).classed('highlighted')) {
        // If it does, remove the 'highlighted' class
        d3.select(row).classed('highlighted', false);
    } else {
        // If it doesn't, add the 'highlighted' class
        d3.select(row).classed('highlighted', true);
    }
}

function highlightTableRows() {
    console.log("highlightTableRows");
    const tbody = d3.select('table').select('tbody');
    data.forEach(d => {
        const rowId = d.properties.id;
        const isHighlighted = d.properties.highlighted;
        //select tr with id
        const row = tbody.select(`tr[id="${rowId}"]`);

        if (isHighlighted) {
            row.classed('highlighted', true);
        } else {
            row.classed('highlighted', false);
        }
    });
}



function updateHighlightedPoints() {
    // Implement the logic to update the map visualization
    // based on the highlighted property of data points
    // For example:
    zoomableMap.mapToSvg(data, glyphs);
}

function updateTableBody(data, columns) {
    console.log("Updating table body...");
    console.log("Data to render:", data);

    const tbody = d3.select('table').select('tbody');

    // Bind data to rows, using the unique 'properties.id' as the key
    const rows = tbody.selectAll('tr')
        .data(data, d => d && d.properties ? d.properties.id : null);

    // Remove any rows that no longer have matching data
    rows.exit().remove();

    // Append new rows for incoming data
    const addedRows = rows.enter().append('tr')
        .attr('id', d => d && d.properties ? d.properties.id : null)
        .on('click', function (event, d) {
            toggleHighlightData(d);
            toggleHighlightRow(this);
            updateHighlightedSubcharts();
        });

    // Merge new and existing rows and reorder them in the DOM
    const allRows = addedRows.merge(rows)
        .order() // Ensure rows are rendered in the order of the bound data
        .attr('id', d => d && d.properties ? d.properties.id : null);

    console.log("Rows after merge:", allRows);

    // Update the cells within each row
    const cells = allRows.selectAll('td')
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
        });

    // Remove any old cells
    cells.exit().remove();

    // Append new cells for incoming data
    cells.enter()
        .append('td')
        .merge(cells) // Merge with existing cells
        .text(d => d.value);

    // Apply the 'highlighted' class to rows based on the 'highlighted' property
    allRows.classed('highlighted', d => d && d.properties ? d.properties.highlighted : false);

    console.log("Table body updated.");
}


function updateTableWithFilteredData() {
    // Filter the data to only include items where properties.selected is true
    const filteredData = data.filter(d => d.properties.selected);

    // Now call updateTableBody with the filtered data
    updateTableBody(filteredData, tableInfo);
    //console.log("Updating");
    updateHighlightedSubcharts();
}


