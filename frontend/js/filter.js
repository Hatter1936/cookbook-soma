document.addEventListener('DOMContentLoaded', function() {
    const filterButton = document.getElementById('filter-button');
    const filterDropdown = document.getElementById('filterDropdown');
    const filterContent = document.querySelector('.filter-dropdown-content');
    
    let isMenuOpen = false;
    
    function openMenu() {
        filterContent.classList.add('show');
        document.body.classList.add('menu-open');
        isMenuOpen = true;
    }
    
    function closeMenu() {
        filterContent.classList.remove('show');
        document.body.classList.remove('menu-open');
        isMenuOpen = false;
    }
    
    filterButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (isMenuOpen && 
            !filterDropdown.contains(e.target) && 
            !filterButton.contains(e.target)) {
            closeMenu();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });
    
    filterDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});