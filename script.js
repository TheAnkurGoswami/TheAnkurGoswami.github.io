document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const username = 'TheAnkurGoswami'; // Replace this with the actual GitHub username

    if (!projectsContainer) {
        console.error('Projects container not found!');
        return;
    }

    if (username === 'YOUR_USERNAME') {
        projectsContainer.innerHTML = '<p>Please update script.js with your GitHub username to see your projects.</p>';
        console.warn('GitHub username not set. Please replace "YOUR_USERNAME" in script.js');
        // Display some dummy projects for layout purposes if no username is set
        displayDummyProjects(projectsContainer);
        return;
    }

    fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            return response.json();
        })
        .then(repos => {
            if (repos.length === 0) {
                projectsContainer.innerHTML = '<p>No public repositories found for this user.</p>';
                return;
            }
            repos.forEach(repo => {
                const projectElement = document.createElement('div');
                projectElement.classList.add('project');

                const title = document.createElement('h2');
                title.textContent = repo.name;

                const description = document.createElement('p');
                description.textContent = repo.description || 'No description available.';

                const link = document.createElement('a');
                link.href = repo.html_url;
                link.textContent = 'View Project';
                link.target = '_blank'; // Open in new tab

                projectElement.appendChild(title);
                projectElement.appendChild(description);
                projectElement.appendChild(link);

                projectsContainer.appendChild(projectElement);
            });
        })
        .catch(error => {
            console.error('Failed to fetch projects:', error);
            projectsContainer.innerHTML = `<p>Error loading projects: ${error.message}. Check the console for more details.</p>`;
            // Display dummy projects if API fails
            displayDummyProjects(projectsContainer);
        });

    // New Typing Animation Logic
    const typedElement = document.getElementById('typing-designation');

    if (typedElement) {
        const options = {
            strings: ['AI Researcher', 'Data Scientist'],
            typeSpeed: 70, // Speed of typing
            backSpeed: 50, // Speed of backspacing
            backDelay: 1500, // Pause before backspacing
            startDelay: 500, // Pause before starting animation
            loop: true,      // Loop the animation
            smartBackspace: true, // Only backspace what doesn't match the next string
            showCursor: true,
            cursorChar: '|',
        };
        new Typed('#typing-designation', options);
    } else {
        console.error('Typing designation element not found for animation.');
    }

    // Sidebar Toggle Functionality
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    if (sidebar && sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
            sidebarToggle.classList.toggle('active'); // For 'X' transformation

            // Update aria-expanded attribute for accessibility
            const isExpanded = sidebar.classList.contains('expanded');
            sidebarToggle.setAttribute('aria-expanded', isExpanded);
        });
    } else {
        if (!sidebar) console.error('Sidebar element not found!');
        if (!sidebarToggle) console.error('Sidebar toggle button not found!');
    }

    // Smooth scrolling for sidebar links & close sidebar on click
    const sidebarLinks = document.querySelectorAll('#sidebar nav a');

    if (sidebarLinks.length > 0 && sidebar && sidebarToggle) { // Ensure sidebar and toggle exist for closing
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent default anchor jump

                const targetId = this.getAttribute('href'); // Get href value (e.g., "#about")

                // Check if it's an internal link
                if (targetId && targetId.startsWith('#') && targetId.length > 1) {
                    const targetElement = document.querySelector(targetId);

                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });
                    } else {
                        console.warn(`Smooth scroll target not found for ID: ${targetId}`);
                    }
                } else if (targetId && !targetId.startsWith('#')) {
                    // If it's an external link, just navigate
                    window.location.href = targetId;
                    return; // Exit, don't try to close sidebar if navigating away
                }

                // Close the sidebar after clicking a link (for internal links)
                if (sidebar.classList.contains('expanded')) {
                    sidebar.classList.remove('expanded');
                    sidebarToggle.classList.remove('active'); // Reset hamburger icon
                    sidebarToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    } else {
        if (sidebarLinks.length === 0) console.warn('No sidebar links found for smooth scroll/close functionality.');
    }
});

function displayDummyProjects(container) {
    const dummyProjects = [
        { name: 'Sample Project 1', description: 'This is a placeholder for a project description. Replace YOUR_USERNAME in script.js.', html_url: '#' },
        { name: 'Sample Project 2', description: 'Another example project. The real projects will be fetched from GitHub.', html_url: '#' },
        { name: 'Sample Project 3', description: 'Configure your GitHub username to see your actual projects listed here.', html_url: '#' }
    ];

    dummyProjects.forEach(repo => {
        const projectElement = document.createElement('div');
        projectElement.classList.add('project');

        const title = document.createElement('h2');
        title.textContent = repo.name;

        const description = document.createElement('p');
        description.textContent = repo.description;

        const link = document.createElement('a');
        link.href = repo.html_url;
        link.textContent = 'View Project';
        link.target = '_blank';

        projectElement.appendChild(title);
        projectElement.appendChild(description);
        projectElement.appendChild(link);

        container.appendChild(projectElement);
    });
}
