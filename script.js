document.addEventListener('DOMContentLoaded', () => {
    // Project Loading Logic
    const projectsContainer = document.getElementById('projects-container');

    if (!projectsContainer) {
        console.error('Projects container not found for rendering projects!');
    } else {
        fetch('projects.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(projectsData => {
                displayProjects(projectsData, projectsContainer);
            })
            .catch(error => {
                console.error('Failed to fetch or parse projects.json:', error);
                projectsContainer.innerHTML = '<p>Error loading projects. Please check the console.</p>';
            });
    }

    // Typing Animation Logic
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

    // Intersection Observer for Scroll Animations
    const animatedElements = document.querySelectorAll('.scroll-animate');

    if (animatedElements.length > 0) {
        console.log("Found elements to animate:", animatedElements); // ADD THIS LOG

        const observerOptions = {
            root: null, // Use the viewport as the root
            rootMargin: '0px',
            threshold: 0.01 // CHANGED - Trigger when 1% of the element is visible
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                // ADD THIS BLOCK FOR DETAILED LOGGING
                console.groupCollapsed(`IntersectionObserver Entry: ${entry.target.id || 'Unnamed Element'}`);
                console.log("Target:", entry.target);
                console.log("Is Intersecting:", entry.isIntersecting);
                console.log("Intersection Ratio:", entry.intersectionRatio);
                console.log("Bounding Client Rect:", entry.boundingClientRect);
                console.log("Intersection Rect:", entry.intersectionRect);
                console.log("Root Bounds:", entry.rootBounds);
                console.groupEnd();

                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    console.log("Added 'is-visible' class to:", entry.target.id || entry.target); // LOG CLASS ADDITION
                    observer.unobserve(entry.target); // Optional: stop observing once animated
                }
            });
        };

        const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);

        animatedElements.forEach(el => {
            console.log("Observing element:", el.id || el); // LOG WHICH ELEMENTS ARE BEING OBSERVED
            scrollObserver.observe(el);
        });

    } else {
        console.log("No elements with class '.scroll-animate' found to observe."); // ENSURE THIS LOG IS ACTIVE
    }
});

function displayProjects(projectsData, container) {
    container.innerHTML = ''; // Clear previous content

    if (!projectsData || !Array.isArray(projectsData) || projectsData.length === 0) {
        container.innerHTML = '<p>No projects to display at the moment.</p>';
        return;
    }

    projectsData.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.classList.add('project');

        if (project.imageUrl) {
            const img = document.createElement('img');
            img.src = project.imageUrl;
            img.alt = project.title ? project.title + " image" : "Project image";
            // Add error handling for images if desired, e.g., img.onerror = ...
            projectElement.appendChild(img);
        }

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('project-card-content');

        if (project.title) {
            const title = document.createElement('h2');
            title.textContent = project.title;
            contentWrapper.appendChild(title);
        }

        if (project.description) {
            const description = document.createElement('p');
            description.textContent = project.description;
            contentWrapper.appendChild(description);
        }

        if (project.technologies && project.technologies.length > 0) {
            const techsDiv = document.createElement('div');
            techsDiv.classList.add('project-technologies');
            project.technologies.forEach(tech => {
                const techTag = document.createElement('span');
                techTag.classList.add('tech-tag');
                techTag.textContent = tech;
                techsDiv.appendChild(techTag);
            });
            contentWrapper.appendChild(techsDiv);
        }

        if (project.tags && project.tags.length > 0) {
            const tagsDiv = document.createElement('div');
            tagsDiv.classList.add('project-tags');
            project.tags.forEach(t => {
                const tag = document.createElement('span');
                tag.classList.add('tag');
                tag.textContent = t;
                tagsDiv.appendChild(tag);
            });
            contentWrapper.appendChild(tagsDiv);
        }

        const linksDiv = document.createElement('div');
        linksDiv.classList.add('project-links');
        let hasLinks = false;

        if (project.repoUrl) {
            const repoLink = document.createElement('a');
            repoLink.href = project.repoUrl;
            repoLink.textContent = 'View Repo';
            repoLink.target = '_blank';
            repoLink.rel = 'noopener noreferrer';
            linksDiv.appendChild(repoLink);
            hasLinks = true;
        }

        if (project.liveUrl) {
            if(hasLinks) { // Add a separator if repo link also exists
                const separator = document.createTextNode(' | ');
                linksDiv.appendChild(separator);
            }
            const liveLink = document.createElement('a');
            liveLink.href = project.liveUrl;
            liveLink.textContent = 'Live Demo';
            liveLink.target = '_blank';
            liveLink.rel = 'noopener noreferrer';
            linksDiv.appendChild(liveLink);
            hasLinks = true;
        }

        if(hasLinks){
            contentWrapper.appendChild(linksDiv);
        }

        projectElement.appendChild(contentWrapper);
        container.appendChild(projectElement);
    });
}
