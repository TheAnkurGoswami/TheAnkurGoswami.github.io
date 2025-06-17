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

    // Skills Loading Logic
    const skillsGridContainer = document.getElementById('skills-grid');

    if (!skillsGridContainer) {
        console.error('Skills grid container not found!');
    } else {
        fetch('skills.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(skillsData => {
                displaySkills(skillsData, skillsGridContainer);
                // After skills are displayed, position them.
                if (skillsGridContainer.children.length > 0) {
                    positionSkillsInCloud();
                }
            })
            .catch(error => {
                console.error('Failed to fetch or parse skills.json:', error);
                skillsGridContainer.innerHTML = '<p>Error loading skills. Please check the console.</p>';
            });
    }

    // Work Experience Loading Logic
    const timelineContainer = document.querySelector('#work-experience .timeline');

    if (!timelineContainer) {
        console.error('Work experience timeline container not found!');
    } else {
        fetch('experience.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(experienceData => {
                displayExperience(experienceData, timelineContainer);
            })
            .catch(error => {
                console.error('Failed to fetch or parse experience.json:', error);
                timelineContainer.innerHTML = '<p>Error loading work experience. Please check the console.</p>';
            });
    }

    // Fetch and display contributions
    const contributionsContainer = document.getElementById('contributions-container');
    if (contributionsContainer) {
        fetch('contributions.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => displayContributions(data, contributionsContainer))
            .catch(error => {
                console.error('Error loading contributions:', error);
                contributionsContainer.innerHTML = '<p>Error loading contributions. Please try again later.</p>';
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

    // Call animation initializer after a short delay to ensure DOM is likely populated
    setTimeout(initializeScrollAnimations, 500);

    // Add resize listener for skills cloud, debounced for performance
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(positionSkillsInCloud, 250); // Debounce for 250ms
    });
});

// --- SKILLS CLOUD POSITIONING ---
function positionSkillsInCloud() {
    const container = document.getElementById('skills-grid');
    if (!container) {
        console.error('Skills grid container not found for positioning.');
        return;
    }

    const items = container.querySelectorAll('.skill-item');
    if (items.length === 0) {
        // console.log('No skill items found to position.'); // Can be noisy on initial load before displaySkills
        return;
    }

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const edgeMargin = 20; // Pixels from the edge
    const placedItemsRects = [];
    const maxAttempts = 100; // Max attempts to find a non-overlapping position

    items.forEach(item => {
        const itemWidth = item.offsetWidth;
        const itemHeight = item.offsetHeight;

        if (itemWidth === 0 || itemHeight === 0) {
            console.warn('Skill item has zero dimensions, will use default position.', item);
            // Fallback: position it somewhere, or it'll be stuck at 0,0
            item.style.left = `${edgeMargin}px`;
            item.style.top = `${edgeMargin}px`;
            item.style.zIndex = Math.floor(Math.random() * 5) + 1;
            return; // Skip overlap logic for this item
        }

        let foundPosition = false;
        let currentLeft, currentTop;

        for (let attempts = 0; attempts < maxAttempts; attempts++) {
            // Calculate random top and left positions
            const maxPossibleLeft = Math.max(0, containerWidth - itemWidth - edgeMargin);
            const maxPossibleTop = Math.max(0, containerHeight - itemHeight - edgeMargin);

            currentLeft = Math.max(edgeMargin, Math.random() * (maxPossibleLeft - edgeMargin) + edgeMargin);
            currentTop = Math.max(edgeMargin, Math.random() * (maxPossibleTop - edgeMargin) + edgeMargin);

            const currentRect = {
                x1: currentLeft,
                y1: currentTop,
                x2: currentLeft + itemWidth,
                y2: currentTop + itemHeight
            };

            let isOverlapping = false;
            for (const placedRect of placedItemsRects) {
                // Check for overlap
                const overlap = !(currentRect.x2 < placedRect.x1 ||
                                  currentRect.x1 > placedRect.x2 ||
                                  currentRect.y2 < placedRect.y1 ||
                                  currentRect.y1 > placedRect.y2);
                if (overlap) {
                    isOverlapping = true;
                    break;
                }
            }

            if (!isOverlapping) {
                placedItemsRects.push(currentRect);
                item.style.left = `${currentLeft}px`;
                item.style.top = `${currentTop}px`;
                item.style.zIndex = Math.floor(Math.random() * 5) + 1;
                foundPosition = true;
                break; // Found a position
            }
        }

        if (!foundPosition) {
            // Fallback: If maxAttempts reached, place at last attempted position (might overlap)
            console.warn(`Could not find a non-overlapping position for item after ${maxAttempts} attempts. Placing at last tried spot.`, item);
            item.style.left = `${currentLeft}px`;
            item.style.top = `${currentTop}px`;
            item.style.zIndex = Math.floor(Math.random() * 5) + 1;
            // Optionally, still add its rect to prevent others from trying to avoid this forced position too much,
            // or leave it out if you prefer new items to try to avoid it. For now, let's add it.
            placedItemsRects.push({
                x1: currentLeft, y1: currentTop,
                x2: currentLeft + itemWidth, y2: currentTop + itemHeight
            });
        }
    });
}


