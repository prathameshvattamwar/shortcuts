// Globals
let shortcuts = {};
let dataLoaded = false;
let currentCategory = '';
let favorites = JSON.parse(localStorage.getItem('shortcut-favorites')) || [];
let recentShortcuts = JSON.parse(localStorage.getItem('recent-shortcuts')) || [];
let darkMode = localStorage.getItem('dark-mode') === 'true';
let currentLayout = localStorage.getItem('layout-preference') || 'grid';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Apply Dark Mode if previously set
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerHTML = '<i class="fa fa-sun"></i> <span class="dif_views">Light Mode</span>';
    }
    
    // Apply saved layout preference
    if (currentLayout) {
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-layout') === currentLayout) {
                btn.classList.add('active');
            }
        });
    }
    
    // Fetch shortcuts data
    fetchShortcuts();
    
    // Display recent shortcuts if available
    if (recentShortcuts.length > 0) {
        displayRecentShortcuts();
    }
    
    // Initialize search functionality
    document.getElementById('search-input').addEventListener('input', filterShortcuts);
    
    // Initialize tutorial if first visit
    if (!localStorage.getItem('tutorial-shown')) {
        setTimeout(showQuickTutorial, 2000);
        localStorage.setItem('tutorial-shown', 'true');
    }
});

// Sidebar Toggle Function
function toggleSidebar() {
    let sidebar = document.getElementById("sidebar");
    let closeBtn = document.querySelector(".close-sidebar");
    
    sidebar.classList.toggle("open");
}

// Fetch Shortcuts from JSON
async function fetchShortcuts() {
    try {
        let response = await fetch("shortcuts.json");
        shortcuts = await response.json();
        dataLoaded = true;
        
        // Add category count indicators to sidebar
        updateSidebarCounts();
        
        // Show toast notification
        showToast('Shortcuts data loaded successfully!', 'success');
    } catch (error) {
        console.error("Error loading shortcuts:", error);
        // showToast('Failed to load shortcuts data', 'error');
    }
}

// Update sidebar with shortcut counts
function updateSidebarCounts() {
    const sidebarItems = document.querySelectorAll('.sidebar ul li');
    
    sidebarItems.forEach(item => {
        const category = item.getAttribute('onclick').match(/loadShortcuts\('(.+?)'\)/)[1];
        if (shortcuts[category] && shortcuts[category].length > 0) {
            // Add count badge
            const count = shortcuts[category].length;
            const badge = document.createElement('span');
            badge.className = 'count-badge';
            badge.textContent = count;
            item.appendChild(badge);
        }
    });
}

// Load Shortcuts
async function loadShortcuts(category) {
    currentCategory = category;
    let container = document.getElementById('shortcuts-container');
    let title = document.getElementById('category-title');
    let aboutSection = document.getElementById('about-section');
    let layoutToggle = document.querySelector('.layout-toggle');
    let recentSection = document.querySelector('.recent-shortcuts');
    
    // Hide Welcome Message and recent shortcuts
    aboutSection.style.display = "none";
    if (recentSection) recentSection.style.display = "none";
    
    // Show the Category Title & Layout Buttons
    title.style.display = "block";
    layoutToggle.style.display = "flex";
    layoutToggle.style.justifyContent = "center";
    layoutToggle.style.gap = "20px";
    layoutToggle.style.margin = "40px auto";
    
    // Update the title to match the selected category
    title.innerText = `${formatCategoryName(category)} Shortcuts`;
    
    // Show Shortcuts Container
    container.style.display = "grid";
    
    // Show loading animation
    container.innerHTML = '<div class="loading"><div></div><div></div><div></div><div></div></div>';
    
    // Highlight the active sidebar item
    document.querySelectorAll('.sidebar ul li').forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('onclick').includes(category)) {
            li.classList.add('active');
        }
    });
    
    // Load data if not already loaded
    if (!dataLoaded) {
        await fetchShortcuts();
    }
    
    // Clear the container
    container.innerHTML = '';
    
    // Get shortcuts for the selected category
    let data = shortcuts[category];
    
    // Check if data exists
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="no-results">No shortcuts found for this category</div>';
        return;
    }
    
    // Create shortcut cards
    data.forEach(shortcut => {
        createShortcutCard(shortcut, container);
    });
    
    // Apply the current layout
    setLayout(currentLayout);
    
    // Add to recent categories
    addToRecentCategories(category);
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
}

