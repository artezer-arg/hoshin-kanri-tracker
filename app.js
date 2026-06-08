// app.js — Lógica de la aplicación Hoshin Kanri Tracker

// Constantes de configuración de la línea de tiempo
const MONTHS_CONFIG = [
    { name: "Junio", weeks: 5 },
    { name: "Julio", weeks: 4 },
    { name: "Agosto", weeks: 5 },
    { name: "Septiembre", weeks: 4 },
    { name: "Octubre", weeks: 4 },
    { name: "Noviembre", weeks: 5 },
    { name: "Diciembre", weeks: 4 },
    { name: "Enero", weeks: 4 },
    { name: "Febrero", weeks: 4 },
    { name: "Marzo", weeks: 5 }
];

const MONTH_MONDAYS = {
    "Junio": ["01", "08", "15", "22", "29"],
    "Julio": ["06", "13", "20", "27"],
    "Agosto": ["03", "10", "17", "24", "31"],
    "Septiembre": ["07", "14", "21", "28"],
    "Octubre": ["05", "12", "19", "26"],
    "Noviembre": ["02", "09", "16", "23", "30"],
    "Diciembre": ["07", "14", "21", "28"],
    "Enero": ["04", "11", "18", "25"],
    "Febrero": ["01", "08", "15", "22"],
    "Marzo": ["01", "08", "15", "22", "29"]
};

// Estado global de la aplicación
let tasks = [];
let projectsMetadata = {};
let currentView = "dashboard";
let currentUserRole = "admin"; // Rol por defecto
let filters = {
    search: "",
    proyecto: "",
    responsable: "",
    compania: "",
    status: ""
};

// Función segura para crear íconos con Lucide
function safeCreateIcons() {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        try {
            lucide.createIcons();
        } catch (e) {
            console.error("Error al ejecutar lucide.createIcons():", e);
        }
    } else {
        console.warn("Lucide Icons no está cargado. Asegúrate de tener conexión a Internet o que la URL del CDN sea accesible.");
    }
}

const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
};

function translateStatus(status) {
    const map = {
        "Completed": "Completado",
        "In Progress": "En Progreso",
        "Blocked": "Bloqueado",
        "Not Started": "No Iniciado"
    };
    return map[status] || status;
}

function getWeekAbsoluteIndex(monthName, weekNum) {
    let index = 0;
    for (let i = 0; i < MONTHS_CONFIG.length; i++) {
        if (MONTHS_CONFIG[i].name === monthName) {
            return index + (weekNum - 1);
        }
        index += MONTHS_CONFIG[i].weeks;
    }
    return -1;
}

function getGanttRowTiming(scheduleArray) {
    if (!scheduleArray || scheduleArray.length === 0) {
        return { startDate: "-", durationWeeks: 0 };
    }
    
    let minIdx = Infinity;
    let maxIdx = -Infinity;
    let startWeekObj = null;
    
    scheduleArray.forEach(item => {
        const idx = getWeekAbsoluteIndex(item.month, item.week);
        if (idx !== -1) {
            if (idx < minIdx) {
                minIdx = idx;
                startWeekObj = item;
            }
            if (idx > maxIdx) {
                maxIdx = idx;
            }
        }
    });
    
    if (minIdx === Infinity) {
        return { startDate: "-", durationWeeks: 0 };
    }
    
    const durationWeeks = maxIdx - minIdx + 1;
    
    const monthMapNum = {
        "Junio": "06", "Julio": "07", "Agosto": "08", "Septiembre": "09",
        "Octubre": "10", "Noviembre": "11", "Diciembre": "12",
        "Enero": "01", "Febrero": "02", "Marzo": "03"
    };
    
    const dayList = MONTH_MONDAYS[startWeekObj.month];
    const dayStr = dayList ? dayList[startWeekObj.week - 1] : "";
    const mm = monthMapNum[startWeekObj.month] || "";
    const startDate = (dayStr && mm) ? `${dayStr}/${mm}` : "-";
    
    return {
        startDate,
        durationWeeks
    };
}

function getProjectUnionSchedule(projectTasks) {
    const unionMap = new Set();
    const unionList = [];
    
    projectTasks.forEach(t => {
        if (!t) return;
        const schedules = [];
        if (t.schedule) schedules.push(...t.schedule);
        if (t.realSchedule) schedules.push(...t.realSchedule);
        
        schedules.forEach(s => {
            const key = `${s.month}_${s.week}`;
            if (!unionMap.has(key)) {
                unionMap.add(key);
                unionList.push({ month: s.month, week: s.week });
            }
        });
    });
    
    return unionList;
}

// Cargar estado inicial
document.addEventListener("DOMContentLoaded", () => {
    initApp();
    setupEventListeners();
    safeCreateIcons();
});

// Función para migrar los planes guardados de 4 semanas a la distribución de semanas reales del calendario (coherente)
function migrateSchedules(tasksArray) {
    if (!Array.isArray(tasksArray)) return;
    tasksArray.forEach(task => {
        if (!task) return;
        if (!task.schedule) return;
        
        // Mapear los elementos existentes para buscar rápido
        const schedMap = {};
        task.schedule.forEach(s => {
            schedMap[`${s.month}_W${s.week}`] = s;
        });
        
        const newItems = [];
        const fiveWeekMonths = ["Junio", "Agosto", "Noviembre", "Marzo"];
        
        // Heurística 1: Si la tarea estaba asignada a todas las 4 semanas de un mes de 5 semanas, la extendemos a la 5ta
        fiveWeekMonths.forEach(m => {
            const hasW1 = schedMap[`${m}_W1`];
            const hasW2 = schedMap[`${m}_W2`];
            const hasW3 = schedMap[`${m}_W3`];
            const hasW4 = schedMap[`${m}_W4`];
            
            if (hasW1 && hasW2 && hasW3 && hasW4) {
                newItems.push({
                    month: m,
                    week: 5,
                    color: hasW4.color || 14857357
                });
            }
        });
        
        // Heurística 2: Si la tarea es continua en el límite (Semana 4 de mes M y Semana 1 de mes M+1), llenamos la Semana 5
        const transitionMonths = [
            { current: "Junio", next: "Julio" },
            { current: "Agosto", next: "Septiembre" },
            { current: "Noviembre", next: "Diciembre" }
        ];
        
        transitionMonths.forEach(t => {
            const hasCurrentW4 = schedMap[`${t.current}_W4`];
            const hasNextW1 = schedMap[`${t.next}_W1`];
            
            if (hasCurrentW4 && hasNextW1) {
                const alreadyAdded = newItems.some(item => item.month === t.current && item.week === 5);
                if (!alreadyAdded && !schedMap[`${t.current}_W5`]) {
                    newItems.push({
                        month: t.current,
                        week: 5,
                        color: hasCurrentW4.color || 14857357
                    });
                }
            }
        });
        
        if (newItems.length > 0) {
            task.schedule = [...task.schedule, ...newItems];
        }
    });
}

// Inicializar la aplicación
function initApp() {
    // Cargar rol de usuario y validar sesión activa
    currentUserRole = localStorage.getItem("hoshin_user_role");
    if (!currentUserRole) {
        document.getElementById("btn-login-cancel").style.display = "none"; // Asegurar oculto en carga inicial
        document.getElementById("login-overlay").style.display = "flex";
        return; // Detener carga inicial
    }
    
    // Ocultar login si la sesión ya existe
    document.getElementById("login-overlay").style.display = "none";
    document.getElementById("btn-login-cancel").style.display = "none";
    
    const roleSelector = document.getElementById("role-selector");
    if (roleSelector) {
        roleSelector.value = currentUserRole;
    }

    // Intentar cargar desde localStorage con validación robusta
    const savedData = localStorage.getItem("hoshin_tasks");
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (Array.isArray(parsed)) {
                tasks = parsed;
            } else {
                console.warn("localStorage hoshin_tasks no es un array válido. Cargando datos por defecto.");
                loadBaselineData();
            }
        } catch (e) {
            console.error("Error al parsear localStorage, cargando datos por defecto:", e);
            loadBaselineData();
        }
    } else {
        loadBaselineData();
    }

    // Asegurar que tasks sea un array válido antes de proceder
    if (!Array.isArray(tasks)) {
        tasks = [];
    }

    // Migración única para usuarios con datos en localStorage
    const migrated = localStorage.getItem("hoshin_tasks_migrated_v2");
    if (!migrated) {
        migrateSchedules(tasks);
        localStorage.setItem("hoshin_tasks_migrated_v2", "true");
        saveToLocalStorage();
    }

    // Resetear todas las tareas a "Not Started" una sola vez
    const resetToNotStarted = localStorage.getItem("hoshin_tasks_reset_not_started_v1");
    if (!resetToNotStarted) {
        tasks.forEach(task => {
            if (task) {
                task.status = "Not Started";
            }
        });
        localStorage.setItem("hoshin_tasks_reset_not_started_v1", "true");
        saveToLocalStorage();
    }

    // Si la carga inicial no tiene 'Digital Twin' (proyecto nuevo), agregarlos desde BASE_DATA
    const hasDigitalTwin = tasks.some(t => t && t.proyecto === "Digital Twin");
    if (!hasDigitalTwin && typeof BASE_DATA !== 'undefined' && Array.isArray(BASE_DATA)) {
        const digitalTwinTasks = BASE_DATA.filter(t => t && t.proyecto === "Digital Twin");
        if (digitalTwinTasks.length > 0) {
            tasks = [...tasks, ...JSON.parse(JSON.stringify(digitalTwinTasks))];
            migrateSchedules(tasks); // Asegurar migración de nuevos
            saveToLocalStorage();
        }
    }

    // Intentar cargar metadata de proyectos
    const savedProjects = localStorage.getItem("hoshin_projects_metadata");
    if (savedProjects) {
        try {
            projectsMetadata = JSON.parse(savedProjects) || {};
        } catch (e) {
            console.error("Error al parsear projectsMetadata:", e);
            initProjectsMetadata();
        }
    } else {
        initProjectsMetadata();
    }

    // Asegurar que todos los proyectos actuales en tasks tengan metadata y se guarden
    let metadataChanged = false;
    const uniqueProjects = [...new Set(tasks.filter(t => t && t.proyecto).map(t => t.proyecto))];
    const defaultDescriptions = {
        "GECAP": "Gestión y Control de Asistencia de Personal. Integración de tableros de control y auditorías.",
        "Ausentismo": "Seguimiento y control de ausentismo. Desarrollo de portal de ingresos alternativos y tableros métricos.",
        "PEFF": "Proceso de Eficiencia de Flujo de Fabricación. Análisis, desarrollo y testeo de flujos operativos en planta.",
        "DX Office": "Digital Transformation Office. Proyectos transversales de automatización de oficinas y soporte de sistemas.",
        "Double fold": "Línea de doblado doble. Análisis, desarrollo e implementación de mejoras de hardware y software.",
        "HxH": "Hour by Hour (Hora por Hora). Validación de procesos y desarrollo de herramientas de reporte en planta.",
        "EOL": "End of Line (Fin de Línea). Análisis del proceso actual, tableros de control y conectividad con retrabajos.",
        "RPS": "Real-time Production System. Implementación de interfaces con SAP 770 y SAP HANA.",
        "SCRAP": "Control y reducción de desperdicios. Desarrollo de métricas y adquisición de hardware para control en planta.",
        "RFID": "Identificación por Radiofrecuencia. Análisis, desarrollo e implementación de hardware RFID en almacenes.",
        "737D": "Proyecto de automatización de línea 737D. Conexión TASA, impresión inmediata y tableros DOOR-EMS.",
        "Copilot": "Capacitación y desarrollo de personal para integración de asistentes de código y productividad.",
        "Digital Twin": "Modelado y simulación de gemelo digital para optimización de procesos y pruebas de planta."
    };
    uniqueProjects.forEach(proj => {
        if (proj && !projectsMetadata[proj]) {
            projectsMetadata[proj] = {
                status: "In Progress",
                description: defaultDescriptions[proj] || `Seguimiento del proyecto ${proj}.`
            };
            metadataChanged = true;
        }
    });
    if (metadataChanged) {
        saveProjectsMetadata();
    }
    
    // Si la carga inicial no tiene estados/notas, inicializar y guardar
    let tasksChanged = false;
    tasks.forEach(task => {
        if (!task) return;
        let changed = false;
        if (!task.status) {
            task.status = "Not Started";
            changed = true;
        }
        if (!task.notes) {
            task.notes = "";
            changed = true;
        }
        if (!task.realSchedule) {
            task.realSchedule = [];
            changed = true;
        }
        // Limpiar strings
        const origProj = task.proyecto;
        task.proyecto = task.proyecto ? task.proyecto.trim() : "Sin Proyecto";
        if (origProj !== task.proyecto) changed = true;

        const origResp = task.responsable;
        task.responsable = task.responsable ? task.responsable.trim() : "Sin Responsable";
        if (origResp !== task.responsable) changed = true;

        const origTarea = task.tarea;
        task.tarea = task.tarea ? task.tarea.trim() : "Sin Tarea";
        if (origTarea !== task.tarea) changed = true;

        const origComp = task.compania;
        task.compania = task.compania ? task.compania.trim() : "TBAR";
        if (origComp !== task.compania) changed = true;
        
        if (changed) {
            tasksChanged = true;
        }
    });
    if (tasksChanged) {
        saveToLocalStorage();
    }

    // Rellenar filtros select dinámicos
    populateFilterDropdowns();
    
    // Renderizar la vista por defecto
    renderCurrentView();
    updateThemeIcon();
}

