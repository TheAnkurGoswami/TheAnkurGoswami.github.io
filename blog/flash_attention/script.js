document.addEventListener('DOMContentLoaded', () => {
    // --- Global State and Parameters ---
    let q_proj, k_proj, k_T_proj;
    const block_size_q = 2;
    const block_size_kv = 3;
    let seq_len, d_model, n_blocks_q, n_blocks_kv;
    let blockQ = 0;
    let blockKV = 0;

    // --- DOM Elements ---
    const qMatrixContainer = document.getElementById('q-matrix');
    const kMatrixContainer = document.getElementById('k-matrix');
    const logitsMatrixContainer = document.getElementById('logits-matrix');
    const qBlockInfo = document.getElementById('q-block-info');
    const kvBlockInfo = document.getElementById('kv-block-info');
    const prevQBtn = document.getElementById('prev-q');
    const nextQBtn = document.getElementById('next-q');
    const prevKVBtn = document.getElementById('prev-kv');
    const nextKVBtn = document.getElementById('next-kv');

    // --- Utility Functions ---
    const transpose = (matrix) => {
        return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    };

    const renderMatrix = (container, data, title, highlightRow = null, highlightCol = null) => {
        let table = '<table>';
        for (let i = 0; i < data.length; i++) {
            const rowClass = (highlightRow && i >= highlightRow[0] && i < highlightRow[1]) ? 'highlight-row' : '';
            table += `<tr class="${rowClass}">`;
            for (let j = 0; j < data[0].length; j++) {
                const colClass = (highlightCol && j >= highlightCol[0] && j < highlightCol[1]) ? 'highlight-col' : '';
                const cellValue = !isNaN(data[i][j]) ? data[i][j].toFixed(2) : '';
                table += `<td class="${colClass}">${cellValue}</td>`;
            }
            table += '</tr>';
        }
        table += '</table>';
        container.innerHTML = `<h4>${title}</h4>${table}`;
    };

    // --- Core Logic ---
    const calculateAndRender = () => {
        const start_q = blockQ * block_size_q;
        const end_q = Math.min(start_q + block_size_q, seq_len);
        const q_block = q_proj.slice(start_q, end_q);

        const start_kv = blockKV * block_size_kv;
        const end_kv = Math.min(start_kv + block_size_kv, seq_len);
        const k_block = k_proj.slice(start_kv, end_kv);

        const logits = new Array(q_block.length).fill(0).map(() => new Array(k_block.length).fill(0));
        for (let i = 0; i < q_block.length; i++) {
            for (let j = 0; j < k_block.length; j++) {
                let sum = 0;
                for (let k = 0; k < d_model; k++) {
                    sum += q_block[i][k] * k_block[j][k];
                }
                logits[i][j] = sum / Math.sqrt(d_model);
            }
        }

        const logits_plot_mat = new Array(seq_len).fill(0).map(() => new Array(seq_len).fill(NaN));
        for (let i = 0; i < logits.length; i++) {
            for (let j = 0; j < logits[0].length; j++) {
                logits_plot_mat[start_q + i][start_kv + j] = logits[i][j];
            }
        }

        renderMatrix(qMatrixContainer, q_proj, 'Query (Q)', [start_q, end_q]);
        renderMatrix(kMatrixContainer, k_T_proj, 'Key Transposed (K^T)', null, [start_kv, end_kv]);
        renderMatrix(logitsMatrixContainer, logits_plot_mat, 'Logits (S)', [start_q, end_q], [start_kv, end_kv]);
        
        updateControls();
    };
    
    const updateControls = () => {
        qBlockInfo.textContent = `Q Block: ${blockQ} / ${n_blocks_q - 1}`;
        kvBlockInfo.textContent = `K Block: ${blockKV} / ${n_blocks_kv - 1}`;
        prevQBtn.disabled = blockQ === 0;
        nextQBtn.disabled = blockQ === n_blocks_q - 1;
        prevKVBtn.disabled = blockKV === 0;
        nextKVBtn.disabled = blockKV === n_blocks_kv - 1;
    };

    // --- Initialization ---
    const init = async () => {
        const response = await fetch('data.json');
        const data = await response.json();
        q_proj = data.q_proj;
        k_proj = data.k_proj;
        k_T_proj = transpose(k_proj);
        
        seq_len = q_proj.length;
        d_model = q_proj[0].length;
        n_blocks_q = Math.ceil(seq_len / block_size_q);
        n_blocks_kv = Math.ceil(seq_len / block_size_kv);

        prevQBtn.addEventListener('click', () => {
            if (blockQ > 0) {
                blockQ--;
                calculateAndRender();
            }
        });
        nextQBtn.addEventListener('click', () => {
            if (blockQ < n_blocks_q - 1) {
                blockQ++;
                calculateAndRender();
            }
        });
        prevKVBtn.addEventListener('click', () => {
            if (blockKV > 0) {
                blockKV--;
                calculateAndRender();
            }
        });
        nextKVBtn.addEventListener('click', () => {
            if (blockKV < n_blocks_kv - 1) {
                blockKV++;
                calculateAndRender();
            }
        });

        calculateAndRender();
    };

    init();
});