function initializeScrollAnimations() {
    const animatedElements = document.querySelectorAll('.js-scroll-animate');

    if (animatedElements.length > 0) {
        // console.log("Found elements to animate for IntersectionObserver:", animatedElements);

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.01
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                // console.log(`Intersection for ${entry.target.id || entry.target.className}: ${entry.isIntersecting}`);
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // console.log("Added 'is-visible' class to:", entry.target.id || entry.target.classList[0] || entry.target.tagName);
                } else {
                    entry.target.classList.remove('is-visible');
                    // console.log("Removed 'is-visible' class from:", entry.target.id || entry.target.classList[0] || entry.target.tagName);
                }
            });
        };

        const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);

        animatedElements.forEach(el => {
            // console.log("Observing element:", el.id || el.classList[0] || el.tagName);
            scrollObserver.observe(el);
        });

    } else {
        console.log("No elements with class '.js-scroll-animate' found to observe at time of init.");
    }
}

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

function displaySkills(skillsData, container) {
    container.innerHTML = ''; // Clear previous content

    if (!skillsData || !Array.isArray(skillsData) || skillsData.length === 0) {
        container.innerHTML = '<p>No skills to display at the moment.</p>';
        return;
    }

    skillsData.forEach(skill => {
        const skillItem = document.createElement('div');
        skillItem.classList.add('skill-item');

        if (skill.logoUrl) {
            const skillLogo = document.createElement('img');
            skillLogo.classList.add('skill-logo');
            skillLogo.src = skill.logoUrl;
            skillLogo.alt = skill.name ? skill.name + " logo" : "Skill logo";
            skillItem.appendChild(skillLogo);
        }

        if (skill.name) {
            const skillName = document.createElement('p');
            skillName.classList.add('skill-name');
            skillName.textContent = skill.name;
            skillItem.appendChild(skillName);
        }

        // Only append if the item is not empty
        if (skillItem.hasChildNodes()) {
             container.appendChild(skillItem);
        }
    });
    // Call positionSkillsInCloud again IF skills were just added and it's not the initial DOMContentLoaded call
    // This ensures that if displaySkills is called at other times, positions are updated.
    // However, the primary call is after fetch in DOMContentLoaded.
    // if (document.readyState === 'complete' && container.children.length > 0) {
    //    positionSkillsInCloud();
    // }
}

function displayExperience(experienceData, container) {
    container.innerHTML = ''; // Clear previous hardcoded content

    if (!experienceData || !Array.isArray(experienceData) || experienceData.length === 0) {
        container.innerHTML = '<p>No work experience to display at the moment.</p>';
        return;
    }

    experienceData.forEach((exp, index) => { // Added index here
        const item = document.createElement('div');
        item.classList.add('timeline-item');
        item.classList.add('js-scroll-animate'); // ADDED - base animation class

        // ADDED - directional animation class
        if (index % 2 === 0) { // 0, 2, 4... are effectively :nth-child(odd) -> slide from left
            item.classList.add('slide-from-left');
        } else { // 1, 3, 5... are effectively :nth-child(even) -> slide from right
            item.classList.add('slide-from-right');
        }

        const dates = document.createElement('p');
        dates.classList.add('timeline-dates');
        dates.textContent = `${exp.startDate} – ${exp.endDate}`;
        item.appendChild(dates);

        const marker = document.createElement('div');
        marker.classList.add('timeline-marker');
        item.appendChild(marker);

        const content = document.createElement('div');
        content.classList.add('timeline-content');

        const heading = document.createElement('h3');
        heading.classList.add('timeline-company');
        // Ensure all parts of the heading are defined before creating text content
        const role = exp.role || 'N/A';
        const company = exp.company || 'N/A';
        const location = exp.location || 'N/A';
        heading.textContent = `${role}, ${company}, ${location}`;
        content.appendChild(heading);

        if (exp.details && exp.details.length > 0) {
            const detailsDiv = document.createElement('div');
            detailsDiv.classList.add('timeline-details');
            exp.details.forEach(detail => {
                if (detail.title) {
                    const detailTitle = document.createElement('h4');
                    detailTitle.textContent = detail.title;
                    detailsDiv.appendChild(detailTitle);
                }
                if (detail.points && detail.points.length > 0) {
                    const pointsUl = document.createElement('ul');
                    detail.points.forEach(pointText => {
                        const pointLi = document.createElement('li');
                        pointLi.textContent = pointText;
                        pointsUl.appendChild(pointLi);
                    });
                    detailsDiv.appendChild(pointsUl);
                }
            });
            content.appendChild(detailsDiv);
        }
        item.appendChild(content);
        container.appendChild(item);
    });
}

function displayContributions(contributionsData, container) {
    container.innerHTML = ''; // Clear existing content

    if (!contributionsData || !contributionsData.contributions || contributionsData.contributions.length === 0) {
        container.innerHTML = '<p>No contributions to display at the moment.</p>';
        return;
    }

    contributionsData.contributions.forEach(contribution => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'contribution-item'; // Added a class for potential styling

        const projectName = document.createElement('h3');
        if (contribution.projectUrl) {
            const link = document.createElement('a');
            link.href = contribution.projectUrl;
            link.textContent = contribution.projectName;
            link.target = '_blank'; // Open in new tab
            link.rel = 'noopener noreferrer'; // Security best practice
            projectName.appendChild(link);
        } else {
            projectName.textContent = contribution.projectName;
        }
        itemDiv.appendChild(projectName);

        const description = document.createElement('p');
        description.textContent = contribution.description;
        itemDiv.appendChild(description);

        const role = document.createElement('p');
        // Added <strong> for emphasis on "Role:"
        role.innerHTML = `<strong>Role:</strong> ${contribution.role}`;
        itemDiv.appendChild(role);

        container.appendChild(itemDiv);
    });
}
