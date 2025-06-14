document.addEventListener('DOMContentLoaded', () => {
    // --- Existing Project, Skills, Experience Loading Logic ---
    // (Copied from original script.js, ensure these are still relevant and working)
    const projectsContainer = document.getElementById('projects-container');
    if (projectsContainer) {
        fetch('projects.json')
            .then(response => response.ok ? response.json() : Promise.reject(response.status))
            .then(data => displayProjects(data, projectsContainer))
            .catch(error => console.error('Failed to load projects.json:', error));
    }

    const skillsGridContainer = document.getElementById('skills-grid');
    if (skillsGridContainer) {
        fetch('skills.json')
            .then(response => response.ok ? response.json() : Promise.reject(response.status))
            .then(data => displaySkills(data, skillsGridContainer))
            .catch(error => console.error('Failed to load skills.json:', error));
    }

    const timelineContainer = document.querySelector('#work-experience .timeline');
    if (timelineContainer) {
        fetch('experience.json')
            .then(response => response.ok ? response.json() : Promise.reject(response.status))
            .then(data => displayExperience(data, timelineContainer)) // Keep existing animation classes for experience items
            .catch(error => console.error('Failed to load experience.json:', error));
    }

    // Typing Animation Logic (from original script)
    const typedElement = document.getElementById('typing-designation');
    if (typedElement) {
        new Typed('#typing-designation', {
            strings: ['AI Researcher', 'Data Scientist'], typeSpeed: 70, backSpeed: 50,
            backDelay: 1500, startDelay: 500, loop: true, smartBackspace: true,
            showCursor: true, cursorChar: '|',
        });
    }

    // Sidebar Toggle Functionality (from original script)
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebar && sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
            sidebarToggle.classList.toggle('active');
            sidebarToggle.setAttribute('aria-expanded', sidebar.classList.contains('expanded'));
        });
    }

    // --- Full Page Scroll Navigation Logic ---
    const sections = [
        document.getElementById('hero'),
        document.getElementById('about'),
        document.getElementById('work-experience'),
        document.getElementById('projects'),
        document.getElementById('skills'),
        document.getElementById('education'),
        document.getElementById('contributions'),
        document.getElementById('contact')
    ].filter(section => section !== null); // Filter out nulls if some sections are missing

    const sidebarLinks = document.querySelectorAll('#sidebar nav a');
    let currentSectionIndex = 0;
    let scrollTimeout;

    if (sections.length === 0) {
        console.error("No sections found for full page scroll navigation.");
        return;
    }

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function updateSidebar(activeIndex) {
        sidebarLinks.forEach((link, index) => {
            if (index === activeIndex) {
                link.classList.add('active'); // Add 'active' class to current section's link
            } else {
                link.classList.remove('active');
            }
        });
    }

    function changeSection(newIndex) {
        if (newIndex === currentSectionIndex || newIndex < 0 || newIndex >= sections.length) {
            return; // No change or out of bounds
        }

        const currentSection = sections[currentSectionIndex];
        const newSection = sections[newIndex];

        currentSection.classList.remove('active-section');
        // currentSection.style.zIndex = 0; // Managed by active-section class removal

        newSection.classList.add('active-section');
        // newSection.style.zIndex = 1; // Managed by active-section class

        currentSectionIndex = newIndex;
        window.location.hash = newSection.id;
        updateSidebar(currentSectionIndex);
    }

    function handleScroll(event) {
        event.preventDefault(); // Prevent default window scroll

        let newIndex = currentSectionIndex;
        if (event.deltaY > 0) { // Scrolling down
            if (currentSectionIndex < sections.length - 1) {
                newIndex++;
            }
        } else { // Scrolling up
            if (currentSectionIndex > 0) {
                newIndex--;
            }
        }
        changeSection(newIndex);
    }

    const debouncedScrollHandler = debounce(handleScroll, 150); // Adjust delay as needed

    // Initial setup
    document.body.style.overflow = 'hidden'; // Prevent body scrollbar
    if (sections.length > 0) {
        // Check hash on load
        const hash = window.location.hash.substring(1);
        const hashIndex = sections.findIndex(s => s.id === hash);
        if (hashIndex !== -1) {
            currentSectionIndex = hashIndex;
        }
        sections[currentSectionIndex].classList.add('active-section');
        updateSidebar(currentSectionIndex);
    }

    window.addEventListener('wheel', debouncedScrollHandler, { passive: false });

    // Modify existing sidebar link click handlers
    if (sidebarLinks.length > 0 && sidebar && sidebarToggle) {
        sidebarLinks.forEach((link, index) => { // Assuming link order matches section order
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetIndex = sections.findIndex(s => s.id === targetId);

                if (targetIndex !== -1 && targetIndex !== currentSectionIndex) {
                    changeSection(targetIndex);
                }

                // Close the sidebar after clicking a link
                if (sidebar.classList.contains('expanded')) {
                    sidebar.classList.remove('expanded');
                    sidebarToggle.classList.remove('active');
                    sidebarToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    /* // --- Commenting out the old scroll animation system ---
    setTimeout(initializeScrollAnimations, 500);
    */
});

/*
// --- Old scroll animation system (Commented Out) ---
function initializeScrollAnimations() {
    const animatedElements = document.querySelectorAll('.js-scroll-animate');

    if (animatedElements.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.01
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                } else {
                    // Optional: remove class if you want animation to reverse when scrolling out
                    // entry.target.classList.remove('is-visible');
                }
            });
        };

        const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
        animatedElements.forEach(el => scrollObserver.observe(el));
    }
}
*/

// --- displayProjects, displaySkills, displayExperience functions (Copied from original script.js) ---
// Ensure these functions are defined in the global scope or passed around if needed by fetched data.
// For displayExperience, the js-scroll-animate classes are still added. These might need adjustment
// if they interfere with the full-page transitions or if their visibility logic is no longer desired.

function displayProjects(projectsData, container) {
    container.innerHTML = '';
    if (!projectsData || !Array.isArray(projectsData) || projectsData.length === 0) {
        container.innerHTML = '<p>No projects to display.</p>'; return;
    }
    projectsData.forEach(project => {
        const el = document.createElement('div'); el.classList.add('project');
        if (project.imageUrl) {
            const img = document.createElement('img'); img.src = project.imageUrl;
            img.alt = project.title ? project.title + " image" : "Project image";
            el.appendChild(img);
        }
        const content = document.createElement('div'); content.classList.add('project-card-content');
        if (project.title) { const h2 = document.createElement('h2'); h2.textContent = project.title; content.appendChild(h2); }
        if (project.description) { const p = document.createElement('p'); p.textContent = project.description; content.appendChild(p); }
        if (project.technologies && project.technologies.length > 0) {
            const techs = document.createElement('div'); techs.classList.add('project-technologies');
            project.technologies.forEach(t => { const s = document.createElement('span'); s.classList.add('tech-tag'); s.textContent = t; techs.appendChild(s); });
            content.appendChild(techs);
        }
        if (project.tags && project.tags.length > 0) {
            const tags = document.createElement('div'); tags.classList.add('project-tags');
            project.tags.forEach(t => { const s = document.createElement('span'); s.classList.add('tag'); s.textContent = t; tags.appendChild(s); });
            content.appendChild(tags);
        }
        const links = document.createElement('div'); links.classList.add('project-links'); let hasL = false;
        if (project.repoUrl) { const a = document.createElement('a'); a.href = project.repoUrl; a.textContent = 'View Repo'; a.target = '_blank'; links.appendChild(a); hasL = true; }
        if (project.liveUrl) { if(hasL) links.appendChild(document.createTextNode(' | ')); const a = document.createElement('a'); a.href = project.liveUrl; a.textContent = 'Live Demo'; a.target = '_blank'; links.appendChild(a); hasL = true; }
        if(hasL) content.appendChild(links);
        el.appendChild(content); container.appendChild(el);
    });
}

function displaySkills(skillsData, container) {
    container.innerHTML = '';
    if (!skillsData || !Array.isArray(skillsData) || skillsData.length === 0) {
        container.innerHTML = '<p>No skills to display.</p>'; return;
    }
    skillsData.forEach(skill => {
        const item = document.createElement('div'); item.classList.add('skill-item');
        if (skill.logoUrl) { const img = document.createElement('img'); img.classList.add('skill-logo'); img.src = skill.logoUrl; img.alt = skill.name ? skill.name + " logo" : "Skill logo"; item.appendChild(img); }
        if (skill.name) { const p = document.createElement('p'); p.classList.add('skill-name'); p.textContent = skill.name; item.appendChild(p); }
        if (item.hasChildNodes()) container.appendChild(item);
    });
}

function displayExperience(experienceData, container) {
    container.innerHTML = '';
    if (!experienceData || !Array.isArray(experienceData) || experienceData.length === 0) {
        container.innerHTML = '<p>No work experience to display.</p>'; return;
    }
    experienceData.forEach((exp, index) => {
        const item = document.createElement('div'); item.classList.add('timeline-item');
        // Keep existing scroll animations for individual timeline items if desired.
        // These animate *within* the work-experience section.
        item.classList.add('js-scroll-animate');
        if (index % 2 === 0) item.classList.add('slide-from-left');
        else item.classList.add('slide-from-right');

        const dates = document.createElement('p'); dates.classList.add('timeline-dates'); dates.textContent = `${exp.startDate} – ${exp.endDate}`; item.appendChild(dates);
        const marker = document.createElement('div'); marker.classList.add('timeline-marker'); item.appendChild(marker);
        const content = document.createElement('div'); content.classList.add('timeline-content');
        const h3 = document.createElement('h3'); h3.classList.add('timeline-company');
        h3.textContent = `${exp.role || 'N/A'}, ${exp.company || 'N/A'}, ${exp.location || 'N/A'}`; content.appendChild(h3);
        if (exp.details && exp.details.length > 0) {
            const detailsDiv = document.createElement('div'); detailsDiv.classList.add('timeline-details');
            exp.details.forEach(detail => {
                if (detail.title) { const h4 = document.createElement('h4'); h4.textContent = detail.title; detailsDiv.appendChild(h4); }
                if (detail.points && detail.points.length > 0) {
                    const ul = document.createElement('ul');
                    detail.points.forEach(pt => { const li = document.createElement('li'); li.textContent = pt; ul.appendChild(li); });
                    detailsDiv.appendChild(ul);
                }
            });
            content.appendChild(detailsDiv);
        }
        item.appendChild(content); container.appendChild(item);
    });

    // Re-initialize the IntersectionObserver for these newly added .js-scroll-animate elements
    // This part is tricky because initializeScrollAnimations was fully commented out.
    // For the experience items to still animate, that logic needs to be callable here.
    // For now, this might mean those animations won't work unless initializeScrollAnimations is restored
    // and made smarter to only apply to elements *within* sections, not the sections themselves.
    // A simpler immediate fix is to remove 'js-scroll-animate' from experience items if we don't want to fix this now.
    // OR, we can define a more targeted scroll animation initializer here.
    initializeInternalScrollAnimations(container);

}

// More targeted scroll animation initializer for dynamic content within sections
function initializeInternalScrollAnimations(parentElement) {
    const animatedElements = parentElement.querySelectorAll('.js-scroll-animate');
    if (animatedElements.length > 0) {
        const observerOptions = {
            root: null, // observes intersections relative to the viewport
            rootMargin: '0px',
            threshold: 0.1 // visible by 10%
        };
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // observer.unobserve(entry.target); // Optional: stop observing once visible
                } else {
                     entry.target.classList.remove('is-visible'); // Re-animate if it goes out of view and back
                }
            });
        };
        const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
        animatedElements.forEach(el => scrollObserver.observe(el));
    }
}
