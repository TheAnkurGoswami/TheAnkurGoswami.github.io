document.addEventListener('DOMContentLoaded', () => {
    // --- Global State and Parameters ---
    let q_proj, k_proj, k_T_proj, max_logits, softmax_normalizers;
    const block_size_q = 2;
    const block_size_kv = 3;
    let seq_len, d_model, n_blocks_q, n_blocks_kv, total_steps;
    let current_step = -1; // -1 means initial state, before step 0

    // --- DOM Elements ---
    const resetBtn = document.getElementById('reset-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const stepInfo = document.getElementById('step-info');
    const qMatrixContainer = document.getElementById('q-matrix');
    const kMatrixContainer = document.getElementById('k-matrix');
    const logitsMatrixContainer = document.getElementById('logits-matrix');
    const maxLogitMatrixContainer = document.getElementById('max-logit-matrix');
    const rowSumMatrixContainer = document.getElementById('row-sum-matrix');
    const mOldContainer = document.getElementById('m-old-matrix');
    const lOldContainer = document.getElementById('l-old-matrix');
    const blockMaxLogitContextContainer = document.getElementById('block-max-logit-context');
    const blockRowSumContextContainer = document.getElementById('block-row-sum-context');
    const mNewContainer = document.getElementById('m-new-matrix');
    const lNewContainer = document.getElementById('l-new-matrix');

    // --- Utility Functions ---
    const transpose = (matrix) => matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));

    const renderMatrix = (container, data, title, highlightRow = null, highlightCol = null) => {
        if (!container || !data) return;
        let table = '<table>';
        for (let i = 0; i < data.length; i++) {
            const rowClass = (highlightRow && i >= highlightRow[0] && i < highlightRow[1]) ? 'highlight-row' : '';
            table += `<tr class="${rowClass}">`;
            for (let j = 0; j < data[0].length; j++) {
                const colClass = (highlightCol && j >= highlightCol[0] && j < highlightCol[1]) ? 'highlight-col' : '';
                const cellValue = data[i][j] === -Infinity ? '-&infin;' : (data[i][j] != null && !isNaN(data[i][j]) ? data[i][j].toFixed(2) : '');
                table += `<td class="${colClass}">${cellValue}</td>`;
            }
            table += '</tr>';
        }
        table += '</table>';
        container.innerHTML = `<h4>${title}</h4>${table}`;
    };

    // --- Core Logic ---
    const calculateAndRender = (step) => {
        if (step >= total_steps) return;

        const blockQ = step % n_blocks_q;
        const blockKV = Math.floor(step / n_blocks_q);

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
        
        const block_max_logit = logits.map(row => Math.max(...row));
        const block_max_logit_col = block_max_logit.map(val => [val]);
        
        const m_old_slice = JSON.parse(JSON.stringify(max_logits.slice(start_q, end_q)));
        
        for (let i = 0; i < q_block.length; i++) {
            const row_idx = start_q + i;
            const prev_max_logit = max_logits[row_idx][0];
            const current_block_max_logit = block_max_logit[i];
            max_logits[row_idx][0] = Math.max(prev_max_logit, current_block_max_logit);
        }

        const m_new_slice = max_logits.slice(start_q, end_q);
        
        // --- Rendering for m update ---
        renderMatrix(mOldContainer, m_old_slice, 'Old m');
        renderMatrix(blockMaxLogitContextContainer, block_max_logit_col, 'Block Max');
        renderMatrix(mNewContainer, m_new_slice, 'New m');


        // --- Second part of calculation for l update ---
        const p_matrix = logits.map((row, i) => row.map(val => Math.exp(val - block_max_logit[i])));
        const block_row_sum = p_matrix.map(row => row.reduce((sum, val) => sum + val, 0));
        const block_row_sum_col = block_row_sum.map(val => [val]);

        const l_old_slice = JSON.parse(JSON.stringify(softmax_normalizers.slice(start_q, end_q)));
        
        for (let i = 0; i < q_block.length; i++) {
            const row_idx = start_q + i;
            const new_max_logit = max_logits[row_idx][0];
            const prev_max_logit = m_old_slice[i][0]; // Use the value from before the update
            
            const rescale_factor_prev = Math.exp(prev_max_logit - new_max_logit);
            const rescale_factor_block = Math.exp(block_max_logit[i] - new_max_logit);
            
            const block_rowsum_old = softmax_normalizers[row_idx][0];
            const current_block_row_sum = block_row_sum[i];
            
            softmax_normalizers[row_idx][0] = (rescale_factor_prev * block_rowsum_old) + (rescale_factor_block * current_block_row_sum);
        }

        const l_new_slice = softmax_normalizers.slice(start_q, end_q);

        // --- Final Rendering ---
        renderMatrix(maxLogitMatrixContainer, max_logits, 'Max Logit (m)', [start_q, end_q]);
        renderMatrix(rowSumMatrixContainer, softmax_normalizers, 'Row Sum (l)', [start_q, end_q]);
        
        renderMatrix(qMatrixContainer, q_proj, 'Query (Q)', [start_q, end_q]);
        renderMatrix(kMatrixContainer, k_T_proj, 'Key Transposed (K^T)', null, [start_kv, end_kv]);
        renderMatrix(logitsMatrixContainer, logits_plot_mat, 'Logits (S)', [start_q, end_q], [start_kv, end_kv]);

        renderMatrix(lOldContainer, l_old_slice, 'Old l');
        renderMatrix(blockRowSumContextContainer, block_row_sum_col, 'Block Row Sum');
        renderMatrix(lNewContainer, l_new_slice, 'New l');
    };
    
    const updateControls = (step) => {
        const display_step = step + 1;
        stepInfo.textContent = `Step: ${display_step} / ${total_steps}`;

        if (step === -1) { // Initial state
            stepInfo.textContent = `Step: 0 / ${total_steps}`;
            resetBtn.disabled = true;
        } else {
            resetBtn.disabled = false;
        }
        
        nextStepBtn.disabled = step >= total_steps - 1;
    };

    const reset = () => {
        current_step = -1;
        max_logits = new Array(seq_len).fill(0).map(() => [-Infinity]);
        softmax_normalizers = new Array(seq_len).fill(0).map(() => [0]);
        
        renderMatrix(maxLogitMatrixContainer, max_logits, 'Max Logit (m)');
        renderMatrix(rowSumMatrixContainer, softmax_normalizers, 'Row Sum (l)');
        renderMatrix(qMatrixContainer, q_proj, 'Query (Q)');
        renderMatrix(kMatrixContainer, k_T_proj, 'Key Transposed (K^T)');
        renderMatrix(logitsMatrixContainer, new Array(seq_len).fill(0).map(() => new Array(seq_len).fill(NaN)), 'Logits (S)');
        
        mOldContainer.innerHTML = '<h4>Old m</h4>';
        blockMaxLogitContextContainer.innerHTML = '<h4>Block Max</h4>';
        mNewContainer.innerHTML = '<h4>New m</h4>';
        lOldContainer.innerHTML = '<h4>Old l</h4>';
        blockRowSumContextContainer.innerHTML = '<h4>Block Sum</h4>';
        lNewContainer.innerHTML = '<h4>New l</h4>';

        updateControls(current_step);
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
        total_steps = n_blocks_q * n_blocks_kv;
        
        nextStepBtn.addEventListener('click', () => {
            current_step++;
            if (current_step < total_steps) {
                calculateAndRender(current_step);
                updateControls(current_step);
            }
        });
        
        resetBtn.addEventListener('click', reset);

        reset();
    };

    init();
});
