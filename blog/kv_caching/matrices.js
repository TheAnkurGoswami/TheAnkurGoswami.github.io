// matrices.js
export const matrices = {
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
        cell: (i, j) => `\\( O'_{${i + 1}${j + 1}} \\)`,
        class: () => "s-cell s-ok"
    },


};