// Cargar datos por defecto de data.js
function loadBaselineData() {
    if (typeof BASE_DATA !== 'undefined') {
        tasks = JSON.parse(JSON.stringify(BASE_DATA));
        migrateSchedules(tasks); // Asegurarse de migrar los datos base al restablecer
        saveToLocalStorage();
    } else {
        console.error("BASE_DATA no está definido. Asegúrate de que data.js esté cargado.");
        tasks = [];
    }
}

// Guardar datos en localStorage
function saveToLocalStorage() {
    localStorage.setItem("hoshin_tasks", JSON.stringify(tasks));
}

// Rellenar dropdowns de filtros basados en los datos de las tareas
function populateFilterDropdowns() {
    const proyectos = [...new Set(tasks.filter(t => t && t.proyecto).map(t => t.proyecto))].sort();
    const responsables = [...new Set(tasks.filter(t => t && t.responsable).map(t => t.responsable))].sort();
    
    const filterProyecto = document.getElementById("filter-proyecto");
    const filterResponsable = document.getElementById("filter-responsable");
    
    // Limpiar excepto el primero
    filterProyecto.innerHTML = '<option value="">Todos los Proyectos</option>';
    filterResponsable.innerHTML = '<option value="">Todos los Responsables</option>';
    
    proyectos.forEach(p => {
        if (p) {
            const opt = document.createElement("option");
            opt.value = p;
            opt.textContent = p;
            filterProyecto.appendChild(opt);
        }
    });
    
    responsables.forEach(r => {
        if (r) {
            const opt = document.createElement("option");
            opt.value = r;
            opt.textContent = r;
            filterResponsable.appendChild(opt);
        }
    });
}

