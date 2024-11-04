// Get elements for pop-up and overlay
const overlay = document.getElementById('overlay');
const popup = document.getElementById('popup');
const popupEventSelection = document.getElementById('popupEventSelection');
const openPopupButton = document.getElementById('openPopupButton');
const closePopupButton = document.getElementById('closePopupButton');
const eventSelection = document.getElementById('eventSelection');

// Open pop-up when "Sort" button is clicked
openPopupButton.addEventListener('click', function () {
    // Move eventSelection content to pop-up for sorting
    popupEventSelection.innerHTML = eventSelection.innerHTML;
    overlay.classList.remove('hidden');
    popup.classList.remove('hidden');
});

// Close pop-up and apply sorting
closePopupButton.addEventListener('click', function () {
    // Save sorted items back to eventSelection
    eventSelection.innerHTML = popupEventSelection.innerHTML;
    overlay.classList.add('hidden');
    popup.classList.add('hidden');
    updateOrderOfLineCharts(); // Update charts after sorting
});

// Initialize Sortable within the pop-up
new Sortable(popupEventSelection, {
    animation: 150,
    handle: '.checkbox-container',
    onEnd: function () {
        // Update eventOrder after sorting in the popup
        eventOrder = Array.from(popupEventSelection.children)
            .filter(container => !container.classList.contains('hide-all-container'))
            .map(container => container.dataset.eventType);
    }
});
