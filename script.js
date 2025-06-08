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