// Configurar los manejadores de eventos
function setupEventListeners() {
    // Pestañas de Navegación
    document.querySelectorAll(".nav-tab").forEach(tab => {
        tab.addEventListener("click", (e) => {
            document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
            const targetTab = e.currentTarget;
            targetTab.classList.add("active");
            
            currentView = targetTab.getAttribute("data-view");
            renderCurrentView();
        });
    });

    // Filtros de búsqueda
    document.getElementById("search-text").addEventListener("input", (e) => {
        filters.search = e.target.value.toLowerCase();
        renderCurrentView();
    });

    document.getElementById("filter-proyecto").addEventListener("change", (e) => {
        filters.proyecto = e.target.value;
        renderCurrentView();
    });

    document.getElementById("filter-responsable").addEventListener("change", (e) => {
        filters.responsable = e.target.value;
        renderCurrentView();
    });

    document.getElementById("filter-compania").addEventListener("change", (e) => {
        filters.compania = e.target.value;
        renderCurrentView();
    });

    document.getElementById("filter-status").addEventListener("change", (e) => {
        filters.status = e.target.value;
        renderCurrentView();
    });

    document.getElementById("btn-reset-filters").addEventListener("click", () => {
        document.getElementById("search-text").value = "";
        document.getElementById("filter-proyecto").value = "";
        document.getElementById("filter-responsable").value = "";
        document.getElementById("filter-compania").value = "";
        document.getElementById("filter-status").value = "";
        
        filters = { search: "", proyecto: "", responsable: "", compania: "", status: "" };
        renderCurrentView();
    });

    // Alternar tema Claro/Oscuro
    document.getElementById("btn-theme-toggle").addEventListener("click", () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        html.setAttribute("data-theme", newTheme);
        updateThemeIcon();
    });

    // Impresión
    document.getElementById("btn-print").addEventListener("click", () => {
        // Formatear datos de impresión en el header antes de abrir el diálogo
        document.getElementById("print-date").textContent = new Date().toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        
        const stats = calculateStats();
        document.getElementById("print-progress").textContent = `${stats.pct}%`;
        
        // Forzar vista Gantt temporalmente en la pantalla si es necesario (el media query se encarga en la impresora)
        window.print();
    });

    // Exportar a Excel (Calidad Gráfica Premium con ExcelJS)
    document.getElementById("btn-export").addEventListener("click", () => {
        try {
            if (typeof ExcelJS === 'undefined') {
                alert("La biblioteca de Excel (ExcelJS) no está cargada. Revisa tu conexión a internet.");
                return;
            }
            
            const workbook = new ExcelJS.Workbook();
            workbook.creator = "DX Plan Toyota";
            


            // Hoja 1: Resumen Ejecutivo
            const wsResumen = workbook.addWorksheet('Resumen Ejecutivo', {
                views: [{ showGridLines: true }]
            });
            populateGanttWorksheet(wsResumen, true);

            // Hoja 2: Matriz Gantt Detallada
            const wsDetallada = workbook.addWorksheet('Matriz Gantt Detallada', {
                views: [{ showGridLines: true }]
            });
            populateGanttWorksheet(wsDetallada, false);

            // Hoja 3: Detalle de Tareas
            const wsTareas = workbook.addWorksheet('Detalle de Tareas', {
                views: [{ showGridLines: true }]
            });
            
            wsTareas.columns = [
                { header: 'ID', key: 'id', width: 6 },
                { header: 'Proyecto', key: 'proyecto', width: 16 },
                { header: 'Responsable', key: 'responsable', width: 16 },
                { header: 'Tarea', key: 'tarea', width: 50 },
                { header: 'Compañía', key: 'compania', width: 12 },
                { header: 'Estado', key: 'status', width: 15 },
                { header: 'Semanas Planificadas', key: 'weeks', width: 30 },
                { header: 'Notas / Observaciones', key: 'notes', width: 40 }
            ];
            
            wsTareas.getRow(1).height = 24;
            wsTareas.getRow(1).eachCell((cell) => {
                cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = thinBorder;
            });
            
            tasks.forEach(task => {
                const weeksList = task.schedule ? task.schedule.map(s => {
                    const dayStr = MONTH_MONDAYS[s.month][s.week - 1];
                    const monthMapNum = {
                        "Junio": "06", "Julio": "07", "Agosto": "08", "Septiembre": "09",
                        "Octubre": "10", "Noviembre": "11", "Diciembre": "12",
                        "Enero": "01", "Febrero": "02", "Marzo": "03"
                    };
                    return `${dayStr}/${monthMapNum[s.month]}`;
                }).join(", ") : "";
                
                const row = wsTareas.addRow({
                    id: task.id,
                    proyecto: task.proyecto,
                    responsable: task.responsable,
                    tarea: task.tarea,
                    compania: task.compania,
                    status: translateStatus(task.status),
                    weeks: weeksList,
                    notes: task.notes || ""
                });
                
                row.height = 20;
                
                row.eachCell((cell, colNum) => {
                    cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
                    cell.border = thinBorder;
                    cell.alignment = { vertical: 'middle', horizontal: (colNum === 1 || colNum === 5 || colNum === 6) ? 'center' : 'left', wrapText: true };
                    
                    if (colNum === 6) { // Estado coloring
                        const statusStyles = {
                            "Completed": { fg: 'FFD1FAE5', text: 'FF065F46' },
                            "In Progress": { fg: 'FFFEF3C7', text: 'FF92400E' },
                            "Blocked": { fg: 'FFFEE2E2', text: 'FF991B1B' },
                            "Not Started": { fg: 'FFF1F5F9', text: 'FF475569' }
                        };
                        const style = statusStyles[task.status] || statusStyles["Not Started"];
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fg } };
                        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: style.text } };
                    }
                });
            });
            
            // Descargar el archivo XLSX binario real
            workbook.xlsx.writeBuffer().then((buffer) => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `DX_Plan_Seguimiento_${new Date().toISOString().slice(0,10)}.xlsx`;
                anchor.click();
                window.URL.revokeObjectURL(url);
            });
            
        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            alert("Ocurrió un error al generar el archivo Excel: " + error.message);
        }
    });

    const fileInput = document.getElementById("json-file-input");
    document.getElementById("btn-import-trigger").addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const imported = JSON.parse(evt.target.result);
                let newTasks = [];
                let newMetadata = null;
                
                if (Array.isArray(imported)) {
                    newTasks = imported;
                } else if (imported && Array.isArray(imported.tasks)) {
                    newTasks = imported.tasks;
                    newMetadata = imported.projectsMetadata;
                } else {
                    alert("El archivo JSON no tiene un formato válido.");
                    return;
                }

                if (confirm(`¿Estás seguro de importar ${newTasks.length} tareas? Esto sobrescribirá los datos actuales.`)) {
                    tasks = newTasks;
                    saveToLocalStorage();
                    
                    if (newMetadata) {
                        projectsMetadata = newMetadata;
                        localStorage.setItem("hoshin_projects_metadata", JSON.stringify(projectsMetadata));
                    } else {
                        initProjectsMetadata();
                    }
                    
                    initApp();
                    alert("Tareas y configuraciones importadas con éxito.");
                }
            } catch (err) {
                alert("Error al leer el archivo JSON: " + err.message);
            }
        };
        reader.readAsText(file);
    });

    // Exportar Respaldo JSON
    const btnExportJson = document.getElementById("btn-export-json");
    if (btnExportJson) {
        btnExportJson.addEventListener("click", () => {
            try {
                const backupData = {
                    tasks: tasks,
                    projectsMetadata: projectsMetadata
                };
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `DX_Plan_Backup_${new Date().toISOString().slice(0,10)}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
            } catch (err) {
                console.error("Error al exportar JSON:", err);
                alert("Ocurrió un error al generar la copia de seguridad: " + err.message);
            }
        });
    }

    // Formulario Modal de Tarea
    const modal = document.getElementById("edit-modal");
    document.getElementById("btn-modal-close").addEventListener("click", closeModal);
    document.getElementById("btn-modal-cancel").addEventListener("click", closeModal);
    document.getElementById("btn-modal-save").addEventListener("click", saveTaskModal);
    document.getElementById("btn-add-task").addEventListener("click", () => openModal());

    // Gantt Summary Toggle
    const summaryToggle = document.getElementById("gantt-summary-toggle");
    if (summaryToggle) {
        summaryToggle.addEventListener("change", () => {
            renderGantt();
        });
    }

    // Kanban drag over handle
    document.querySelectorAll(".kanban-cards-container").forEach(container => {
        container.addEventListener("dragover", (e) => {
            e.preventDefault();
        });
        container.addEventListener("drop", (e) => {
            e.preventDefault();
            const taskId = parseInt(e.dataTransfer.getData("text/plain"));
            const newStatus = container.parentElement.getAttribute("data-status");
            updateTaskStatus(taskId, newStatus);
        });
    });

    // Cerrar el menú contextual al hacer clic fuera
    document.addEventListener("click", () => {
        const menu = document.getElementById("gantt-context-menu");
        if (menu) menu.style.display = "none";
    });

    // Selector de rol
    const roleSelector = document.getElementById("role-selector");
    if (roleSelector) {
        roleSelector.addEventListener("change", (e) => {
            const selectedRole = e.target.value;
            if (selectedRole === "admin") {
                // En vez de un prompt nativo en texto plano, abrimos la pantalla de login con contraseña oculta y botón cancelar
                document.getElementById("login-code").value = "";
                document.getElementById("login-error-msg").style.display = "none";
                document.getElementById("btn-login-cancel").style.display = "inline-flex";
                document.getElementById("login-overlay").style.display = "flex";
            } else if (selectedRole === "collaborator") {
                currentUserRole = "collaborator";
                localStorage.setItem("hoshin_user_role", "collaborator");
                renderCurrentView();
            } else {
                currentUserRole = "viewer";
                localStorage.setItem("hoshin_user_role", "viewer");
                renderCurrentView();
            }
        });
    }

    // Manejadores de la pantalla de acceso (Login)
    const btnLoginSubmit = document.getElementById("btn-login-submit");
    if (btnLoginSubmit) {
        btnLoginSubmit.addEventListener("click", handleLoginSubmit);
    }
    const btnLoginGuest = document.getElementById("btn-login-guest");
    if (btnLoginGuest) {
        btnLoginGuest.addEventListener("click", () => {
            localStorage.setItem("hoshin_user_role", "viewer");
            initApp();
        });
    }
    const btnLoginCollaborator = document.getElementById("btn-login-collaborator");
    if (btnLoginCollaborator) {
        btnLoginCollaborator.addEventListener("click", () => {
            localStorage.setItem("hoshin_user_role", "collaborator");
            initApp();
        });
    }
    const btnLoginCancel = document.getElementById("btn-login-cancel");
    if (btnLoginCancel) {
        btnLoginCancel.addEventListener("click", () => {
            document.getElementById("login-overlay").style.display = "none";
            if (roleSelector) {
                roleSelector.value = currentUserRole; // Restaurar rol anterior en la cabecera
            }
        });
    }
    const loginCodeInput = document.getElementById("login-code");
    if (loginCodeInput) {
        loginCodeInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                handleLoginSubmit();
            }
        });
    }

    function handleLoginSubmit() {
        const codeInput = document.getElementById("login-code");
        const errorMsg = document.getElementById("login-error-msg");
        if (codeInput.value === "1974") {
            localStorage.setItem("hoshin_user_role", "admin");
            errorMsg.style.display = "none";
            codeInput.value = "";
            document.getElementById("btn-login-cancel").style.display = "none";
            initApp();
        } else {
            errorMsg.style.display = "block";
            codeInput.value = "";
            codeInput.focus();
        }
    }

    // Manejadores de las opciones del menú contextual del Gantt
    const ctxTogglePlan = document.getElementById("ctx-toggle-plan");
    if (ctxTogglePlan) {
        ctxTogglePlan.addEventListener("click", (e) => {
            e.stopPropagation();
            if (currentCtxTarget) {
                toggleGanttWeek(currentCtxTarget.taskId, currentCtxTarget.monthName, currentCtxTarget.weekNum, "plan");
            }
            document.getElementById("gantt-context-menu").style.display = "none";
        });
    }

    const ctxToggleReal = document.getElementById("ctx-toggle-real");
    if (ctxToggleReal) {
        ctxToggleReal.addEventListener("click", (e) => {
            e.stopPropagation();
            if (currentCtxTarget) {
                toggleGanttWeek(currentCtxTarget.taskId, currentCtxTarget.monthName, currentCtxTarget.weekNum, "real");
            }
            document.getElementById("gantt-context-menu").style.display = "none";
        });
    }

    const ctxEdit = document.getElementById("ctx-edit-task");
    if (ctxEdit) {
        ctxEdit.addEventListener("click", (e) => {
            e.stopPropagation();
            if (currentCtxTarget) {
                openModal(currentCtxTarget.taskId);
            }
            document.getElementById("gantt-context-menu").style.display = "none";
        });
    }

    document.querySelectorAll(".context-menu-item.status-option").forEach(opt => {
        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            if (currentCtxTarget) {
                const newStatus = opt.getAttribute("data-status");
                updateTaskStatusDirectly(currentCtxTarget.taskId, newStatus);
            }
            document.getElementById("gantt-context-menu").style.display = "none";
        });
    });
}

// Cambiar ícono de tema
function updateThemeIcon() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const btn = document.getElementById("btn-theme-toggle");
    if (isDark) {
        btn.innerHTML = '<i data-lucide="sun"></i>';
    } else {
        btn.innerHTML = '<i data-lucide="moon"></i>';
    }
    safeCreateIcons();
}

// Obtener tareas filtradas
function getFilteredTasks() {
    return tasks.filter(task => {
        if (!task) return false;
        const matchesSearch = !filters.search || 
            (task.tarea && task.tarea.toLowerCase().includes(filters.search)) || 
            (task.proyecto && task.proyecto.toLowerCase().includes(filters.search));
        
        const matchesProyecto = !filters.proyecto || task.proyecto === filters.proyecto;
        const matchesResponsable = !filters.responsable || task.responsable === filters.responsable;
        const matchesCompania = !filters.compania || task.compania === filters.compania;
        const matchesStatus = !filters.status || task.status === filters.status;
        
        return matchesSearch && matchesProyecto && matchesResponsable && matchesCompania && matchesStatus;
    });
}

function applyRolePermissions() {
    const isReadOnlyOrCollab = (currentUserRole === "viewer" || currentUserRole === "collaborator");
    
    const btnAddTask = document.getElementById("btn-add-task");
    if (btnAddTask) {
        btnAddTask.style.display = isReadOnlyOrCollab ? "none" : "inline-flex";
    }
    const btnImport = document.getElementById("btn-import-trigger");
    if (btnImport) {
        btnImport.style.display = isReadOnlyOrCollab ? "none" : "inline-flex";
    }
}

// Renderizar la vista actual activa
function renderCurrentView() {
    // Aplicar permisos del rol activo
    applyRolePermissions();

    // Ocultar todos los paneles
    document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
    
    // Activar el panel seleccionado
    const activePanel = document.getElementById(`${currentView}-panel`);
    if (activePanel) {
        activePanel.classList.add("active");
    }

    // Renderizar datos del panel
    if (currentView === "dashboard") {
        renderDashboard();
    } else if (currentView === "gantt") {
        renderGantt();
    } else if (currentView === "kanban") {
        renderKanban();
    } else if (currentView === "table") {
        renderTable();
    } else if (currentView === "projects") {
        renderProjects();
    }
    
    safeCreateIcons();
}

// ==========================================================================
// 1. RENDER DASHBOARD
// ==========================================================================
function renderDashboard() {
    const stats = calculateStats();
    
    // Actualizar KPIs
    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-completed").textContent = stats.completed;
    document.getElementById("stat-progress").textContent = stats.progress;
    document.getElementById("stat-blocked").textContent = stats.blocked;
    
    // Dibujar Gráfico Donut de Estados
    renderDonutChart(stats);
    
    // Dibujar Carga de Trabajo de Proyectos
    renderProjectWorkloadChart();
    
    // Dibujar Tabla de Responsables
    renderResponsibleStatsTable();
}

function calculateStats() {
    const validTasks = tasks.filter(t => t);
    const total = validTasks.length;
    if (total === 0) return { total: 0, completed: 0, progress: 0, blocked: 0, pending: 0, pct: 0 };
    
    const completed = validTasks.filter(t => t.status === "Completed").length;
    const progress = validTasks.filter(t => t.status === "In Progress").length;
    const blocked = validTasks.filter(t => t.status === "Blocked").length;
    const pending = validTasks.filter(t => t.status === "Not Started").length;
    
    const pct = Math.round((completed / total) * 100);
    
    return { total, completed, progress, blocked, pending, pct };
}

function renderDonutChart(stats) {
    const completedPct = Math.round((stats.completed / stats.total) * 100) || 0;
    const progressPct = Math.round((stats.progress / stats.total) * 100) || 0;
    const blockedPct = Math.round((stats.blocked / stats.total) * 100) || 0;
    const pendingPct = 100 - (completedPct + progressPct + blockedPct);

    // Ajustar los segmentos del SVG
    // Circunferencia = 2 * PI * r = 2 * 3.14159 * 15.915 = 100
    const segCompleted = document.getElementById("donut-segment-completed");
    const segProgress = document.getElementById("donut-segment-progress");
    const segBlocked = document.getElementById("donut-segment-blocked");
    const segPending = document.getElementById("donut-segment-pending");

    // Dash array para cada uno
    segCompleted.setAttribute("stroke-dasharray", `${completedPct} 100`);
    segProgress.setAttribute("stroke-dasharray", `${progressPct} 100`);
    segBlocked.setAttribute("stroke-dasharray", `${blockedPct} 100`);
    segPending.setAttribute("stroke-dasharray", `${pendingPct} 100`);

    // Calcular offsets para apilarlos
    segCompleted.setAttribute("stroke-dashoffset", "0");
    segProgress.setAttribute("stroke-dashoffset", `-${completedPct}`);
    segBlocked.setAttribute("stroke-dashoffset", `-${completedPct + progressPct}`);
    segPending.setAttribute("stroke-dashoffset", `-${completedPct + progressPct + blockedPct}`);

    // Poner el porcentaje en el centro
    document.getElementById("donut-pct").textContent = `${completedPct}%`;

    // Renderizar leyenda
    const legend = document.getElementById("donut-legend");
    legend.innerHTML = `
        <div class="legend-item">
            <span class="legend-dot" style="background-color: #10b981;"></span>
            <span>Completado: <strong>${stats.completed}</strong> (${completedPct}%)</span>
        </div>
        <div class="legend-item">
            <span class="legend-dot" style="background-color: #f59e0b;"></span>
            <span>En Progreso: <strong>${stats.progress}</strong> (${progressPct}%)</span>
        </div>
        <div class="legend-item">
            <span class="legend-dot" style="background-color: #ef4444;"></span>
            <span>Bloqueado: <strong>${stats.blocked}</strong> (${blockedPct}%)</span>
        </div>
        <div class="legend-item">
            <span class="legend-dot" style="background-color: #64748b;"></span>
            <span>No Iniciado: <strong>${stats.pending}</strong> (${pendingPct}%)</span>
        </div>
    `;
}

function renderProjectWorkloadChart() {
    // Agrupar tareas por proyecto
    const projMap = {};
    tasks.forEach(t => {
        if (!t || !t.proyecto) return;
        if (!projMap[t.proyecto]) {
            projMap[t.proyecto] = { total: 0, completed: 0 };
        }
        projMap[t.proyecto].total++;
        if (t.status === "Completed") {
            projMap[t.proyecto].completed++;
        }
    });

    // Convertir a array y ordenar por total de tareas descendente
    const sortedProjects = Object.keys(projMap)
        .map(name => ({
            name,
            total: projMap[name].total,
            completed: projMap[name].completed,
            pct: Math.round((projMap[name].completed / projMap[name].total) * 100)
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Tomar los top 5

    const container = document.getElementById("project-bar-list");
    container.innerHTML = "";

    sortedProjects.forEach(p => {
        const barItem = document.createElement("div");
        barItem.className = "bar-item";
        barItem.innerHTML = `
            <div class="bar-header">
                <span class="bar-label">${p.name}</span>
                <span class="bar-value">${p.completed}/${p.total} Completadas (${p.pct}%)</span>
            </div>
            <div class="bar-outer">
                <div class="bar-inner" style="width: ${p.pct}%; background-color: ${p.pct === 100 ? '#10b981' : 'hsl(var(--primary))'}"></div>
            </div>
        `;
        container.appendChild(barItem);
    });
}

function renderResponsibleStatsTable() {
    // Agrupar por responsable
    const respMap = {};
    tasks.forEach(t => {
        if (!t || !t.responsable) return;
        if (!respMap[t.responsable]) {
            respMap[t.responsable] = { total: 0, completed: 0, progress: 0, blocked: 0, pending: 0 };
        }
        respMap[t.responsable].total++;
        if (t.status === "Completed") respMap[t.responsable].completed++;
        else if (t.status === "In Progress") respMap[t.responsable].progress++;
        else if (t.status === "Blocked") respMap[t.responsable].blocked++;
        else respMap[t.responsable].pending++;
    });

    const tbody = document.getElementById("responsible-stats-rows");
    tbody.innerHTML = "";

    Object.keys(respMap).sort().forEach(r => {
        const stats = respMap[r];
        const pct = Math.round((stats.completed / stats.total) * 100) || 0;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="font-weight: 600;">${r}</td>
            <td style="text-align: center; font-weight: 500;">${stats.total}</td>
            <td style="text-align: center; color: #34d399;">${stats.completed}</td>
            <td style="text-align: center; color: #fbbf24;">${stats.progress}</td>
            <td style="text-align: center; color: #f87171;">${stats.blocked}</td>
            <td style="text-align: center; color: #94a3b8;">${stats.pending}</td>
            <td style="text-align: center;">
                <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
                    <div style="width: 50px; background-color: var(--border); height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${pct}%; background-color: #10b981; height: 100%;"></div>
                    </div>
                    <strong>${pct}%</strong>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

            function populateGanttWorksheet(worksheet, isSummary) {
                // 1. Establecer anchos de columna
                worksheet.getColumn(1).width = 16;  // Proyecto
                worksheet.getColumn(2).width = 16;  // Responsable
                worksheet.getColumn(3).width = 45;  // Tarea o Descripción de Proyecto
                worksheet.getColumn(4).width = 12;  // Compañía
                worksheet.getColumn(5).width = 12;  // F. Inicio
                worksheet.getColumn(6).width = 12;  // Duración
                worksheet.getColumn(7).width = 15;  // Estado
                for (let c = 8; c <= 51; c++) {
                    worksheet.getColumn(c).width = 6.5; // Semanas
                }
                
                // 2. Escribir valores de cabeceras estáticas
                worksheet.getCell('A1').value = "Proyecto";
                worksheet.getCell('B1').value = "Responsable";
                worksheet.getCell('C1').value = isSummary ? "Descripción del Proyecto" : "Tarea";
                worksheet.getCell('D1').value = "Compañía";
                worksheet.getCell('E1').value = "F. Inicio";
                worksheet.getCell('F1').value = "Duración";
                worksheet.getCell('G1').value = "Estado";
                
                // Combinar verticalmente las cabeceras estáticas
                worksheet.mergeCells('A1:A2');
                worksheet.mergeCells('B1:B2');
                worksheet.mergeCells('C1:C2');
                worksheet.mergeCells('D1:D2');
                worksheet.mergeCells('E1:E2');
                worksheet.mergeCells('F1:F2');
                worksheet.mergeCells('G1:G2');
                
                // 3. Escribir meses y semanas
                let colIdx = 8;
                MONTHS_CONFIG.forEach(m => {
                    const startCol = colIdx;
                    const endCol = colIdx + m.weeks - 1;
                    
                    // Mes
                    const cell = worksheet.getCell(1, startCol);
                    cell.value = m.name;
                    worksheet.mergeCells(1, startCol, 1, endCol);
                    
                    // Semanas
                    for (let w = 1; w <= m.weeks; w++) {
                        const dayStr = MONTH_MONDAYS[m.name][w - 1];
                        const monthMapNum = {
                            "Junio": "06", "Julio": "07", "Agosto": "08", "Septiembre": "09",
                            "Octubre": "10", "Noviembre": "11", "Diciembre": "12",
                            "Enero": "01", "Febrero": "02", "Marzo": "03"
                        };
                        worksheet.getCell(2, colIdx).value = `${dayStr}/${monthMapNum[m.name]}`;
                        colIdx++;
                    }
                });
                
                // Estilo columnas estáticas (A1:G2)
                ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2", "F1", "F2", "G1", "G2"].forEach(pos => {
                    const cell = worksheet.getCell(pos);
                    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Dark Slate
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    cell.border = thinBorder;
                });
                
                // Estilo meses
                let colIdxStyle = 8;
                MONTHS_CONFIG.forEach(m => {
                    const startCol = colIdxStyle;
                    const endCol = colIdxStyle + m.weeks - 1;
                    for (let c = startCol; c <= endCol; c++) {
                        const cell = worksheet.getCell(1, c);
                        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        cell.border = thinBorder;
                    }
                    colIdxStyle += m.weeks;
                });
                
                // Estilo semanas
                for (let c = 8; c <= 51; c++) {
                    const cell = worksheet.getCell(2, c);
                    cell.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: 'FF475569' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Light Slate
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.border = thinBorder;
                }
                
                let rowNum = 3;
                
                if (isSummary) {
                    const uniqueProjectsInTasks = [...new Set(tasks.map(t => t.proyecto))].sort();
                    
                    uniqueProjectsInTasks.forEach(projName => {
                        const projectTasks = tasks.filter(t => t.proyecto === projName);
                        const status = projectsMetadata[projName]?.status || "In Progress";
                        const desc = projectsMetadata[projName]?.description || `Proyecto ${projName}`;
                        
                        const uniqueResps = [...new Set(projectTasks.map(t => t.responsable))].sort().join(", ");
                        const uniqueComps = [...new Set(projectTasks.map(t => t.compania))].sort().join(", ");
                        
                        const unionSchedule = getProjectUnionSchedule(projectTasks);
                        const timing = getGanttRowTiming(unionSchedule);
                        const durationText = timing.durationWeeks > 0 ? `${timing.durationWeeks} sem.` : "-";
                        
                        // Set values on top row of the pair (rowNum)
                        worksheet.getCell(rowNum, 1).value = projName;
                        worksheet.getCell(rowNum, 2).value = uniqueResps;
                        worksheet.getCell(rowNum, 3).value = desc;
                        worksheet.getCell(rowNum, 4).value = uniqueComps;
                        worksheet.getCell(rowNum, 5).value = timing.startDate;
                        worksheet.getCell(rowNum, 6).value = durationText;
                        worksheet.getCell(rowNum, 7).value = translateStatus(status);
                        
                        const rowStyles = [
                            { font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } }, alignment: { vertical: 'middle', horizontal: 'left' } },
                            { font: { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } }, alignment: { vertical: 'middle', horizontal: 'left' } },
                            { font: { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } }, alignment: { vertical: 'middle', horizontal: 'left', wrapText: true } },
                            { font: { name: 'Segoe UI', size: 9, bold: true }, alignment: { vertical: 'middle', horizontal: 'center' } },
                            { font: { name: 'Segoe UI', size: 9 }, alignment: { vertical: 'middle', horizontal: 'center' } },
                            { font: { name: 'Segoe UI', size: 9, bold: true }, alignment: { vertical: 'middle', horizontal: 'center' } },
                            { font: { name: 'Segoe UI', size: 9, bold: true }, alignment: { vertical: 'middle', horizontal: 'center' } }
                        ];
                        
                        // Merge columns 1 to 7 vertically (rowNum to rowNum + 1)
                        for (let c = 1; c <= 7; c++) {
                            worksheet.mergeCells(rowNum, c, rowNum + 1, c);
                        }
                        
                        // Apply borders to all merged cells (both rows)
                        for (let r = rowNum; r <= rowNum + 1; r++) {
                            for (let c = 1; c <= 7; c++) {
                                const cell = worksheet.getCell(r, c);
                                cell.border = thinBorder;
                            }
                        }
                        
                        // Style the top cells (rowNum)
                        for (let c = 1; c <= 7; c++) {
                            const cell = worksheet.getCell(rowNum, c);
                            cell.font = JSON.parse(JSON.stringify(rowStyles[c - 1].font));
                            cell.alignment = { ...rowStyles[c - 1].alignment, vertical: 'middle' };
                            
                            if (c === 4) { // Compañía badge
                                if (uniqueComps === "SAR") {
                                    cell.font.color = { argb: 'FF2563EB' };
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF5FF' } };
                                } else if (uniqueComps === "TBAR") {
                                    cell.font.color = { argb: 'FFD97706' };
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF2E9' } };
                                } else {
                                    cell.font.color = { argb: 'FF7E22CE' };
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
                                }
                            }
                            
                            if (c === 7) { // Estado badge
                                const statusStyles = {
                                    "Completed": { fg: 'FFD1FAE5', text: 'FF065F46' },
                                    "In Progress": { fg: 'FFFEF3C7', text: 'FF92400E' },
                                    "Blocked": { fg: 'FFFEE2E2', text: 'FF991B1B' },
                                    "Not Started": { fg: 'FFF1F5F9', text: 'FF475569' }
                                };
                                const style = statusStyles[status] || statusStyles["In Progress"];
                                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fg } };
                                cell.font.color = { argb: style.text };
                            }
                        }
                        
                        // Fill weeks: rowNum for Plan, rowNum + 1 for Real
                        let cIdx = 8;
                        MONTHS_CONFIG.forEach(m => {
                            for (let w = 1; w <= m.weeks; w++) {
                                const cellPlan = worksheet.getCell(rowNum, cIdx);
                                const cellReal = worksheet.getCell(rowNum + 1, cIdx);
                                
                                cellPlan.border = thinBorder;
                                cellReal.border = thinBorder;
                                
                                // Planified weeks
                                const hasPlan = projectTasks.some(t => t.schedule && t.schedule.some(s => s.month === m.name && s.week === w));
                                if (hasPlan) {
                                    cellPlan.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Light blue for plan
                                }
                                
                                // Real executed weeks
                                const weekStatus = getConsolidatedWeekStatus(projectTasks, m.name, w);
                                if (weekStatus) {
                                    const colorMap = {
                                        "Completed": 'FF10B981',  // Verde Toyota
                                        "In Progress": 'FFF59E0B', // Ámbar
                                        "Blocked": 'FFEF4444',     // Rojo
                                        "Not Started": 'FF64748B'  // Gris
                                    };
                                    const color = colorMap[weekStatus] || colorMap["Not Started"];
                                    cellReal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
                                }
                                cIdx++;
                            }
                        });
                        
                        worksheet.getRow(rowNum).height = 16;
                        worksheet.getRow(rowNum + 1).height = 16;
                        rowNum += 2;
                    });
                } else {
                    tasks.forEach(task => {
                        const timing = getGanttRowTiming(task.schedule && task.schedule.length > 0 ? task.schedule : task.realSchedule);
                        const durationText = timing.durationWeeks > 0 ? `${timing.durationWeeks} sem.` : "-";
                        
                        worksheet.getCell(rowNum, 1).value = task.proyecto;
                        worksheet.getCell(rowNum, 2).value = task.responsable;
                        worksheet.getCell(rowNum, 3).value = task.tarea;
                        worksheet.getCell(rowNum, 4).value = task.compania;
                        worksheet.getCell(rowNum, 5).value = timing.startDate;
                        worksheet.getCell(rowNum, 6).value = durationText;
                        worksheet.getCell(rowNum, 7).value = translateStatus(task.status);
                        
                        const rowStyles = [
                            { font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } }, alignment: { vertical: 'middle', horizontal: 'left' } },
                            { font: { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } }, alignment: { vertical: 'middle', horizontal: 'left' } },
                            { font: { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } }, alignment: { vertical: 'middle', horizontal: 'left', wrapText: true } },
                            { font: { name: 'Segoe UI', size: 9, bold: true }, alignment: { vertical: 'middle', horizontal: 'center' } },
                            { font: { name: 'Segoe UI', size: 9 }, alignment: { vertical: 'middle', horizontal: 'center' } },
                            { font: { name: 'Segoe UI', size: 9, bold: true }, alignment: { vertical: 'middle', horizontal: 'center' } },
                            { font: { name: 'Segoe UI', size: 9, bold: true }, alignment: { vertical: 'middle', horizontal: 'center' } }
                        ];
                        
                        // Merge columns 1 to 7 vertically (rowNum to rowNum + 1)
                        for (let c = 1; c <= 7; c++) {
                            worksheet.mergeCells(rowNum, c, rowNum + 1, c);
                        }
                        
                        // Apply borders to all merged cells (both rows)
                        for (let r = rowNum; r <= rowNum + 1; r++) {
                            for (let c = 1; c <= 7; c++) {
                                const cell = worksheet.getCell(r, c);
                                cell.border = thinBorder;
                            }
                        }
                        
                        // Style the top cells (rowNum)
                        for (let c = 1; c <= 7; c++) {
                            const cell = worksheet.getCell(rowNum, c);
                            cell.font = JSON.parse(JSON.stringify(rowStyles[c - 1].font));
                            cell.alignment = { ...rowStyles[c - 1].alignment, vertical: 'middle' };
                            
                            if (c === 4) { // Compañía badge
                                if (task.compania === "SAR") {
                                    cell.font.color = { argb: 'FF2563EB' };
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF5FF' } };
                                } else if (task.compania === "TBAR") {
                                    cell.font.color = { argb: 'FFD97706' };
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF2E9' } };
                                } else if (task.compania === "TBAR/SAR") {
                                    cell.font.color = { argb: 'FF7E22CE' };
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
                                }
                            }
                            
                            if (c === 7) { // Estado badge
                                const statusStyles = {
                                    "Completed": { fg: 'FFD1FAE5', text: 'FF065F46' },
                                    "In Progress": { fg: 'FFFEF3C7', text: 'FF92400E' },
                                    "Blocked": { fg: 'FFFEE2E2', text: 'FF991B1B' },
                                    "Not Started": { fg: 'FFF1F5F9', text: 'FF475569' }
                                };
                                const style = statusStyles[task.status] || statusStyles["Not Started"];
                                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fg } };
                                cell.font.color = { argb: style.text };
                            }
                        }
                        
                        // Fill weeks: rowNum for Plan, rowNum + 1 for Real
                        let cIdx = 8;
                        MONTHS_CONFIG.forEach(m => {
                            for (let w = 1; w <= m.weeks; w++) {
                                const cellPlan = worksheet.getCell(rowNum, cIdx);
                                const cellReal = worksheet.getCell(rowNum + 1, cIdx);
                                
                                cellPlan.border = thinBorder;
                                cellReal.border = thinBorder;
                                
                                // Planified weeks
                                const isScheduled = task.schedule && task.schedule.some(s => s.month === m.name && s.week === w);
                                if (isScheduled) {
                                    cellPlan.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Light blue for plan
                                }
                                
                                // Real executed weeks
                                const isRealScheduled = task.realSchedule && task.realSchedule.some(s => s.month === m.name && s.week === w);
                                if (isRealScheduled) {
                                    const colorMap = {
                                        "Completed": 'FF10B981',  // Verde Toyota
                                        "In Progress": 'FFF59E0B', // Ámbar
                                        "Blocked": 'FFEF4444',     // Rojo
                                        "Not Started": 'FF64748B'  // Gris
                                    };
                                    const color = colorMap[task.status] || colorMap["Not Started"];
                                    cellReal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
                                }
                                cIdx++;
                            }
                        });
                        
                        worksheet.getRow(rowNum).height = 16;
                        worksheet.getRow(rowNum + 1).height = 16;
                        rowNum += 2;
                    });
                }

                // Add visual Legend at the bottom of the worksheet
                rowNum += 2;
                worksheet.getCell(rowNum, 1).value = "Referencia Visual (Leyenda Gantt):";
                worksheet.getCell(rowNum, 1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
                
                rowNum++;
                worksheet.getCell(rowNum, 1).value = "Fila Superior (Celda de Arriba)";
                worksheet.getCell(rowNum, 2).value = "Semanas Planificadas (Plan)";
                worksheet.getCell(rowNum, 2).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF1E3A8A' } };
                worksheet.getCell(rowNum, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
                worksheet.getCell(rowNum, 2).border = thinBorder;
                
                rowNum++;
                worksheet.getCell(rowNum, 1).value = "Fila Inferior (Celda de Abajo)";
                worksheet.getCell(rowNum, 2).value = "Semanas Ejecutadas (Real) según estado de la tarea:";
                worksheet.getCell(rowNum, 2).font = { name: 'Segoe UI', size: 9 };
                
                rowNum++;
                worksheet.getCell(rowNum, 2).value = "Completado";
                worksheet.getCell(rowNum, 2).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF065F46' } };
                worksheet.getCell(rowNum, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
                worksheet.getCell(rowNum, 2).border = thinBorder;
                
                rowNum++;
                worksheet.getCell(rowNum, 2).value = "En Progreso";
                worksheet.getCell(rowNum, 2).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF92400E' } };
                worksheet.getCell(rowNum, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
                worksheet.getCell(rowNum, 2).border = thinBorder;
                
                rowNum++;
                worksheet.getCell(rowNum, 2).value = "Bloqueado";
                worksheet.getCell(rowNum, 2).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF991B1B' } };
                worksheet.getCell(rowNum, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
                worksheet.getCell(rowNum, 2).border = thinBorder;
                
                rowNum++;
                worksheet.getCell(rowNum, 2).value = "No Iniciado / Pendiente";
                worksheet.getCell(rowNum, 2).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF1E293B' } };
                worksheet.getCell(rowNum, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64748B' } };
                worksheet.getCell(rowNum, 2).border = thinBorder;
            }
function renderGanttColgroup() {
    const colgroup = document.getElementById("gantt-colgroup");
    if (!colgroup) return;
    
    colgroup.innerHTML = "";
    
    // Columnas fijas
    const cols = ["col-proyecto", "col-responsable", "col-tarea", "col-compania", "col-fecha-inicio", "col-duracion"];
    cols.forEach(cls => {
        const col = document.createElement("col");
        col.className = cls;
        colgroup.appendChild(col);
    });
    
    // Columnas de semanas
    MONTHS_CONFIG.forEach(m => {
        for (let w = 1; w <= m.weeks; w++) {
            const col = document.createElement("col");
            col.className = "col-week";
            colgroup.appendChild(col);
        }
    });
    
    // Columna de acción
    const colAction = document.createElement("col");
    colAction.className = "col-accion";
    colgroup.appendChild(colAction);
}

// Obtener el estado consolidado de las tareas en una semana específica de un proyecto
function getConsolidatedWeekStatus(projectTasks, monthName, weekNum) {
    const scheduledTasks = projectTasks.filter(t => t.realSchedule && t.realSchedule.some(s => s.month === monthName && s.week === weekNum));
    if (scheduledTasks.length === 0) return null;
    
    const hasBlocked = scheduledTasks.some(t => t.status === "Blocked");
    const hasInProgress = scheduledTasks.some(t => t.status === "In Progress");
    const hasCompleted = scheduledTasks.some(t => t.status === "Completed");
    const hasNotStarted = scheduledTasks.some(t => t.status === "Not Started");
    
    if (hasBlocked) {
        return "Blocked";
    }
    if (hasInProgress) {
        return "In Progress";
    }
    if (hasNotStarted && hasCompleted) {
        return "In Progress";
    }
    if (hasNotStarted) {
        return "Not Started";
    }
    if (hasCompleted) {
        return "Completed";
    }
    return "Not Started";
}

function renderGantt() {
    const filteredTasks = getFilteredTasks();
    
    const currentWeekInfo = getCurrentTimelineColumn();

    // Renderizar colgroup dinámico para controlar anchos
    renderGanttColgroup();

    // 1. Renderizar encabezados de meses y semanas
    const monthRow = document.getElementById("gantt-month-row");
    const weekRow = document.getElementById("gantt-week-row");
    
    // Limpiar dinámicos anteriores (manteniendo las 6 columnas estáticas iniciales)
    while (monthRow.children.length > 6) {
        monthRow.removeChild(monthRow.lastChild);
    }
    weekRow.innerHTML = "";
    
    // Crear meses y semanas
    MONTHS_CONFIG.forEach(m => {
        const thMonth = document.createElement("th");
        thMonth.className = "gantt-month-header";
        
        // Destacar mes si coincide con el mes actual
        if (currentWeekInfo && m.name === currentWeekInfo.month) {
            thMonth.style.color = "#f97316";
        }
        
        thMonth.colSpan = m.weeks;
        thMonth.textContent = m.name;
        monthRow.appendChild(thMonth);
        
        for (let w = 1; w <= m.weeks; w++) {
            const thWeek = document.createElement("th");
            thWeek.className = "gantt-week-header";
            
            // Transformar semanas en fechas reales tomando los días lunes del mapa
            const dayStr = MONTH_MONDAYS[m.name][w - 1];
            const monthMapNum = {
                "Junio": "06", "Julio": "07", "Agosto": "08", "Septiembre": "09",
                "Octubre": "10", "Noviembre": "11", "Diciembre": "12",
                "Enero": "01", "Febrero": "02", "Marzo": "03"
            };
            thWeek.textContent = `${dayStr}/${monthMapNum[m.name]}`;
            
            // Destacar columna de la semana actual
            if (currentWeekInfo && m.name === currentWeekInfo.month && w === currentWeekInfo.week) {
                thWeek.classList.add("current-week-column");
            }
            
            weekRow.appendChild(thWeek);
        }
    });

    // Agregar columna de acciones para desktop
    const thActions = document.createElement("th");
    thActions.rowSpan = 2;
    thActions.style.width = "60px";
    thActions.style.textAlign = "center";
    thActions.style.verticalAlign = "middle";
    thActions.innerHTML = "Acción";
    monthRow.appendChild(thActions);

    // 2. Renderizar filas de datos
    const tbody = document.getElementById("gantt-body");
    tbody.innerHTML = "";

    if (filteredTasks.length === 0) {
        const tr = document.createElement("tr");
        // colspan=51 (6 columnas fijas + 44 semanas + 1 acción)
        tr.innerHTML = `<td colspan="51" style="text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron tareas que coincidan con los filtros.</td>`;
        tbody.appendChild(tr);
        return;
    }

    const isSummaryView = document.getElementById("gantt-summary-toggle")?.checked || false;
    if (isSummaryView) {
        const uniqueProjectsInTasks = [...new Set(filteredTasks.map(t => t.proyecto))].sort();
        
        uniqueProjectsInTasks.forEach(projName => {
            const projectTasks = filteredTasks.filter(t => t.proyecto === projName);
            const status = projectsMetadata[projName]?.status || "In Progress";
            const desc = projectsMetadata[projName]?.description || `Proyecto ${projName}`;
            
            const uniqueResps = [...new Set(projectTasks.map(t => t.responsable))].sort().join(", ");
            const uniqueComps = [...new Set(projectTasks.map(t => t.compania))].sort().join(", ");
            
            const unionSchedule = getProjectUnionSchedule(projectTasks);
            const timing = getGanttRowTiming(unionSchedule);
            const durationText = timing.durationWeeks > 0 ? `${timing.durationWeeks} sem.` : "-";
            
            const tr = document.createElement("tr");
            tr.style.backgroundColor = "rgba(59, 130, 246, 0.03)";
            tr.style.cursor = "pointer";
            tr.addEventListener("click", (evt) => {
                if (evt.target.closest("button")) return;
                drillDownProject(projName);
            });
            
            let badgeClass = "badge-both";
            if (uniqueComps === "SAR") badgeClass = "badge-sar";
            else if (uniqueComps === "TBAR") badgeClass = "badge-tbar";
            
            tr.innerHTML = `
                <td class="sticky-col-1" style="font-weight:700; color:hsl(var(--primary));">${projName}</td>
                <td class="sticky-col-2" style="font-size:0.75rem; color:var(--text-muted);" title="${uniqueResps}">${uniqueResps}</td>
                <td class="sticky-col-3" style="font-weight:600;" title="${desc}">
                    <span style="color:var(--text-muted); font-size:0.75rem; margin-right:0.25rem;">[${projectTasks.length} tareas]</span> ${desc}
                </td>
                <td class="sticky-col-4"><span class="badge ${badgeClass}">${uniqueComps}</span></td>
                <td class="sticky-col-5" style="text-align:center;">${timing.startDate}</td>
                <td class="sticky-col-6" style="text-align:center; font-weight:600;">${durationText}</td>
            `;
            
            // Celdas de las semanas del Gantt (Consolidado según el estado de las tareas)
            MONTHS_CONFIG.forEach(m => {
                for (let w = 1; w <= m.weeks; w++) {
                    const td = document.createElement("td");
                    td.className = "gantt-week-cell";
                    td.style.cursor = "default";
                    
                    // Destacar celda si coincide con la semana actual
                    if (currentWeekInfo && m.name === currentWeekInfo.month && w === currentWeekInfo.week) {
                        td.classList.add("current-week-column");
                    }
                    
                    const hasPlan = projectTasks.some(t => t.schedule && t.schedule.some(s => s.month === m.name && s.week === w));
                    const weekStatus = getConsolidatedWeekStatus(projectTasks, m.name, w);
                    
                    if (hasPlan || weekStatus) {
                        const container = document.createElement("div");
                        container.className = "gantt-bar-container";
                        
                        const barPlan = document.createElement("div");
                        barPlan.className = "gantt-bar-plan";
                        if (hasPlan) {
                            barPlan.classList.add("active");
                        }
                        
                        const barReal = document.createElement("div");
                        barReal.className = "gantt-bar-real";
                        if (weekStatus) {
                            barReal.classList.add("active");
                            if (weekStatus === "Completed") barReal.classList.add("completed");
                            else if (weekStatus === "In Progress") barReal.classList.add("progress");
                            else if (weekStatus === "Blocked") barReal.classList.add("blocked");
                        }
                        
                        container.appendChild(barPlan);
                        container.appendChild(barReal);
                        td.appendChild(container);
                    }
                    
                    tr.appendChild(td);
                }
            });

            // Botón ver detalles
            const tdAction = document.createElement("td");
            tdAction.className = "row-actions-cell";
            tdAction.innerHTML = `
                <button class="btn" style="font-size: 0.7rem; padding: 0.2rem 0.4rem;" onclick="drillDownProject('${projName.replace(/'/g, "\\'")}')" title="Ver Detalle de Tareas">
                    <i data-lucide="eye" style="width: 12px; height: 12px;"></i> Detalles
                </button>
            `;
            tr.appendChild(tdAction);

            tbody.appendChild(tr);
        });
        
        return; // Finalizar renderGantt para vista resumen
    }

    filteredTasks.forEach(task => {
        const tr = document.createElement("tr");
        
        // Determinar badge de compañía
        let badgeClass = "badge-tbar";
        if (task.compania === "SAR") badgeClass = "badge-sar";
        else if (task.compania === "TBAR/SAR") badgeClass = "badge-both";
        
        const timing = getGanttRowTiming(task.schedule && task.schedule.length > 0 ? task.schedule : task.realSchedule);
        const durationText = timing.durationWeeks > 0 ? `${timing.durationWeeks} sem.` : "-";
        
        tr.innerHTML = `
            <td class="sticky-col-1" style="font-weight:600;">${task.proyecto}</td>
            <td class="sticky-col-2">${task.responsable}</td>
            <td class="sticky-col-3" title="${task.tarea}">${task.tarea}</td>
            <td class="sticky-col-4"><span class="badge ${badgeClass}">${task.compania}</span></td>
            <td class="sticky-col-5" style="text-align:center;">${timing.startDate}</td>
            <td class="sticky-col-6" style="text-align:center; font-weight:600;">${durationText}</td>
        `;
        
        // Celdas de las semanas del Gantt
        MONTHS_CONFIG.forEach(m => {
            for (let w = 1; w <= m.weeks; w++) {
                const td = document.createElement("td");
                td.className = "gantt-week-cell";
                td.setAttribute("data-month", m.name);
                td.setAttribute("data-week", w);
                
                // Destacar celda si coincide con la semana actual
                if (currentWeekInfo && m.name === currentWeekInfo.month && w === currentWeekInfo.week) {
                    td.classList.add("current-week-column");
                }
                
                const isScheduled = task.schedule && task.schedule.some(s => s.month === m.name && s.week === w);
                const isRealScheduled = task.realSchedule && task.realSchedule.some(s => s.month === m.name && s.week === w);
                
                if (isScheduled || isRealScheduled) {
                    const container = document.createElement("div");
                    container.className = "gantt-bar-container";
                    
                    const barPlan = document.createElement("div");
                    barPlan.className = "gantt-bar-plan";
                    if (isScheduled) {
                        barPlan.classList.add("active");
                    }
                    
                    const barReal = document.createElement("div");
                    barReal.className = "gantt-bar-real";
                    if (isRealScheduled) {
                        barReal.classList.add("active");
                        if (task.status === "Completed") barReal.classList.add("completed");
                        else if (task.status === "In Progress") barReal.classList.add("progress");
                        else if (task.status === "Blocked") barReal.classList.add("blocked");
                    }
                    
                    container.appendChild(barPlan);
                    container.appendChild(barReal);
                    td.appendChild(container);
                }
                
                // Click para abrir menú de opciones de la semana (Planificar/Eliminar/Editar)
                td.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (currentUserRole === "viewer") {
                        openModal(task.id);
                    } else {
                        showGanttContextMenu(e, task.id, m.name, w);
                    }
                });
                
                tr.appendChild(td);
            }
        });

        // Botón editar/ver detalles fila
        const isViewer = (currentUserRole === "viewer");
        const tdAction = document.createElement("td");
        tdAction.className = "row-actions-cell";
        tdAction.innerHTML = `
            <button class="row-edit-btn" title="${isViewer ? 'Ver Detalles' : 'Editar Detalles'}">
                <i data-lucide="${isViewer ? 'eye' : 'edit-3'}" style="width: 16px; height: 16px;"></i>
            </button>
        `;
        tdAction.querySelector(".row-edit-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            openModal(task.id);
        });
        tr.appendChild(tdAction);

        tbody.appendChild(tr);
    });
}

