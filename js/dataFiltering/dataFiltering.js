document.addEventListener('DOMContentLoaded', (event) => {
    // Initial setup
    document.getElementById('time-filter').addEventListener('change', handleTimeFilterChange);
    document.getElementById('start-date').addEventListener('change', handleDateChange);
    document.getElementById('end-date').addEventListener('change', handleDateChange);
    document.getElementById('search-event-types').addEventListener('focus', showHideGroup);
    document.getElementById('search-event-types').addEventListener('click', showHideGroup);
    document.getElementById('search-event-types').addEventListener('blur', hideGroupOnBlur);
    document.querySelector('.hide-group').addEventListener('mousedown', preventHideGroupUnfocus);
    document.querySelector('.hide-group').addEventListener('click', focusSearchEventTypes);
    document.getElementById('confirm-selection').addEventListener('click', confirmSelection);
    document.getElementById('dropdown').addEventListener('click', preventDropdownClose);
    document.getElementById('select-all').addEventListener('click', toggleSelectAll);
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
    document.getElementById('confirm-selection').addEventListener('click', confirmSelection);
    window.addEventListener('click', closeDropdownOnOutsideClick);
    document.getElementById('search-event-types').addEventListener('input', filterEventTypes);
    // document.getElementById('apply-filters').addEventListener('click', applyFiltersOnClick);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    document.getElementById("change-name-time").addEventListener("change", updateColorVisualization);
    document.getElementById('name').addEventListener('change', changeActiveSpanColor);
    document.getElementById('time').addEventListener('change', changeActiveSpanColor);
    
    
    document.getElementById('time').addEventListener('change', function() {
        document.getElementById('color-visualization').style.display = 'block';
        const selectedScale = d3[document.getElementById('colorScale').value];
        lineChart.updateColorScale(selectedScale);
    });

    document.getElementById('name').addEventListener('change', function() {
        document.getElementById('color-visualization').style.display = 'none';
        lineChart.updateColorScale("grayscale");
    });

    document.getElementById('colorScale').addEventListener('change', function () {
        const selectedScale = d3[this.value];
        lineChart.updateColorScale(selectedScale);
    });



    // Initial call to create checkboxes
    createCheckboxes(names);

    // Automatically apply filters on page load
    const initialFilters = getFilters();
    applyFilters(initialFilters);
    showActiveFilters(initialFilters);
    changeActiveSpanColor();
    document.getElementById('time').dispatchEvent(new Event('change'));
    document.getElementById('colorScale').dispatchEvent(new Event('change'));
});

function handleTimeFilterChange() {
    const customTime = document.getElementById('custom-time');
    customTime.style.display = this.value === 'custom' ? 'flex' : 'none';
    const filters = getFilters();
    applyFilters(filters);
    showActiveFilters(filters);
}

function handleDateChange() {
    const filters = getFilters();
    applyFilters(filters);
    showActiveFilters(filters);
}

function showHideGroup() {
    document.querySelector('.hide-group').style.display = 'block';
}

function hideGroupOnBlur(event) {
    if (!event.relatedTarget || !document.querySelector('.hide-group').contains(event.relatedTarget)) {
        document.querySelector('.hide-group').style.display = 'none';
    }
}

function preventHideGroupUnfocus(event) {
    event.preventDefault();
}

function focusSearchEventTypes() {
    document.getElementById('search-event-types').focus();
}

function confirmSelection() {
    document.querySelector('.hide-group').style.display = 'none';
    document.getElementById('dropdown').classList.remove('show');
    applyFilters(getFilters());
    showActiveFilters(getFilters());
}

function preventDropdownClose(event) {
    event.stopPropagation();
}

function handleCheckboxChange() {
    console.log('Checkbox state changed:', this.checked);
    updateSelectAllButtonText();
    updateSelectedEvents();
    const filters = getFilters();
    applyFilters(filters);
    showActiveFilters(filters);
}

function closeDropdownOnOutsideClick(event) {
    if (!event.target.matches('#select-event-types') && !event.target.closest('#dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(dropdown => {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        });
    }
}

function filterEventTypes() {
    const filter = this.value.toLowerCase();
    document.querySelectorAll('.checkbox-group label').forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(filter) ? 'flex' : 'none';
    });
}

