document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentStrategy = null; // 'A' or 'B'
    let initialStake = 100;
    let totalOdds = 3;
    let legs = [
        { id: generateId(), name: 'Leg 1', odds: 2.0, targetNet: 0, status: 'pending-hedge', cost: 0 },
        { id: generateId(), name: 'Leg 2', odds: 2.0, targetNet: 0, status: 'pending-hedge', cost: 0 },
        { id: generateId(), name: 'Leg 3', odds: 2.0, targetNet: 0, status: 'pending-hedge', cost: 0 }
    ];

    // --- DOM Elements ---
    const heroView = document.getElementById('hero-view');
    const appView = document.getElementById('app-view');
    const strategyTitle = document.getElementById('strategy-title');
    const btnBack = document.getElementById('btn-back');
    const strategyCards = document.querySelectorAll('.strategy-card:not(.disabled)');

    const initialStakeInput = document.getElementById('initial-stake');
    const totalOddsInput = document.getElementById('total-odds');
    const addLegBtn = document.getElementById('add-leg-btn');
    const legsContainer = document.getElementById('legs-container');
    const profitAmountEl = document.getElementById('profit-amount');
    const profitWarningEl = document.getElementById('profit-warning');
    const actionPlanList = document.getElementById('action-plan-list');
    const finalSummary = document.getElementById('final-summary');

    // --- View Navigation ---
    strategyCards.forEach(card => {
        card.addEventListener('click', () => {
            currentStrategy = card.dataset.strategy;
            if (currentStrategy === 'A') {
                strategyTitle.textContent = "Strategy A: Absolute Guaranteed Equal Net";
            } else if (currentStrategy === 'B') {
                strategyTitle.textContent = "Strategy B: Confidence-Weighted Hedge Sizing";
            }
            heroView.classList.add('hidden');
            appView.classList.remove('hidden');
            renderLegs();
            calculateAndRender();
            window.scrollTo(0, 0);
        });
    });

    btnBack.addEventListener('click', () => {
        appView.classList.add('hidden');
        heroView.classList.remove('hidden');
        currentStrategy = null;
    });

    // --- Initialization ---
    new Sortable(legsContainer, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: function (evt) {
            const itemEl = legs.splice(evt.oldIndex, 1)[0];
            legs.splice(evt.newIndex, 0, itemEl);
            calculateAndRender();
        },
    });

    initialStakeInput.addEventListener('input', (e) => {
        initialStake = parseFloat(e.target.value) || 0;
        calculateAndRender();
    });

    totalOddsInput.addEventListener('input', (e) => {
        totalOdds = parseFloat(e.target.value) || 0;
        calculateAndRender();
    });

    addLegBtn.addEventListener('click', () => {
        legs.push({
            id: generateId(),
            name: `Leg ${legs.length + 1}`,
            odds: 2.0,
            targetNet: 1000,
            status: 'pending-hedge',
            cost: 0
        });
        renderLegs();
        calculateAndRender();
    });

    // --- Core Functions ---
    function generateId() { return Math.random().toString(36).substr(2, 9); }
    function formatCurrency(val) { return 'Php ' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

    function getStatusClass(status) {
        switch (status) {
            case 'pending-hedge': return 'status-pending-hedge';
            case 'pending-no': return 'status-pending-no';
            case 'won-unhedged': return 'status-won-unhedged';
            case 'won-hedged': return 'status-won-hedged';
            default: return '';
        }
    }

    function renderLegs() {
        legsContainer.innerHTML = '';

        legs.forEach((leg, index) => {
            const legCard = document.createElement('div');
            legCard.className = 'leg-card';
            legCard.dataset.id = leg.id;

            const isCostHidden = leg.status !== 'won-hedged';
            const costClass = isCostHidden ? 'hidden' : '';

            // In strategy B, if leg is finished, hide the Target Net input entirely to avoid confusion.
            const isFinished = leg.status.startsWith('won');
            const targetNetClass = (currentStrategy === 'B' && !isFinished) ? '' : 'hidden';

            legCard.innerHTML = `
                <div class="drag-handle" title="Drag to reorder">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </div>
                
                <div class="leg-inputs">
                    <div class="leg-input-group">
                        <label>Name</label>
                        <input type="text" class="leg-name-input" value="${leg.name}">
                    </div>
                    
                    <div class="leg-input-group">
                        <label>Hedge Odds</label>
                        <input type="number" step="0.1" class="leg-odds-input" value="${leg.odds}">
                    </div>
                    
                    <div class="leg-input-group ${targetNetClass}">
                        <label>Safety Net (Php)</label>
                        <input type="number" step="10" class="leg-target-input" value="${leg.targetNet}">
                    </div>
                    
                    <div class="leg-input-group">
                        <label>Status</label>
                        <select class="leg-status-input status-select ${getStatusClass(leg.status)}">
                            <option value="pending-hedge" ${leg.status === 'pending-hedge' ? 'selected' : ''}>Pending (Plan to Hedge)</option>
                            <option value="pending-no" ${leg.status === 'pending-no' ? 'selected' : ''}>Pending (Do Not Hedge)</option>
                            <option value="won-unhedged" ${leg.status === 'won-unhedged' ? 'selected' : ''}>Finished: Won (Unhedged)</option>
                            <option value="won-hedged" ${leg.status === 'won-hedged' ? 'selected' : ''}>Finished: Won (Hedged)</option>
                        </select>
                    </div>

                    <div class="leg-input-group cost-group ${costClass}">
                        <label>Cost</label>
                        <input type="number" step="1" class="leg-cost-input" value="${leg.cost}">
                    </div>
                </div>

                <button class="btn-icon danger remove-btn" title="Remove Leg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;

            legCard.querySelector('.leg-name-input').addEventListener('input', (e) => {
                leg.name = e.target.value;
                calculateAndRender();
            });

            legCard.querySelector('.leg-odds-input').addEventListener('input', (e) => {
                leg.odds = parseFloat(e.target.value) || 0;
                calculateAndRender();
            });

            const targetInput = legCard.querySelector('.leg-target-input');
            if (targetInput) {
                targetInput.addEventListener('input', (e) => {
                    leg.targetNet = parseFloat(e.target.value) || 0;
                    calculateAndRender();
                });
            }

            legCard.querySelector('.leg-cost-input').addEventListener('input', (e) => {
                leg.cost = parseFloat(e.target.value) || 0;
                calculateAndRender();
            });

            const statusSelect = legCard.querySelector('.leg-status-input');
            statusSelect.addEventListener('change', (e) => {
                leg.status = e.target.value;
                renderLegs();
                calculateAndRender();
            });

            legCard.querySelector('.remove-btn').addEventListener('click', () => {
                legs.splice(index, 1);
                renderLegs();
                calculateAndRender();
            });

            legsContainer.appendChild(legCard);
        });
    }

    function calculateAndRender() {
        if (!currentStrategy) return;

        if (currentStrategy === 'A') {
            calculateStrategyA();
        } else if (currentStrategy === 'B') {
            calculateStrategyB();
        }
    }

    function calculateStrategyA() {
        // [Existing Strategy A Math]
        const fullPayout = initialStake * totalOdds;
        let futureLegs = [];
        let totalSunkCost = 0;

        legs.forEach(leg => {
            if (leg.status.startsWith('won')) {
                if (leg.status === 'won-hedged') totalSunkCost += leg.cost;
            } else {
                futureLegs.push({ name: leg.name, odds: leg.odds, planToHedge: leg.status === 'pending-hedge' });
            }
        });

        if (futureLegs.length === 0) {
            profitAmountEl.textContent = 'Completed';
            profitAmountEl.className = 'profit-amount';
            profitWarningEl.innerHTML = `Total Sunk Costs: <b>${formatCurrency(totalSunkCost)}</b>`;
            actionPlanList.innerHTML = '<p style="text-align:center; color: var(--text-secondary); padding: 20px;">No remaining legs to hedge.</p>';
            finalSummary.innerHTML = '';
            return;
        }

        const n = futureLegs.length;
        const values = new Array(n + 1).fill(0);
        const hedges = new Array(n).fill(0);
        values[n] = fullPayout;

        let hasUnhedged = false;
        let conditionalWarning = false;

        for (let i = n - 1; i >= 0; i--) {
            const leg = futureLegs[i];
            if (leg.planToHedge) {
                hedges[i] = leg.odds > 0 ? values[i + 1] / leg.odds : 0;
                values[i] = values[i + 1] - hedges[i];
                if (hasUnhedged) conditionalWarning = true;
            } else {
                hedges[i] = 0;
                values[i] = values[i + 1];
                hasUnhedged = true;
            }
        }

        const currentValue = values[0];
        const profit = currentValue - initialStake - totalSunkCost;

        profitAmountEl.textContent = formatCurrency(profit);
        const ratio = profit / initialStake;
        profitAmountEl.className = 'profit-amount';
        if (ratio >= 2.0) profitAmountEl.classList.add('profit-high');
        else if (ratio >= 0.5) profitAmountEl.classList.add('profit-medium');
        else profitAmountEl.classList.add('profit-low');

        if (conditionalWarning) {
            profitWarningEl.innerHTML = `⚠️ Hedged leg followed by UNHEDGED leg. Profit is CONDITIONAL.`;
            profitWarningEl.style.color = 'var(--profit-loss)';
        } else if (hasUnhedged) {
            profitWarningEl.innerHTML = `ℹ️ Unhedged legs at end sequence. Profit is CONDITIONAL.`;
            profitWarningEl.style.color = 'var(--profit-warning)';
        } else {
            profitWarningEl.innerHTML = `✅ Absolute Guaranteed Net Profit`;
            profitWarningEl.style.color = 'var(--profit-green)';
        }

        actionPlanList.innerHTML = '';
        let runningCost = initialStake + totalSunkCost;

        futureLegs.forEach((leg, i) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'action-step';
            if (leg.planToHedge) {
                const h = hedges[i];
                const winProfit = (h * leg.odds) - h - runningCost;
                stepDiv.innerHTML = `
                    <div class="step-title">STEP ${i + 1}: ${leg.name}</div>
                    <div class="step-action"><b>Action:</b> Execute hedge of <b>${formatCurrency(h)}</b> at ${leg.odds}x odds.</div>
                    <div class="step-outcome">If hedge hits (full slip fails): You collect ${formatCurrency(h * leg.odds)} & STOP. <b>Net Profit: ${formatCurrency(winProfit)}</b></div>
                    <div class="step-outcome">If hedge loses (full slip survives): Slip survives. Proceed to next step.</div>
                `;
                runningCost += h;
            } else {
                stepDiv.innerHTML = `
                    <div class="step-title" style="color: var(--status-pending-no-hedge)">STEP ${i + 1}: ${leg.name}</div>
                    <div class="step-action"><b>Action:</b> DO NOT HEDGE. Let it ride.</div>
                    <div class="step-outcome" style="color: var(--profit-loss)">If leg fails: FULL SLIP LOST. Total Loss: -${formatCurrency(runningCost)}</div>
                    <div class="step-outcome">If leg wins: Slip survives. Proceed to next step.</div>
                `;
            }
            actionPlanList.appendChild(stepDiv);
        });

        const finalSlipProfit = fullPayout - runningCost;
        finalSummary.innerHTML = `If ALL legs survive: FULL SLIP WINS ${formatCurrency(fullPayout)}!<br>Net Profit: ${formatCurrency(finalSlipProfit)}`;
    }

    function calculateStrategyB() {
        const fullPayout = initialStake * totalOdds;
        let futureLegs = [];
        let totalSunkCost = 0;

        legs.forEach(leg => {
            if (leg.status.startsWith('won')) {
                if (leg.status === 'won-hedged') totalSunkCost += leg.cost;
            } else {
                futureLegs.push({ name: leg.name, odds: leg.odds, targetNet: leg.targetNet, planToHedge: leg.status === 'pending-hedge' });
            }
        });

        if (futureLegs.length === 0) {
            profitAmountEl.textContent = 'Completed';
            profitAmountEl.className = 'profit-amount';
            profitWarningEl.innerHTML = `Total Sunk Costs: <b>${formatCurrency(totalSunkCost)}</b>`;
            actionPlanList.innerHTML = '<p style="text-align:center; color: var(--text-secondary); padding: 20px;">No remaining legs to hedge.</p>';
            finalSummary.innerHTML = '';
            return;
        }

        const n = futureLegs.length;
        const hedges = new Array(n).fill(0);
        let runningCost = initialStake + totalSunkCost;

        actionPlanList.innerHTML = '';

        for (let i = 0; i < n; i++) {
            const leg = futureLegs[i];
            const stepDiv = document.createElement('div');
            stepDiv.className = 'action-step';

            if (leg.planToHedge) {
                if (leg.odds <= 1.0) {
                    stepDiv.innerHTML = `<div class="step-title">STEP ${i + 1}: ${leg.name}</div><div class="step-outcome" style="color:red">⚠️ ERROR: Hedge Odds must be > 1.0.</div>`;
                    hedges[i] = 0;
                    actionPlanList.appendChild(stepDiv);
                    continue;
                }

                const h = (leg.targetNet + runningCost) / (leg.odds - 1.0);
                hedges[i] = h;
                const winProfit = (h * leg.odds) - h - runningCost;

                stepDiv.innerHTML = `
                    <div class="step-title">STEP ${i + 1}: ${leg.name}</div>
                    <div class="step-action"><b>Action:</b> Execute hedge of <b>${formatCurrency(h)}</b> at ${leg.odds}x odds.</div>
                    <div class="step-outcome">If hedge hits (full slip fails): You collect ${formatCurrency(h * leg.odds)} & STOP. <b>Net Profit: ${formatCurrency(winProfit)}</b></div>
                    <div class="step-outcome">If hedge loses (full slip survives): Slip survives. Proceed to next step.</div>
                `;
                runningCost += h;
            } else {
                stepDiv.innerHTML = `
                    <div class="step-title" style="color: var(--status-pending-no-hedge)">STEP ${i + 1}: ${leg.name}</div>
                    <div class="step-action"><b>Action:</b> DO NOT HEDGE. Let it ride.</div>
                    <div class="step-outcome" style="color: var(--profit-loss)">If leg fails: FULL SLIP LOST. Total Loss: -${formatCurrency(runningCost)}</div>
                    <div class="step-outcome">If leg wins: Slip survives. Proceed to next step.</div>
                `;
            }
            actionPlanList.appendChild(stepDiv);
        }

        const finalSlipProfit = fullPayout - runningCost;

        // In strategy B, the "Guaranteed Profit" isn't a single number anymore, it's the final parlay profit IF it hits.
        profitAmountEl.textContent = formatCurrency(finalSlipProfit);
        profitAmountEl.className = 'profit-amount';

        if (finalSlipProfit >= 0) {
            profitAmountEl.classList.add('profit-high');
            profitWarningEl.innerHTML = `✅ <b>FEASIBLE:</b> If ALL legs survive, you get the profit above!`;
            profitWarningEl.style.color = 'var(--profit-green)';
            finalSummary.innerHTML = `If ALL legs survive: FULL SLIP WINS ${formatCurrency(fullPayout)}!<br>Net Profit: ${formatCurrency(finalSlipProfit)}`;
        } else {
            profitAmountEl.classList.add('profit-low');
            profitWarningEl.innerHTML = `❌ <b>INFEASIBLE:</b> You are spending too much on hedges to secure those safety nets! Lower them or skip hedges.`;
            profitWarningEl.style.color = 'var(--profit-loss)';
            finalSummary.innerHTML = `If ALL legs survive: FULL SLIP WINS ${formatCurrency(fullPayout)}!<br><span style="color:var(--profit-loss)">Net Loss: -${formatCurrency(Math.abs(finalSlipProfit))}</span>`;
        }
    }
});