// Alternar la asignación de una semana en la tarea
function toggleGanttWeek(taskId, monthName, weekNum, type = "plan") {
    if (currentUserRole === "viewer") return;
    if (currentUserRole === "collaborator" && type === "plan") return;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    if (!task.schedule) task.schedule = [];
    if (!task.realSchedule) task.realSchedule = [];
    
    if (type === "plan") {
        const weekIdx = task.schedule.findIndex(s => s.month === monthName && s.week === weekNum);
        if (weekIdx > -1) {
            task.schedule.splice(weekIdx, 1);
        } else {
            task.schedule.push({
                month: monthName,
                week: weekNum,
                color: 14857357
            });
            if (task.status === "Not Started") {
                task.status = "In Progress";
            }
        }
    } else if (type === "real") {
        const weekIdx = task.realSchedule.findIndex(s => s.month === monthName && s.week === weekNum);
        if (weekIdx > -1) {
            task.realSchedule.splice(weekIdx, 1);
        } else {
            task.realSchedule.push({
                month: monthName,
                week: weekNum,
                color: 14857357
            });
            if (task.status === "Not Started") {
                task.status = "In Progress";
            }
        }
    }
    
    saveToLocalStorage();
    renderGantt();
}

// ==========================================================================
// 3. RENDER KANBAN BOARD
// ==========================================================================
function renderKanban() {
    const filteredTasks = getFilteredTasks();
    
    const containerPending = document.getElementById("kanban-container-pending");
    const containerProgress = document.getElementById("kanban-container-progress");
    const containerBlocked = document.getElementById("kanban-container-blocked");
    const containerCompleted = document.getElementById("kanban-container-completed");
    
    // Limpiar tableros
    containerPending.innerHTML = "";
    containerProgress.innerHTML = "";
    containerBlocked.innerHTML = "";
    containerCompleted.innerHTML = "";
    
    let counts = { "Not Started": 0, "In Progress": 0, "Blocked": 0, "Completed": 0 };

    filteredTasks.forEach(task => {
        counts[task.status]++;
        
        const isViewer = (currentUserRole === "viewer");
        const card = document.createElement("div");
        card.className = "kanban-card";
        card.draggable = !isViewer;
        card.setAttribute("data-id", task.id);
        
        const weeksPlanned = task.schedule ? task.schedule.length : 0;
        
        card.innerHTML = `
            <div class="kanban-card-project">${task.proyecto}</div>
            <div class="kanban-card-title">${task.tarea}</div>
            <div class="kanban-card-meta">
                <span class="kanban-card-responsible">
                    <i data-lucide="user" style="width: 12px; height: 12px;"></i> ${task.responsable}
                </span>
                <span>${weeksPlanned} sem.</span>
            </div>
        `;
        
        // Eventos drag y drop
        card.addEventListener("dragstart", (e) => {
            if (isViewer) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.setData("text/plain", task.id);
            card.style.opacity = "0.5";
        });
        card.addEventListener("dragend", () => {
            if (isViewer) return;
            card.style.opacity = "1";
        });
        
        // Evento de click para editar desde el Kanban
        card.addEventListener("click", () => {
            openModal(task.id);
        });

        // Insertar en su columna correspondiente
        if (task.status === "Completed") containerCompleted.appendChild(card);
        else if (task.status === "In Progress") containerProgress.appendChild(card);
        else if (task.status === "Blocked") containerBlocked.appendChild(card);
        else containerPending.appendChild(card);
    });

    // Actualizar contadores
    document.getElementById("count-pending").textContent = counts["Not Started"];
    document.getElementById("count-progress").textContent = counts["In Progress"];
    document.getElementById("count-blocked").textContent = counts["Blocked"];
    document.getElementById("count-completed").textContent = counts["Completed"];
}

