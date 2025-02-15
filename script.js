// Sidebar Toggle Function
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

// Fetch Shortcuts from JSON
let shortcuts = {};
let dataLoaded = false;

async function fetchShortcuts() {
  try {
    let response = await fetch("shortcuts.json");
    shortcuts = await response.json();
    dataLoaded = true;
  } catch (error) {
    console.error("Error loading shortcuts:", error);
  }
}

// Load Shortcuts
async function loadShortcuts(category) {
    let container = document.getElementById('shortcuts-container');
    let title = document.getElementById('category-title');
    let aboutSection = document.getElementById('about-section'); // Get About Section

    // Hide About Section & Show Shortcuts
    aboutSection.style.display = "none";
    container.style.display = "grid"; // Show shortcuts container

    title.innerText = `${category.toUpperCase()} Shortcuts`;
    container.innerHTML = '<p>Loading...</p>';

    if (!dataLoaded) {
        await fetchShortcuts();
    }

    container.innerHTML = '';
    let data = shortcuts[category];

    if (!data || data.length === 0) {
        container.innerHTML = '<p>No shortcuts found.</p>';
        return;
    }

    data.forEach(shortcut => {
        let shortcutDiv = document.createElement('div');
        shortcutDiv.classList.add('shortcut-card');
        shortcutDiv.dataset.keys = shortcut.keys; // Store for flip mode
        shortcutDiv.dataset.description = shortcut.description;

        shortcutDiv.innerHTML = `
            <span>${shortcut.description}</span>
            <span class="shortcut-key">${shortcut.keys}</span>
        `;
        container.appendChild(shortcutDiv);
    });

    // Apply the current layout (default is grid)
    setLayout('grid');
}

// Copy to Clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  alert("Copied: " + text);
}

// Dark Mode Toggle
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

function setLayout(layout) {
    let container = document.getElementById('shortcuts-container');
    container.classList.remove('grid', 'list'); 
    container.classList.add(layout); 

    // Change how cards are generated based on the layout
    let cards = document.querySelectorAll('.shortcut-card');
    cards.forEach(card => {
        card.classList.remove('flip'); 

        if (layout === 'flip') {
            card.classList.add('flip');
            card.innerHTML = `
                <div class="inner-card">
                    <div class="front">${card.dataset.description}</div>
                    <div class="back">${card.dataset.keys}</div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <span>${card.dataset.description}</span>
                <span class="shortcut-key">${card.dataset.keys}</span>
            `;
        }
    });
}