// Format category name for display
function formatCategoryName(category) {
    return category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Create a shortcut card
function createShortcutCard(shortcut, container) {
  let shortcutDiv = document.createElement('div');
  shortcutDiv.classList.add('shortcut-card');
  shortcutDiv.dataset.keys = shortcut.keys;
  shortcutDiv.dataset.description = shortcut.description;
  shortcutDiv.dataset.category = currentCategory;
  
  // Check if this is a mobile device
  const isMobile = window.innerWidth <= 768;
  
  // Format the keys appropriately 
  const formattedKeys = isMobile ? formatKeysForMobile(shortcut.keys) : formatKeys(shortcut.keys);
  
  // Check if this shortcut is in favorites
  const isFavorite = favorites.some(fav => 
      fav.keys === shortcut.keys && 
      fav.description === shortcut.description &&
      fav.category === currentCategory
  );
  
  // Create different HTML for mobile vs desktop
  if (isMobile) {
      shortcutDiv.innerHTML = `
          <i class="fa ${isFavorite ? 'fa-star' : 'fa-star-o'} favorite-btn ${isFavorite ? 'active' : ''}"></i>
          <div class="shortcut-content">
              <div class="shortcut-description">${shortcut.description}</div>
              <div class="shortcut-key mobile-formatted">
                  ${formattedKeys}
                  <i class="fa fa-copy copy-icon" title="Copy to clipboard"></i>
              </div>
          </div>
      `;
  } else {
      shortcutDiv.innerHTML = `
          <i class="fa ${isFavorite ? 'fa-star' : 'fa-star-o'} favorite-btn ${isFavorite ? 'active' : ''}"></i>
          <span>${shortcut.description}</span>
          <div class="shortcut-key">
              ${formattedKeys}
              <i class="fa fa-copy copy-icon" title="Copy to clipboard"></i>
          </div>
      `;
  }
  
  // Add the card to the container
  container.appendChild(shortcutDiv);
  
  // Add event listeners
  const favoriteBtn = shortcutDiv.querySelector('.favorite-btn');
  favoriteBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleFavorite(shortcut, currentCategory, this);
  });
  
  const copyIcon = shortcutDiv.querySelector('.copy-icon');
  copyIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      copyToClipboard(shortcut.keys);
  });
  
  // Add click event for practice mode
  shortcutDiv.addEventListener('click', function() {
      startPracticeMode(shortcut);
      
      // Add to recent shortcuts
      addToRecentShortcuts({
          keys: shortcut.keys,
          description: shortcut.description,
          category: currentCategory
      });
  });
}

// Format shortcut keys for better display
function formatKeys(keys) {
    // Replace common key combinations with styled spans
    return keys
        .replace(/\+/g, ' + ')
        .split(' ')
        .map(part => {
            if (part === '+') return part;
            return `<kbd>${part}</kbd>`;
        })
        .join(' ');
}