function updateTaskStatus(taskId, newStatus) {
    if (currentUserRole === "viewer") return;
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveToLocalStorage();
        renderKanban();
    }
}

// ==========================================================================
// 4. RENDER TABLE VIEW
// ==========================================================================
function renderTable() {
    const filteredTasks = getFilteredTasks();
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";

    if (filteredTasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron tareas.</td></tr>`;
        return;
    }

    filteredTasks.forEach(task => {
        const tr = document.createElement("tr");
        
        let statusBadgeClass = "status-pending";
        let statusText = "No Iniciado";
        
        if (task.status === "Completed") { statusBadgeClass = "status-completed"; statusText = "Completado"; }
        else if (task.status === "In Progress") { statusBadgeClass = "status-progress"; statusText = "En Progreso"; }
        else if (task.status === "Blocked") { statusBadgeClass = "status-blocked"; statusText = "Bloqueado"; }
        
        let badgeClass = "badge-tbar";
        if (task.compania === "SAR") badgeClass = "badge-sar";
        else if (task.compania === "TBAR/SAR") badgeClass = "badge-both";

        const isViewer = (currentUserRole === "viewer");
        tr.innerHTML = `
            <td style="font-weight: 600;">${task.proyecto}</td>
            <td>${task.responsable}</td>
            <td style="font-weight: 500;">${task.tarea}</td>
            <td><span class="badge ${badgeClass}">${task.compania}</span></td>
            <td><span class="status-pill ${statusBadgeClass}">${statusText}</span></td>
            <td class="row-actions-cell">
                <button class="row-edit-btn" title="${isViewer ? 'Ver Detalles' : 'Editar Tarea'}">
                    <i data-lucide="${isViewer ? 'eye' : 'edit-3'}" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;
        
        tr.querySelector(".row-edit-btn").addEventListener("click", () => {
            openModal(task.id);
        });

        tbody.appendChild(tr);
    });
}