function applyFiltersOnClick() {
    const filters = getFilters();
    if (validateDateRange(filters.startDate, filters.endDate)) {
        applyFilters(filters);
        showActiveFilters(filters);
    } else {
        alert('Start date must be before end date.');
    }
}

function updateColorVisualization(event) {
    console.log('Color visualization changed:', event.target.value);
    zoomableMap.currentColorVisualization = event.target.value;
    zoomableMap.applyUpdates(getFilters().eventTypes);
}

function updateSelectedEvents() {
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    const selectedOptions = Array.from(checkboxes)
        .filter(i => i.checked)
        .map(i => `<span class="tag">${i.parentElement.textContent.trim()}</span>`)
        .join(' ');

    //console.log('Selected Event Types updated:', selectedOptions);
}

function updateSelectAllButtonText() {
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    const allSelected = Array.from(checkboxes).every(checkbox => checkbox.checked);
    document.getElementById('select-all').textContent = allSelected ? 'Unselect All' : 'Select All';
    updateSelectedEvents();
}

function getFilters() {
    const timeFilter = document.getElementById('time-filter').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const eventTypes = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    return {
        timeFilter,
        startDate,
        endDate,
        eventTypes
    };
}

function resetFilters() {
    document.getElementById('time-filter').value = 'past-30-days';
    document.getElementById('custom-time').style.display = 'none';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('select-all').textContent = 'Select All';
    updateSelectedEvents();
    const filters = getFilters();
    applyFilters(filters);
    showActiveFilters(filters);

    data.forEach(point => {
        point.properties.selected = true;
    });

    console.log("Data after resetting filters:", data);
    document.getElementById('active-time-filter').innerHTML = 'Time Filter: <span class="active-time-filter">None</span>';
    document.getElementById('active-event-types').innerHTML = 'Event Types: <span class="active-event-types">None</span>';
}

function validateDateRange(startDate, endDate) {
    if (startDate && endDate) {
        return new Date(startDate) <= new Date(endDate);
    }
    return true;
}

function showActiveFilters(filters) {
    let timeFilterText;
    if (filters.timeFilter === 'past-7-days') {
        timeFilterText = 'Past 7 Days';
    } else if (filters.timeFilter === 'past-30-days') {
        timeFilterText = 'Past 30 Days';
    } else if (filters.timeFilter === 'custom') {
        timeFilterText = `Custom (${filters.startDate} to ${filters.endDate})`;
    } else {
        timeFilterText = 'None';
    }

    const eventTypesText = filters.eventTypes.length > 0 ? filters.eventTypes.join(', ') : 'None';

    document.getElementById('active-time-filter').innerHTML = `Time Filter: <span class="active-time-filter">${timeFilterText}</span>`;
    document.getElementById('active-event-types').innerHTML = "Event Types:";
    for (let i = 0; filters.eventTypes.length > 0 && i < filters.eventTypes.length; i++) {
        const eventTypeSpan = document.createElement('span');
        eventTypeSpan.className = 'active-tag';
        eventTypeSpan.textContent = filters.eventTypes[i];
        //add class name to eventTypeSpan based on event type
        eventTypeSpan.classList.add("activeColor" + filters.eventTypes[i]);

        //change color of eventTypeSpan background

        //eventTypeSpan.style.backgroundColor = colorMapping[filters.eventTypes[i]];



        const removeSpan = document.createElement('span');
        removeSpan.className = 'remove';
        removeSpan.textContent = 'X';
        removeSpan.addEventListener('click', (event) => {
            event.stopPropagation();
            removeEventType(filters.eventTypes[i]);
        });

        eventTypeSpan.appendChild(removeSpan);
        document.getElementById('active-event-types').appendChild(eventTypeSpan);
    }

    if (filters.eventTypes.length === 0) {
        document.getElementById('active-event-types').innerHTML += `<span class="active-tag">None</span>`;
    }
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    const allSelected = Array.from(checkboxes).every(checkbox => checkbox.checked);
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allSelected;
    });
    updateSelectAllButtonText();
    updateSelectedEvents();
    const filters = getFilters();
    applyFilters(filters);
    showActiveFilters(filters);
}


