document.addEventListener('DOMContentLoaded', () => {
    const tasksContainer = document.getElementById('tasks-container');
    const taskTemplate = document.getElementById('task-template');
    
    // Summary elements
    const sumTotalHours = document.getElementById('sum-total-hours');
    const annualWorkDays = document.getElementById('annual-work-days');
    const sumDailyHours = document.getElementById('sum-daily-hours');
    const sumTotalTasks = document.getElementById('sum-total-tasks');
    const timeSummaryContainer = document.getElementById('time-summary-container');
    
    // Defined time elements based on PDF Page 6 Excel spec
    const TIME_ELEMENTS = [
        "기획(구상)", "기안결재", "첨부자료정리", "교육준비", "출석체크", 
        "지출결재", "결과보고작성", "문서관리", "행사총괄", "행사지원", 
        "발표자료", "업무개발", "환경관리"
    ];

    let state = {
        userInfo: { dept: '', position: '', name: '', gender: '남', years: 0, year: 2026 },
        annualWorkDays: 210,
        tasks: []
    };

    const loadState = () => {
        const saved = localStorage.getItem('aiWorkDiagnosisStateV2');
        if (saved) {
            state = JSON.parse(saved);
        } else {
            addTask();
        }
        
        // Restore user info
        document.getElementById('user-dept').value = state.userInfo.dept || '';
        document.getElementById('user-position').value = state.userInfo.position || '';
        document.getElementById('user-name').value = state.userInfo.name || '';
        document.getElementById('user-gender').value = state.userInfo.gender || '남';
        document.getElementById('user-years').value = state.userInfo.years || 0;
        document.getElementById('user-year').value = state.userInfo.year || 2026;
        annualWorkDays.value = state.annualWorkDays || 210;
        
        renderAll();
    };

    const saveState = () => {
        // Update user info before saving
        state.userInfo.dept = document.getElementById('user-dept').value;
        state.userInfo.position = document.getElementById('user-position').value;
        state.userInfo.name = document.getElementById('user-name').value;
        state.userInfo.gender = document.getElementById('user-gender').value;
        state.userInfo.years = document.getElementById('user-years').value;
        state.userInfo.year = document.getElementById('user-year').value;
        state.annualWorkDays = annualWorkDays.value;
        
        localStorage.setItem('aiWorkDiagnosisStateV2', JSON.stringify(state));
    };

    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

    const addTask = () => {
        let elMap = {};
        TIME_ELEMENTS.forEach(el => elMap[el] = 0);
        
        state.tasks.push({
            id: generateId(),
            name: '',
            role: '주관',
            type: '신규',
            years: '1년',
            annualCount: 1,
            elements: elMap
        });
        saveState();
        renderAll();
    };

    const removeTask = (id) => {
        if(confirm('해당 업무를 삭제하시겠습니까?')) {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveState();
            renderAll();
        }
    };

    const renderAll = () => {
        tasksContainer.innerHTML = '';
        state.tasks.forEach((task, index) => {
            const taskEl = document.importNode(taskTemplate.content, true);
            const card = taskEl.querySelector('.task-card');
            
            taskEl.querySelector('.task-index').textContent = index + 1;
            
            const nameInp = taskEl.querySelector('.task-name');
            nameInp.value = task.name;
            nameInp.addEventListener('change', (e) => { task.name = e.target.value; saveState(); });

            const roleSel = taskEl.querySelector('.task-role');
            roleSel.value = task.role;
            roleSel.addEventListener('change', (e) => { task.role = e.target.value; saveState(); });

            const typeSel = taskEl.querySelector('.task-type');
            typeSel.value = task.type;
            typeSel.addEventListener('change', (e) => { task.type = e.target.value; saveState(); });

            const yearsSel = taskEl.querySelector('.task-years');
            yearsSel.value = task.years;
            yearsSel.addEventListener('change', (e) => { task.years = e.target.value; saveState(); });

            const countInp = taskEl.querySelector('.task-annual-count');
            countInp.value = task.annualCount;
            countInp.addEventListener('input', (e) => { 
                task.annualCount = parseInt(e.target.value) || 0; 
                saveState(); 
                updateCalculations(card, task);
                updateSummary();
            });

            taskEl.querySelector('.delete-btn').addEventListener('click', () => removeTask(task.id));

            taskEl.querySelector('.task-complete').addEventListener('click', () => {
                addTask();
                setTimeout(() => {
                    const scrollContainer = document.querySelector('.tasks-wrapper');
                    scrollContainer.scrollLeft = scrollContainer.scrollWidth;
                }, 100);
            });

            // Render time elements
            const elList = taskEl.querySelector('.time-elements-list');
            TIME_ELEMENTS.forEach(elName => {
                const row = document.createElement('div');
                row.className = 'el-row';
                
                const label = document.createElement('div');
                label.className = 'el-name';
                label.textContent = elName;
                
                const inp = document.createElement('input');
                inp.type = 'number';
                inp.className = 'el-input';
                inp.min = '0';
                inp.value = task.elements[elName] || '';
                inp.placeholder = '1~20';
                
                inp.addEventListener('input', (e) => {
                    task.elements[elName] = parseFloat(e.target.value) || 0;
                    saveState();
                    updateCalculations(card, task);
                    updateSummary();
                });
                
                const unit = document.createElement('span');
                unit.className = 'el-unit';
                unit.textContent = '1~20H';
                
                row.appendChild(label);
                row.appendChild(inp);
                row.appendChild(unit);
                elList.appendChild(row);
            });
            
            card.dataset.id = task.id;
            tasksContainer.appendChild(taskEl);
            updateCalculations(card, task);
        });
        updateSummary();
    };

    const updateCalculations = (card, task) => {
        let duration = 0;
        Object.values(task.elements).forEach(val => duration += val);
        const annualHours = duration * (task.annualCount || 0);
        
        card.querySelector('.task-duration').textContent = duration;
        card.querySelector('.task-annual-hours').textContent = annualHours;
    };

    const updateSummary = () => {
        let totalHours = 0;
        let totalTasks = 0;
        let elTotals = {};
        TIME_ELEMENTS.forEach(el => elTotals[el] = 0);

        state.tasks.forEach(task => {
            let duration = 0;
            const count = task.annualCount || 0;
            totalTasks += count;
            
            Object.entries(task.elements).forEach(([elName, val]) => {
                duration += val;
                elTotals[elName] += val * count;
            });
            totalHours += duration * count;
        });

        const days = parseFloat(annualWorkDays.value) || 1;
        const avgDaily = totalHours / days;

        sumTotalHours.textContent = totalHours;
        sumTotalTasks.textContent = totalTasks;
        sumDailyHours.textContent = avgDaily.toFixed(1);

        // Update breakdown
        timeSummaryContainer.innerHTML = '';
        TIME_ELEMENTS.forEach(elName => {
            const row = document.createElement('div');
            row.className = 'sum-row';
            row.innerHTML = `<span>${elName}</span><div class="sum-val">${elTotals[elName]}h</div>`;
            timeSummaryContainer.appendChild(row);
        });
    };

    // Event Listeners
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    
    annualWorkDays.addEventListener('input', () => {
        saveState();
        updateSummary();
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        if(confirm('모든 데이터를 초기화하시겠습니까?')) {
            localStorage.removeItem('aiWorkDiagnosisStateV2');
            state.tasks = [];
            addTask();
        }
    });

    document.getElementById('export-excel-btn').addEventListener('click', () => {
        saveState();
        const wb = XLSX.utils.book_new();
        const data = [];
        
        // Header according to Page 6
        const header = ["업무명", "업무주체", "업무형태", "업무지속년수", ...TIME_ELEMENTS, "소요시간", "횟수", "총소요시간"];
        data.push(header);
        
        state.tasks.forEach(task => {
            let row = [
                task.name || '미입력',
                task.role,
                task.type,
                task.years
            ];
            let duration = 0;
            
            TIME_ELEMENTS.forEach(el => {
                const val = task.elements[el] || 0;
                row.push(val > 0 ? val : "");
                duration += val;
            });
            
            const count = task.annualCount || 0;
            const total = duration * count;
            
            row.push(duration);
            row.push(count);
            row.push(total);
            
            data.push(row);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "업무진단결과");
        
        // User Info sheet
        const uiData = [
            ["소속", "직위", "성명", "성별", "근무년수", "해당년도"],
            [state.userInfo.dept, state.userInfo.position, state.userInfo.name, state.userInfo.gender, state.userInfo.years, state.userInfo.year]
        ];
        const uiWs = XLSX.utils.aoa_to_sheet(uiData);
        XLSX.utils.book_append_sheet(wb, uiWs, "사용자정보");
        
        XLSX.writeFile(wb, `AI_자가업무진단_결과_${state.userInfo.name}.xlsx`);
    });
    
    document.getElementById('main-complete-btn').addEventListener('click', () => {
        saveState();
        alert('기본 정보가 정상적으로 저장되었습니다!');
    });

    loadState();
});