// ==========================================================================
// MODAL DRAWER - EDITAR / NUEVA TAREA
// ==========================================================================
function openModal(taskId = null) {
    const modal = document.getElementById("edit-modal");
    const title = document.getElementById("modal-title");
    
    // Crear botón eliminar si no existe
    let deleteBtn = document.getElementById("btn-modal-delete");
    if (!deleteBtn) {
        deleteBtn = document.createElement("button");
        deleteBtn.id = "btn-modal-delete";
        deleteBtn.className = "btn";
        deleteBtn.style.borderColor = "rgba(239, 68, 68, 0.4)";
        deleteBtn.style.color = "#f87171";
        deleteBtn.style.marginRight = "auto";
        deleteBtn.innerHTML = '<i data-lucide="trash-2" style="width:16px; height:16px;"></i> Eliminar';
        modal.querySelector(".modal-footer").prepend(deleteBtn);
        deleteBtn.addEventListener("click", deleteTaskFromModal);
    }
    
    const isViewer = (currentUserRole === "viewer");
    const isCollaborator = (currentUserRole === "collaborator");
    
    // Habilitar o deshabilitar campos según rol
    const modalFields = ["edit-proyecto", "edit-responsable", "edit-tarea", "edit-compania", "edit-status", "edit-notes"];
    modalFields.forEach(fieldId => {
        const inputElement = document.getElementById(fieldId);
        if (inputElement) {
            if (isViewer) {
                inputElement.disabled = true;
            } else if (isCollaborator) {
                inputElement.disabled = (fieldId !== "edit-status");
            } else {
                inputElement.disabled = false;
            }
        }
    });

    const saveBtn = document.getElementById("btn-modal-save");
    if (saveBtn) {
        // El visor no puede guardar cambios; el colaborador y editor sí
        saveBtn.style.display = isViewer ? "none" : "inline-flex";
    }
    
    if (taskId) {
        // Modo Edición
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        title.textContent = isViewer ? "Detalles de la Tarea" : "Editar Tarea";
        document.getElementById("edit-task-id").value = task.id;
        document.getElementById("edit-proyecto").value = task.proyecto;
        document.getElementById("edit-responsable").value = task.responsable;
        document.getElementById("edit-tarea").value = task.tarea;
        document.getElementById("edit-compania").value = task.compania;
        document.getElementById("edit-status").value = task.status;
        document.getElementById("edit-notes").value = task.notes || "";
        
        deleteBtn.style.display = (isViewer || isCollaborator) ? "none" : "inline-flex";
    } else {
        // Modo Nueva Tarea
        title.textContent = "Nueva Tarea Hoshin";
        document.getElementById("edit-task-id").value = "";
        document.getElementById("edit-proyecto").value = "";
        document.getElementById("edit-responsable").value = "";
        document.getElementById("edit-tarea").value = "";
        document.getElementById("edit-compania").value = "TBAR";
        document.getElementById("edit-status").value = "Not Started";
        document.getElementById("edit-notes").value = "";
        
        deleteBtn.style.display = "none";
    }
    
    document.getElementById("edit-modal").classList.add("active");
    safeCreateIcons();
}

