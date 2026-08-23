// matrices.js

// --- Intro worked example: "a quick brown fox jumps [over]" ---
const Q_data = [
    [0.12, -0.34, 0.56],
    [-0.23, 0.47, 0.01],
    [0.88, -0.12, 0.03],
    [-0.91, 0.32, -0.05],
    [0.14, 0.99, -0.37],
];
const K_data = [
    [-0.11, 0.33, -0.54],
    [0.05, -0.77, 0.42],
    [-0.02, 0.16, 0.88],
    [0.29, -0.13, 0.37],
    [-0.48, 0.02, 0.11],
];
const V_data = [
    [0.44, -0.22, 0.19],
    [-0.07, 0.60, -0.33],
    [0.12, 0.81, -0.09],
    [-0.55, 0.04, 0.27],
    [0.36, -0.14, 0.05],
];

// New row for "over" — distinct values, not a copy of the previous row.
const Q_prime_data = [...Q_data, [0.67, -0.28, 0.15]];
const K_prime_data = [...K_data, [0.21, 0.58, -0.19]];
const V_prime_data = [...V_data, [-0.31, 0.22, 0.48]];

function exampleMatrix(data, { highlightLastRow = false } = {}) {
    return {
        rows: data.length,
        cols: data[0].length,
        cell: (i, j) => {
            const v = data[i][j].toFixed(2);
            return (highlightLastRow && i === data.length - 1)
                ? `<span class="new-token">${v}</span>`
                : v;
        },
        class: () => "example-cell"
    };
}

export const matrices = {
    Q_example: exampleMatrix(Q_data),
    K_example: exampleMatrix(K_data),
    V_example: exampleMatrix(V_data),
    Q_prime_example: exampleMatrix(Q_prime_data, { highlightLastRow: true }),
    K_prime_example: exampleMatrix(K_prime_data, { highlightLastRow: true }),
    V_prime_example: exampleMatrix(V_prime_data, { highlightLastRow: true }),

    S: {
        rows: 5,
        cols: 5,
        cell: (i, j) => `\\( S_{${i + 1}${j + 1}} \\)`,
        class: () => "s-cell s-ok"
    },


    mask: {
        rows: 5,
        cols: 5,
        cell: (i, j) => (j > i ? "−∞" : "0"),
        class: (i, j) => j > i ? "s-cell s-mask" : "s-cell s-ok"
    },

    S_masked: {
        rows: 5,
        cols: 5,
        cell: (i, j) => (j > i ? "−∞" : `\\( S_{${i + 1}${j + 1}} \\)`),
        class: (i, j) => j > i ? "s-cell s-mask" : "s-cell s-ok"
    },

    A: {
        rows: 5,
        cols: 5,
        cell: (i, j) => {
            // lower triangular incl diagonal
            if (j <= i) {
                return `\\( A_{${i + 1}${j + 1}} \\)`;
            }
            return `0`;
        },
        class: (i, j) => {
            return j <= i ? "s-cell s-ok" : "s-cell s-mask";
        }
    },
    V: {
        rows: 5,
        cols: 3,
        cell: (i, j) => `\\( V_{${i + 1}${j + 1}} \\)`,
        class: () => "s-cell s-ok"
    },
    O: {
        rows: 5,
        cols: 3,
        cell: (i, j) => `\\( O_{${i + 1}${j + 1}} \\)`,
        class: () => "s-cell s-ok"
    },
    S_prime: {
        rows: 6,
        cols: 6,
        cell: (i, j) => `\\( S_{${i + 1}${j + 1}} \\)`,
        class: () => "s-cell s-ok"
    },
    S_prime_overlap: {
        rows: 6,
        cols: 6,
        cell: (i, j) => `\\( S_{${i + 1}${j + 1}} \\)`,

        class: (i, j) => {
            const last = 5; // index 5 = row/col 6

            if (i === last) return "s-cell s-new-row";      // new row
            if (j === last) return "s-cell s-new-col";      // new column
            return "s-cell s-old";                           // old block
        }
    },
    mask_prime: {
        rows: 6,
        cols: 6,
        cell: (i, j) => {
            if (j > i) return "−∞";
            return "0";
        },
        class: (i, j) => (j > i ? "s-cell s-mask" : "s-cell s-ok")
    },
    S_prime_masked: {
        rows: 6,
        cols: 6,
        cell: (i, j) => {
            if (j > i) return "−∞";
            return `\\( S_{${i + 1}${j + 1}} \\)`;
        },
        class: (i, j) => {
            const last = 5;
            if (j > i) {
                if (i === last) return "s-cell s-ok s-new-row";
                if (j === last) return "s-cell s-mask s-new-col";
                return "s-cell s-mask s-old";
            }
            if (i === last) return "s-cell s-ok s-new-row";
            if (j === last) return "s-cell s-mask s-new-col";
            return "s-cell s-ok s-old";
        }
    },
    A_prime: {
        rows: 6,
        cols: 6,

        cell: (i, j) => {
            const last = 5;

            // masked region
            if (j > i && i !== last) return "0";
            if (j === last && i !== last) return "0";

            // active entries
            return `\\( A_{${i + 1}${j + 1}} \\)`;
        },

        class: (i, j) => {
            const last = 5;

            // new row
            if (i === last) return "s-cell s-ok s-new-row";

            // masked column
            if (j === last) return "s-cell s-mask s-new-col";

            // masked upper triangle
            if (j > i) return "s-cell s-mask s-old";

            // old active block
            return "s-cell s-ok s-old";
        }
    },
    V_prime: {
        rows: 6,
        cols: 3,
        cell: (i, j) => `\\( V_{${i + 1}${j + 1}} \\)`,
        class: () => "s-cell s-ok"
    },
    O_prime: {
        rows: 6,
        cols: 3,
        cell: (i, j) => `\\( O_{${i + 1}${j + 1}} \\)`,
        class: () => "s-cell s-ok"
    },


};
