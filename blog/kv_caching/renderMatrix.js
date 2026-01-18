export function renderMatrix(container, spec) {
  const table = document.createElement("table");

  for (let i = 0; i < spec.rows; i++) {
    const tr = document.createElement("tr");
    for (let j = 0; j < spec.cols; j++) {
      const td = document.createElement("td");
      td.className = spec.class(i, j);
      td.innerHTML = spec.cell(i, j); // MathJax LaTeX
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  // Insert table BEFORE caption (caption already exists)
  container.insertBefore(table, container.firstChild);
}