function closeModal() {
    document.getElementById("edit-modal").classList.remove("active");
}

function saveTaskModal() {
    const idVal = document.getElementById("edit-task-id").value;
    const status = document.getElementById("edit-status").value;

    if (currentUserRole === "viewer") return;

    // Si es colaborador, solo permitimos actualizar estado de tarea existente
    if (currentUserRole === "collaborator") {
        if (!idVal) return; // Un colaborador no puede crear tareas nuevas
        const taskId = parseInt(idVal);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            saveToLocalStorage();
            populateFilterDropdowns();
            renderCurrentView();
            closeModal();
        }
        return;
    }
    const proyecto = document.getElementById("edit-proyecto").value.trim();
    const responsable = document.getElementById("edit-responsable").value.trim();
    const tarea = document.getElementById("edit-tarea").value.trim();
    const compania = document.getElementById("edit-compania").value;
    const notes = document.getElementById("edit-notes").value.trim();

    if (!proyecto || !responsable || !tarea) {
        alert("Por favor completa los campos obligatorios: Proyecto, Responsable y Tarea.");
        return;
    }

    if (idVal) {
        // Actualizar existente
        const taskId = parseInt(idVal);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.proyecto = proyecto;
            task.responsable = responsable;
            task.tarea = tarea;
            task.compania = compania;
            task.status = status;
            task.notes = notes;
        }
    } else {
        // Crear nueva tarea
        const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
        const newTask = {
            id: nextId,
            proyecto,
            responsable,
            tarea,
            compania,
            status,
            notes,
            schedule: [] // Inicialmente sin semanas
        };
        tasks.push(newTask);
    }

    saveToLocalStorage();
    populateFilterDropdowns();
    renderCurrentView();
    closeModal();
}

