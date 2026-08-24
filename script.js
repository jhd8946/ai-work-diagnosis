document.addEventListener('DOMContentLoaded', () => {
    const tasksContainer = document.getElementById('tasks-container');
    const taskTemplate = document.getElementById('task-template');
    
    // Summary elements
    const totalAnnualHoursEl = document.getElementById('total-annual-hours');
    const annualWorkDaysEl = document.getElementById('annual-work-days');
    const dailyAvgHoursEl = document.getElementById('daily-avg-hours');
    const totalAnnualTasksEl = document.getElementById('total-annual-tasks');
    const timeElementsBreakdownEl = document.getElementById('time-elements-breakdown');
    
    // Default preset time elements
    const defaultElements = [
        { name: '기안작성', hours: 0 },
        { name: '회의자료작성', hours: 0 },
        { name: '사전준비', hours: 0 },
        { name: '지출기안', hours: 0 },
        { name: '증빙수집', hours: 0 },
        { name: '결과보고', hours: 0 }
    ];

    let state = {
        annualWorkDays: 210,
        tasks: []
    };

    // Load from local storage
    const loadState = () => {
        const saved = localStorage.getItem('aiWorkDiagnosisState');
        if (saved) {
            state = JSON.parse(saved);
        } else {
            // Add initial empty task if no save data
            addTask();
        }
        annualWorkDaysEl.value = state.annualWorkDays;
        renderAll();
    };

    const saveState = () => {
        localStorage.setItem('aiWorkDiagnosisState', JSON.stringify(state));
    };

    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

    const addTask = () => {
        state.tasks.push({
            id: generateId(),
            name: '',
            role: '주관',
            type: '반복',
            years: '1년',
            annualCount: 1,
            elements: JSON.parse(JSON.stringify(defaultElements))
        });
        saveState();
        renderAll();
    };

    const removeTask = (id) => {
        if(confirm('이 업무를 삭제하시겠습니까?')) {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveState();
            renderAll();
        }
    };

    const updateTask = (id, field, value) => {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task[field] = value;
            saveState();
            updateSummary();
        }
    };

    const updateTaskElement = (taskId, elementIndex, field, value) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (task && task.elements[elementIndex]) {
            task.elements[elementIndex][field] = value;
            saveState();
            renderTask(taskId); // Re-render specific task to update its duration
            updateSummary();
        }
    };

    const addElementToTask = (taskId) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            task.elements.push({ name: '', hours: 0 });
            saveState();
            renderAll(); // Re-render to show new element
        }
    };

    const removeElementFromTask = (taskId, elementIndex) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            task.elements.splice(elementIndex, 1);
            saveState();
            renderAll();
            updateSummary();
        }
    };

    // Rendering
    const renderAll = () => {
        tasksContainer.innerHTML = '';
        state.tasks.forEach((task, index) => {
            const taskEl = document.importNode(taskTemplate.content, true);
            const card = taskEl.querySelector('.task-card');
            
            // Set Index
            taskEl.querySelector('.task-index').textContent = index + 1;
            
            // Set Name
            const nameInput = taskEl.querySelector('.task-name');
            nameInput.value = task.name;
            nameInput.addEventListener('change', (e) => updateTask(task.id, 'name', e.target.value));

            // Set Meta
            const roleSelect = taskEl.querySelector('.task-role');
            roleSelect.value = task.role;
            roleSelect.addEventListener('change', (e) => updateTask(task.id, 'role', e.target.value));

            const typeSelect = taskEl.querySelector('.task-type');
            typeSelect.value = task.type;
            typeSelect.addEventListener('change', (e) => updateTask(task.id, 'type', e.target.value));

            const yearsSelect = taskEl.querySelector('.task-years');
            yearsSelect.value = task.years;
            yearsSelect.addEventListener('change', (e) => updateTask(task.id, 'years', e.target.value));

            // Delete btn
            taskEl.querySelector('.delete-task').addEventListener('click', () => removeTask(task.id));
            
            // Add element btn
            taskEl.querySelector('.add-element').addEventListener('click', () => addElementToTask(task.id));

            // Annual count
            const countInput = taskEl.querySelector('.task-annual-count');
            countInput.value = task.annualCount;
            countInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value) || 0;
                updateTask(task.id, 'annualCount', val);
                renderTask(task.id);
            });

            // Render elements
            const elementsList = taskEl.querySelector('.elements-list');
            task.elements.forEach((el, elIndex) => {
                const elDiv = document.createElement('div');
                elDiv.className = 'element-item';
                
                const nameInp = document.createElement('input');
                nameInp.type = 'text';
                nameInp.placeholder = '요소명';
                nameInp.value = el.name;
                nameInp.addEventListener('change', (e) => updateTaskElement(task.id, elIndex, 'name', e.target.value));
                
                const hoursInp = document.createElement('input');
                hoursInp.type = 'number';
                hoursInp.min = '0';
                hoursInp.value = el.hours;
                hoursInp.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value) || 0;
                    updateTaskElement(task.id, elIndex, 'hours', val);
                });

                const span = document.createElement('span');
                span.textContent = 'H';
                span.style.color = '#6c757d';
                span.style.fontSize = '0.8rem';

                const rmBtn = document.createElement('button');
                rmBtn.className = 'remove-element';
                rmBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                rmBtn.addEventListener('click', () => removeElementFromTask(task.id, elIndex));

                elDiv.appendChild(nameInp);
                elDiv.appendChild(hoursInp);
                elDiv.appendChild(span);
                elDiv.appendChild(rmBtn);
                
                elementsList.appendChild(elDiv);
            });

            // Give the card an id to target for updates
            card.dataset.id = task.id;

            // Calculate duration and annual hours for this specific render instance
            const duration = task.elements.reduce((sum, el) => sum + (parseFloat(el.hours) || 0), 0);
            const annualHours = duration * (task.annualCount || 0);
            
            taskEl.querySelector('.task-duration').textContent = duration + ' H';
            taskEl.querySelector('.task-annual-hours').textContent = annualHours + ' H';

            tasksContainer.appendChild(taskEl);
        });
        updateSummary();
    };

    // Update only task calculations without full re-render
    const renderTask = (taskId) => {
        const task = state.tasks.find(t => t.id === taskId);
        if(!task) return;
        
        const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
        if(card) {
            const duration = task.elements.reduce((sum, el) => sum + (parseFloat(el.hours) || 0), 0);
            const annualHours = duration * (task.annualCount || 0);
            
            card.querySelector('.task-duration').textContent = duration + ' H';
            card.querySelector('.task-annual-hours').textContent = annualHours + ' H';
        }
    };

    // Update Overall Summary
    const updateSummary = () => {
        let totalHours = 0;
        let totalTasks = 0;
        let elementsMap = {};

        state.tasks.forEach(task => {
            const duration = task.elements.reduce((sum, el) => sum + (parseFloat(el.hours) || 0), 0);
            const count = task.annualCount || 0;
            const annual = duration * count;
            
            totalHours += annual;
            totalTasks += count;

            task.elements.forEach(el => {
                if(el.name.trim() !== '') {
                    const elAnnual = (parseFloat(el.hours) || 0) * count;
                    if(elementsMap[el.name]) {
                        elementsMap[el.name] += elAnnual;
                    } else {
                        elementsMap[el.name] = elAnnual;
                    }
                }
            });
        });

        const days = parseFloat(state.annualWorkDays) || 1;
        const avgDaily = totalHours / days;

        totalAnnualHoursEl.textContent = totalHours + ' H';
        totalAnnualTasksEl.textContent = totalTasks + ' 건';
        dailyAvgHoursEl.textContent = avgDaily.toFixed(1) + ' H';

        // Update elements breakdown
        timeElementsBreakdownEl.innerHTML = '';
        Object.entries(elementsMap).sort((a,b) => b[1] - a[1]).forEach(([name, hours]) => {
            if(hours > 0) {
                const div = document.createElement('div');
                div.className = 'breakdown-item';
                div.innerHTML = `<span>${name}</span><span>${hours} H</span>`;
                timeElementsBreakdownEl.appendChild(div);
            }
        });
    };

    // Event Listeners
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    
    annualWorkDaysEl.addEventListener('input', (e) => {
        state.annualWorkDays = parseFloat(e.target.value) || 210;
        saveState();
        updateSummary();
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        if(confirm('모든 데이터를 초기화하시겠습니까?')) {
            localStorage.removeItem('aiWorkDiagnosisState');
            state = { annualWorkDays: 210, tasks: [] };
            addTask();
        }
    });

    document.getElementById('export-excel-btn').addEventListener('click', () => {
        const wb = XLSX.utils.book_new();
        
        // Prepare Data
        const data = [];
        data.push(["업무명", "주체", "형태", "지속년수", "건당소요시간(H)", "년간건수", "년간업무시간(H)", "타임요소상세"]);
        
        state.tasks.forEach(task => {
            const duration = task.elements.reduce((sum, el) => sum + (parseFloat(el.hours) || 0), 0);
            const annualHours = duration * (task.annualCount || 0);
            const elementsStr = task.elements.filter(e => parseFloat(e.hours) > 0)
                                    .map(e => `${e.name}(${e.hours}h)`)
                                    .join(", ");
                                    
            data.push([
                task.name || '미입력',
                task.role,
                task.type,
                task.years,
                duration,
                task.annualCount,
                annualHours,
                elementsStr
            ]);
        });
        
        // Add Summary row
        const totalHours = state.tasks.reduce((sum, task) => {
            const dur = task.elements.reduce((s, el) => s + (parseFloat(el.hours) || 0), 0);
            return sum + (dur * (task.annualCount || 0));
        }, 0);
        const totalCounts = state.tasks.reduce((sum, task) => sum + (task.annualCount || 0), 0);
        
        data.push([]);
        data.push(["종합 결과"]);
        data.push(["총 년간 업무소요시간", `${totalHours} H`]);
        data.push(["년간 업무일수", `${state.annualWorkDays} 일`]);
        data.push(["1일 평균 근무시간", `${(totalHours / state.annualWorkDays).toFixed(1)} H`]);
        data.push(["총 년간 업무수", `${totalCounts} 건`]);

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "자가업무진단");
        
        // File download
        XLSX.writeFile(wb, "AI_자가업무진단_결과.xlsx");
    });

    // Init
    loadState();
});
