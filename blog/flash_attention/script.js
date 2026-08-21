document.addEventListener('DOMContentLoaded', () => {
    // --- Global State and Parameters ---
    // These variables hold the core data and state for the Flash Attention calculation.
    let q_proj, k_proj, v_proj, k_T_proj, max_logits, softmax_normalizers, output; // Matrices
    const block_size_q = 2; // Size of query blocks
    const block_size_kv = 3; // Size of key/value blocks
    let seq_len, d_model, n_blocks_q, n_blocks_kv, total_steps; // Dimensions and step counts
    let current_step = -1; // Tracks the current step of the algorithm visualization.

    // --- DOM Element Caching ---
    // Caching all necessary DOM elements upfront for performance.
    const resetBtn = document.getElementById('reset-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const stepInfo = document.getElementById('step-info');
    const progressFill = document.getElementById('progress-fill');
    const playBtn = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    let playInterval = null;
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
    const lBlockResultContainer = document.getElementById('l-block-result');
    const mOldContainer = document.getElementById('m-old-matrix');
    const lOldContainer = document.getElementById('l-old-matrix');
    const mBlockContextContainer = document.getElementById('m-block-context');
    const lBlockContextContainer = document.getElementById('l-block-context');
    const mNewContainer = document.getElementById('m-new-matrix');
    const lNewContainer = document.getElementById('l-new-matrix');
    const mOldForLCalcContainer = document.getElementById('m-old-for-l-calc');
    const mNewForLCalcContainer = document.getElementById('m-new-for-l-calc');
    const mNewForLCalc2Container = document.getElementById('m-new-for-l-calc-2');
    const mBlockForLCalcContainer = document.getElementById('m-block-for-l-calc');
    
    // O-update containers
    const pMatrixForOIntermediate = document.getElementById('p-matrix-for-o-calc');
    const vMatrixForOIntermediate = document.getElementById('v-matrix');
    const oBlockResultContainer = document.getElementById('o-block-result');
    const oBlockForOCalc = document.getElementById('o-block-for-o-calc');
    const lOldForOCalc = document.getElementById('l-old-for-o-calc');
    const mOldForOCalc = document.getElementById('m-old-for-o-calc');
    const mNewForOCalc = document.getElementById('m-new-for-o-calc');
    const mBlockForOCalc = document.getElementById('m-block-for-o-calc');
    const mNewForOCalc2 = document.getElementById('m-new-for-o-calc-2');
    const lNewForOCalc = document.getElementById('l-new-for-o-calc');
    const oOldContainer = document.getElementById('o-old-matrix'); // Reused
    const oNewContainer = document.getElementById('o-new-matrix'); // Reused
    
    // --- Utility Functions ---
    /**
     * Transposes a 2D array (matrix).
     * @param {Array<Array<number>>} matrix The matrix to transpose.
     * @returns {Array<Array<number>>} The transposed matrix.
     */
    const transpose = (matrix) => matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));

    /**
     * Renders a matrix (2D array) as an HTML table within a given container.
     * @param {HTMLElement} container - The DOM element to render the table into.
     * @param {Array<Array<number>>} data - The matrix data to display.
     * @param {string} title - The title to display above the matrix.
     * @param {Array<number>|null} [highlightRow=null] - A tuple [start, end] to highlight rows.
     * @param {Array<number>|null} [highlightCol=null] - A tuple [start, end] to highlight columns.
     */
    const renderMatrix = (container, data, title, highlightRow = null, highlightCol = null) => {
        if (!container || !data) return;

        // Snapshot the previously-rendered cell values so we can flag which
        // ones are about to change, before the table gets replaced below.
        const prevValues = Array.from(container.querySelectorAll('td')).map(td => td.textContent);
        let cellIndex = 0;

        let table = '<table>';
        for (let i = 0; i < data.length; i++) {
            const rowClass = (highlightRow && i >= highlightRow[0] && i < highlightRow[1]) ? 'highlight-row' : '';
            table += `<tr class="${rowClass}">`;
            for (let j = 0; j < data[0].length; j++) {
                const colClass = (highlightCol && j >= highlightCol[0] && j < highlightCol[1]) ? 'highlight-col' : '';
                const cellValue = data[i][j] === -Infinity ? '-∞' : (data[i][j] != null && !isNaN(data[i][j]) ? data[i][j].toFixed(2) : '');
                const prevValue = prevValues[cellIndex];
                const changed = prevValue !== undefined && prevValue !== '' && cellValue !== '' && prevValue !== cellValue;
                cellIndex++;
                table += `<td class="${colClass}${changed ? ' cell-glow' : ''}">${cellValue}</td>`;
            }
            table += '</tr>';
        }
        table += '</table>';
        container.innerHTML = `<h4>${title}</h4>${table}`;
    };

    // --- Core Logic ---
    /**
     * Performs one step of the Flash Attention calculation and renders the results.
     * This function calculates the logits, updates the running max logit (m),
     * the softmax normalizer (l), and the output (O) for the current block
     * of the query and key-value matrices. It then calls renderMatrix to display
     * all intermediate and final results for the current step.
     * @param {number} step - The current step in the overall calculation process.
     */
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
        
        renderMatrix(lBlockResultContainer, block_row_sum_col, 'l<sub>block</sub>');
        
        renderMatrix(mOldContainer, m_old_slice, 'm<sub>old</sub>');
        renderMatrix(mBlockContextContainer, block_max_logit_col, 'm<sub>block</sub>');
        renderMatrix(mNewContainer, m_new_slice, 'm<sub>new</sub>');

        // L-update rendering
        renderMatrix(lNewContainer, l_new_slice, 'l<sub>new</sub>');
        renderMatrix(mOldForLCalcContainer, m_old_slice, '');
        renderMatrix(mNewForLCalcContainer, m_new_slice, '');
        renderMatrix(lOldContainer, l_old_slice, '');
        renderMatrix(mBlockForLCalcContainer, block_max_logit_col, '');
        renderMatrix(mNewForLCalc2Container, m_new_slice, '');
        renderMatrix(lBlockContextContainer, block_row_sum_col, '');

        // O-update rendering
        // Intermediate P@V
        renderMatrix(pMatrixForOIntermediate, p_matrix, 'P');
        renderMatrix(vMatrixForOIntermediate, v_proj, 'V', [start_kv, end_kv]);
        renderMatrix(oBlockResultContainer, output_block_curr, 'O<sub>block</sub>');

        // Final fraction
        renderMatrix(oNewContainer, o_new_slice, 'O<sub>new</sub>');
        renderMatrix(lOldForOCalc, l_old_slice, '');
        renderMatrix(mOldForOCalc, m_old_slice, '');
        renderMatrix(mNewForOCalc, m_new_slice, '');
        renderMatrix(oOldContainer, o_old_slice, '');
        renderMatrix(mBlockForOCalc, block_max_logit_col, '');
        renderMatrix(mNewForOCalc2, m_new_slice, '');
        renderMatrix(oBlockForOCalc, output_block_curr, '');
        renderMatrix(lNewForOCalc, l_new_slice, '');
        
        updateControls(step);
    };
    
    /**
     * Updates the UI controls (step counter, next/reset buttons).
     * @param {number} step - The current step number.
     */
    const updateControls = (step) => {
        const display_step = step + 1;
        stepInfo.textContent = `Step: ${display_step} / ${total_steps}`;
        nextStepBtn.disabled = step >= total_steps - 1;
        resetBtn.disabled = step === -1;
        if (playBtn) playBtn.disabled = step >= total_steps - 1;
        if (progressFill) {
            const progress = step < 0 ? 0 : (display_step / total_steps) * 100;
            progressFill.style.width = `${progress}%`;
        }
        if (step >= total_steps - 1) {
            stopPlaying();
        }
    };

    /**
     * Stops auto-play, if running, and restores the Play button's icon.
     */
    const stopPlaying = () => {
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
        }
        if (playBtn) {
            playBtn.classList.remove('is-playing');
            playBtn.setAttribute('aria-label', 'Auto-play');
            playBtn.title = 'Auto-play';
        }
        if (playIcon) playIcon.style.display = '';
        if (pauseIcon) pauseIcon.style.display = 'none';
    };

    /**
     * Starts auto-play: advances one step on a timer until the algorithm
     * finishes or the user stops it.
     */
    const startPlaying = () => {
        if (current_step >= total_steps - 1) return;
        playBtn.classList.add('is-playing');
        playBtn.setAttribute('aria-label', 'Pause');
        playBtn.title = 'Pause';
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = '';
        playInterval = setInterval(() => {
            if (current_step + 1 >= total_steps) {
                stopPlaying();
                return;
            }
            current_step++;
            calculateAndRender(current_step);
        }, 900);
    };

    /**
     * Resets the entire visualization to its initial state.
     * It clears all global state variables (m, l, O), re-renders the initial
     * matrices, clears all intermediate calculation displays, and resets the step counter.
     */
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
        
        // Clear all calculation containers
        const containersToClear = [
            sBlockForMCalcContainer, mBlockResultContainer, sBlockDisplayContainer,
            mBlockDisplayContainer, sMinusMMatrixContainer, pMatrixContainer,
            lBlockResultContainer, mOldContainer,
            mBlockContextContainer, mNewContainer, lNewContainer, lOldContainer,
            lBlockContextContainer, mOldForLCalcContainer, mNewForLCalcContainer,
            mNewForLCalc2Container, mBlockForLCalcContainer,
            // O-update containers
            pMatrixForOIntermediate, vMatrixForOIntermediate, oBlockResultContainer,
            oBlockForOCalc, lOldForOCalc, mOldForOCalc, mNewForOCalc,
            mBlockForOCalc, mNewForOCalc2, lNewForOCalc
        ];
        containersToClear.forEach(c => {
            if (c) c.innerHTML = '';
        });

        updateControls(current_step);
    };

    /**
     * Initializes the application.
     * Fetches the initial matrix data from 'data.json', sets up global parameters,
     * attaches event listeners to the control buttons, and calls reset() to
     * prepare the initial view.
     */
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
            stopPlaying();
            current_step++;
            if (current_step < total_steps) {
                calculateAndRender(current_step);
                updateControls(current_step);
            }
        });

        resetBtn.addEventListener('click', () => {
            stopPlaying();
            reset();
        });

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (playInterval) {
                    stopPlaying();
                } else {
                    startPlaying();
                }
            });
        }

        reset();
    };

    init();
});
