// UI Controller
const UIController = {
    state: {
        score: 0,
        totalAttempts: 0,
        currentExperiment: 1,
        EXPERIMENTS_PER_SESSION: 3,
        trustDecision: null,
        implementDecision: null,
        followUpDecision: null,
        challenge: null,
        currentRound: 1,
        experimentsInCurrentRound: 0,
        correctInCurrentRound: 0,
        hasSubmitted: false,
        impact: 0,
        userCumulativeEffect: 0,
        competitorCumulativeEffect: 0,
        currentCompetitor: null,
        selectedCompetitor: null,
        roundResults: [] // Store results for each experiment in the current round
    },

    init() {
        this.initializeEventListeners();
        //this.initializeCheatSheet();
        this.initializeTabs();
    },

    debugMode() {
        return document.getElementById('debug-mode').checked;
    },

    initializeEventListeners() {
        // Competitor selection
        document.querySelectorAll('.competitor-card').forEach(card => {
            card.addEventListener('click', () => {
                // Remove selected state from all cards
                document.querySelectorAll('.competitor-card').forEach(c => {
                    c.style.opacity = '0.7';
                    c.style.transform = 'scale(1)';
                });
                
                // Add selected state to clicked card
                card.style.opacity = '1';
                card.style.transform = 'scale(1.05)';
                
                // Enable start button
                const startBtn = document.getElementById('start-btn');
                startBtn.disabled = false;
                
                // Store selected competitor
                this.state.selectedCompetitor = card.getAttribute('data-competitor');
            });

            // Add hover effects
            card.addEventListener('mouseenter', () => {
                if (card.style.opacity !== '1') {
                    card.style.opacity = '0.9';
                }
            });

            card.addEventListener('mouseleave', () => {
                if (card.style.opacity !== '1') {
                    card.style.opacity = '0.7';
                }
            });
        });

        // Start button
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.state.selectedCompetitor) {
                    this.startSession();
                }
            });
        }

        // Decision buttons
        document.querySelectorAll('.decision-btn').forEach(button => {
            button.addEventListener('click', () => {
                // Remove active state from all buttons in the same group
                const name = button.getAttribute('name');
                document.querySelectorAll(`.decision-btn[name="${name}"]`).forEach(btn => {
                    btn.style.opacity = '0.7';
                    btn.style.transform = 'scale(1)';
                    btn.classList.remove('selected');
                });

                // Add active state to clicked button
                button.style.opacity = '1';
                button.style.transform = 'scale(1.05)';
                button.classList.add('selected');

                this.handleDecision(name, button.getAttribute('value'));
            });

            // Add hover effects
            button.addEventListener('mouseenter', () => {
                if (!button.classList.contains('selected')) {
                    button.style.opacity = '1';
                }
            });

            button.addEventListener('mouseleave', () => {
                if (!button.classList.contains('selected')) {
                    button.style.opacity = '0.7';
                }
            });

            // Add touch event listeners alongside click events
            button.addEventListener('touchstart', () => {
                this.handleDecision(button.getAttribute('name'), button.getAttribute('value'));
            });
        });

        // Submit decision
        document.getElementById('submit-decision').addEventListener('click', () => {
            this.evaluateDecision();
        });

        // Next challenge
        document.getElementById('next-challenge-btn').addEventListener('click', () => this.handleNextChallenge());

        // Start new session
        document.getElementById('start-new-session').addEventListener('click', () => this.startNewSession());

        // Initialize cheat sheet
        //this.initializeCheatSheet();

        // Initialize feedback modal
        const feedbackModal = document.getElementById('feedback-modal');
        const closeFeedback = document.getElementById('close-feedback');
        const nextChallengeBtn = document.getElementById('next-challenge-btn');

        // Close feedback modal
        closeFeedback.addEventListener('click', () => {
            ModalManager.hide('feedback-modal');
            // Batch DOM operations
            const submitButton = document.getElementById('submit-decision');
            const decisionButtons = document.querySelectorAll('.decision-btn');

            // Update submit button
            submitButton.textContent = 'Show Feedback';
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');

            // Update decision buttons in a single operation
            decisionButtons.forEach(button => {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            });
        });

        // Close feedback when clicking outside
        feedbackModal.addEventListener('click', (e) => {
            if (e.target === feedbackModal) {
                ModalManager.hide('feedback-modal');
                // Batch DOM operations
                const submitButton = document.getElementById('submit-decision');
                const decisionButtons = document.querySelectorAll('.decision-btn');

                // Update submit button
                submitButton.textContent = 'Show Feedback';
                submitButton.disabled = false;
                submitButton.classList.remove('opacity-50', 'cursor-not-allowed');

                // Update decision buttons in a single operation
                decisionButtons.forEach(button => {
                    button.disabled = true;
                    button.style.opacity = '0.5';
                    button.style.cursor = 'not-allowed';
                });
            }
        });
    },

    initializeCheatSheet() {
        const cheatSheetBtn = document.getElementById('cheat-sheet-btn');
        const cheatSheetModal = document.getElementById('cheat-sheet-modal');
        const closeCheatSheet = document.getElementById('close-cheat-sheet');

        cheatSheetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            ModalManager.show('cheat-sheet-modal');
        });

        closeCheatSheet.addEventListener('click', () => {
            ModalManager.hide('cheat-sheet-modal');
        });

        cheatSheetModal.addEventListener('click', (e) => {
            if (e.target === cheatSheetModal) {
                ModalManager.hide('cheat-sheet-modal');
            }
        });
    },

    initializeTabs() {
        // Hide all tab content except metrics tab
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id !== 'metrics-tab') {
                content.classList.add('hidden');
            } else {
                content.classList.remove('hidden');
            }
        });

        // Set up click handlers and initial state
        document.querySelectorAll('.tab-button').forEach(button => {
            // Remove active class from all buttons
            button.classList.remove('active', 'border-blue-500', 'text-blue-600');
            button.classList.add('text-gray-500');
            
            // Add click handler
            button.addEventListener('click', () => {
                this.switchTab(button.getAttribute('data-tab'));
            });
        });

        // Set initial active state for metrics tab
        const metricsTab = document.querySelector('[data-tab="metrics"]');
        if (metricsTab) {
            metricsTab.classList.add('border-blue-500', 'text-blue-600');
            metricsTab.classList.remove('text-gray-500');
        }
    },

    switchTab(tabName) {
        // Remove active state from all tabs
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('border-blue-500', 'text-blue-600');
            btn.classList.add('text-gray-500');
        });

        // Add active state to clicked tab
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('border-blue-500', 'text-blue-600');
            activeTab.classList.remove('text-gray-500');
        }

        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Show selected tab content
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.remove('hidden');
        }
    },

    startSession() {
        const tutorialSection = document.getElementById('tutorial-section');
        const experimentContainer = document.getElementById('challenge-container');

        // Hide tutorial section
        tutorialSection.classList.add('hidden');

        // Show experiment container
        experimentContainer.classList.remove('hidden');
        experimentContainer.classList.add('fade-in');

        // Set the selected competitor for the entire session
        this.state.currentCompetitor = VirtualCompetitors[this.state.selectedCompetitor];
        
        // Update competitor name in UI
        this.updateCompetitorName();

        // Load the first challenge
        this.loadChallenge();
    },

    async loadChallenge() {
        try {
            if (typeof generateABTestChallenge !== 'function') {
                throw new Error("generateABTestChallenge function is not defined");
            }

            // Clean up warning emoji from conversion rates tab header
            const conversionTab = document.querySelector('[data-tab="conversion"]');
            if (conversionTab) {
                conversionTab.textContent = 'Conversion Rate';
            }

            // Define challenge sequence for each round
            const challengeSequences = {
                1: [winner(), inconclusive(), partialLoser()],
                2: [partialLoser().withBaseRateMismatch(), partialLoser().withVisitorsLoss(), partialLoser().withSampleRatioMismatch()],
                3: [slowCompletion(), fastWinner(), fastLoserWithPartialWeek()],
                4: [slowCompletion().withBaseRateMismatch(), fastLoserWithPartialWeek().withVisitorsLoss(), loser()],
                5: [partialWinner(), partialLoser(), inconclusive()]
            };

            // Define round captions
            const roundCaptions = {
                1: "Warm Up!", // First round caption
                2: "Let's Begin!", // Second round caption
                // Add more round captions here as needed
            };

            const caption = roundCaptions[this.state.currentRound] || "";

            // Reset visitors header
            const visitorsHeader = document.querySelector('.metrics-table th:nth-child(2)');
            if (visitorsHeader) {
                visitorsHeader.textContent = 'Visitors';
            }

            // Generate a new challenge based on round and experiment number
            let challengeDesign;
            const sequence = challengeSequences[this.state.currentRound];
            const experimentIndex = this.state.experimentsInCurrentRound;

            if (sequence && experimentIndex < sequence.length) {
                // Use the predefined challenge generator for this experiment
                challengeDesign = sequence[experimentIndex];
            } else {
                // After predefined sequences or for rounds without a sequence, randomly sample from all scenarios
                const allScenarios = Object.values(challengeSequences).flat();
                challengeDesign = allScenarios[Math.floor(Math.random() * allScenarios.length)];
            }

            // Generate the challenge from the design
            window.currentExperiment = challengeDesign.generate();
            this.state.challenge = window.currentExperiment;

            // Analyze the experiment and store it globally
            window.currentAnalysis = analyzeExperiment(window.currentExperiment);

            // Log the analysis result
            console.log('=== EXPERIMENT ANALYSIS ===');
            console.log('Round:', this.state.currentRound);
            console.log('Experiment:', this.state.experimentsInCurrentRound + 1);
            console.log('Analysis:', window.currentAnalysis);

            // Update the UI with the new challenge
            this.updateExperimentDisplay();
            this.updateExecutionSection();
            this.updateMetricsTable();

            this.updateProgress();

            window.updateConfidenceIntervals(window.currentExperiment);

            // Initialize charts
            initializeCharts(window.currentExperiment);

            // Reset decisions
            this.resetDecisions();
            if (this.debugMode()) {
                this.addDebugAlerts();
            }
            return true;
        } catch (error) {
            console.error('Error loading challenge:', error);
            return false;
        }
    },

    // Helper function to create a warning icon with tooltip
    createWarningIcon(message) {
        const warningIcon = document.createElement('span');
        warningIcon.className = 'text-yellow-500 cursor-help tooltip-trigger';
        warningIcon.textContent = '⚠️';

        const tooltipContent = document.createElement('span');
        tooltipContent.className = 'tooltip-content';
        tooltipContent.innerHTML = message.replace(/\n/g, '<br>');
        warningIcon.appendChild(tooltipContent);

        // Add tooltip positioning
        warningIcon.addEventListener('mousemove', (e) => {
            const tooltip = warningIcon.querySelector('.tooltip-content');
            if (!tooltip) return;

            const rect = warningIcon.getBoundingClientRect();
            tooltip.style.left = (rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
        });

        return warningIcon;
    },

    // Helper function to add warning to a cell
    addWarningToCell(cell, message) {
        const visitorsSpan = document.createElement('span');
        visitorsSpan.className = 'font-medium';
        visitorsSpan.textContent = cell.textContent;
        cell.textContent = '';
        cell.appendChild(visitorsSpan);

        const warningIcon = this.createWarningIcon(message);
        cell.appendChild(warningIcon);
    },

    addDebugAlerts() {
        this.addBaseConversionRateMissmatchAlert();
        this.addSampleSizeWarning();
        this.addSampleRatioMismatchAlert();
    },

    addBaseConversionRateMissmatchAlert() {
        const analysis = window.currentAnalysis;
        if (!analysis.analysis.hasBaseRateMismatch) return;

        const baseRateCell = document.getElementById('base-rate');
        const { expected, actual, difference, pValue } = analysis.analysis.baseRate;
        
        const message = `Design Base Rate: ${formatPercent(expected)}\nActual Base Rate: ${formatPercent(actual)}\nDifference: ${formatPercent(difference)}\np-value: ${pValue.toFixed(4)}`;
        this.addWarningToCell(baseRateCell, message);
    },

    addSampleSizeWarning() {
        const analysis = window.currentAnalysis;
        const { sampleSize } = analysis.analysis;
        const { current, required } = analysis.analysis.runtime;
        
        if (current < required) return;

        // Check base variant
        if (sampleSize.actualBase < sampleSize.required) {
            const message = `Insufficient sample size (${sampleSize.actualBase.toLocaleString()} < ${sampleSize.required.toLocaleString()})`;
            this.addWarningToCell(document.getElementById('base-visitors'), message);
        }

        // Check variant
        if (sampleSize.actualVariant < sampleSize.required) {
            const message = `Insufficient sample size (${sampleSize.actualVariant.toLocaleString()} < ${sampleSize.required.toLocaleString()})`;
            this.addWarningToCell(document.getElementById('variant-visitors'), message);
        }

        // Check total sample size
        const totalVisitors = sampleSize.actualBase + sampleSize.actualVariant;
        const requiredTotal = sampleSize.required * 2;
        
        if (totalVisitors < requiredTotal) {
            const completeTextElement = document.getElementById('exp-complete-text');
            const message = `Runtime Complete but Insufficient sample size: ${totalVisitors.toLocaleString()} < ${requiredTotal.toLocaleString()}`;
            
            completeTextElement.textContent = '';
            completeTextElement.appendChild(this.createWarningIcon(message));
            completeTextElement.appendChild(document.createTextNode(` Complete | ${current}d | ${totalVisitors.toLocaleString()}v`));
        }
    },

    addSampleRatioMismatchAlert() {
        if (!this.debugMode()) return;

        const analysis = window.currentAnalysis;
        if (!analysis || !analysis.analysis.hasSignificantRatioMismatch) return;

        const visitorsHeader = document.querySelector('.metrics-table th:nth-child(2)');
        if (!visitorsHeader) return;

        const message = `Sample Ratio Mismatch detected (p-value<0.0001)`;
        
        visitorsHeader.textContent = '';
        visitorsHeader.appendChild(document.createTextNode('Visitors'));
        visitorsHeader.appendChild(this.createWarningIcon(message));
    },

    // Attach tooltip behaviour to dynamically added elements
    initializeTooltipTriggers(parent) {
        if (!parent) return;
        const triggers = parent.querySelectorAll('.tooltip-trigger');
        triggers.forEach(trigger => {
            trigger.addEventListener('mousemove', function (e) {
                const tooltip = this.querySelector('.tooltip-content');
                if (!tooltip) return;

                const rect = this.getBoundingClientRect();
                const tooltipHeight = tooltip.offsetHeight;
                const tooltipWidth = tooltip.offsetWidth;
                const spaceAbove = rect.top;
                const spaceBelow = window.innerHeight - rect.bottom;

                let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                if (left < 10) left = 10;
                if (left + tooltipWidth > window.innerWidth - 10) {
                    left = window.innerWidth - tooltipWidth - 10;
                }

                let top;
                if (spaceAbove >= tooltipHeight + 10) {
                    top = rect.top - tooltipHeight - 10;
                } else if (spaceBelow >= tooltipHeight + 10) {
                    top = rect.bottom + 10;
                } else {
                    top = spaceAbove > spaceBelow ?
                        rect.top - tooltipHeight - 10 :
                        rect.bottom + 10;
                }

                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            });
        });
    },

    // Explanations for each decision are provided in the analysis object
    getTrustExplanation(analysis) {
        return analysis.decision.trustworthyReason || '';
    },

    getDecisionExplanation(analysis) {
        return analysis.decision.decisionReason || '';
    },

    getFollowUpExplanation(analysis) {
        return analysis.decision.followUpReason || '';
    },

    updateExperimentDisplay() {
        const challenge = this.state.challenge;
        const formatPercentage = (value) => {
            const percentage = value * 100;
            return Number.isInteger(percentage) ? `${percentage}%` : `${percentage.toFixed(1)}%`;
        };

        // Update experiment parameters
        document.getElementById('exp-alpha').textContent = formatPercentage(challenge.experiment.alpha);
        document.getElementById('exp-beta').textContent = formatPercentage(1 - challenge.experiment.beta);
        document.getElementById('exp-base-rate').textContent = `${(challenge.experiment.baseConversionRate * 100).toFixed(2)}%`;
        document.getElementById('exp-min-effect').textContent = `${(challenge.experiment.minimumRelevantEffect * 100).toFixed(2)}%`;
        document.getElementById('exp-visitors').textContent = challenge.experiment.visitorsPerDay.toLocaleString();
        document.getElementById('exp-required-sample').textContent = challenge.experiment.requiredSampleSizePerVariant.toLocaleString();
        document.getElementById('exp-total-required-sample').textContent = (challenge.experiment.requiredSampleSizePerVariant * 2).toLocaleString();
        document.getElementById('exp-required-days').textContent = `${challenge.experiment.requiredRuntimeDays} days`;
        const direction = challenge.experiment.improvementDirection === window.IMPROVEMENT_DIRECTION.LOWER ? 'Lower is Better' : 'Higher is Better';
        document.getElementById('exp-improvement-direction').textContent = direction;

        // Update conversion rates tab header if there's data loss
        if (this.debugMode() && window.currentAnalysis?.analysis?.hasDataLoss) {
            const conversionTab = document.querySelector('[data-tab="conversion"]');
            if (conversionTab) {
                conversionTab.textContent = 'Conversion Rate ⚠️';
            }
        }
    },

    // Helper function to measure text width
    measureTextWidth(text, referenceElement) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const style = window.getComputedStyle(referenceElement);
        context.font = `${style.fontSize} ${style.fontFamily}`;
        return context.measureText(text).width + 20; // Add padding
    },

    checkProgressBarSpace(progressPercent, totalVisitors, remainingVisitors, daysRemaining) {
        const progressBarContainer = document.getElementById('exp-progress-bar').parentElement;
        const containerWidth = progressBarContainer.offsetWidth;
        const progressBarWidth = (containerWidth * progressPercent) / 100;
        const remainingBarWidth = containerWidth - progressBarWidth;

        // Measure text widths once
        const visitorsText = `${totalVisitors.toLocaleString()}v`;
        const remainingText = `${remainingVisitors.toLocaleString()}v`;
        const daysText = `${daysRemaining}d`;

        const visitorsTextWidth = this.measureTextWidth(visitorsText, document.getElementById('exp-visitors-text'));
        const remainingTextWidth = this.measureTextWidth(remainingText, document.getElementById('exp-remaining-text'));
        const daysTextWidth = this.measureTextWidth(daysText, document.getElementById('exp-days-remaining-text'));

        // Check space availability with 5% buffer
        const SPACE_BUFFER = 1.05;
        return {
            hasEnoughSpaceForVisitors: progressBarWidth > (visitorsTextWidth * SPACE_BUFFER),
            hasEnoughSpaceForRemaining: remainingBarWidth > (remainingTextWidth * SPACE_BUFFER),
            hasEnoughSpaceForDays: remainingBarWidth > ((remainingTextWidth + daysTextWidth) * SPACE_BUFFER)
        };
    },

    addExecutionBarTooltip(progressBar, hasEnoughSampleSize, daysElapsed, totalDays) {
        // Always reset tooltip state first
        progressBar.classList.remove('tooltip-trigger');
        const existingTooltip = progressBar.querySelector('.tooltip-content');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        progressBar.removeEventListener('mousemove', progressBar.mousemoveHandler);

        // Define tooltip scenarios
        const tooltipScenarios = [
            {
                condition: () => hasEnoughSampleSize && daysElapsed < totalDays && daysElapsed % 7 !== 0,
                message: 'Not Ready: Full Sample size has been reached but the last week is incomplete.'
            },
            {
                condition: () => hasEnoughSampleSize && daysElapsed >= totalDays && daysElapsed % 7 === 0,
                message: 'Ready: Full sample size has been reached at full weeks.'
            },
            {
                condition: () => !hasEnoughSampleSize && daysElapsed < totalDays,
                message: 'Not Ready: Not enough sample size.'
            },
            {
                condition: () => hasEnoughSampleSize && daysElapsed < totalDays && daysElapsed % 7 === 0,
                message: 'Ready: Full sample size has been reached at full weeks.'
            }

        ];

        // Check if any scenario matches
        const matchingScenario = tooltipScenarios.find(scenario => scenario.condition());

        // Handle tooltip
        if (matchingScenario) {
            // Add tooltip trigger class
            progressBar.classList.add('tooltip-trigger');

            // Create tooltip content
            const tooltipContent = document.createElement('span');
            tooltipContent.className = 'tooltip-content';
            tooltipContent.style.position = 'absolute';
            tooltipContent.style.zIndex = '1000';
            tooltipContent.style.backgroundColor = 'black';
            tooltipContent.style.color = 'white';
            tooltipContent.style.padding = '8px';
            tooltipContent.style.borderRadius = '4px';
            tooltipContent.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            tooltipContent.textContent = matchingScenario.message;
            
            // Add tooltip to the progress bar
            progressBar.appendChild(tooltipContent);

            // Add mousemove event listener for tooltip positioning
            const mousemoveHandler = function(e) {
                const tooltip = this.querySelector('.tooltip-content');
                if (!tooltip) return;

                // Get trigger position
                const rect = this.getBoundingClientRect();
                
                // Position tooltip above the trigger
                tooltip.style.left = (e.clientX - rect.left) + 'px';
                tooltip.style.top = (e.clientY - rect.top - tooltip.offsetHeight - 10) + 'px';
            };

            // Add new listener and store reference
            progressBar.addEventListener('mousemove', mousemoveHandler);
            progressBar.mousemoveHandler = mousemoveHandler;
        }
    },

    updateExecutionSection() {
        const challenge = this.state.challenge;
        const currentDate = new Date();
        const daysElapsed = challenge.simulation.timeline.currentRuntimeDays;
        const totalDays = challenge.experiment.requiredRuntimeDays;
        const daysRemaining = totalDays - daysElapsed;
        const isComplete = daysElapsed >= totalDays;

        // Calculate dates
        const startDate = new Date(currentDate);
        startDate.setDate(startDate.getDate() - daysElapsed);

        const finishDate = new Date(currentDate);
        finishDate.setDate(finishDate.getDate() + daysRemaining);

        // Format dates
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric'
        });

        // Update progress bar and annotations
        const progressPercent = Math.round((daysElapsed / totalDays) * 100);
        const progressBar = document.getElementById('exp-progress-bar');
        const progressBarInvisible = document.getElementById('exp-progress-bar-invisible');
        const remainingBar = document.getElementById('exp-remaining-bar');
        const remainingBarInvisible = document.getElementById('exp-remaining-bar-invisible');
        const visitorsText = document.getElementById('exp-visitors-text');
        const remainingText = document.getElementById('exp-remaining-text');
        const totalText = document.getElementById('exp-total-text');
        const completeText = document.getElementById('exp-complete-text');
        const progressStartDate = document.getElementById('progress-start-date');
        const progressEndDate = document.getElementById('progress-end-date');
        const daysElapsedText = document.getElementById('exp-days-elapsed-text');
        const daysRemainingText = document.getElementById('exp-days-remaining-text');
        const totalDaysText = document.getElementById('exp-total-days-text');

        // Reset all text content first
        visitorsText.textContent = '';
        remainingText.textContent = '';
        totalText.textContent = '';
        completeText.textContent = '';
        daysElapsedText.textContent = '';
        daysRemainingText.textContent = '';
        totalDaysText.textContent = '';
        progressStartDate.textContent = '';
        progressEndDate.textContent = '';

        // Calculate visitor counts
        const totalVisitors = challenge.simulation.actualVisitorsBase + challenge.simulation.actualVisitorsVariant;
        const requiredVisitors = challenge.experiment.requiredSampleSizePerVariant * 2;
        const remainingVisitors = Math.max(0, requiredVisitors - totalVisitors);

        // Update bar widths
        progressBar.style.width = `${Math.min(100, progressPercent)}%`;
        progressBarInvisible.style.width = `${Math.min(100, progressPercent)}%`;
        remainingBar.style.width = `${Math.max(0, 100 - progressPercent)}%`;
        remainingBarInvisible.style.width = `${Math.max(0, 100 - progressPercent)}%`;

        // Update progress bar classes based on completion state
        if (isComplete) {
            progressBar.classList.remove('rounded-l-full');
            progressBar.classList.add('rounded-full');
            remainingBar.classList.remove('rounded-r-full');
            remainingBar.classList.add('hidden');
        } else {
            progressBar.classList.remove('rounded-full');
            progressBar.classList.add('rounded-l-full');
            remainingBar.classList.remove('hidden');
            remainingBar.classList.add('rounded-r-full');
        }

        // Check if we have enough sample size and if elapsed days is a multiple of 7
        const hasEnoughSampleSize = totalVisitors >= (2 * challenge.experiment.requiredSampleSizePerVariant);
        const isFullWeek = daysElapsed % 7 === 0;

        // Set progress bar color based on conditions
        if (hasEnoughSampleSize && isFullWeek) {
            // Bright blue for complete weeks with enough sample size
            progressBar.style.backgroundColor = '#3b82f6'; // Tailwind blue-500
        } else {
            // Gray for incomplete weeks or insufficient sample size
            progressBar.style.backgroundColor = '#9ca3af'; // Tailwind gray-400
        }

        // Update text content
        if (isComplete) {
            completeText.classList.remove('hidden');
            completeText.textContent = `Complete | ${totalDays}d | ${totalVisitors}v`;
            progressStartDate.textContent = dateFormatter.format(startDate);
            visitorsText.textContent = dateFormatter.format(finishDate);
            progressEndDate.textContent = ''; // End date is not shown in complete state
        } else {
            // Always show dates
            progressStartDate.textContent = dateFormatter.format(startDate);
            progressEndDate.textContent = dateFormatter.format(finishDate);

            // Always show current visitors and elapsed days
            visitorsText.textContent = `${totalVisitors}v`;
            daysElapsedText.textContent = `${daysElapsed}d`;

            // Always show remaining information
            remainingText.textContent = `${remainingVisitors}v`;
            daysRemainingText.textContent = `${daysRemaining}d`;

            // Always show total information
            totalText.textContent = `${requiredVisitors}v`;
            totalDaysText.textContent = `${totalDays}d`;

            // Check space availability and adjust visibility if needed
            const spaceAvailability = this.checkProgressBarSpace(progressPercent, totalVisitors, remainingVisitors, daysRemaining);

            if (!spaceAvailability.hasEnoughSpaceForRemaining) {
                remainingText.textContent = '';
                daysRemainingText.textContent = '';
            }

            if (!spaceAvailability.hasEnoughSpaceForDays) {
                totalText.textContent = '';
                totalDaysText.textContent = '';
            }
        }

        // Add tooltip to progress bar
        this.addExecutionBarTooltip(progressBar, hasEnoughSampleSize, daysElapsed, totalDays);
    },

    updateMetricsTable() {
        const challenge = this.state.challenge;
        const formatDelta = (value, isPercentage = false) => {
            const sign = value > 0 ? '+' : '';
            return isPercentage ?
                `${sign}${(value * 100).toFixed(2)}%` :
                `${sign}${value}`;
        };

        const formatUplift = (value) => {
            const sign = value > 0 ? '+' : '';
            return `${sign}${(value * 100).toFixed(2)}%`;
        };

        // Update base metrics
        document.getElementById('base-visitors').textContent = challenge.simulation.actualVisitorsBase;
        document.getElementById('base-conversions').textContent = challenge.simulation.actualConversionsBase;
        document.getElementById('base-rate').textContent = `${(challenge.simulation.baseConversionRate * 100).toFixed(2)}%`;


        // Update variant metrics
        document.getElementById('variant-visitors').textContent = challenge.simulation.actualVisitorsVariant;
        document.getElementById('variant-conversions').textContent = challenge.simulation.actualConversionsVariant;
        document.getElementById('variant-rate').textContent = `${(challenge.simulation.variantConversionRate * 100).toFixed(2)}%`;

        // Update delta metrics
        document.getElementById('delta-visitors').textContent = formatDelta(challenge.simulation.actualVisitorsVariant - challenge.simulation.actualVisitorsBase);
        document.getElementById('delta-conversions').textContent = formatDelta(challenge.simulation.actualConversionsVariant - challenge.simulation.actualConversionsBase);
        document.getElementById('delta-rate').textContent = formatDelta(challenge.simulation.variantConversionRate - challenge.simulation.baseConversionRate, true);

        // Update uplift metrics
        document.getElementById('visitor-uplift').textContent = formatUplift(challenge.simulation.visitorUplift);
        document.getElementById('conversion-uplift').textContent = formatUplift(challenge.simulation.conversionUplift);
        document.getElementById('uplift-value').textContent = formatUplift(challenge.simulation.uplift);
    },

    updateProgress() {
        const progressBar = document.getElementById('progress-bar');
        const progressPercent = (this.state.experimentsInCurrentRound / this.state.EXPERIMENTS_PER_SESSION) * 100;
        progressBar.style.width = `${progressPercent}%`;
        document.getElementById('current-experiment').textContent = this.state.experimentsInCurrentRound + 1;
    },

    handleDecision(decisionType, value) {
        if (decisionType === 'trust') {
            this.state.trustDecision = value;
        } else if (decisionType === 'decision') {
            this.state.implementDecision = value;
        } else if (decisionType === 'follow_up') {
            this.state.followUpDecision = value;
        }

        this.checkDecisions();
    },

    checkDecisions() {
        const submitButton = document.getElementById('submit-decision');

        // Check if any button in each group is selected
        const trustSelected = Array.from(document.querySelectorAll('.decision-btn[name="trust"]')).some(btn => btn.classList.contains('selected'));
        const decisionSelected = Array.from(document.querySelectorAll('.decision-btn[name="decision"]')).some(btn => btn.classList.contains('selected'));
        const followUpSelected = Array.from(document.querySelectorAll('.decision-btn[name="follow_up"]')).some(btn => btn.classList.contains('selected'));

        console.log('Trust selected:', trustSelected);
        console.log('Decision selected:', decisionSelected);
        console.log('Follow up selected:', followUpSelected);

        if (trustSelected && decisionSelected && followUpSelected) {
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
    },

    resetDecisions() {
        // Reset all decision buttons
        document.querySelectorAll('.decision-btn').forEach(button => {
            button.style.opacity = '0.7';
            button.style.transform = 'scale(1)';
            button.classList.remove('selected');
            button.disabled = false; // Enable the buttons
            button.style.cursor = 'pointer'; // Reset cursor
        });

        // Reset state
        this.state.trustDecision = null;
        this.state.implementDecision = null;
        this.state.followUpDecision = null;
        this.state.hasSubmitted = false;

        // Reset submit button
        const submitButton = document.getElementById('submit-decision');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        submitButton.textContent = 'Submit Decision';
    },

    async evaluateDecision() {
        if (!this.state.trustDecision || !this.state.implementDecision) {
            return;
        }

        try {
            // If this is a subsequent click, just show the feedback dialog
            if (this.state.hasSubmitted) {
                ModalManager.show('feedback-modal');
                return;
            }

            // Mark that we've submitted
            this.state.hasSubmitted = true;

            this.state.totalAttempts++;

            // Check if this is the last experiment of the round BEFORE incrementing
            const isLastExperiment = this.state.experimentsInCurrentRound === this.state.EXPERIMENTS_PER_SESSION - 1;

            this.state.experimentsInCurrentRound++;

            // Use the global analysis
            const analysis = window.currentAnalysis;
            const experiment = window.currentExperiment;

            // Calculate impact
            const actualEffect = experiment.simulation.actualEffectSize;
            const expectedDailyVisitors = experiment.experiment.visitorsPerDay;

            // Calculate impact in terms of conversions per day
            const calculateConversionImpact = (effectSize) => {
                return Math.round(effectSize * expectedDailyVisitors);
            };

            // Record user's chosen option
            let userImpact = 0;
            let userChoice = "None";
            if (this.state.implementDecision === "KEEP_VARIANT") {
                userChoice = "Variant";
            } else if (this.state.implementDecision === "KEEP_BASE") {
                userChoice = "Base";
            } else if (this.state.implementDecision === "KEEP_RUNNING") {
                userChoice = "Keep Running";
            }

            // Get competitor's decision
            const competitorDecision = this.state.currentCompetitor.makeDecision(experiment);
            let competitorImpact = 0;
            let competitorChoice = "None";

            if (competitorDecision.decision === "KEEP_VARIANT") {
                competitorChoice = "Variant";
            } else if (competitorDecision.decision === "KEEP_BASE") {
                competitorChoice = "Base";
            } else if (competitorDecision.decision === "KEEP_RUNNING") {
                competitorChoice = "Keep Running";
            }

            // Determine which variant is better based on improvement direction
            const actualEffectCpd = calculateConversionImpact(actualEffect);
            const directionFactor = experiment.experiment.improvementDirection === window.IMPROVEMENT_DIRECTION.LOWER ? -1 : 1;
            const adjustedEffect = actualEffectCpd * directionFactor;
            const variantBetter = adjustedEffect > 0;
            const effectMagnitude = Math.abs(actualEffectCpd);

            // Impacts shown in the table should reflect the signed true effect
            let userImpactDisplay = 0;
            if (this.state.implementDecision === "KEEP_VARIANT") {
                userImpactDisplay = actualEffectCpd;
            }

            let competitorImpactDisplay = 0;
            if (competitorDecision.decision === "KEEP_VARIANT") {
                competitorImpactDisplay = actualEffectCpd;
            }

            // Calculate impact for user based on correctness
            if ((variantBetter && this.state.implementDecision === "KEEP_VARIANT") ||
                (!variantBetter && this.state.implementDecision === "KEEP_BASE")) {
                userImpact = effectMagnitude;
            }

            // Calculate impact for competitor based on correctness
            if ((variantBetter && competitorDecision.decision === "KEEP_VARIANT") ||
                (!variantBetter && competitorDecision.decision === "KEEP_BASE")) {
                competitorImpact = effectMagnitude;
            }

            // Update cumulative effects
            this.state.userCumulativeEffect += userImpact;
            this.state.competitorCumulativeEffect += competitorImpact;

            // Update impact displays
            this.updateImpactDisplay();

            // Update modal displays
            const bestVariant = variantBetter ? "Variant" : "Base";
            
            // Determine if user made the correct decision
            const userImplementDecision = this.state.implementDecision;
            const correctDecision = analysis.decision.decision;
            const userMadeCorrectDecision = (userImplementDecision === correctDecision);
            
            // Create the impact message based on relative impact compared to opponent
            let impactMessage;
            let impactDisplayClass;
            let impactTextClass;
            
            // Calculate relative impact (user impact - opponent impact)
            const userImpactValue = userImpact;
            const opponentImpactValue = competitorImpact;
            const relativeImpact = userImpactValue - opponentImpactValue;
            
            // Determine if user made the optimal choice (chose the better variant)
            const userChoseBest = (variantBetter && userImplementDecision === "KEEP_VARIANT") ||
                                 (!variantBetter && userImplementDecision === "KEEP_BASE");
            
            // Color coding based on relative impact
            if (relativeImpact > 0) {
                // User scores positive relative impact
                impactDisplayClass = 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2 mt-2';
                impactTextClass = 'text-green-700 font-semibold';
            } else if (relativeImpact < 0) {
                // User scores negative relative impact
                impactDisplayClass = 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-2 mt-2';
                impactTextClass = 'text-red-700 font-semibold';
            } else {
                // User scores zero relative impact
                impactDisplayClass = 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2 mt-2';
                impactTextClass = 'text-blue-700 font-semibold';
            }
            
            // Construct message based on true effect and choices
            if (actualEffectCpd === 0) {
                // Line 1: Prefix and true effect
                impactMessage = `No difference between base and variant.`;
                
                // Line 2: Opponent choice (empty for no effect case)
                const opponentChoiceElement = document.getElementById('modal-opponent-choice');
                if (opponentChoiceElement) {
                    opponentChoiceElement.textContent = '';
                }
                
                // Line 3: Impact with badge
                const impactLineElement = document.getElementById('modal-impact-line');
                if (impactLineElement) {
                    impactLineElement.innerHTML = `your relative impact is <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded-full shadow-sm">0 cpd</span>`;
                }
            } else {
                const isCorrect = userChoseBest || actualEffectCpd === 0;
                var prefix = isCorrect ? "Correct!" : "Oops!";
                if (userImplementDecision === "KEEP_RUNNING") {
                    prefix = "";
                }
                
                let opponentChoiceText;
                if (competitorDecision.decision === "KEEP_VARIANT") {
                    opponentChoiceText = "variant";
                } else if (competitorDecision.decision === "KEEP_BASE") {
                    opponentChoiceText = "base";
                } else {
                    opponentChoiceText = "keep running";
                }
                
                // Line 1: Prefix and true effect
                impactMessage = `${prefix} The true effect is ${actualEffectCpd} cpd.`;
                
                // Line 2: Opponent choice
                const opponentChoiceElement = document.getElementById('modal-opponent-choice');
                if (opponentChoiceElement) {
                    const opponentName = this.state.currentCompetitor ? this.state.currentCompetitor.name : 'Opponent';
                    opponentChoiceElement.textContent = `Since ${opponentName} chose ${opponentChoiceText},`;
                }
                
                // Line 3: Impact with badge
                const badgeColor = relativeImpact > 0 ? 'bg-green-500' : relativeImpact < 0 ? 'bg-red-500' : 'bg-blue-500';
                const impactLineElement = document.getElementById('modal-impact-line');
                const plus = relativeImpact >= 0 ? '+' : '';
                if (impactLineElement) {
                    impactLineElement.innerHTML = `your relative impact is <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white ${badgeColor} rounded-full shadow-sm">${plus}${relativeImpact} cpd</span>`;
                }
            }
            
            // Apply consistent styling to all text elements based on the color scheme
            const textColorClass = relativeImpact > 0 ? 'text-green-700 font-semibold' : relativeImpact < 0 ? 'text-red-700 font-semibold' : 'text-blue-700 font-semibold';
            
            const bestVariantElement = document.getElementById('modal-best-variant');
            const opponentChoiceElement = document.getElementById('modal-opponent-choice');
            const impactLineElement = document.getElementById('modal-impact-line');
            
            if (bestVariantElement) bestVariantElement.className = textColorClass;
            if (opponentChoiceElement) opponentChoiceElement.className = textColorClass;
            if (impactLineElement) {
                // Keep the existing content but update the text color
                const currentContent = impactLineElement.innerHTML;
                impactLineElement.className = textColorClass;
                impactLineElement.innerHTML = currentContent;
            }
            
            // Determine if user and competitor made correct choices
            const userMadeCorrectChoice = (userChoice === bestVariant);
            const competitorMadeCorrectChoice = (competitorChoice === bestVariant);
            
            // Create icons for impact table
            const userIcon = userMadeCorrectChoice ? 
                '<svg class="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' :
                '<svg class="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
            
            const competitorIcon = competitorMadeCorrectChoice ? 
                '<svg class="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' :
                '<svg class="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
            
            const modalElements = {
                'modal-best-variant': impactMessage,
                'modal-user-choice': userChoice,
                'modal-user-impact': userImpactDisplay,
                'modal-competitor-choice': competitorChoice,
                'modal-competitor-impact': competitorImpactDisplay,
                'modal-user-icon': userIcon,
                'modal-competitor-icon': competitorIcon
            };

            // Safely update modal elements
            Object.entries(modalElements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    if (id.includes('icon')) {
                        element.innerHTML = value;
                    } else {
                        element.textContent = value;
                    }
                }
            });

            // Set impact table content cell colors to match their icons
            const userChoiceElement = document.getElementById('modal-user-choice');
            const userImpactElement = document.getElementById('modal-user-impact');
            const competitorChoiceElement = document.getElementById('modal-competitor-choice');
            const competitorImpactElement = document.getElementById('modal-competitor-impact');
            
            // Determine colors based on impact values
            let userColor, competitorColor;
            if (userImpact === competitorImpact) {
                // Same impact - both blue
                userColor = 'text-blue-600';
                competitorColor = 'text-blue-600';
            } else if (userImpact > competitorImpact) {
                // User has higher impact - user green, competitor red
                userColor = 'text-green-600';
                competitorColor = 'text-red-600';
            } else {
                // Competitor has higher impact - competitor green, user red
                userColor = 'text-red-600';
                competitorColor = 'text-green-600';
            }
            
            if (userChoiceElement) userChoiceElement.className = `py-1 px-2 ${userColor} whitespace-nowrap`;
            if (userImpactElement) userImpactElement.className = `py-1 px-2 ${userColor} font-semibold whitespace-nowrap`;
            if (competitorChoiceElement) competitorChoiceElement.className = `py-1 px-2 ${competitorColor} whitespace-nowrap`;
            if (competitorImpactElement) competitorImpactElement.className = `py-1 px-2 ${competitorColor} font-semibold whitespace-nowrap`;

            // Update impact display styling
            const impactDisplay = document.getElementById('impact-display');
            const impactText = document.getElementById('modal-best-variant');
            if (impactDisplay && impactText) {
                impactDisplay.className = impactDisplayClass;
                impactText.className = impactTextClass;
            }

            // Update competitor name in the modal
            this.updateCompetitorName();

            // Compare user's choices with analysis result
            let correctChoices = 0;
            const totalChoices = 3;
            let feedbackMessage = '';

            // Check trustworthiness
            const userTrust = this.state.trustDecision === "TRUSTWORTHY";
            const analysisTrust = analysis.decision.trustworthy === "TRUSTWORTHY";
            const displayTrust = analysisTrust ? "Yes" : "No";
            const userTrustDisplay = userTrust ? "Yes" : "No";

            // Check decision
            const userDecision = this.state.implementDecision;
            const analysisDecision = analysis.decision.decision;
            const displayDecision = analysisDecision === "KEEP_VARIANT" ? "Keep Variant" :
                                  analysisDecision === "KEEP_BASE" ? "Keep Base" : "Keep Running";
            const userDecisionDisplay = userDecision === "KEEP_VARIANT" ? "Keep Variant" :
                                      userDecision === "KEEP_BASE" ? "Keep Base" : "Keep Running";

            // Check follow-up
            const userFollowUp = this.state.followUpDecision;
            const analysisFollowUp = analysis.decision.followUp;
            const displayFollowUp = analysisFollowUp === "CELEBRATE" ? "Celebrate" :
                                  analysisFollowUp === "ITERATE" ? "Iterate" :
                                  analysisFollowUp === "VALIDATE" ? "Validate" :
                                  analysisFollowUp === "RERUN" ? "Fix & Rerun" : "None";
            const userFollowUpDisplay = userFollowUp === "CELEBRATE" ? "Celebrate" :
                                      userFollowUp === "ITERATE" ? "Iterate" :
                                      userFollowUp === "VALIDATE" ? "Validate" :
                                      userFollowUp === "RERUN" ? "Fix & Rerun" : "None";

            // Build table rows with optional tooltips
            const trustExplanation = userTrust === analysisTrust ? '' : this.getTrustExplanation(analysis);
            const decisionExplanation = userDecision === analysisDecision ? '' : this.getDecisionExplanation(analysis);
            const followUpExplanation = userFollowUp === analysisFollowUp ? '' : this.getFollowUpExplanation(analysis);

            const trustIcon = userTrust === analysisTrust ?
                '<svg class="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' :
                `<span class="tooltip-trigger"><svg class="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span class="tooltip-content">${trustExplanation}</span></span>`;

            const decisionIcon = userDecision === analysisDecision ?
                '<svg class="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' :
                `<span class="tooltip-trigger"><svg class="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span class="tooltip-content">${decisionExplanation}</span></span>`;

            const followUpIcon = userFollowUp === analysisFollowUp ?
                '<svg class="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' :
                `<span class="tooltip-trigger"><svg class="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span class="tooltip-content">${followUpExplanation}</span></span>`;

            // Count correct choices
            if (userTrust === analysisTrust) correctChoices++;
            if (userDecision === analysisDecision) correctChoices++;
            if (userFollowUp === analysisFollowUp) correctChoices++;

            // Create table format
            feedbackMessage = `
                <div class="overflow-x-auto">
                    <table class="w-full text-sm border-collapse">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="text-left py-1 px-2 font-medium text-gray-700 whitespace-nowrap"></th>
                                <th class="text-left py-1 px-2 font-medium text-gray-700 whitespace-nowrap">Your Choice</th>
                                <th class="text-left py-1 px-2 font-medium text-gray-700 whitespace-nowrap">Correct Choice</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-gray-100">
                                <td class="py-1 px-2 flex items-center space-x-2 whitespace-nowrap">
                                    ${trustIcon}
                                    <span class="font-medium text-gray-700">Trustworthy?</span>
                                </td>
                                <td class="py-1 px-2 ${userTrust === analysisTrust ? 'text-green-600' : 'text-red-600'} whitespace-nowrap">${userTrustDisplay}</td>
                                <td class="py-1 px-2 text-gray-600 whitespace-nowrap">${displayTrust}</td>
                            </tr>
                            <tr class="border-b border-gray-100">
                                <td class="py-1 px-2 flex items-center space-x-2 whitespace-nowrap">
                                    ${decisionIcon}
                                    <span class="font-medium text-gray-700">Decision</span>
                                </td>
                                <td class="py-1 px-2 ${userDecision === analysisDecision ? 'text-green-600' : 'text-red-600'} whitespace-nowrap">${userDecisionDisplay}</td>
                                <td class="py-1 px-2 text-gray-600 whitespace-nowrap">${displayDecision}</td>
                            </tr>
                            <tr>
                                <td class="py-1 px-2 flex items-center space-x-2 whitespace-nowrap">
                                    ${followUpIcon}
                                    <span class="font-medium text-gray-700">Follow-up</span>
                                </td>
                                <td class="py-1 px-2 ${userFollowUp === analysisFollowUp ? 'text-green-600' : 'text-red-600'} whitespace-nowrap">${userFollowUpDisplay}</td>
                                <td class="py-1 px-2 text-gray-600 whitespace-nowrap">${displayFollowUp}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            // Calculate score based on performance
            const isPerfect = (correctChoices === totalChoices);
            const isGood = (correctChoices >= 2);

            // Store the result for this experiment in the round
            const experimentResult = {
                experiment: this.state.experimentsInCurrentRound,
                isPerfect: isPerfect,
                isGood: isGood,
                correctChoices: correctChoices
            };
            this.state.roundResults[this.state.experimentsInCurrentRound - 1] = experimentResult;

            // Update feedback icon and title based on performance
            const feedbackIcon1 = document.getElementById('feedback-icon-1');
            const feedbackIcon2 = document.getElementById('feedback-icon-2');
            const feedbackIcon3 = document.getElementById('feedback-icon-3');
            const feedbackTitle = document.getElementById('feedback-title');
            const scoreCardTitle = document.getElementById('score-card-title');
            const scoreDisplay = document.getElementById('score-display');
            
            // Create the score card title with round and experiment info
            const scoreCardTitleText = `Round ${this.state.currentRound}, Experiment ${this.state.experimentsInCurrentRound}`;
            
            // Update tick marks based on round progress
            this.updateRoundTickMarks();
            
            if (isPerfect) {
                this.state.score++;
                this.state.correctInCurrentRound++;
                
                feedbackTitle.textContent = 'Score Card';
                scoreCardTitle.textContent = scoreCardTitleText;
                
                // Update score display for perfect performance
                scoreDisplay.className = 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2 mt-2';
                scoreDisplay.innerHTML = `
                    <p class="text-xs text-gray-600 leading-tight text-center">
                        <span class="text-green-700 font-semibold">Perfect! All 3 decisions right: </span>
                        <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-green-500 rounded-full shadow-sm">+1</span>
                        <span class="text-green-700 font-semibold"> point!</span>
                    </p>
                `;
                
                ModalManager.showFeedback(true, feedbackMessage);
            } else if (isGood) {
                this.state.score += 0.5;
                this.state.correctInCurrentRound++;
                
                feedbackTitle.textContent = 'Score Card';
                scoreCardTitle.textContent = scoreCardTitleText;
                
                // Update score display for good performance
                scoreDisplay.className = 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2 mt-2';
                scoreDisplay.innerHTML = `
                    <p class="text-xs text-gray-600 leading-tight text-center">
                        <span class="text-blue-700 font-semibold">Good Job! You got ${correctChoices} out of 3 right: </span>
                        <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded-full shadow-sm">+0.5</span>
                        <span class="text-blue-700 font-semibold"> point!</span>
                    </p>
                `;
                
                ModalManager.showFeedback(true, feedbackMessage);
            } else {
                feedbackTitle.textContent = 'Score Card';
                scoreCardTitle.textContent = scoreCardTitleText;
                
                // Update score display for poor performance
                scoreDisplay.className = 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-2 mt-2';
                if (correctChoices === 0) {
                    scoreDisplay.innerHTML = `
                        <p class="text-xs text-gray-600 leading-tight text-center">
                            <span class="text-red-700 font-semibold">Oops! No right decisions, no points!</span>
                            <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-sm">+0</span>
                        </p>
                    `;
                } else {
                    scoreDisplay.innerHTML = `
                        <p class="text-xs text-gray-600 leading-tight text-center">
                            <span class="text-red-700 font-semibold">Oops! Just 1, not enough to score: </span>
                            <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-sm">+0</span>
                            <span class="text-red-700 font-semibold"> points!</span>
                        </p>
                    `;
                }
                
                if (correctChoices === 0) {
                    ModalManager.showFeedback(false, feedbackMessage);
                } else {
                    ModalManager.showFeedback(false, feedbackMessage);
                }
            }

            // Initialize tooltips for any mistake explanations
            this.initializeTooltipTriggers(document.getElementById('feedback-message'));

            const accuracy = Math.round((this.state.score / this.state.totalAttempts) * 100);
            this.updateScoreDisplay();
            this.updateAccuracyDisplay(accuracy);

            // Check if this was the last experiment in the current round
            if (this.state.experimentsInCurrentRound === this.state.EXPERIMENTS_PER_SESSION) {
                // Check if player got at least 2 experiments right
                if (this.state.correctInCurrentRound >= 2) {
                    document.getElementById('next-challenge-btn').textContent = 'Next Round!';
                } else {
                    document.getElementById('next-challenge-btn').textContent = 'Done';
                }
            }

            // Disable all decision buttons after submission
            document.querySelectorAll('.decision-btn').forEach(button => {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            });

        } catch (error) {
            console.error('Error evaluating decision:', error);
            ModalManager.showFeedback(false, 'Error evaluating decision. Please try again.');
        }
    },

    updateScoreDisplay() {
        const scoreElement = document.getElementById('score');
        const modalScoreElement = document.getElementById('modal-score');
        
        if (scoreElement) {
            scoreElement.textContent = this.state.score;
        }
        if (modalScoreElement) {
            modalScoreElement.textContent = this.state.score;
        }
    },

    updateAccuracyDisplay(accuracy) {
        const accuracyElement = document.getElementById('accuracy');
        const modalAccuracyElement = document.getElementById('modal-accuracy');
        
        if (accuracyElement) {
            accuracyElement.textContent = `${accuracy}%`;
        }
        if (modalAccuracyElement) {
            modalAccuracyElement.textContent = `${accuracy}%`;
        }
    },

    updateRoundDisplay() {
        document.getElementById('current-round').textContent = this.state.currentRound;
    },

    async handleNextChallenge() {
        const feedbackModal = document.getElementById('feedback-modal');
        const nextChallengeBtn = document.getElementById('next-challenge-btn');

        ModalManager.hide('feedback-modal');

        if (this.state.experimentsInCurrentRound === this.state.EXPERIMENTS_PER_SESSION) {
            // Always advance progress bar to 100% at the end of a round
            const progressBar = document.getElementById('progress-bar');
            progressBar.style.width = '100%';

            // Wait a moment to show the full progress bar
            await new Promise(resolve => setTimeout(resolve, 500));

            if (this.state.correctInCurrentRound >= 2) {
                // Start new round
                this.state.currentExperiment = 1; // Reset the experiment counter
                this.state.experimentsInCurrentRound = 0;
                this.state.correctInCurrentRound = 0;
                this.state.currentRound++; // Increment the round number
                this.state.roundResults = []; // Reset round results for new round
                this.updateRoundDisplay(); // Update the round display
                // Show round splash first
                this.showRoundSplash();
                // Wait for splash animation to complete before loading new challenge
                await new Promise(resolve => setTimeout(resolve, 2000));
                this.resetDecisions();
                this.loadChallenge();
                // Reset progress bar
                progressBar.style.width = '0%';
                document.getElementById('current-experiment').textContent = '1';
            } else {
                // End game
                this.showCompletionModal();
            }
        } else {
            this.resetDecisions();
            this.loadChallenge();
        }
    },

    showRoundSplash() {
        const splash = document.getElementById('round-splash');
        const overlay = document.getElementById('round-splash-overlay');
        if (!splash || !overlay) {
            return;
        }

        // Get the round caption if it exists
        const roundCaptions = {
            1: "Warm Up", // First round caption
            2: "Let's Begin!", // Second round caption
            // Add more round captions here as needed
        };

        const caption = roundCaptions[this.state.currentRound] || "";

        // Set the round text with caption - maintain original large font size and center the caption
        splash.innerHTML = `<div style="text-align: center;">
            <div style="font-size: 8rem; font-weight: bold;">Round ${this.state.currentRound}</div>
            ${caption ? `<div style="font-size: 2rem; margin-top: 1rem;">${caption}</div>` : ''}
        </div>`;

        // Show the overlay and blur effect
        overlay.classList.add('active');

        // Show the splash
        splash.style.display = 'block';
        splash.style.opacity = '0';
        splash.style.transform = 'translate(-50%, -50%) scale(0.5)';

        // Force reflow
        void splash.offsetWidth;

        // Start animation
        splash.style.opacity = '1';
        splash.style.transform = 'translate(-50%, -50%) scale(1)';

        // Hide the splash and overlay after animation completes
        setTimeout(() => {
            splash.style.opacity = '0';
            splash.style.transform = 'translate(-50%, -50%) scale(0.5)';

            setTimeout(() => {
                splash.style.display = 'none';
                overlay.classList.remove('active');
            }, 500);
        }, 1500);
    },

    showCompletionModal() {
        const experimentContainer = document.getElementById('challenge-container');
        const completionModal = document.getElementById('completion-modal');
        const feedbackModal = document.getElementById('feedback-modal');

        // Hide feedback modal first
        feedbackModal.classList.add('hidden');
        feedbackModal.classList.remove('fade-in');

        // Then hide experiment container
        experimentContainer.classList.add('fade-out');

        setTimeout(() => {
            document.getElementById('final-score').textContent = this.state.score;
            document.getElementById('final-accuracy').textContent = `${Math.round((this.state.score / this.state.totalAttempts) * 100)}%`;
            document.getElementById('final-user-impact').textContent = `${this.state.userCumulativeEffect} cpd`;
            document.getElementById('final-opponent-impact').textContent = `${this.state.competitorCumulativeEffect} cpd`;
            document.getElementById('final-round').textContent = this.state.currentRound;

            completionModal.classList.remove('hidden');
            setTimeout(() => {
                completionModal.classList.add('fade-in');
            }, 10);
        }, 500);
    },

    startNewSession() {
        const completionModal = document.getElementById('completion-modal');
        const experimentContainer = document.getElementById('challenge-container');
        const tutorialSection = document.getElementById('tutorial-section');

        // Hide modals and experiment container
        completionModal.classList.add('hidden');
        completionModal.classList.remove('fade-in');
        experimentContainer.classList.add('hidden');
        experimentContainer.classList.remove('fade-out');

        // Show tutorial section
        tutorialSection.classList.remove('hidden');

        // Reset state
        this.state.currentExperiment = 1;
        this.state.score = 0;
        this.state.totalAttempts = 0;
        this.state.currentRound = 1; // Reset round number for new session
        this.state.experimentsInCurrentRound = 0;
        this.state.correctInCurrentRound = 0;
        this.state.impact = 0;
        this.state.userCumulativeEffect = 0;
        this.state.competitorCumulativeEffect = 0;
        this.state.currentCompetitor = null;
        this.state.selectedCompetitor = null;
        this.state.roundResults = []; // Reset round results

        // Update displays
        this.updateScoreDisplay();
        this.updateAccuracyDisplay(0);
        this.updateRoundDisplay(); // Update the round display
        this.updateImpactDisplay(); // Update impact display
        document.getElementById('current-experiment').textContent = this.state.currentExperiment;

        // Reset button text
        const nextButton = document.getElementById('next-challenge-btn');
        if (nextButton) {
            nextButton.textContent = 'Next!';
        }

        // Reset progress bar
        document.getElementById('progress-bar').style.width = '0%';

        // Clear any existing experiment data
        window.currentExperiment = null;
        window.currentAnalysis = null;
    },

    shareOnTwitter() {
        const text = `I just completed the A/B Testing Gym challenge with a score of ${this.state.score} and ${Math.round((this.state.score / this.state.totalAttempts) * 100)}% accuracy! Try it yourself!`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`);
    },

    shareOnLinkedIn() {
        const text = `I just completed the A/B Testing Gym challenge with a score of ${this.state.score} and ${Math.round((this.state.score / this.state.totalAttempts) * 100)}% accuracy! Try it yourself!`;
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(text)}`);
    },

    updateImpactDisplay() {
        document.getElementById('user-impact').textContent = `${this.state.userCumulativeEffect} cpd`;
        document.getElementById('opponent-impact').textContent = `${this.state.competitorCumulativeEffect} cpd`;
    },

    formatPercent(value) {
        return `${(value * 100).toFixed(1)}%`;
    },

    updateCompetitorName() {
        const competitorName = this.state.currentCompetitor.name;
        const competitorNameElement = document.getElementById('competitor-name');
        const finalCompetitorNameElement = document.getElementById('final-competitor-name');
        const modalCompetitorNameElement = document.getElementById('modal-competitor-name');
        
        if (competitorNameElement) {
            competitorNameElement.textContent = competitorName;
        }
        if (finalCompetitorNameElement) {
            finalCompetitorNameElement.textContent = competitorName;
        }
        if (modalCompetitorNameElement) {
            modalCompetitorNameElement.textContent = competitorName;
        }
    },

    updateRoundTickMarks() {
        const feedbackIcon1 = document.getElementById('feedback-icon-1');
        const feedbackIcon2 = document.getElementById('feedback-icon-2');
        const feedbackIcon3 = document.getElementById('feedback-icon-3');
        const roundProgressText = document.getElementById('round-progress-text');
        
        // Update round progress text
        if (roundProgressText) {
            roundProgressText.textContent = `Round ${this.state.currentRound} Progress: ${this.state.correctInCurrentRound}/${this.state.experimentsInCurrentRound} correct`;
        }
        
        // Reset all icons to gray placeholder (empty circles)
        [feedbackIcon1, feedbackIcon2, feedbackIcon3].forEach(icon => {
            icon.className = 'flex items-center justify-center h-10 w-10 rounded-full bg-gray-200';
            icon.innerHTML = '';
        });
        
        // Update icons based on round results
        for (let i = 0; i < this.state.roundResults.length; i++) {
            const result = this.state.roundResults[i];
            const icon = [feedbackIcon1, feedbackIcon2, feedbackIcon3][i];
            const isCurrentExperiment = (i === this.state.experimentsInCurrentRound - 1);
            
            if (result) {
                if (result.isPerfect || result.isGood) {
                    // Green checkmark for any points scored (perfect or good)
                    const baseClass = 'flex items-center justify-center rounded-full bg-green-100';
                    const sizeClass = isCurrentExperiment ? 'h-12 w-12 border-2 border-green-600' : 'h-10 w-10';
                    icon.className = `${baseClass} ${sizeClass}`;
                    const iconSize = isCurrentExperiment ? 'h-6 w-6' : 'h-5 w-5';
                    icon.innerHTML = `<svg class="${iconSize} text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
                } else {
                    // Red X only when no points are scored (poor performance)
                    const baseClass = 'flex items-center justify-center rounded-full bg-red-100';
                    const sizeClass = isCurrentExperiment ? 'h-12 w-12 border-2 border-red-600' : 'h-10 w-10';
                    icon.className = `${baseClass} ${sizeClass}`;
                    const iconSize = isCurrentExperiment ? 'h-6 w-6' : 'h-5 w-5';
                    icon.innerHTML = `<svg class="${iconSize} text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
                }
            }
        }
    }
};

// Initialize UI Controller when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        UIController.init();
    });
} else {
    UIController.init();
} 