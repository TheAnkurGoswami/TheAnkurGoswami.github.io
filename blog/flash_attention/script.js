document.addEventListener('DOMContentLoaded', () => {
    // --- Global State and Parameters ---
    let q_proj, k_proj, v_proj, k_T_proj, max_logits, softmax_normalizers, output;
    const block_size_q = 2;
    const block_size_kv = 3;
    let seq_len, d_model, n_blocks_q, n_blocks_kv, total_steps;
    let current_step = -1;

    // --- DOM Elements (The One True Set) ---
    const resetBtn = document.getElementById('reset-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const stepInfo = document.getElementById('step-info');
    const qMatrixContainer = document.getElementById('q-matrix');
    const kMatrixContainer = document.getElementById('k-matrix');
    const logitsMatrixContainer = document.getElementById('logits-matrix');
    const maxLogitMatrixContainer = document.getElementById('max-logit-matrix');
    const rowSumMatrixContainer = document.getElementById('row-sum-matrix');
    const outputMatrixContainer = document.getElementById('output-matrix');
    const sBlockForMCalcContainer = document.getElementById('s-block-for-m-calc');
    const mBlockResultContainer = document.getElementById('m-block-result');
    const sBlockDisplayContainer = document.getElementById('s-block-display');
    const mBlockDisplayContainer = document.getElementById('m-block-display');
    const sMinusMMatrixContainer = document.getElementById('s-minus-m-matrix');
    const pMatrixContainer = document.getElementById('p-matrix');
    const pMatrixForLCalcContainer = document.getElementById('p-matrix-for-l-calc');
    const lBlockResultContainer = document.getElementById('l-block-result');
    const mOldContainer = document.getElementById('m-old-matrix');
    const lOldContainer = document.getElementById('l-old-matrix');
    const mBlockContextContainer = document.getElementById('m-block-context');
    const lBlockContextContainer = document.getElementById('l-block-context');
    const mNewContainer = document.getElementById('m-new-matrix');
    const lNewContainer = document.getElementById('l-new-matrix');
    const pMatrixForOCalcContainer = document.getElementById('p-matrix-for-o-calc');
    const vMatrixContainer = document.getElementById('v-matrix');
    const oBlockResultContainer = document.getElementById('o-block-result');
    const oOldContainer = document.getElementById('o-old-matrix');
    const oBlockContextContainer = document.getElementById('o-block-context');
    const oNewContainer = document.getElementById('o-new-matrix');

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
        const v_block = v_proj.slice(start_kv, end_kv);

        const logits = new Array(q_block.length).fill(0).map(() => new Array(k_block.length).fill(0));
        for (let i = 0; i < q_block.length; i++) {
            for (let j = 0; j < k_block.length; j++) {
                let sum = 0;
                for (let k = 0; k < d_model; k++) { sum += q_block[i][k] * k_block[j][k]; }
                logits[i][j] = sum / Math.sqrt(d_model);
            }
        }

        const logits_plot_mat = new Array(seq_len).fill(0).map(() => new Array(seq_len).fill(NaN));
        for (let i = 0; i < logits.length; i++) {
            for (let j = 0; j < logits[0].length; j++) { logits_plot_mat[start_q + i][start_kv + j] = logits[i][j]; }
        }
        
        const block_max_logit = logits.map(row => Math.max(...row));
        const block_max_logit_col = block_max_logit.map(val => [val]);
        const s_minus_m = logits.map((row, i) => row.map(val => val - block_max_logit[i]));
        const p_matrix = s_minus_m.map(row => row.map(val => Math.exp(val)));
        const block_row_sum = p_matrix.map(row => row.reduce((sum, val) => sum + val, 0));
        const block_row_sum_col = block_row_sum.map(val => [val]);
        
        const m_old_slice = max_logits.slice(start_q, end_q).map(row => [...row]);
        const l_old_slice = softmax_normalizers.slice(start_q, end_q).map(row => [...row]);
        const o_old_slice = output.slice(start_q, end_q).map(row => [...row]);

        for (let i = 0; i < q_block.length; i++) {
            const row_idx = start_q + i;
            max_logits[row_idx][0] = Math.max(m_old_slice[i][0], block_max_logit[i]);
        }
        const m_new_slice = max_logits.slice(start_q, end_q);

        for (let i = 0; i < q_block.length; i++) {
            const row_idx = start_q + i;
            const new_max_logit = m_new_slice[i][0];
            const prev_max_logit = m_old_slice[i][0];
            const rescale_factor_prev = Math.exp(prev_max_logit - new_max_logit);
            const rescale_factor_block = Math.exp(block_max_logit[i] - new_max_logit);
            softmax_normalizers[row_idx][0] = (rescale_factor_prev * l_old_slice[i][0]) + (rescale_factor_block * block_row_sum[i]);
        }
        const l_new_slice = softmax_normalizers.slice(start_q, end_q);

        const output_block_curr = new Array(q_block.length).fill(0).map(() => new Array(d_model).fill(0));
        for (let i = 0; i < p_matrix.length; i++) {
            for (let j = 0; j < v_block[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < p_matrix[0].length; k++) { sum += p_matrix[i][k] * v_block[k][j]; }
                output_block_curr[i][j] = sum;
            }
        }
        
        for (let i = 0; i < q_block.length; i++) {
            const row_idx = start_q + i;
            const new_max_logit = m_new_slice[i][0];
            const prev_max_logit = m_old_slice[i][0];
            const rescale_factor_prev = Math.exp(prev_max_logit - new_max_logit);
            const rescale_factor_block = Math.exp(block_max_logit[i] - new_max_logit);
            const new_l = softmax_normalizers[row_idx][0];
            for (let d = 0; d < d_model; d++) {
                const numerator = (l_old_slice[i][0] * rescale_factor_prev * o_old_slice[i][d]) + (rescale_factor_block * output_block_curr[i][d]);
                output[row_idx][d] = numerator / new_l;
            }
        }
        const o_new_slice = output.slice(start_q, end_q);

        // --- Rendering ---
        renderMatrix(maxLogitMatrixContainer, max_logits, 'Max Logit (m)', [start_q, end_q]);
        renderMatrix(rowSumMatrixContainer, softmax_normalizers, 'Row Sum (l)', [start_q, end_q]);
        renderMatrix(outputMatrixContainer, output, 'Output (O)', [start_q, end_q]);
        
        renderMatrix(qMatrixContainer, q_proj, 'Query (Q)', [start_q, end_q]);
        renderMatrix(kMatrixContainer, k_T_proj, 'Key Transposed (K^T)', null, [start_kv, end_kv]);
        renderMatrix(logitsMatrixContainer, logits_plot_mat, 'Logits (S)', [start_q, end_q], [start_kv, end_kv]);

        renderMatrix(sBlockForMCalcContainer, logits, 'S<sub>block</sub>');
        renderMatrix(mBlockResultContainer, block_max_logit_col, 'm<sub>block</sub>');
        
        renderMatrix(sBlockDisplayContainer, logits, 'S<sub>block</sub>');
        renderMatrix(mBlockDisplayContainer, block_max_logit_col, 'm<sub>block</sub>');
        renderMatrix(sMinusMMatrixContainer, s_minus_m, 'Result');
        
        renderMatrix(pMatrixContainer, p_matrix, 'P');
        
        renderMatrix(pMatrixForLCalcContainer, p_matrix, 'P');
        renderMatrix(lBlockResultContainer, block_row_sum_col, 'l<sub>block</sub>');
        
        renderMatrix(mOldContainer, m_old_slice, 'Old m');
        renderMatrix(mBlockContextContainer, block_max_logit_col, 'm<sub>block</sub>');
        renderMatrix(mNewContainer, m_new_slice, 'New m');

        renderMatrix(lOldContainer, l_old_slice, 'Old l');
        renderMatrix(lBlockContextContainer, block_row_sum_col, 'l<sub>block</sub>');
        renderMatrix(lNewContainer, l_new_slice, 'New l');

        renderMatrix(pMatrixForOCalcContainer, p_matrix, 'P');
        renderMatrix(vMatrixContainer, v_proj, 'Value (V)', [start_kv, end_kv]);
        renderMatrix(oBlockResultContainer, output_block_curr, 'O<sub>block</sub>');
        
        renderMatrix(oOldContainer, o_old_slice, 'Old O');
        renderMatrix(oBlockContextContainer, output_block_curr, 'O<sub>block</sub>');
        renderMatrix(oNewContainer, o_new_slice, 'New O');
        
        updateControls(step);
    };
    
    const updateControls = (step) => {
        const display_step = step + 1;
        stepInfo.textContent = `Step: ${display_step} / ${total_steps}`;
        nextStepBtn.disabled = step >= total_steps - 1;
        resetBtn.disabled = step === -1;
    };

    const reset = () => {
        current_step = -1;
        max_logits = new Array(seq_len).fill(0).map(() => [-Infinity]);
        softmax_normalizers = new Array(seq_len).fill(0).map(() => [0]);
        output = new Array(seq_len).fill(0).map(() => new Array(d_model).fill(0));
        
        renderMatrix(maxLogitMatrixContainer, max_logits, 'Max Logit (m)');
        renderMatrix(rowSumMatrixContainer, softmax_normalizers, 'Row Sum (l)');
        renderMatrix(outputMatrixContainer, output, 'Output (O)');
        renderMatrix(qMatrixContainer, q_proj, 'Query (Q)');
        renderMatrix(kMatrixContainer, k_T_proj, 'Key Transposed (K^T)');
        renderMatrix(logitsMatrixContainer, new Array(seq_len).fill(0).map(() => new Array(seq_len).fill(NaN)), 'Logits (S)');
        
        sBlockForMCalcContainer.innerHTML = '<h4>S<sub>block</sub></h4>';
        mBlockResultContainer.innerHTML = '<h4>m<sub>block</sub></h4>';
        sBlockDisplayContainer.innerHTML = '<h4>S<sub>block</sub></h4>';
        mBlockDisplayContainer.innerHTML = '<h4>m<sub>block</sub></h4>';
        sMinusMMatrixContainer.innerHTML = '<h4>Result</h4>';
        pMatrixContainer.innerHTML = '<h4>P</h4>';
        pMatrixForLCalcContainer.innerHTML = '<h4>P</h4>';
        lBlockResultContainer.innerHTML = '<h4>l<sub>block</sub></h4>';
        mOldContainer.innerHTML = '<h4>Old m</h4>';
        mBlockContextContainer.innerHTML = '<h4>m<sub>block</sub></h4>';
        mNewContainer.innerHTML = '<h4>New m</h4>';
        lOldContainer.innerHTML = '<h4>Old l</h4>';
        lBlockContextContainer.innerHTML = '<h4>l<sub>block</sub></h4>';
        lNewContainer.innerHTML = '<h4>New l</h4>';
        pMatrixForOCalcContainer.innerHTML = '<h4>P</h4>';
        vMatrixContainer.innerHTML = '<h4>Value (V)</h4>';
        oBlockResultContainer.innerHTML = '<h4>O<sub>block</sub></h4>';
        oOldContainer.innerHTML = '<h4>Old O</h4>';
        oBlockContextContainer.innerHTML = '<h4>O<sub>block</sub></h4>';
        oNewContainer.innerHTML = '<h4>New O</h4>';

        updateControls(current_step);
    };

    const init = async () => {
        const response = await fetch('data.json');
        const data = await response.json();
        q_proj = data.q_proj;
        k_proj = data.k_proj;
        v_proj = data.v_proj;
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
