// Entry point for the home page. Each section lives in its own module
// and renders into its own <section>; a failure in one does not stop the rest.

const sections = [];

for (const load of sections) {
  load().catch(err => console.error(err));
}
