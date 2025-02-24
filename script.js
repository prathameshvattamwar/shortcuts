// Sidebar Toggle Function
function toggleSidebar() {
  let sidebar = document.getElementById("sidebar");
  let closeBtn = document.querySelector(".close-sidebar");

  sidebar.classList.toggle("open");

  // Adjust close button position based on sidebar state
  if (sidebar.classList.contains("open")) {
      closeBtn.style.left = "280px"; // Show close button outside sidebar
  } else {
      closeBtn.style.left = "-50px"; // Hide close button
  }
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
  let aboutSection = document.getElementById('about-section');
  let layoutToggle = document.querySelector('.layout-toggle'); // Get the layout buttons

  // Hide Welcome Message
  aboutSection.style.display = "none";

  // Show the Category Title & Layout Buttons
  title.style.display = "block";
  layoutToggle.style.display = "flex"; // Make the buttons visible
  layoutToggle.style.justifyContent = "center";

  // Update the title to match the selected category
  title.innerText = `${category.toUpperCase()} Shortcuts`;

  // Show Shortcuts Container
  container.style.display = "grid"; 

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
// function toggleDarkMode() {
//   document.body.classList.toggle("dark-mode");
// }

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

//Download Shortcut in the form of PDF
// async function downloadShortcuts() {
//   const container = document.getElementById("shortcuts-container");
//   const title = document.getElementById("category-title").innerText;

//   const { jsPDF } = window.jspdf;
//   const doc = new jsPDF();

//   doc.setFont("Poppins", "normal");
//   doc.setFontSize(14);
//   doc.text(title, 10, 10);

//   let y = 20; // Starting Y position

//   container.querySelectorAll(".shortcut-card").forEach((card) => {
//       const description = card.querySelector("span:first-child").innerText;
//       const keys = card.querySelector(".shortcut-key").innerText;

//       doc.text(`${description}: ${keys}`, 10, y);
//       y += 10;
//   });

//   doc.save(`${title}.pdf`);
// }

async function downloadShortcuts() {
  const container = document.getElementById("shortcuts-container");
  const title = document.getElementById("category-title").innerText;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "normal"); // Use a common font
  doc.setFontSize(14);
  doc.text(title, 10, 10);

  let y = 20; // Starting Y position
  let pageHeight = doc.internal.pageSize.height - 20; // Account for page margins

  // Select all shortcut cards, including those hidden
  const cards = container.querySelectorAll(".shortcut-card");

  if (cards.length === 0) {
    alert("No shortcuts found to export!");
    return;
  }

  cards.forEach((card, index) => {
    const description = card.querySelector("span:first-child").innerText.trim();
    const keys = card.querySelector(".shortcut-key").innerText.trim();

    doc.text(`${description}: ${keys}`, 10, y);
    y += 10;

    // If text reaches the bottom, add a new page
    if (y > pageHeight) {
      doc.addPage();
      y = 20; // Reset Y position for new page
    }
  });

  doc.save(`${title}.pdf`);
}