// Toggle favorite status
function toggleFavorite(shortcut, category, btnElement) {
    const shortcutInfo = {
        keys: shortcut.keys,
        description: shortcut.description,
        category: category
    };
    
    // Check if already in favorites
    const existingIndex = favorites.findIndex(fav => 
        fav.keys === shortcutInfo.keys && 
        fav.description === shortcutInfo.description &&
        fav.category === shortcutInfo.category
    );
    
    if (existingIndex === -1) {
        // Add to favorites
        favorites.push(shortcutInfo);
        btnElement.classList.add('active');
        btnElement.classList.remove('fa-star-o');
        btnElement.classList.add('fa-star');
        showToast('Added to favorites!', 'success');
    } else {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        btnElement.classList.remove('active');
        btnElement.classList.remove('fa-star');
        btnElement.classList.add('fa-star-o');
        showToast('Removed from favorites', 'info');
    }
    
    // Save to localStorage
    localStorage.setItem('shortcut-favorites', JSON.stringify(favorites));
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`Copied: ${text}`, 'success');
    }).catch(err => {
        showToast('Failed to copy text', 'error');
        console.error('Failed to copy: ', err);
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create the toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Set icon based on type
    let icon;
    switch(type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-exclamation-circle';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            break;
        default:
            icon = 'fa-info-circle';
    }
    
    toast.innerHTML = `
        <i class="fa ${icon}"></i>
        <span class="toast-message">${message}</span>
        <i class="fa fa-times close-toast"></i>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Show the toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 50);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
        dismissToast(toast);
    }, 3000);
    
    // Close button functionality
    toast.querySelector('.close-toast').addEventListener('click', function() {
        dismissToast(toast);
    });
}

// Dismiss toast animation
function dismissToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Change layout view
function setLayout(layout) {
    currentLayout = layout;
    let container = document.getElementById('shortcuts-container');
    
    // Remove all layout classes
    container.classList.remove('grid', 'list');
    
    // Add the new layout class
    container.classList.add(layout);
    
    // Update active button state
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-layout') === layout) {
            btn.classList.add('active');
        }
    });
    
    // Process all cards based on layout
    const cards = document.querySelectorAll('.shortcut-card');
    
    cards.forEach(card => {
        // Store original content
        const description = card.dataset.description;
        const keys = card.dataset.keys;
        const formattedKeys = formatKeys(keys);
        const isFavorite = card.querySelector('.favorite-btn').classList.contains('active');
        
        // Clear the card inner content
        if (layout === 'flip') {
            card.classList.add('flip');
            card.innerHTML = `
                <i class="fa ${isFavorite ? 'fa-star' : 'fa-star-o'} favorite-btn ${isFavorite ? 'active' : ''}"></i>
                <div class="inner-card">
                    <div class="front">${description}</div>
                    <div class="back">${formattedKeys}</div>
                </div>
            `;
        } else {
            card.classList.remove('flip');
            card.innerHTML = `
                <i class="fa ${isFavorite ? 'fa-star' : 'fa-star-o'} favorite-btn ${isFavorite ? 'active' : ''}"></i>
                <span>${description}</span>
                <div class="shortcut-key">
                    ${formattedKeys}
                    <i class="fa fa-copy copy-icon" title="Copy to clipboard"></i>
                </div>
            `;
        }
        
        // Re-add event listeners
        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Toggle the class first for immediate feedback
            this.classList.toggle('active');
            this.classList.toggle('fa-star');
            this.classList.toggle('fa-star-o');
            
            // Then update the data
            const shortcutInfo = {
                keys: card.dataset.keys,
                description: card.dataset.description,
                category: card.dataset.category
            };
            
            toggleFavorite(shortcutInfo, shortcutInfo.category, this);
        });
        
        const copyIcon = card.querySelector('.copy-icon');
        if (copyIcon) {
            copyIcon.addEventListener('click', function(e) {
                e.stopPropagation();
                copyToClipboard(card.dataset.keys);
            });
        }
        
        // Re-add click event for practice mode
        card.addEventListener('click', function() {
            startPracticeMode({
                keys: card.dataset.keys,
                description: card.dataset.description
            });
            
            // Add to recent shortcuts
            addToRecentShortcuts({
                keys: card.dataset.keys,
                description: card.dataset.description,
                category: card.dataset.category
            });
        });
    });
    
    // Save layout preference
    localStorage.setItem('layout-preference', layout);
}

// Toggle Dark Mode
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    
    // Update button text
    const themeBtn = document.getElementById('theme-toggle');
    if (darkMode) {
        themeBtn.innerHTML = '<i class="fa fa-sun"></i> Light Mode';
    } else {
        themeBtn.innerHTML = '<i class="fa fa-moon"></i> Dark Mode';
    }
    
    // Save preference
    localStorage.setItem('dark-mode', darkMode);
    
    // Show toast
    showToast(`Switched to ${darkMode ? 'light' : 'dark'} mode`, 'info');
}

// Filter shortcuts based on search input
function filterShortcuts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const container = document.getElementById('shortcuts-container');
    const cards = container.querySelectorAll('.shortcut-card');
    
    let hasResults = false;
    
    cards.forEach(card => {
        const keys = card.dataset.keys.toLowerCase();
        const description = card.dataset.description.toLowerCase();
        
        if (keys.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = '';
            hasResults = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show no results message if needed
    const noResultsMsg = container.querySelector('.no-results');
    
    if (!hasResults) {
        if (!noResultsMsg) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'no-results';
            msgDiv.innerHTML = `No shortcuts found matching "<strong>${searchTerm}</strong>"`;
            container.appendChild(msgDiv);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Load favorites page
function loadFavorites() {
    const container = document.getElementById('shortcuts-container');
    const title = document.getElementById('category-title');
    const aboutSection = document.getElementById('about-section');
    const layoutToggle = document.querySelector('.layout-toggle');
    const recentSection = document.querySelector('.recent-shortcuts');
    
    // Hide welcome and recent section
    aboutSection.style.display = "none";
    if (recentSection) recentSection.style.display = "none";
    
    // Show title and layout toggle
    title.style.display = "block";
    layoutToggle.style.display = "flex";
    // layoutToggle.style.justifyContent = "center";
    // layoutToggle.style.gap = "20px";
    // layoutToggle.style.margin = "40px auto";
    
    // Set favorites title with custom header
    title.innerHTML = `
        <div class="favorites-header">
            <span class="favorites-title">My Favorite Shortcuts</span>
            <button class="clear-favorites" onclick="clearFavorites()">
                <i class="fa fa-trash"></i> Clear All
            </button>
        </div>
    `;
    
    // Show container
    container.style.display = "grid";
    
    // Clear container
    container.innerHTML = '';
    
    // Highlight active sidebar item
    document.querySelectorAll('.sidebar ul li').forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('onclick') && li.getAttribute('onclick').includes('loadFavorites')) {
            li.classList.add('active');
        }
    });
    
    // Check if we have favorites
    if (!favorites || favorites.length === 0) {
        container.innerHTML = '<div class="no-results">No favorites added yet. Star shortcuts to add them here!</div>';
        return;
    }
    
    // Create a card for each favorite
    favorites.forEach(favorite => {
        createShortcutCard(favorite, container);
    });
    
    // Apply current layout
    setLayout(currentLayout);
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
}

// Clear all favorites
function clearFavorites() {
    // Show confirmation modal
    showModal(
        'Clear Favorites',
        'Are you sure you want to remove all favorites? This action cannot be undone.',
        [
            {
                text: 'Cancel',
                action: 'closeModal()',
                type: 'secondary'
            },
            {
                text: 'Clear All',
                action: 'confirmClearFavorites()',
                type: 'danger'
            }
        ]
    );
}

// Confirm clearing favorites
function confirmClearFavorites() {
    favorites = [];
    localStorage.setItem('shortcut-favorites', JSON.stringify(favorites));
    loadFavorites(); // Reload the favorites view
    closeModal();
    showToast('All favorites have been cleared', 'info');
}

// Add to recent shortcuts
function addToRecentShortcuts(shortcut) {
    // Check if already in recent list
    const existingIndex = recentShortcuts.findIndex(s => 
        s.keys === shortcut.keys && 
        s.description === shortcut.description &&
        s.category === shortcut.category
    );
    
    // If exists, remove it to reorder
    if (existingIndex !== -1) {
        recentShortcuts.splice(existingIndex, 1);
    }
    
    // Add to beginning of array
    recentShortcuts.unshift(shortcut);
    
    // Limit to 10 items
    if (recentShortcuts.length > 10) {
        recentShortcuts.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('recent-shortcuts', JSON.stringify(recentShortcuts));
}

// Display recent shortcuts
function displayRecentShortcuts() {
    // Check if we're on the home page
    const aboutSection = document.getElementById('about-section');
    if (aboutSection.style.display === 'none') return;
    
    // Check if we have recent shortcuts
    if (!recentShortcuts || recentShortcuts.length === 0) return;
    
    // Check if the section already exists
    let recentSection = document.querySelector('.recent-shortcuts');
    if (!recentSection) {
        recentSection = document.createElement('div');
        recentSection.className = 'recent-shortcuts';
        recentSection.innerHTML = `
            <h2><i class="fa fa-history"></i> Recently Viewed Shortcuts</h2>
            <div class="recent-list"></div>
        `;
        aboutSection.after(recentSection);
    }
    
    // Get the list container
    const recentList = recentSection.querySelector('.recent-list');
    recentList.innerHTML = '';
    
    // Add recent shortcuts
    recentShortcuts.forEach(shortcut => {
        const itemElement = document.createElement('div');
        itemElement.className = 'recent-item';
        itemElement.innerHTML = `
            <div>${shortcut.description}</div>
            <div class="recent-key">${shortcut.keys}</div>
        `;
        recentList.appendChild(itemElement);
        
        // Add click event
        itemElement.addEventListener('click', () => {
            loadShortcuts(shortcut.category);
            
            // Find and highlight the specific shortcut
            setTimeout(() => {
                const cards = document.querySelectorAll('.shortcut-card');
                cards.forEach(card => {
                    if (card.dataset.keys === shortcut.keys && 
                        card.dataset.description === shortcut.description) {
                        card.classList.add('highlight');
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Remove highlight after a moment
                        setTimeout(() => {
                            card.classList.remove('highlight');
                        }, 2000);
                    }
                });
            }, 500);
        });
    });
}

// Add category to recent list
function addToRecentCategories(category) {
    // Implementation placeholder - could expand this later
}

// Practice mode
function startPracticeMode(shortcut) {
    // Create modal for practice
    showModal(
        'Practice Shortcut',
        `
        <div class="practice-container">
            <div class="practice-description">${shortcut.description}</div>
            <div class="practice-keys">
                ${formatPracticeKeys(shortcut.keys)}
            </div>
            <div class="practice-input">
                <input type="text" id="practice-input" placeholder="Type the shortcut..." autocomplete="off">
            </div>
            <div class="practice-result"></div>
            <div class="practice-controls">
                <button class="practice-btn" onclick="closeModal()">
                    <i class="fa fa-times"></i> Close
                </button>
                <button class="practice-btn next" onclick="verifyPractice('${shortcut.keys}')">
                    <i class="fa fa-check"></i> Check
                </button>
            </div>
        </div>
        `,
        []
    );
    
    // Focus on input after modal appears
    setTimeout(() => {
        document.getElementById('practice-input').focus();
    }, 300);
}

// Format practice keys for display
function formatPracticeKeys(keys) {
    return keys.split('+').map(key => {
        const trimmedKey = key.trim();
        return `<div class="practice-key">${trimmedKey}</div>`;
    }).join('+');
}

// Verify practice input
function verifyPractice(correctKeys) {
    const input = document.getElementById('practice-input');
    const result = document.querySelector('.practice-result');
    const userInput = input.value.trim();
    
    // Compare (case insensitive, ignore extra spaces)
    const normalizedInput = userInput.toLowerCase().replace(/\s+/g, '');
    const normalizedCorrect = correctKeys.toLowerCase().replace(/\s+/g, '');
    
    if (normalizedInput === normalizedCorrect) {
        result.textContent = 'Correct! Well done!';
        result.className = 'practice-result success';
        input.style.borderColor = '#4ade80';
        
        // Disable input and update button
        input.disabled = true;
        document.querySelector('.practice-btn.next').innerHTML = '<i class="fa fa-times"></i> Close';
        document.querySelector('.practice-btn.next').onclick = closeModal;
    } else {
        result.textContent = 'Not quite right. Try again!';
        result.className = 'practice-result error';
        input.style.borderColor = '#f87171';
        
        // Shake the input to indicate error
        input.classList.add('shake');
        setTimeout(() => {
            input.classList.remove('shake');
        }, 500);
    }
}

// Show modal
function showModal(title, content, buttons = []) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-content">
            <i class="fa fa-times close-modal" onclick="closeModal()"></i>
            <h3 class="modal-title">${title}</h3>
            <div class="modal-body">${content}</div>
            ${buttons.length > 0 ? `
                <div class="modal-footer">
                    ${buttons.map(btn => `
                        <button class="toggle-btn ${btn.type || ''}" onclick="${btn.action}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 50);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
    
    // Re-enable scrolling
    document.body.style.overflow = '';
}

// Show Settings Modal
function showSettings() {
    showModal(
        'Settings',
        `
        <div class="settings-container">
            <div class="settings-group">
                <h3>Display Options</h3>
                <div class="setting-item">
                    <span class="setting-label">Dark Mode</span>
                    <label class="switch">
                        <input type="checkbox" id="dark-mode-toggle" ${darkMode ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <span class="setting-label">Default View</span>
                    <select id="default-layout" class="setting-select">
                        <option value="grid" ${currentLayout === 'grid' ? 'selected' : ''}>Grid</option>
                        <option value="list" ${currentLayout === 'list' ? 'selected' : ''}>List</option>
                        <option value="flip" ${currentLayout === 'flip' ? 'selected' : ''}>Flip Cards</option>
                    </select>
                </div>
            </div>
            
            <div class="settings-group">
                <h3>Data Management</h3>
                <div class="setting-item">
                    <span class="setting-label">Clear Recent Shortcuts</span>
                    <button class="setting-btn" onclick="clearRecentShortcuts()">Clear</button>
                </div>
                <div class="setting-item">
                    <span class="setting-label">Clear All Favorites</span>
                    <button class="setting-btn" onclick="clearFavorites()">Clear</button>
                </div>
            </div>
        </div>
        `,
        [
            {
                text: 'Close',
                action: 'closeModal()',
                type: 'primary'
            },
            {
                text: 'Save Changes',
                action: 'saveSettings()',
                type: 'primary'
            }
        ]
    );
    
    // Add event listener for dark mode toggle
    document.getElementById('dark-mode-toggle').addEventListener('change', function() {
        darkMode = this.checked;
        toggleDarkMode();
    });
    
    // Add event listener for default layout change
    document.getElementById('default-layout').addEventListener('change', function() {
        currentLayout = this.value;
        setLayout(currentLayout);
    });
}

// Save settings
function saveSettings() {
    // Dark mode and layout preferences are saved in their respective toggle functions
    closeModal();
    showToast('Settings saved successfully', 'success');
}

// Clear recent shortcuts
function clearRecentShortcuts() {
    recentShortcuts = [];
    localStorage.setItem('recent-shortcuts', JSON.stringify(recentShortcuts));
    
    // Remove the recent section if on home page
    const recentSection = document.querySelector('.recent-shortcuts');
    if (recentSection) {
        recentSection.remove();
    }
    
    showToast('Recent shortcuts cleared', 'info');
}

// Show quick tutorial
function showQuickTutorial() {
    showModal(
        'Welcome to Shortcut Keys Reference!',
        `
        <div class="tutorial-content">
            <p>This site helps you learn and practice keyboard shortcuts for various applications.</p>
            
            <h4><i class="fa fa-star"></i> Getting Started</h4>
            <ul>
                <li>Click the <i class="fa fa-bars"></i> menu to browse shortcuts by category</li>
                <li>Use the search bar to find specific shortcuts</li>
                <li>Click on any shortcut card to practice it</li>
                <li>Star shortcuts to add them to your favorites</li>
            </ul>
            
            <h4><i class="fa fa-lightbulb-o"></i> Pro Tips</h4>
            <ul>
                <li>Toggle between grid, list, and flip card views</li>
                <li>Switch to dark mode for late-night browsing</li>
                <li>Copy shortcuts with a single click</li>
                <li>Download shortcuts as PDF for offline reference</li>
            </ul>
        </div>
        `,
        [
            {
                text: 'Get Started',
                action: 'closeModal()',
                type: 'primary'
            }
        ]
    );
}

// Download shortcuts as PDF
async function downloadShortcuts() {
    const container = document.getElementById("shortcuts-container");
    const title = document.getElementById("category-title").innerText;
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set document properties
        doc.setFont("helvetica", "normal");
        doc.setFontSize(22);
        doc.setTextColor(33, 33, 33);
        
        // Add title
        doc.text(title, 15, 20);
        
        // Add divider line
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 25, 195, 25);
        
        // Add footer
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Generated by Shortcut Keys Reference", 15, 285);
        doc.text("https://shortcutkeys.com", 160, 285);
        
        // Reset for content
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        
        let y = 40; // Starting Y position
        let pageHeight = doc.internal.pageSize.height - 30;
        
        // Select all shortcut cards
        const cards = container.querySelectorAll(".shortcut-card");
        
        if (cards.length === 0) {
            showToast("No shortcuts found to export!", "warning");
            return;
        }
        
        // Function to add a new page
        const addNewPage = () => {
            doc.addPage();
            y = 20;
            
            // Add header to new page
            doc.setFontSize(14);
            doc.setTextColor(100, 100, 100);
            doc.text(title + " (continued)", 15, y);
            doc.line(15, y + 5, 195, y + 5);
            
            // Reset for content
            doc.setFontSize(12);
            doc.setTextColor(33, 33, 33);
            
            y = 40;
        };
        
        // Process all shortcuts
        cards.forEach((card, index) => {
            // Skip hidden cards (filtered out by search)
            if (card.style.display === 'none') return;
            
            const description = card.dataset.description;
            const keys = card.dataset.keys;
            
            // Check if we need a new page
            if (y > pageHeight) {
                addNewPage();
            }
            
            // Add description
            doc.setFont("helvetica", "normal");
            doc.text(description, 15, y);
            
            // Add shortcut key
            doc.setFont("helvetica", "bold");
            doc.text(keys, 150, y);
            
            // Move to next line
            y += 10;
        });
        
        // Save the PDF
        doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
        showToast("PDF downloaded successfully!", "success");
    } catch (error) {
        console.error("Error generating PDF:", error);
        showToast("Failed to generate PDF. Please try again.", "error");
    }
}

// Adjust for mobile display
function adjustForMobile() {
  const isMobile = window.innerWidth <= 768;
  
  // Show search bar when category is loaded
  const searchContainer = document.querySelector('.search-container');
  if (searchContainer) {
      searchContainer.style.display = currentCategory ? 'block' : 'none';
  }
  
  // Adjust controls container
  const controlsContainer = document.querySelector('.controls-container');
  if (controlsContainer && isMobile) {
      controlsContainer.scrollLeft = 0; // Reset scroll position
  }
  
  // Fix body scroll when modal is open
  const modal = document.getElementById('modal');
  if (modal && modal.classList.contains('active')) {
      document.body.classList.add('modal-open');
  } else {
      document.body.classList.remove('modal-open');
  }
  
  // Special handling for shortcut cards on mobile
  if (isMobile) {
      const cards = document.querySelectorAll('.shortcut-card');
      cards.forEach(card => {
          // Format keys for better mobile display
          const keyElement = card.querySelector('.shortcut-key');
          if (keyElement) {
              const keys = card.dataset.keys;
              const formattedKeys = formatKeysForMobile(keys);
              
              // Only update if not already formatted for mobile
              if (!keyElement.classList.contains('mobile-formatted')) {
                  keyElement.innerHTML = formattedKeys;
                  keyElement.classList.add('mobile-formatted');
                  
                  // Re-add copy icon if needed
                  if (!keyElement.querySelector('.copy-icon')) {
                      const copyIcon = document.createElement('i');
                      copyIcon.className = 'fa fa-copy copy-icon';
                      copyIcon.title = 'Copy to clipboard';
                      keyElement.appendChild(copyIcon);
                      
                      // Add event listener
                      copyIcon.addEventListener('click', function(e) {
                          e.stopPropagation();
                          copyToClipboard(card.dataset.keys);
                      });
                  }
              }
          }
      });
  }
}

// Format keys specially for mobile
function formatKeysForMobile(keys) {
  // For mobile, we want to make the display more compact
  const keyParts = keys.split('+').map(k => k.trim());
  
  let result = '';
  for (let i = 0; i < keyParts.length; i++) {
      const key = keyParts[i];
      result += `<kbd>${key}</kbd>`;
      
      // Add plus sign between keys, but not after the last one
      if (i < keyParts.length - 1) {
          result += '+';
      }
  }
  
  return result;
}

// Update the existing loadShortcuts function to include mobile adjustments
const originalLoadShortcuts = loadShortcuts; // Store the original function
loadShortcuts = function(category) {
  // Call the original function
  originalLoadShortcuts(category);
  
  // Additional mobile-specific adjustments
  setTimeout(() => {
      adjustForMobile();
      
      // Show search bar when category is loaded
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer) {
          searchContainer.style.display = 'block';
      }
  }, 300);
};

// Update existing setLayout function
const originalSetLayout = setLayout; // Store the original function
setLayout = function(layout) {
  // Call the original function
  originalSetLayout(layout);
  
  // Additional mobile-specific adjustments
  setTimeout(adjustForMobile, 100);
};

// Close modal function needs to be updated for mobile
const originalCloseModal = closeModal; // Store the original function
closeModal = function() {
  // Call the original function
  originalCloseModal();
  
  // Remove the modal-open class from body
  document.body.classList.remove('modal-open');
};

// Add window resize listener for responsive adjustments
window.addEventListener('resize', debounce(adjustForMobile, 250));

// Debounce function to prevent excessive resize handling
function debounce(func, wait) {
  let timeout;
  return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Initialize mobile adjustments on page load
document.addEventListener('DOMContentLoaded', function() {
  // Call any existing initialization code
  // ...
  
  // Then apply mobile adjustments
  adjustForMobile();
});