function deleteTaskFromModal() {
    if (currentUserRole === "viewer" || currentUserRole === "collaborator") return;
    const idVal = document.getElementById("edit-task-id").value;
    if (!idVal) return;
    
    const taskId = parseInt(idVal);
    if (confirm("¿Estás seguro de que deseas eliminar esta tarea permanentemente?")) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveToLocalStorage();
        populateFilterDropdowns();
        renderCurrentView();
        closeModal();
    }
}

// ==========================================================================
// PROYECTOS METADATA Y VISTAS
// ==========================================================================

function initProjectsMetadata() {
    projectsMetadata = {};
    const defaultDescriptions = {
        "GECAP": "Gestión y Control de Asistencia de Personal. Integración de tableros de control y auditorías.",
        "Ausentismo": "Seguimiento y control de ausentismo. Desarrollo de portal de ingresos alternativos y tableros métricos.",
        "PEFF": "Proceso de Eficiencia de Flujo de Fabricación. Análisis, desarrollo y testeo de flujos operativos en planta.",
        "DX Office": "Digital Transformation Office. Proyectos transversales de automatización de oficinas y soporte de sistemas.",
        "Double fold": "Línea de doblado doble. Análisis, desarrollo e implementación de mejoras de hardware y software.",
        "HxH": "Hour by Hour (Hora por Hora). Validación de procesos y desarrollo de herramientas de reporte en planta.",
        "EOL": "End of Line (Fin de Línea). Análisis del proceso actual, tableros de control y conectividad con retrabajos.",
        "RPS": "Real-time Production System. Implementación de interfaces con SAP 770 y SAP HANA.",
        "SCRAP": "Control y reducción de desperdicios. Desarrollo de métricas y adquisición de hardware para control en planta.",
        "RFID": "Identificación por Radiofrecuencia. Análisis, desarrollo e implementación de hardware RFID en almacenes.",
        "737D": "Proyecto de automatización de línea 737D. Conexión TASA, impresión inmediata y tableros DOOR-EMS.",
        "Copilot": "Capacitación y desarrollo de personal para integración de asistentes de código y productividad.",
        "Digital Twin": "Modelado y simulación de gemelo digital para optimización de procesos y pruebas de planta."
    };
    
    // Obtener proyectos únicos de las tareas
    const uniqueProjects = [...new Set(tasks.filter(t => t && t.proyecto).map(t => t.proyecto))];
    uniqueProjects.forEach(proj => {
        if (proj) {
            projectsMetadata[proj] = {
                status: "In Progress",
                description: defaultDescriptions[proj] || `Seguimiento del proyecto ${proj}.`
            };
        }
    });
    saveProjectsMetadata();
}

function saveProjectsMetadata() {
    localStorage.setItem("hoshin_projects_metadata", JSON.stringify(projectsMetadata));
}

function renderProjects() {
    const container = document.getElementById("projects-container");
    container.innerHTML = "";
    
    // Asegurarse de que todos los proyectos actuales de las tareas existan en metadata
    const uniqueProjects = [...new Set(tasks.filter(t => t && t.proyecto).map(t => t.proyecto))];
    uniqueProjects.forEach(proj => {
        if (proj && !projectsMetadata[proj]) {
            projectsMetadata[proj] = {
                status: "In Progress",
                description: `Seguimiento del proyecto ${proj}.`
            };
        }
    });

    Object.keys(projectsMetadata).sort().forEach(projName => {
        // Ignorar si el proyecto ya no existe en las tareas actuales
        if (!uniqueProjects.includes(projName)) return;

        const proj = projectsMetadata[projName];
        
        // Calcular tareas completadas y total
        const projTasks = tasks.filter(t => t.proyecto === projName);
        const totalTasks = projTasks.length;
        const completedTasks = projTasks.filter(t => t.status === "Completed").length;
        const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Crear tarjeta de proyecto
        const card = document.createElement("div");
        card.className = "project-card";
        
        const isReadOnlyProj = (currentUserRole === "viewer" || currentUserRole === "collaborator");
        card.innerHTML = `
            <div class="project-card-header">
                <div class="project-card-title">${projName}</div>
                <select class="select-filter project-status-select" style="min-width: 120px; font-size: 0.75rem; padding: 0.25rem 1.5rem 0.25rem 0.5rem; background-position: right 0.25rem center;" data-project="${projName}" ${isReadOnlyProj ? 'disabled' : ''}>
                    <option value="Not Started" ${proj.status === 'Not Started' ? 'selected' : ''}>No Iniciado</option>
                    <option value="In Progress" ${proj.status === 'In Progress' ? 'selected' : ''}>En Progreso</option>
                    <option value="Completed" ${proj.status === 'Completed' ? 'selected' : ''}>Completado</option>
                    <option value="Blocked" ${proj.status === 'Blocked' ? 'selected' : ''}>Bloqueado</option>
                </select>
            </div>
            
            <textarea class="project-desc-textarea" placeholder="Escribe una descripción del proyecto..." data-project="${projName}" ${isReadOnlyProj ? 'disabled' : ''}>${proj.description || ''}</textarea>
            
            <div>
                <div class="project-card-meta">
                    <span>Progreso del Proyecto</span>
                    <span>${completedTasks}/${totalTasks} Tareas (${progressPct}%)</span>
                </div>
                <div class="bar-outer" style="margin-top: 0.25rem; height: 0.375rem;">
                    <div class="bar-inner" style="width: ${progressPct}%; background-color: ${progressPct === 100 ? '#10b981' : 'hsl(var(--primary))'}"></div>
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
                <button class="btn" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="filterByProjectFromCard('${projName}')">
                    <i data-lucide="filter" style="width: 12px; height: 12px;"></i> Filtrar Gantt
                </button>
            </div>
        `;
        
        // Manejador para cambiar el estado del proyecto
        card.querySelector(".project-status-select").addEventListener("change", (e) => {
            if (currentUserRole === "viewer" || currentUserRole === "collaborator") return;
            const newStatus = e.target.value;
            projectsMetadata[projName].status = newStatus;
            saveProjectsMetadata();
            renderDashboard();
        });

        // Manejador para guardar descripción al escribir/perder foco
        card.querySelector(".project-desc-textarea").addEventListener("blur", (e) => {
            if (currentUserRole === "viewer" || currentUserRole === "collaborator") return;
            const newDesc = e.target.value;
            projectsMetadata[projName].description = newDesc;
            saveProjectsMetadata();
        });
        
        container.appendChild(card);
    });
    
    safeCreateIcons();
}

// Filtrar por proyecto desde la tarjeta
window.filterByProjectFromCard = function(projectName) {
    document.getElementById("filter-proyecto").value = projectName;
    filters.proyecto = projectName;
    
    // Activar pestaña Gantt
    document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
    const ganttTab = document.querySelector('[data-view="gantt"]');
    if (ganttTab) ganttTab.classList.add("active");
    
    currentView = "gantt";
    renderCurrentView();
};

window.drillDownProject = function(projectName) {
    const summaryToggle = document.getElementById("gantt-summary-toggle");
    if (summaryToggle) summaryToggle.checked = false;
    
    document.getElementById("filter-proyecto").value = projectName;
    filters.proyecto = projectName;
    
    renderGantt();
};

// Obtener columna correspondiente a hoy (Junio 2026 - Marzo 2027) basado en los lunes reales
function getCurrentTimelineColumn() {
    const today = new Date();
    
    // Encontrar el lunes de la semana actual
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const mondayDate = new Date(today);
    mondayDate.setDate(diff);
    
    const mondayMonthIdx = mondayDate.getMonth();
    const mondayDayStr = String(mondayDate.getDate()).padStart(2, '0');
    
    const monthMapping = {
        5: "Junio",
        6: "Julio",
        7: "Agosto",
        8: "Septiembre",
        9: "Octubre",
        10: "Noviembre",
        11: "Diciembre",
        0: "Enero",
        1: "Febrero",
        2: "Marzo"
    };
    
    const currentMonthName = monthMapping[mondayMonthIdx];
    if (!currentMonthName) return null; // Fuera del rango del plan
    
    const mondays = MONTH_MONDAYS[currentMonthName];
    if (!mondays) return null;
    
    const weekIdx = mondays.indexOf(mondayDayStr);
    if (weekIdx === -1) return null; // No coincide con nuestros lunes definidos
    
    return { month: currentMonthName, week: weekIdx + 1 };
}

// Lógica de Menú Contextual del Gantt
let currentCtxTarget = null;

function showGanttContextMenu(e, taskId, monthName, weekNum) {
    const menu = document.getElementById("gantt-context-menu");
    if (!menu) return;
    
    currentCtxTarget = { taskId, monthName, weekNum };
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const isScheduled = task.schedule && task.schedule.some(s => s.month === monthName && s.week === weekNum);
    const isRealScheduled = task.realSchedule && task.realSchedule.some(s => s.month === monthName && s.week === weekNum);
    
    const togglePlanText = document.getElementById("ctx-toggle-plan-text");
    const togglePlanItem = document.getElementById("ctx-toggle-plan");
    const toggleRealText = document.getElementById("ctx-toggle-real-text");
    const toggleRealItem = document.getElementById("ctx-toggle-real");
    
    const isViewerOrCollaborator = (currentUserRole === "viewer" || currentUserRole === "collaborator");
    if (togglePlanItem) {
        togglePlanItem.style.display = isViewerOrCollaborator ? "none" : "flex";
    }
    
    if (isScheduled) {
        togglePlanText.textContent = "Plan: Eliminar Semana";
        togglePlanItem.classList.add("remove-action");
    } else {
        togglePlanText.textContent = "Plan: Activar Semana";
        togglePlanItem.classList.remove("remove-action");
    }
    
    if (isRealScheduled) {
        toggleRealText.textContent = "Real: Eliminar Semana";
        toggleRealItem.classList.add("remove-action");
    } else {
        toggleRealText.textContent = "Real: Activar Semana";
        toggleRealItem.classList.remove("remove-action");
    }
    
    menu.style.display = "flex";
    
    // Posicionamiento inteligente para evitar salirse de la pantalla
    const menuWidth = 180;
    const menuHeight = 220;
    let left = e.pageX;
    let top = e.pageY;
    
    if (left + menuWidth > window.innerWidth + window.scrollX) {
        left = window.innerWidth + window.scrollX - menuWidth - 10;
    }
    if (top + menuHeight > window.innerHeight + window.scrollY) {
        top = window.innerHeight + window.scrollY - menuHeight - 10;
    }
    
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
}

function updateTaskStatusDirectly(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveToLocalStorage();
        renderCurrentView(); // Recarga la vista activa y actualiza dashboards/Gantt
    }
}