function onFilterUpdate() {
    // Find the <div class="dynamicChartName">
    var dynamicChartName = document.getElementsByClassName("dynamicChartName");
    var filters = getFilters();

    // Clear existing content
    while (dynamicChartName[0].firstChild) {
        dynamicChartName[0].removeChild(dynamicChartName[0].firstChild);
    }

    // Add each filter's eventTypes to dynamicChartName
    for (let i = 0; filters.eventTypes.length > 0 && i < filters.eventTypes.length; i++) {
        var element = document.createElement("span");
        element.className = "dynamicChartName";
        element.innerHTML = filters.eventTypes[i] + " ";
        dynamicChartName[0].appendChild(element);
    }
}


function applyFilters(filters) {
    let startDate, endDate;
    //console.log('Applying filters:', filters);

    if (filters.timeFilter === 'past-7-days') {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        dateSpan = [startDate, endDate];
    } else if (filters.timeFilter === 'past-30-days') {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        dateSpan = [startDate, endDate];
    } else if (filters.timeFilter === 'custom') {
        startDate = filters.startDate ? new Date(filters.startDate) : null;
        endDate = filters.endDate ? new Date(filters.endDate) : null;
        dateSpan = [startDate, endDate];
    }

    data.forEach(point => {
        const eventName = point.properties.name;
        const eventDate = new Date(point.properties.date);

        const nameMatches = filters.eventTypes.includes(eventName);
        const dateMatches = (!startDate || eventDate >= startDate) && (!endDate || eventDate <= endDate);

        point.properties.selected = nameMatches && dateMatches;
        if (nameMatches && dateMatches) {
            point.properties.highlighted = false;
        }
    });

    // Update selectedEventTypes and eventOrder based on the filters
    selectedEventTypes = {};
    eventOrder = [];

    filters.eventTypes.forEach(eventType => {
        selectedEventTypes[eventType] = true; // Set the default to true if not already set
        if (!eventOrder.includes(eventType)) {
            eventOrder.push(eventType); // Add to the order array if not already present
        }
    });

    // Call the function to create or update the charts
    createMoreLineCharts();

    zoomableMap.applyUpdates(filters.eventTypes);
    lineChart.updateChartData(dataHandler.getSelectedEventCounts().eventCounts);
    updateTableWithFilteredData();
    updateHighlightedSubcharts();
}


function createCheckboxes(eventNames) {
    const checkboxGroup = document.getElementsByClassName('checkbox-group')[0];
    if (checkboxGroup) {
        checkboxGroup.innerHTML = '';

        eventNames.forEach(event => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = event;
            checkbox.checked = true;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${event}`));
            checkboxGroup.appendChild(label);

            checkbox.addEventListener('change', function () {
                console.log('Checkbox state changed:', this.checked);
                updateSelectAllButtonText();
                updateSelectedEvents();
                const filters = getFilters();
                applyFilters(filters);
                showActiveFilters(filters);
            });
        });
        updateSelectedEvents();
        updateSelectAllButtonText();
    } else {
        console.error('No element with the class "checkbox-group" found.');
    }
}

function removeEventType(eventType) {
    document.querySelector(`.checkbox-group input[type="checkbox"][value="${eventType}"]`).checked = false;
    updateSelectAllButtonText();
    updateSelectedEvents();
    const filters = getFilters();
    
    applyFilters(filters);
    showActiveFilters(filters);
    changeActiveSpanColor();
    
    
}






function changeActiveSpanColor() {
    const nameRadioButton = document.getElementById('name');

    if (nameRadioButton.checked) {
        var filters = getFilters();
        //for each eventtype in filters.eventTypes
        for (let i = 0; filters.eventTypes.length > 0 && i < filters.eventTypes.length; i++) {
            //console.log(filters.eventTypes[i]);
            //find element with class activeColor + filters.eventTypes[i]
            var element = document.querySelector(".activeColor" + filters.eventTypes[i]);
            //console.log(element);
            //change color of element
            element.style.backgroundColor = colorMapping[filters.eventTypes[i]];
        }
    }
    else {
        //change color of active-time-filter
        var filters = getFilters();
        for (let i = 0; filters.eventTypes.length > 0 && i < filters.eventTypes.length; i++) {
            //console.log(filters.eventTypes[i]);
            //find element with class activeColor + filters.eventTypes[i]
            var element = document.querySelector(".activeColor" + filters.eventTypes[i]);
            //console.log(element);
            //revert color of element to #237e32
            element.style.backgroundColor = "#237e32";
            
        }
    }

}




