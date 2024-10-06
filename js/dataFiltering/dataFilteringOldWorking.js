document.addEventListener('DOMContentLoaded', (event) => {
    // Handle custom time filter display
    document.getElementById('time-filter').addEventListener('change', function () {
        const customTime = document.getElementById('custom-time');
        customTime.style.display = this.value === 'custom' ? 'flex' : 'none';
        const filters = getFilters();
        applyFilters(filters);
        showActiveFilters(filters);
    });


    //get element with id start-date and add event listener to it
    document.getElementById('start-date').addEventListener('change', function () {
        const filters = getFilters();
        applyFilters(filters);
        showActiveFilters(filters);
    });

    //get element with id end-date and add event listener to it
    document.getElementById('end-date').addEventListener('change', function () {
        const filters = getFilters();
        applyFilters(filters);
        showActiveFilters(filters);
    });

    //handle hide-group display
    {
        document.getElementById('search-event-types').addEventListener('focus', function () {
            document.querySelector('.hide-group').style.display = 'block';
        });

        document.getElementById('search-event-types').addEventListener('click', function () {
            document.querySelector('.hide-group').style.display = 'block';
        });

        document.getElementById('search-event-types').addEventListener('blur', function (event) {
            // Check if the newly focused element is inside .hide-group
            if (!event.relatedTarget || !document.querySelector('.hide-group').contains(event.relatedTarget)) {
                document.querySelector('.hide-group').style.display = 'none';
            }
        });

        // Make .hide-group not unfocus the search-event-types element
        document.querySelector('.hide-group').addEventListener('mousedown', function (event) {
            event.preventDefault();
        });

        document.querySelector('.hide-group').addEventListener('click', function (event) {
            document.getElementById('search-event-types').focus();
        });

        // When you click on confirm-selection button hide the hide-group
        document.getElementById('confirm-selection').addEventListener('click', function () {
            document.querySelector('.hide-group').style.display = 'none';
        });
    }

    // Prevent dropdown from closing when clicking inside it
    document.getElementById('dropdown').addEventListener('click', function (event) {
        event.stopPropagation();
    });

    // Select/unselect all event types
    document.getElementById('select-all').addEventListener('click', toggleSelectAll);


    // Update selected events display
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            console.log('Checkbox state changed:', this.checked);
            updateSelectAllButtonText();
            updateSelectedEvents();
        });
    });

    document.getElementById('confirm-selection').addEventListener('click', function () {
        document.getElementById('dropdown').classList.remove('show');
        applyFilters(getFilters());
        showActiveFilters(getFilters());
    });

    // Close dropdown on outside click
    window.addEventListener('click', function (event) {
        if (!event.target.matches('#select-event-types') && !event.target.closest('#dropdown')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                if (dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            });
        }
    });

    // Filter event types based on search input
    document.getElementById('search-event-types').addEventListener('input', function () {
        const filter = this.value.toLowerCase();
        document.querySelectorAll('.checkbox-group label').forEach(label => {
            label.style.display = label.textContent.toLowerCase().includes(filter) ? 'flex' : 'none';
        });
    });

    // Apply filters
    document.getElementById('apply-filters').addEventListener('click', function () {
        const filters = getFilters();
        if (validateDateRange(filters.startDate, filters.endDate)) {
            applyFilters(filters);
            showActiveFilters(filters);
        } else {
            alert('Start date must be before end date.');
        }
    });

    // Reset filters
    document.getElementById('reset-filters').addEventListener('click', function () {
        resetFilters();
        applyFilters(getFilters());
    });

    // Update selected events display function
    function updateSelectedEvents() {
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
        const selectedOptions = Array.from(checkboxes)
            .filter(i => i.checked)
            .map(i => `<span class="tag">${i.parentElement.textContent.trim()}</span>`)
            .join(' ');

        console.log('Selected Event Types updated:', selectedOptions);
    }

    // Update the text of the Select All buttons
    function updateSelectAllButtonText() {
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
        const allSelected = Array.from(checkboxes).every(checkbox => checkbox.checked);
        const someSelected = Array.from(checkboxes).some(checkbox => checkbox.checked);
        document.getElementById('select-all').textContent = allSelected ? 'Unselect All' : 'Select All';

    }

    updateSelectedEvents();

    // Get selected filters
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

    // Reset filters
    function resetFilters() {
        document.getElementById('time-filter').value = 'past-30-days';
        document.getElementById('custom-time').style.display = 'none';
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        document.getElementById('select-all').textContent = 'Select All';
        //document.getElementById('select-all-event-types').textContent = 'Select All'; // Reset the outside button text
        updateSelectedEvents();

        // Reset selected attribute in data
        data.forEach(point => {
            point.properties.selected = true;
        });

        console.log("Data after resetting filters:", data);
        // Implement any additional logic to reset the UI

        // Clear the active filters display
        document.getElementById('active-time-filter').innerHTML = 'Time Filter: <span class="active-time-filter">None</span>';
        document.getElementById('active-event-types').innerHTML = 'Event Types: <span class="active-event-types">None</span>';
    }

    // Validate date range
    function validateDateRange(startDate, endDate) {
        if (startDate && endDate) {
            return new Date(startDate) <= new Date(endDate);
        }
        return true;
    }

    // Show active filters
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
        // for each filters.eventype create a span with the class tag and the text of the event type
        for (let i = 0; filters.eventTypes.length > 0 && i < filters.eventTypes.length; i++) {
            const eventTypeSpan = document.createElement('span');
            eventTypeSpan.className = 'active-tag';
            eventTypeSpan.textContent = filters.eventTypes[i];

            const removeSpan = document.createElement('span');
            removeSpan.className = 'remove';
            removeSpan.textContent = 'X';
            removeSpan.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent triggering parent click
                removeEventType(filters.eventTypes[i]);
            });

            eventTypeSpan.appendChild(removeSpan);
            document.getElementById('active-event-types').appendChild(eventTypeSpan);
        }

        if (filters.eventTypes.length === 0) {
            document.getElementById('active-event-types').innerHTML += `<span class="active-tag">None</span>`;
        }
    }

    // Toggle select/unselect all in dropdown
    function toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
        const allSelected = Array.from(checkboxes).every(checkbox => checkbox.checked);
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allSelected;
        });
        updateSelectAllButtonText();
        updateSelectedEvents();
    }

    // Apply filters
    function applyFilters(filters) {
        let startDate, endDate;

        if (filters.timeFilter === 'past-7-days') {
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 7);
        } else if (filters.timeFilter === 'past-30-days') {
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 30);
        } else if (filters.timeFilter === 'custom') {
            startDate = filters.startDate ? new Date(filters.startDate) : null;
            endDate = filters.endDate ? new Date(filters.endDate) : null;
        }

        data.forEach(point => {
            const eventName = point.properties.name;
            const eventDate = new Date(point.properties.date);

            const nameMatches = filters.eventTypes.includes(eventName);
            const dateMatches = (!startDate || eventDate >= startDate) && (!endDate || eventDate <= endDate);

            point.properties.selected = nameMatches && dateMatches;
        });

        //Update the map with the new data
        zoomableMap.applyUpdates(filters.eventTypes);

        console.log("Data after applying filters:", data);
        // Implement any additional logic to use the filtered data, such as updating the UI
    }

    // Function to create checkboxes dynamically
    function createCheckboxes(eventNames) {
        const checkboxGroup = document.getElementsByClassName('checkbox-group')[0]; // Get the first element with the class name
        if (checkboxGroup) { // Check if the element exists
            checkboxGroup.innerHTML = ''; // Clear existing content

            eventNames.forEach(event => {
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = event;
                checkbox.checked = true; // Set default checked state

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${event}`));
                checkboxGroup.appendChild(label);

                // Ensure the event listener is attached to dynamically created checkboxes
                checkbox.addEventListener('change', function () {
                    console.log('Checkbox state changed:', this.checked);
                    updateSelectAllButtonText();
                    updateSelectedEvents();
                    const filters = getFilters();
                    applyFilters(filters);
                    showActiveFilters(filters);
                });
            });
            // Call updateSelectedEvents and updateSelectAllButtonText after creating checkboxes
            updateSelectedEvents();
            updateSelectAllButtonText();
        } else {
            console.error('No element with the class "checkbox-group" found.');
        }
    }

    // Remove an event type from the active filters
    function removeEventType(eventType) {
        document.querySelector(`.checkbox-group input[type="checkbox"][value="${eventType}"]`).checked = false;
        updateSelectAllButtonText();
        updateSelectedEvents();
        const filters = getFilters();
        applyFilters(filters);
        showActiveFilters(filters);
    }

    document.getElementById("color-visualization").addEventListener("change", (event) => {
        zoomableMap.currentColorVisualization = event.target.value;
        zoomableMap.applyUpdates(getFilters().eventTypes);
    });

    // Initial call to create checkboxes
    createCheckboxes(names);

    // Automatically apply filters on page load
    const initialFilters = getFilters();
    applyFilters(initialFilters);
    showActiveFilters(initialFilters);
});
