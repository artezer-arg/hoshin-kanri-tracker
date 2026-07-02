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
let db = null;
let useFirebase = false;
let useLocalServer = false;
let projectsMetadata = {};
let currentView = "dashboard";
let currentUserRole = "admin"; // Rol por defecto
let windowsUsername = "";
let collaboratorsList = [];

// Idioma y traducción
let currentLanguage = localStorage.getItem("hoshin_lang") || "es";

const TRANSLATIONS = {
    es: {
        app_title: "DX Plan",
        app_title_print: "Toyota DX Plan — 2026",
        app_subtitle_print: "Plan de Proyectos y Seguimiento de Tareas Anuales",
        print_presented_to: "Presentado a:",
        print_president: "Presidencia de la Empresa",
        print_report_date: "Fecha del Reporte:",
        print_overall_progress: "Avance General:",
        app_subtitle: "Tablero de Seguimiento Estratégico",
        nav_dashboard: "Dashboard",
        nav_gantt: "Gantt Matrix",
        nav_kanban: "Kanban",
        nav_tasks: "Tareas",
        nav_projects: "Proyectos",
        nav_users: "Usuarios",
        role_admin: "✏️ Editor",
        role_collaborator: "👥 Colaborador",
        role_viewer: "👁️ Visor",
        btn_import: "Importar",
        btn_backup: "Respaldo JSON",
        btn_export: "Exportar Excel",
        btn_print: "Imprimir Reporte",
        search_placeholder: "Buscar por tarea o proyecto...",
        all_projects: "Todos los Proyectos",
        all_responsibles: "Todos los Responsables",
        all_companies: "Todas las Compañías",
        all_statuses: "Todos los Estados",
        status_not_started: "No Iniciado",
        status_in_progress: "En Progreso",
        status_completed: "Completado",
        status_blocked: "Bloqueado",
        btn_reset_filters: "Limpiar Filtros",
        btn_add_task: "Nueva Tarea",
        kpi_total: "Total de Tareas",
        kpi_completed: "Completadas",
        kpi_progress: "En Progreso",
        kpi_blocked: "Bloqueadas",
        chart_donut_title: "Estado del Plan Hoshin Kanri",
        chart_donut_progress: "Avance",
        chart_bars_title: "Tareas por Proyecto (Top 5 con mayor volumen)",
        chart_workload_title: "Carga de Trabajo y Eficiencia por Responsable",
        table_resp: "Responsable",
        table_total: "Total Tareas",
        table_comp: "Completadas",
        table_prog: "En Progreso",
        table_block: "Bloqueadas",
        table_pending: "No Iniciadas",
        table_pct: "% Cumplimiento",
        gantt_legend_plan: "Planificado (Plan)",
        gantt_legend_real: "Real (Ejecutado)",
        gantt_executive_view: "Vista Ejecutiva (Resumir por Proyecto)",
        gantt_th_project: "Proyecto",
        gantt_th_responsible: "Responsable",
        gantt_th_task: "Tarea",
        gantt_th_company: "Compañía",
        gantt_th_start: "F. Inicio",
        gantt_th_duration: "Duración",
        gantt_th_action: "Acción",
        kanban_col_not_started: "No Iniciado",
        kanban_col_in_progress: "En Progreso",
        kanban_col_blocked: "Bloqueado",
        kanban_col_completed: "Completado",
        table_th_project: "Proyecto",
        table_th_responsible: "Responsable",
        table_th_task: "Tarea",
        table_th_company: "Compañía",
        table_th_status: "Estado",
        table_th_action: "Acción",
        modal_title_edit: "Editar Tarea",
        modal_title_new: "Nueva Tarea Hoshin",
        modal_title_details: "Detalles de la Tarea",
        modal_label_project: "Proyecto",
        modal_label_responsible: "Responsable",
        modal_label_task: "Tarea",
        modal_label_company: "Compañía",
        modal_label_status: "Estado",
        modal_label_notes: "Notas / Observaciones",
        modal_label_notes_placeholder: "Añade detalles del estado actual...",
        modal_label_planned_weeks: "Semanas Planificadas",
        modal_label_weeks_helper: "Puedes configurar las semanas directamente en el gráfico Gantt haciendo clic en las celdas correspondientes.",
        modal_btn_cancel: "Cancelar",
        modal_btn_save: "Guardar",
        modal_btn_delete: "Eliminar",
        ctx_plan_activate: "Plan: Activar Semana",
        ctx_plan_deactivate: "Plan: Eliminar Semana",
        ctx_real_activate: "Real: Activar Semana",
        ctx_real_deactivate: "Real: Eliminar Semana",
        ctx_edit_task: "Editar Tarea",
        ctx_change_status: "Cambiar Estado",
        users_title: "Personal con Acceso Autorizado",
        users_subtitle: "Los usuarios <strong>nramirez</strong> y <strong>artez</strong> siempre tienen permisos de <strong>Editor</strong> (Administrador). Los usuarios listados aquí tendrán permisos de <strong>Colaborador</strong>. Cualquier otro usuario de Windows no registrado tendrá permisos de <strong>Visor</strong> (Solo lectura).",
        users_th_username: "Usuario Windows",
        users_th_role: "Rol asignado",
        users_th_actions: "Acciones",
        users_form_title: "Registrar Colaborador",
        users_form_username: "Nombre de Usuario Windows",
        users_form_placeholder: "ej. jsmith",
        users_form_btn: "Registrar Colaborador",
        login_title: "Código de Acceso (Editor)",
        login_placeholder: "Introduce el código...",
        login_error: "Código incorrecto. Inténtalo de nuevo.",
        login_btn_submit: "Ingresar como Editor",
        login_or: "o también puedes",
        login_btn_guest: "👁️ Entrar como Invitado (Solo Lectura)",
        login_btn_collab: "👥 Entrar como Colaborador (Actualizar Real/Estado)",
        login_btn_cancel: "Cancelar",
        confirm_import: "¿Estás seguro de importar {count} tareas? Esto sobrescribirá los datos actuales.",
        import_success: "Tareas y configuraciones importadas con éxito.",
        confirm_delete_task: "¿Estás seguro de que deseas eliminar esta tarea permanentemente?",
        confirm_remove_user: "¿Estás seguro de quitar los permisos de colaborador al usuario \"{user}\"?",
        error_fields_required: "Por favor completa los campos obligatorios: Proyecto, Responsable y Tarea.",
        error_exceljs: "La biblioteca de Excel (ExcelJS) no está cargada. Revisa tu conexión a internet.",
        excel_sheet_executive: "Resumen Ejecutivo",
        excel_sheet_detailed: "Matriz Gantt Detallada",
        excel_sheet_tasks: "Detalle de Tareas",
        excel_th_weeks: "Semanas Planificadas",
        excel_th_notes: "Notas / Observaciones",
        excel_legend_title: "Referencia Visual (Leyenda Gantt):",
        excel_legend_top: "Fila Superior (Celda de Arriba)",
        excel_legend_top_val: "Semanas Planificadas (Plan)",
        excel_legend_bottom: "Fila Inferior (Celda de Abajo)",
        excel_legend_bottom_val: "Semanas Ejecutadas (Real) según estado de la tarea:",
        excel_duration_weeks: "{count} sem.",
        excel_project_tasks_count: "[{count} tareas] ",
        online_users_prefix: "Conectados: ",
        online_users_loading: "Conectados: ...",
        role_label_admin: "Editor",
        role_label_collaborator: "Colaborador",
        role_label_viewer: "Visor",
        project_card_progress: "Progreso del Proyecto",
        project_card_tasks: "{completed}/{total} Tareas ({pct}%)",
        project_card_desc_placeholder: "Escribe una descripción del proyecto...",
        project_card_btn_filter: "Filtrar Gantt",
        project_card_tasks_count: "[{count} tareas]",
        badge_tasks_count: "tareas",
        active_users_label: "Conectados: ",
        admin_permanent_label: "Editor (Permanente)",
        admin_cannot_delete: "El Administrador/Editor principal no puede ser eliminado",
        delete_collaborator_tooltip: "Eliminar Colaborador",
        excel_project_description: "Descripción del Proyecto",
        excel_legend_pending: "No Iniciado / Pendiente",
        error_backup_failed: "Ocurrió un error al generar la copia de seguridad: ",
        error_username_required: "Por favor, introduce un nombre de usuario de Windows.",
        error_admin_permanent: "El usuario 'nramirez' o 'artez' es el Editor permanente y no necesita ser agregado.",
        error_user_already_registered: "Este usuario ya está registrado como colaborador.",
        prompt_windows_username: "Por favor, introduce tu nombre de usuario de Windows para identificarte:",
        edit_details_tooltip: "Editar Detalles",
        btn_fullscreen: "Pantalla Completa",
        btn_exit_fullscreen: "Salir de Pantalla Completa",
        excel_export_error: "Error al exportar a Excel: "
    },
    en: {
        app_title: "DX Plan",
        app_title_print: "Toyota DX Plan — 2026",
        app_subtitle_print: "Annual Project Planning and Task Tracking",
        print_presented_to: "Presented to:",
        print_president: "Company Presidency",
        print_report_date: "Report Date:",
        print_overall_progress: "Overall Progress:",
        app_subtitle: "Strategic Tracking Board",
        nav_dashboard: "Dashboard",
        nav_gantt: "Gantt Matrix",
        nav_kanban: "Kanban",
        nav_tasks: "Tasks",
        nav_projects: "Projects",
        nav_users: "Users",
        role_admin: "✏️ Editor",
        role_collaborator: "👥 Collaborator",
        role_viewer: "👁️ Viewer",
        btn_import: "Import",
        btn_backup: "JSON Backup",
        btn_export: "Export Excel",
        btn_print: "Print Report",
        search_placeholder: "Search by task or project...",
        all_projects: "All Projects",
        all_responsibles: "All Responsibles",
        all_companies: "All Companies",
        all_statuses: "All Statuses",
        status_not_started: "Not Started",
        status_in_progress: "In Progress",
        status_completed: "Completed",
        status_blocked: "Blocked",
        btn_reset_filters: "Clear Filters",
        btn_add_task: "New Task",
        kpi_total: "Total Tasks",
        kpi_completed: "Completed",
        kpi_progress: "In Progress",
        kpi_blocked: "Blocked",
        chart_donut_title: "Hoshin Kanri Plan Status",
        chart_donut_progress: "Progress",
        chart_bars_title: "Tasks per Project (Top 5 by volume)",
        chart_workload_title: "Workload and Efficiency by Responsible",
        table_resp: "Responsible",
        table_total: "Total Tasks",
        table_comp: "Completed",
        table_prog: "In Progress",
        table_block: "Blocked",
        table_pending: "Not Started",
        table_pct: "% Compliance",
        gantt_legend_plan: "Planned (Plan)",
        gantt_legend_real: "Real (Executed)",
        gantt_executive_view: "Executive View (Summarize by Project)",
        gantt_th_project: "Project",
        gantt_th_responsible: "Responsible",
        gantt_th_task: "Task",
        gantt_th_company: "Company",
        gantt_th_start: "Start Date",
        gantt_th_duration: "Duration",
        gantt_th_action: "Action",
        kanban_col_not_started: "Not Started",
        kanban_col_in_progress: "In Progress",
        kanban_col_blocked: "Blocked",
        kanban_col_completed: "Completed",
        table_th_project: "Project",
        table_th_responsible: "Responsible",
        table_th_task: "Task",
        table_th_company: "Company",
        table_th_status: "Status",
        table_th_action: "Action",
        modal_title_edit: "Edit Task",
        modal_title_new: "New Hoshin Task",
        modal_title_details: "Task Details",
        modal_label_project: "Project",
        modal_label_responsible: "Responsible",
        modal_label_task: "Task",
        modal_label_company: "Company",
        modal_label_status: "Status",
        modal_label_notes: "Notes / Remarks",
        modal_label_notes_placeholder: "Add details of the current status...",
        modal_label_planned_weeks: "Planned Weeks",
        modal_label_weeks_helper: "You can configure weeks directly on the Gantt chart by clicking the corresponding cells.",
        modal_btn_cancel: "Cancel",
        modal_btn_save: "Save",
        modal_btn_delete: "Delete",
        ctx_plan_activate: "Plan: Activate Week",
        ctx_plan_deactivate: "Plan: Remove Week",
        ctx_real_activate: "Real: Activate Week",
        ctx_real_deactivate: "Real: Remove Week",
        ctx_edit_task: "Edit Task",
        ctx_change_status: "Change Status",
        users_title: "Authorized Access Personnel",
        users_subtitle: "Users <strong>nramirez</strong> and <strong>artez</strong> always have <strong>Editor</strong> (Admin) permissions. Users listed here will have <strong>Collaborator</strong> permissions. Any other unregistered Windows user will have <strong>Viewer</strong> (Read-only) permissions.",
        users_th_username: "Windows User",
        users_th_role: "Assigned Role",
        users_th_actions: "Actions",
        users_form_title: "Register Collaborator",
        users_form_username: "Windows Username",
        users_form_placeholder: "e.g. jsmith",
        users_form_btn: "Register Collaborator",
        login_title: "Access Code (Editor)",
        login_placeholder: "Enter the code...",
        login_error: "Incorrect code. Try again.",
        login_btn_submit: "Enter as Editor",
        login_or: "or you can also",
        login_btn_guest: "👁️ Enter as Guest (Read-Only)",
        login_btn_collab: "👥 Enter as Collaborator (Update Real/Status)",
        login_btn_cancel: "Cancel",
        confirm_import: "Are you sure you want to import {count} tasks? This will overwrite the current data.",
        import_success: "Tasks and configurations successfully imported.",
        confirm_delete_task: "Are you sure you want to delete this task permanently?",
        confirm_remove_user: "Are you sure you want to remove collaborator permissions from user \"{user}\"?",
        error_fields_required: "Please complete the required fields: Project, Responsible, and Task.",
        error_exceljs: "The Excel library (ExcelJS) is not loaded. Please check your internet connection.",
        excel_sheet_executive: "Executive Summary",
        excel_sheet_detailed: "Detailed Gantt Matrix",
        excel_sheet_tasks: "Task Details",
        excel_th_weeks: "Planned Weeks",
        excel_th_notes: "Notes / Remarks",
        excel_legend_title: "Visual Reference (Gantt Legend):",
        excel_legend_top: "Top Row (Upper Cell)",
        excel_legend_top_val: "Planned Weeks (Plan)",
        excel_legend_bottom: "Bottom Row (Lower Cell)",
        excel_legend_bottom_val: "Real Executed Weeks according to task status:",
        excel_duration_weeks: "{count} wks.",
        excel_project_tasks_count: "[{count} tasks] ",
        online_users_prefix: "Connected: ",
        online_users_loading: "Connected: ...",
        role_label_admin: "Editor",
        role_label_collaborator: "Collaborator",
        role_label_viewer: "Viewer",
        project_card_progress: "Project Progress",
        project_card_tasks: "{completed}/{total} Tasks ({pct}%)",
        project_card_desc_placeholder: "Write a description for the project...",
        project_card_btn_filter: "Filter Gantt",
        project_card_tasks_count: "[{count} tasks]",
        badge_tasks_count: "tasks",
        active_users_label: "Connected: ",
        admin_permanent_label: "Editor (Permanent)",
        admin_cannot_delete: "The main Administrator/Editor cannot be deleted",
        delete_collaborator_tooltip: "Remove Collaborator",
        excel_project_description: "Project Description",
        excel_legend_pending: "Not Started / Pending",
        error_backup_failed: "An error occurred while generating the backup: ",
        error_username_required: "Please enter a Windows username.",
        error_admin_permanent: "The user 'nramirez' or 'artez' is the permanent Editor and does not need to be added.",
        error_user_already_registered: "This user is already registered as a collaborator.",
        prompt_windows_username: "Please enter your Windows username to identify yourself:",
        edit_details_tooltip: "Edit Details",
        btn_fullscreen: "Fullscreen",
        btn_exit_fullscreen: "Exit Fullscreen",
        excel_export_error: "Error exporting to Excel: "
    }
};

function t(key, replacements = {}) {
    const lang = currentLanguage || "es";
    let text = TRANSLATIONS[lang]?.[key] || TRANSLATIONS["es"]?.[key] || key;
    Object.keys(replacements).forEach(placeholder => {
        text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    });
    return text;
}

function translateMonth(monthName) {
    if (currentLanguage === "en") {
        const monthMap = {
            "Junio": "June",
            "Julio": "July",
            "Agosto": "August",
            "Septiembre": "September",
            "Octubre": "October",
            "Noviembre": "November",
            "Diciembre": "December",
            "Enero": "January",
            "Febrero": "February",
            "Marzo": "March"
        };
        return monthMap[monthName] || monthName;
    }
    return monthName;
}

function updateDOMTranslations() {
    // 1. Traducir text content simple
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        const translation = t(key);
        // Verificar si contiene ícono para no pisarlo
        const icon = el.querySelector("i[data-lucide], svg");
        if (icon) {
            el.innerHTML = "";
            el.appendChild(icon);
            el.appendChild(document.createTextNode(" " + translation));
        } else {
            el.textContent = translation;
        }
    });

    // 2. Traducir HTML formateado
    document.querySelectorAll("[data-i18n-html]").forEach(el => {
        const key = el.getAttribute("data-i18n-html");
        el.innerHTML = t(key);
    });

    // 3. Traducir placeholders de inputs
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.setAttribute("placeholder", t(key));
    });

    // 4. Traducir atributos title (tooltips)
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        el.setAttribute("title", t(key));
    });

    // 4. Actualizar el indicador del botón de idioma
    const label = document.getElementById("lang-label");
    if (label) {
        label.textContent = currentLanguage === "es" ? "EN" : "ES";
    }
}

// Entorno de SharePoint
let isSharePoint = false;
let spSiteUrl = "";
let spFolderRelativeUrl = "";

function initSharePointContext() {
    isSharePoint = window.location.hostname.endsWith(".sharepoint.com");
    if (isSharePoint) {
        const path = window.location.pathname; // e.g. "/sites/DXPlan/Shared%20Documents/DX-Plan/index.html"
        const decodedPath = decodeURIComponent(path);
        spFolderRelativeUrl = decodedPath.substring(0, decodedPath.lastIndexOf('/'));
        
        // Extraer siteUrl (por ejemplo: /sites/SiteName)
        const siteUrlMatch = decodedPath.match(/^(\/sites\/[^\/]+)/);
        spSiteUrl = siteUrlMatch ? siteUrlMatch[1] : '';
        console.log("Entorno de SharePoint detectado:");
        console.log("  Site URL:", spSiteUrl);
        console.log("  Folder Relative URL:", spFolderRelativeUrl);
    }
}

// Obtener token X-RequestDigest de SharePoint para peticiones POST
async function getSpRequestDigest() {
    const response = await fetch(`${spSiteUrl}/_api/contextinfo`, {
        method: "POST",
        headers: { "Accept": "application/json;odata=verbose" }
    });
    if (!response.ok) throw new Error("Error al obtener token de SharePoint X-RequestDigest");
    const data = await response.json();
    return data.d.GetContextWebInformation.FormDigestValue;
}

// Leer archivo de la biblioteca de documentos de SharePoint
async function readSpFile(fileName) {
    const fileUrl = `${spFolderRelativeUrl}/${fileName}`;
    const response = await fetch(`${spSiteUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(fileUrl)}')/$value`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Error al leer archivo ${fileName} de SharePoint: ${response.statusText}`);
    }
    return await response.text();
}

// Escribir/Sobrescribir archivo en la biblioteca de documentos de SharePoint
async function writeSpFile(fileName, content) {
    const digest = await getSpRequestDigest();
    const uploadUrl = `${spSiteUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(spFolderRelativeUrl)}')/Files/add(url='${fileName}',overwrite=true)`;
    const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
            "X-RequestDigest": digest,
            "Accept": "application/json;odata=verbose"
        },
        body: content
    });
    if (!response.ok) {
        throw new Error(`Error al escribir archivo ${fileName} en SharePoint: ${response.statusText}`);
    }
}

// Asegurar existencia de una carpeta en SharePoint (si no existe, se crea)
async function ensureSpFolder(folderName) {
    const relativeUrl = `${spFolderRelativeUrl}/${folderName}`;
    const checkUrl = `${spSiteUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(relativeUrl)}')`;
    try {
        const checkResponse = await fetch(checkUrl);
        if (checkResponse.ok) return;
        
        if (checkResponse.status === 404) {
            const digest = await getSpRequestDigest();
            const createUrl = `${spSiteUrl}/_api/web/folders`;
            const response = await fetch(createUrl, {
                method: "POST",
                headers: {
                    "X-RequestDigest": digest,
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose"
                },
                body: JSON.stringify({
                    "__metadata": { "type": "SP.Folder" },
                    "ServerRelativeUrl": relativeUrl
                })
            });
            if (!response.ok) throw new Error("Error creando carpeta en SharePoint");
            console.log(`Carpeta creada con éxito: ${folderName}`);
        }
    } catch (e) {
        console.warn(`Error al verificar/crear la carpeta ${folderName} en SharePoint:`, e);
    }
}

// Listar archivos dentro de una carpeta de SharePoint (para presencia de usuarios)
async function listSpFolderFiles(folderName) {
    const relativeUrl = `${spFolderRelativeUrl}/${folderName}`;
    const url = `${spSiteUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(relativeUrl)}')/Files?$select=Name,TimeLastModified`;
    const response = await fetch(url, {
        headers: { "Accept": "application/json;odata=verbose" }
    });
    if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Error al listar archivos de la carpeta ${folderName} en SharePoint`);
    }
    const data = await response.json();
    return data.d.results || [];
}
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
    if (currentLanguage === "en") {
        return status;
    }
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

// Cargar y guardar colaboradores autorizados en localStorage
function loadCollaborators() {
    const saved = localStorage.getItem("hoshin_collaborators");
    if (saved) {
        try {
            collaboratorsList = JSON.parse(saved);
            if (!Array.isArray(collaboratorsList)) {
                collaboratorsList = [];
            }
        } catch (e) {
            collaboratorsList = [];
        }
    } else {
        collaboratorsList = [];
    }
}

function saveCollaborators() {
    localStorage.setItem("hoshin_collaborators", JSON.stringify(collaboratorsList));
    if (isSharePoint) {
        writeSpFile("hoshin_collaborators.json", JSON.stringify(collaboratorsList, null, 2))
            .catch(e => console.error("Error guardando colaboradores en SharePoint:", e));
    }
    if (useLocalServer) {
        fetch("/api/collaborators", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(collaboratorsList)
        }).catch(e => console.error("Error guardando colaboradores en servidor local:", e));
    }
    if (useFirebase && db) {
        db.collection("config").doc("collaborators").set({ list: collaboratorsList })
            .catch(e => {
                console.error("Error guardando colaboradores en Firebase:", e);
                alert("Error al guardar colaboradores en Firebase: " + e.message);
            });
    }
}

// Detectar el usuario de Windows a través del API local o SharePoint
async function detectWindowsUser() {
    if (isSharePoint) {
        try {
            const response = await fetch(`${spSiteUrl}/_api/web/currentUser`, {
                headers: { "Accept": "application/json;odata=verbose" }
            });
            if (response.ok) {
                const data = await response.json();
                if (data && data.d) {
                    let rawUser = data.d.Title || "";
                    if (data.d.Email) {
                        rawUser = data.d.Email.split('@')[0];
                    } else if (data.d.LoginName) {
                        const loginParts = data.d.LoginName.split('|');
                        const account = loginParts[loginParts.length - 1];
                        if (account.includes('@')) {
                            rawUser = account.split('@')[0];
                        } else if (account.includes('\\')) {
                            rawUser = account.split('\\')[1];
                        } else {
                            rawUser = account;
                        }
                    }
                    windowsUsername = rawUser.trim();
                    console.log("Usuario de SharePoint detectado:", windowsUsername);
                }
            }
        } catch (err) {
            console.warn("No se pudo detectar el usuario de SharePoint:", err);
        }
    } else {
        try {
            const response = await fetch("/api/user");
            if (response.ok) {
                const data = await response.json();
                if (data && data.username) {
                    windowsUsername = data.username.trim();
                    console.log("Usuario de Windows detectado:", windowsUsername);
                }
            }
        } catch (err) {
            console.warn("No se pudo detectar el usuario de Windows (API inalcanzable). Fallback a selección manual.", err);
        }
    }

    // Si no se detectó (por ser remoto o API inaccesible), buscar en localStorage o solicitar
    if (!windowsUsername) {
        let savedUser = localStorage.getItem("hoshin_windows_username");
        if (!savedUser) {
            savedUser = prompt(t('prompt_windows_username'));
            if (savedUser) {
                savedUser = savedUser.trim();
                localStorage.setItem("hoshin_windows_username", savedUser);
            } else {
                // Generar un nombre de invitado único si cancela
                savedUser = "invitado_" + Math.floor(Math.random() * 1000);
            }
        }
        windowsUsername = savedUser;
    }

    // Determinar el rol automáticamente basado en el usuario resuelto
    let targetRole = "viewer";
    if (windowsUsername.toLowerCase() === "nramirez" || windowsUsername.toLowerCase() === "artez") {
        targetRole = "admin";
    } else if (collaboratorsList.some(c => c.toLowerCase() === windowsUsername.toLowerCase())) {
        targetRole = "collaborator";
    } else {
        const savedRole = localStorage.getItem("hoshin_user_role");
        if (savedRole === "admin" || savedRole === "collaborator") {
            targetRole = savedRole;
        } else {
            targetRole = "viewer";
        }
    }
    currentUserRole = targetRole;

    // Guardar el rol en localStorage
    localStorage.setItem("hoshin_user_role", currentUserRole);
}

// Enviar señales de vida (heartbeat) y actualizar lista de usuarios conectados en simultáneo
let activeUsers = [];

async function sendHeartbeat() {
    if (!windowsUsername) return;

    if (isSharePoint) {
        try {
            // 1. Reportar presencia escribiendo un archivo temporal vacío
            await writeSpFile(`active_users/${windowsUsername}.json`, "active");
            
            // 2. Listar archivos de presencia en SharePoint
            const files = await listSpFolderFiles("active_users");
            const now = new Date();
            const activeList = [];
            
            files.forEach(file => {
                const lastModified = new Date(file.TimeLastModified);
                const diffSeconds = (now.getTime() - lastModified.getTime()) / 1000;
                
                // Tolerancia de 60 segundos por posibles desvíos de reloj entre cliente y SharePoint
                if (diffSeconds < 60 && diffSeconds > -60) {
                    const username = file.Name.replace(".json", "");
                    if (!activeList.includes(username)) {
                        activeList.push(username);
                    }
                }
            });
            activeUsers = activeList;
            renderActiveUsers();
        } catch (err) {
            console.warn("Error en la presencia de SharePoint:", err);
        }
    } else {
        try {
            const response = await fetch(`/api/heartbeat?username=${encodeURIComponent(windowsUsername)}`);
            if (response.ok) {
                activeUsers = await response.json();
                renderActiveUsers();
            }
        } catch (err) {
            console.warn("Error al enviar heartbeat o recuperar usuarios en línea:", err);
        }
    }
}

function renderActiveUsers() {
    const container = document.getElementById("active-users-container");
    const listSpan = document.getElementById("active-users-list");

    if (container && listSpan) {
        if (activeUsers && activeUsers.length > 0) {
            container.style.display = "inline-flex";
            listSpan.textContent = t('active_users_label') + activeUsers.join(", ");
        } else {
            container.style.display = "none";
        }
    }
}

function startHeartbeat() {
    sendHeartbeat();
    // Enviar cada 5 segundos para que la lista de activos sea muy reactiva
    setInterval(sendHeartbeat, 5000);
}

// Sincronización en segundo plano de archivos en SharePoint
let lastTasksJson = "";
let lastMetadataJson = "";

async function syncFromSharePoint() {
    if (!isSharePoint) return;
    
    try {
        // 1. Leer tareas
        const tasksContent = await readSpFile("hoshin_tasks.json");
        if (tasksContent) {
            if (tasksContent !== lastTasksJson) {
                lastTasksJson = tasksContent;
                const parsed = JSON.parse(tasksContent);
                if (Array.isArray(parsed)) {
                    tasks = parsed;
                    localStorage.setItem("hoshin_tasks", tasksContent);
                    console.log("Tareas sincronizadas desde SharePoint.");
                }
            }
        } else {
            console.log("Creando hoshin_tasks.json inicial en SharePoint...");
            const initialTasks = typeof BASE_DATA !== 'undefined' ? BASE_DATA : [];
            const initialJson = JSON.stringify(initialTasks, null, 2);
            await writeSpFile("hoshin_tasks.json", initialJson);
            lastTasksJson = initialJson;
            tasks = JSON.parse(JSON.stringify(initialTasks));
            localStorage.setItem("hoshin_tasks", initialJson);
        }

        // 2. Leer metadata de proyectos
        const metadataContent = await readSpFile("hoshin_metadata.json");
        if (metadataContent) {
            if (metadataContent !== lastMetadataJson) {
                lastMetadataJson = metadataContent;
                const parsed = JSON.parse(metadataContent);
                if (parsed && typeof parsed === 'object') {
                    projectsMetadata = parsed;
                    localStorage.setItem("hoshin_projects_metadata", metadataContent);
                    console.log("Metadata de proyectos sincronizada desde SharePoint.");
                }
            }
        } else {
            console.log("Creando hoshin_metadata.json inicial en SharePoint...");
            const initialMetadata = {};
            const initialJson = JSON.stringify(initialMetadata, null, 2);
            await writeSpFile("hoshin_metadata.json", initialJson);
            lastMetadataJson = initialJson;
            projectsMetadata = initialMetadata;
            localStorage.setItem("hoshin_projects_metadata", initialJson);
        }
        
        // 3. Leer colaboradores
        const collaboratorsContent = await readSpFile("hoshin_collaborators.json");
        if (collaboratorsContent) {
            const parsed = JSON.parse(collaboratorsContent);
            if (Array.isArray(parsed)) {
                collaboratorsList = parsed;
                localStorage.setItem("hoshin_collaborators", collaboratorsContent);
            }
        } else {
            console.log("Creando hoshin_collaborators.json inicial en SharePoint...");
            await writeSpFile("hoshin_collaborators.json", JSON.stringify([], null, 2));
            collaboratorsList = [];
            localStorage.setItem("hoshin_collaborators", JSON.stringify([]));
        }
        
    } catch (err) {
        console.error("Error en la sincronización con SharePoint:", err);
    }
}


async function detectLocalServer() {
    if (isSharePoint) return;
    try {
        const response = await fetch("/api/user");
        if (response.ok) {
            useLocalServer = true;
            console.log("Servidor local PowerShell detectado. Usando API local de almacenamiento.");
            
            const badge = document.getElementById("storage-status-badge");
            const badgeText = document.getElementById("storage-status-text");
            if (badge && badgeText) {
                badge.className = "storage-badge-online";
                badge.style.backgroundColor = "#3b82f6";
                badgeText.textContent = "Servidor Local";
                const icon = badge.querySelector("i");
                if (icon) icon.setAttribute("data-lucide", "server");
            }
        }
    } catch (e) {
        console.log("No se detectó el servidor local PowerShell. Usando localStorage como fallback.");
    }
}

async function loadData() {
    if (useLocalServer) {
        try {
            // 1. Cargar colaboradores
            const resCollab = await fetch("/api/collaborators");
            if (resCollab.ok) {
                collaboratorsList = await resCollab.json();
                localStorage.setItem("hoshin_collaborators", JSON.stringify(collaboratorsList));
            } else {
                loadCollaborators();
            }

            // 2. Cargar tareas
            const resTasks = await fetch("/api/tasks");
            if (resTasks.ok) {
                tasks = await resTasks.json();
                localStorage.setItem("hoshin_tasks", JSON.stringify(tasks));
            } else {
                loadBaselineData();
                await saveToLocalStorage();
            }

            // 3. Cargar metadata de proyectos
            const resMeta = await fetch("/api/metadata");
            if (resMeta.ok) {
                projectsMetadata = await resMeta.json();
                localStorage.setItem("hoshin_projects_metadata", JSON.stringify(projectsMetadata));
            } else {
                initProjectsMetadata();
                await saveProjectsMetadata();
            }
        } catch (err) {
            console.error("Error al cargar datos desde el servidor local:", err);
            loadFromLocalStorage();
        }
    } else {
        if (isSharePoint) {
            await syncFromSharePoint();
        } else {
            loadCollaborators();
            loadFromLocalStorage();
        }
    }
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem("hoshin_tasks");
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (Array.isArray(parsed)) {
                tasks = parsed;
            } else {
                loadBaselineData();
            }
        } catch (e) {
            loadBaselineData();
        }
    } else {
        loadBaselineData();
    }

    const savedProjects = localStorage.getItem("hoshin_projects_metadata");
    if (savedProjects) {
        try {
            projectsMetadata = JSON.parse(savedProjects) || {};
        } catch (e) {
            initProjectsMetadata();
        }
    } else {
        initProjectsMetadata();
    }
}

function startSyncPolling() {
    if (window.syncIntervalId) {
        clearInterval(window.syncIntervalId);
    }
    if ((isSharePoint || useLocalServer) && !useFirebase) {
        window.syncIntervalId = setInterval(async () => {
            const oldTasks = JSON.stringify(tasks);
            const oldMetadata = JSON.stringify(projectsMetadata);
            if (useLocalServer) {
                try {
                    const resTasks = await fetch("/api/tasks");
                    if (resTasks.ok) {
                        tasks = await resTasks.json();
                        localStorage.setItem("hoshin_tasks", JSON.stringify(tasks));
                    }
                    const resMeta = await fetch("/api/metadata");
                    if (resMeta.ok) {
                        projectsMetadata = await resMeta.json();
                        localStorage.setItem("hoshin_projects_metadata", JSON.stringify(projectsMetadata));
                    }
                } catch (e) {
                    console.warn("Error en polling de servidor local:", e);
                }
            } else if (isSharePoint) {
                await syncFromSharePoint();
            }
            if (JSON.stringify(tasks) !== oldTasks || JSON.stringify(projectsMetadata) !== oldMetadata) {
                console.log("Cambios externos detectados. Re-renderizando vista.");
                populateFilterDropdowns();
                renderCurrentView();
            }
        }, 10000);
    }
}

let fallbackTriggered = false;
async function fallbackToLocalOrStorage() {
    if (fallbackTriggered) return;
    fallbackTriggered = true;
    useFirebase = false;
    console.log("Cambiando a modo local/servidor debido a indisponibilidad de Firebase.");
    await detectLocalServer();
    await loadData();
    await detectWindowsUser();
    initApp();
    setupEventListeners();
    safeCreateIcons();
    startHeartbeat();
    startSyncPolling();
}

// Inicializar Firebase
function initFirebase() {
    const badge = document.getElementById("storage-status-badge");
    const badgeText = document.getElementById("storage-status-text");

    if (typeof firebaseConfig !== 'undefined' && 
        firebaseConfig.apiKey && 
        firebaseConfig.apiKey !== "YOUR_API_KEY" && 
        firebaseConfig.projectId && 
        firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
        try {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            useFirebase = true;
            console.log("Firebase Firestore inicializado correctamente.");
            
            if (badge && badgeText) {
                badge.className = "storage-badge-online";
                badgeText.textContent = "Firebase";
                const icon = badge.querySelector("i");
                if (icon) icon.setAttribute("data-lucide", "cloud-lightning");
            }
        } catch (error) {
            console.error("Error al inicializar Firebase:", error);
        }
    } else {
        console.log("Firebase no está configurado o tiene valores por defecto. Usando localStorage como fallback.");
        if (badge && badgeText) {
            badge.className = "storage-badge-offline";
            badgeText.textContent = "Local";
        }
    }
}

// Configurar escuchadores en tiempo real para Firebase
function setupFirebaseListeners() {
    let tasksReady = false;
    let metadataReady = false;
    let collaboratorsReady = false;
    
    function checkAllReady() {
        if (tasksReady && metadataReady && collaboratorsReady) {
            detectWindowsUser().then(() => {
                initApp();
                setupEventListeners();
                safeCreateIcons();
                startHeartbeat();
            });
        }
    }

    // 1. Escuchador de tareas
    db.collection("tasks").onSnapshot(snapshot => {
        let fbTasks = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = parseInt(doc.id);
            fbTasks.push(data);
        });

        // Sembrar base de datos si está vacía
        if (fbTasks.length === 0 && typeof BASE_DATA !== 'undefined' && BASE_DATA.length > 0) {
            console.log("La colección de tareas en Firebase está vacía. Sembrando base de datos con baseline...");
            const batch = db.batch();
            BASE_DATA.forEach(task => {
                const docRef = db.collection("tasks").doc(task.id.toString());
                batch.set(docRef, task);
            });
            batch.commit().then(() => {
                console.log("Base de datos sembrada correctamente.");
            }).catch(e => console.error("Error al sembrar Firebase:", e));
            return;
        }

        // Ordenar tareas por ID
        fbTasks.sort((a, b) => a.id - b.id);
        
        const isFirstLoad = !tasksReady;
        tasks = fbTasks;
        localStorage.setItem("hoshin_tasks", JSON.stringify(tasks));
        tasksReady = true;

        if (!isFirstLoad) {
            console.log("Cambios en tareas detectados en Firebase. Re-renderizando.");
            populateFilterDropdowns();
            renderCurrentView();
        } else {
            checkAllReady();
        }
    }, err => {
        console.error("Error en el escuchador de tareas de Firebase:", err);
        fallbackToLocalOrStorage();
    });

    // 2. Escuchador de metadata de proyectos
    db.collection("config").doc("projectsMetadata").onSnapshot(doc => {
        if (doc.exists) {
            projectsMetadata = doc.data();
        } else {
            projectsMetadata = {};
        }
        localStorage.setItem("hoshin_projects_metadata", JSON.stringify(projectsMetadata));
        
        const isFirstLoad = !metadataReady;
        metadataReady = true;

        if (!isFirstLoad) {
            console.log("Cambios en metadatos recibidos de Firebase. Re-renderizando.");
            renderCurrentView();
        } else {
            checkAllReady();
        }
    }, err => {
        console.error("Error en el escuchador de metadatos de Firebase:", err);
        fallbackToLocalOrStorage();
    });

    // 3. Escuchador de colaboradores
    db.collection("config").doc("collaborators").onSnapshot(doc => {
        if (doc.exists && doc.data().list) {
            collaboratorsList = doc.data().list;
        } else {
            collaboratorsList = [];
        }
        localStorage.setItem("hoshin_collaborators", JSON.stringify(collaboratorsList));
        
        const isFirstLoad = !collaboratorsReady;
        collaboratorsReady = true;

        if (!isFirstLoad) {
            console.log("Cambios en colaboradores recibidos de Firebase. Re-evaluando permisos.");
            detectWindowsUser().then(() => {
                renderUsers();
                renderCurrentView();
            });
        } else {
            checkAllReady();
        }
    }, err => {
        console.error("Error en el escuchador de colaboradores de Firebase:", err);
        fallbackToLocalOrStorage();
    });
}

// Cargar estado inicial
document.addEventListener("DOMContentLoaded", async () => {
    initSharePointContext();
    
    // 1. Detectar si estamos en el servidor local de PowerShell
    await detectLocalServer();
    
    // 2. Inicializar Firebase solo si no estamos en SharePoint ni en Servidor Local
    if (!isSharePoint && !useLocalServer) {
        initFirebase();
    }
    
    // 3. Flujo de inicialización de datos y vistas
    if (useFirebase && db) {
        setupFirebaseListeners();
    } else {
        if (isSharePoint) {
            await syncFromSharePoint();
            await ensureSpFolder("active_users");
        } else {
            await loadData();
        }

        await detectWindowsUser();
        initApp();
        setupEventListeners();
        safeCreateIcons();
        startHeartbeat(); // Iniciar envío de heartbeats
        startSyncPolling();
    }
});

// Función para migrar los planes guardados de 4 semanas a la distribución de semanas reales del calendario (coherente)
function migrateSchedules(tasksArray) {
    if (!Array.isArray(tasksArray)) return;
    tasksArray.forEach(task => {
        if (!task) return;
        if (!task.status) {
            task.status = "Not Started";
        }
        if (!task.realSchedule) {
            task.realSchedule = [];
        }
        if (!task.schedule) {
            task.schedule = [];
        }
        
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

    if (!useFirebase && !useLocalServer) {
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

    if (!useFirebase && !useLocalServer) {
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
    
    // Aplicar traducciones estáticas del DOM
    updateDOMTranslations();
    
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

// Guardar datos en localStorage y Firebase si está activo
function saveToLocalStorage(taskOrTaskId = null, isDeletion = false) {
    localStorage.setItem("hoshin_tasks", JSON.stringify(tasks));
    if (isSharePoint) {
        writeSpFile("hoshin_tasks.json", JSON.stringify(tasks, null, 2))
            .catch(e => console.error("Error guardando tareas en SharePoint:", e));
    }
    if (useLocalServer) {
        fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tasks)
        }).catch(e => console.error("Error guardando tareas en servidor local:", e));
    }
    if (useFirebase && db) {
        if (taskOrTaskId !== null) {
            if (isDeletion) {
                return db.collection("tasks").doc(taskOrTaskId.toString()).delete()
                    .catch(e => {
                        console.error("Error al eliminar tarea en Firebase:", e);
                        alert("Error al eliminar en Firebase: " + e.message);
                    });
            } else {
                return db.collection("tasks").doc(taskOrTaskId.id.toString()).set(taskOrTaskId)
                    .catch(e => {
                        console.error("Error al guardar tarea en Firebase:", e);
                        alert("Error al guardar en Firebase: " + e.message);
                    });
            }
        } else {
            // Reemplazar todas las tareas en Firebase (importación o resiembra)
            const tasksToSave = [...tasks]; // Copia local para evitar condiciones de carrera (race conditions)
            return db.collection("tasks").get().then(snapshot => {
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                tasksToSave.forEach(t => {
                    if (t && t.id) {
                        const docRef = db.collection("tasks").doc(t.id.toString());
                        batch.set(docRef, t);
                    }
                });
                return batch.commit();
            }).catch(e => {
                console.error("Error en batch de Firebase:", e);
                alert("Error de importación/lote en Firebase: " + e.message);
                throw e;
            });
        }
    }
    return Promise.resolve();
}

// Rellenar dropdowns de filtros basados en los datos de las tareas
function populateFilterDropdowns() {
    const proyectos = [...new Set(tasks.filter(t => t && t.proyecto).map(t => t.proyecto))].sort();
    const responsables = [...new Set(tasks.filter(t => t && t.responsable).map(t => t.responsable))].sort();
    
    const filterProyecto = document.getElementById("filter-proyecto");
    const filterResponsable = document.getElementById("filter-responsable");
    
    // Limpiar excepto el primero
    filterProyecto.innerHTML = `<option value="">${t('all_projects')}</option>`;
    filterResponsable.innerHTML = `<option value="">${t('all_responsibles')}</option>`;
    
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

    // Pantalla Completa / Fullscreen
    const btnFullscreen = document.getElementById("btn-fullscreen");
    if (btnFullscreen) {
        btnFullscreen.addEventListener("click", toggleFullscreen);
    }

    document.addEventListener("fullscreenchange", () => {
        const isActive = !!document.fullscreenElement;
        if (isActive) {
            document.body.classList.add("fullscreen-active");
            updateFullscreenIcon(true);
        } else {
            document.body.classList.remove("fullscreen-active");
            updateFullscreenIcon(false);
        }
    });

    // Alternar Idioma Español/Inglés
    document.getElementById("btn-lang-toggle").addEventListener("click", () => {
        currentLanguage = currentLanguage === "es" ? "en" : "es";
        localStorage.setItem("hoshin_lang", currentLanguage);
        updateDOMTranslations();
        populateFilterDropdowns();
        renderCurrentView();
    });

    // Impresión
    document.getElementById("btn-print").addEventListener("click", () => {
        // Formatear datos de impresión en el header antes de abrir el diálogo
        const locale = currentLanguage === "en" ? "en-US" : "es-ES";
        document.getElementById("print-date").textContent = new Date().toLocaleDateString(locale, {
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
                alert(t('error_exceljs'));
                return;
            }
            
            const workbook = new ExcelJS.Workbook();
            workbook.creator = "DX Plan Toyota";
            


            // Hoja 1: Resumen Ejecutivo
            const wsResumen = workbook.addWorksheet(t('excel_sheet_executive'), {
                views: [{ showGridLines: true }]
            });
            populateGanttWorksheet(wsResumen, true);

            // Hoja 2: Matriz Gantt Detallada
            const wsDetallada = workbook.addWorksheet(t('excel_sheet_detailed'), {
                views: [{ showGridLines: true }]
            });
            populateGanttWorksheet(wsDetallada, false);

            // Hoja 3: Detalle de Tareas
            const wsTareas = workbook.addWorksheet(t('excel_sheet_tasks'), {
                views: [{ showGridLines: true }]
            });
            
            wsTareas.columns = [
                { header: 'ID', key: 'id', width: 6 },
                { header: t('gantt_th_project'), key: 'proyecto', width: 16 },
                { header: t('gantt_th_responsible'), key: 'responsable', width: 16 },
                { header: t('gantt_th_task'), key: 'tarea', width: 50 },
                { header: t('gantt_th_company'), key: 'compania', width: 12 },
                { header: t('table_th_status'), key: 'status', width: 15 },
                { header: t('excel_th_weeks'), key: 'weeks', width: 30 },
                { header: t('excel_th_notes'), key: 'notes', width: 40 }
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
            alert(t('excel_export_error') + error.message);
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
        reader.onload = async (evt) => {
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
                    alert(t('error_json_invalid'));
                    return;
                }

                if (confirm(t('confirm_import', { count: newTasks.length }))) {
                    tasks = newTasks;
                    
                    // Esperar a que se guarden las tareas en Firebase/localStorage
                    await saveToLocalStorage();
                    
                    if (newMetadata) {
                        projectsMetadata = newMetadata;
                        // Esperar a que se guarde la metadata en Firebase/localStorage
                        await saveProjectsMetadata();
                    } else {
                        initProjectsMetadata();
                    }
                    
                    initApp();
                    alert(t('import_success'));
                }
            } catch (err) {
                alert(t('error_json_read') + err.message);
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
                alert(t('error_backup_failed') + err.message);
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

    // ABM Usuarios - Registrar Colaborador
    const btnAddCollab = document.getElementById("btn-add-collab");
    if (btnAddCollab) {
        btnAddCollab.addEventListener("click", () => {
            const usernameInput = document.getElementById("new-collab-username");
            const username = usernameInput.value.trim();
            if (!username) {
                alert(t('error_username_required'));
                return;
            }
            if (username.toLowerCase() === "nramirez" || username.toLowerCase() === "artez") {
                alert(t('error_admin_permanent'));
                return;
            }
            if (collaboratorsList.some(c => c.toLowerCase() === username.toLowerCase())) {
                alert(t('error_user_already_registered'));
                return;
            }
            
            collaboratorsList.push(username);
            saveCollaborators();
            usernameInput.value = "";
            renderUsers();
            
            // Si agregamos al usuario actual, actualizamos su rol dinámicamente
            if (windowsUsername && windowsUsername.toLowerCase() === username.toLowerCase()) {
                currentUserRole = "collaborator";
                localStorage.setItem("hoshin_user_role", currentUserRole);
                renderCurrentView();
            }
        });
    }

    // Exportar CSV para Power BI
    const btnExportCsv = document.getElementById("btn-export-csv");
    if (btnExportCsv) {
        btnExportCsv.addEventListener("click", () => {
            try {
                // Funciones auxiliares internas para calcular fechas y progreso
                function getWeekDateRangeLocal(monthName, weekNum) {
                    const yearMap = {
                        "Junio": 2026, "Julio": 2026, "Agosto": 2026, "Septiembre": 2026,
                        "Octubre": 2026, "Noviembre": 2026, "Diciembre": 2026,
                        "Enero": 2027, "Febrero": 2027, "Marzo": 2027
                    };
                    const monthMapNum = {
                        "Junio": "06", "Julio": "07", "Agosto": "08", "Septiembre": "09",
                        "Octubre": "10", "Noviembre": "11", "Diciembre": "12",
                        "Enero": "01", "Febrero": "02", "Marzo": "03"
                    };
                    const days = MONTH_MONDAYS[monthName];
                    if (!days || weekNum < 1 || weekNum > days.length) return null;
                    const day = days[weekNum - 1];
                    const mm = monthMapNum[monthName];
                    const yyyy = yearMap[monthName];
                    const startDate = new Date(`${yyyy}-${mm}-${day}T00:00:00`);
                    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
                    return { startDate, endDate };
                }

                function getTaskDateRangeLocal(scheduleArray) {
                    if (!scheduleArray || scheduleArray.length === 0) return { startStr: "", endStr: "" };
                    let minDate = null;
                    let maxDate = null;
                    scheduleArray.forEach(item => {
                        const range = getWeekDateRangeLocal(item.month, item.week);
                        if (range) {
                            if (!minDate || range.startDate < minDate) minDate = range.startDate;
                            if (!maxDate || range.endDate > maxDate) maxDate = range.endDate;
                        }
                    });
                    if (!minDate || !maxDate) return { startStr: "", endStr: "" };
                    const formatDate = (d) => {
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    };
                    return { startStr: formatDate(minDate), endStr: formatDate(maxDate) };
                }

                function getStatusProgressLocal(status) {
                    switch (status) {
                        case "Completed": return 100;
                        case "In Progress": return 50;
                        case "Blocked": return 25;
                        case "Not Started":
                        default: return 0;
                    }
                }

                const headers = [
                    "ID Tarea",
                    "Proyecto",
                    "Responsable",
                    "Tarea",
                    "Compania",
                    "Estado",
                    "Porcentaje Avance",
                    "Fecha Inicio Planificada",
                    "Fecha Fin Planificada",
                    "Semanas Planificadas",
                    "Fecha Inicio Real",
                    "Fecha Fin Real",
                    "Semanas Reales",
                    "Notas"
                ];

                const rows = tasks.map(t => {
                    const plannedRange = getTaskDateRangeLocal(t.schedule);
                    const realRange = getTaskDateRangeLocal(t.realSchedule);
                    const progress = getStatusProgressLocal(t.status);
                    const plannedWeeks = t.schedule ? t.schedule.length : 0;
                    const realWeeks = t.realSchedule ? t.realSchedule.length : 0;
                    
                    const cleanStr = (str) => {
                        if (!str) return "";
                        return '"' + str.replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
                    };
                    
                    return [
                        t.id,
                        cleanStr(t.proyecto),
                        cleanStr(t.responsable),
                        cleanStr(t.tarea),
                        cleanStr(t.compania),
                        cleanStr(t.status),
                        progress,
                        plannedRange.startStr,
                        plannedRange.endStr,
                        plannedWeeks,
                        realRange.startStr,
                        realRange.endStr,
                        realWeeks,
                        cleanStr(t.notes)
                    ].join(",");
                });

                const csvContent = "\ufeff" + [headers.join(","), ...rows].join("\n");
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `hoshin_tasks_powerbi_${new Date().toISOString().slice(0,10)}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (err) {
                console.error("Error al exportar CSV:", err);
                alert("Error al exportar a CSV: " + err.message);
            }
        });
    }
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

// Alternar Pantalla Completa
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn("Fullscreen request blocked/unsupported; forcing CSS fallback.", err);
            document.body.classList.toggle("fullscreen-active");
            const isFallbackActive = document.body.classList.contains("fullscreen-active");
            updateFullscreenIcon(isFallbackActive);
        });
    } else {
        document.exitFullscreen().catch(err => {
            console.warn("Error exiting native fullscreen:", err);
        });
    }
}

function updateFullscreenIcon(active) {
    const btn = document.getElementById("btn-fullscreen");
    if (!btn) return;
    if (active) {
        btn.innerHTML = '<i data-lucide="minimize-2"></i>';
        btn.setAttribute("title", t('btn_exit_fullscreen'));
        btn.setAttribute("data-i18n-title", "btn_exit_fullscreen");
    } else {
        btn.innerHTML = '<i data-lucide="maximize-2"></i>';
        btn.setAttribute("title", t('btn_fullscreen'));
        btn.setAttribute("data-i18n-title", "btn_fullscreen");
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
    const isAdmin = (currentUserRole === "admin");
    const isReadOnlyOrCollab = (currentUserRole === "viewer" || currentUserRole === "collaborator");
    
    const btnAddTask = document.getElementById("btn-add-task");
    if (btnAddTask) {
        btnAddTask.style.display = isReadOnlyOrCollab ? "none" : "inline-flex";
    }
    const btnImport = document.getElementById("btn-import-trigger");
    if (btnImport) {
        btnImport.style.display = isReadOnlyOrCollab ? "none" : "inline-flex";
    }

    // Mostrar/ocultar pestaña de administración de usuarios
    const tabUsers = document.getElementById("tab-users");
    if (tabUsers) {
        tabUsers.style.display = isAdmin ? "inline-flex" : "none";
    }

    // Renderizar insignia de usuario activo
    const badgeContainer = document.getElementById("user-badge-container");
    const roleSelector = document.getElementById("role-selector");
    
    if (badgeContainer) {
        if (windowsUsername) {
            badgeContainer.style.display = "inline-flex";
            if (roleSelector) roleSelector.style.display = "none";
            
            let roleName = t('role_label_viewer');
            let roleClass = "role-viewer";
            let iconName = "eye";
            
            if (currentUserRole === "admin") {
                roleName = t('role_label_admin');
                roleClass = "role-admin";
                iconName = "shield";
            } else if (currentUserRole === "collaborator") {
                roleName = t('role_label_collaborator');
                roleClass = "role-collaborator";
                iconName = "users";
            }
            
            badgeContainer.innerHTML = `
                <div class="user-badge ${roleClass}" title="${currentLanguage === 'en' ? 'Windows user detected' : 'Usuario de Windows detectado'}">
                    <i data-lucide="${iconName}"></i>
                    <span>${windowsUsername} (${roleName})</span>
                </div>
            `;
        } else {
            badgeContainer.style.display = "none";
            if (roleSelector) {
                roleSelector.style.display = "inline-flex";
                roleSelector.value = currentUserRole;
            }
        }
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
    } else if (currentView === "users") {
        renderUsers();
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
            <span>${t('status_completed')}: <strong>${stats.completed}</strong> (${completedPct}%)</span>
        </div>
        <div class="legend-item">
            <span class="legend-dot" style="background-color: #f59e0b;"></span>
            <span>${t('status_in_progress')}: <strong>${stats.progress}</strong> (${progressPct}%)</span>
        </div>
        <div class="legend-item">
            <span class="legend-dot" style="background-color: #ef4444;"></span>
            <span>${t('status_blocked')}: <strong>${stats.blocked}</strong> (${blockedPct}%)</span>
        </div>
        <div class="legend-item">
            <span class="legend-dot" style="background-color: #64748b;"></span>
            <span>${t('status_not_started')}: <strong>${stats.pending}</strong> (${pendingPct}%)</span>
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
                <span class="bar-value">${p.completed}/${p.total} ${t('status_completed')} (${p.pct}%)</span>
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
                worksheet.getCell('A1').value = t('gantt_th_project');
                worksheet.getCell('B1').value = t('gantt_th_responsible');
                worksheet.getCell('C1').value = isSummary ? t('excel_project_description') : t('gantt_th_task');
                worksheet.getCell('D1').value = t('gantt_th_company');
                worksheet.getCell('E1').value = t('gantt_th_start');
                worksheet.getCell('F1').value = t('gantt_th_duration');
                worksheet.getCell('G1').value = t('table_th_status');
                
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
                    cell.value = translateMonth(m.name);
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
                        const desc = projectsMetadata[projName]?.description || (currentLanguage === "en" ? `Project ${projName}` : `Proyecto ${projName}`);
                        
                        const uniqueResps = [...new Set(projectTasks.map(t => t.responsable))].sort().join(", ");
                        const uniqueComps = [...new Set(projectTasks.map(t => t.compania))].sort().join(", ");
                        
                        const unionSchedule = getProjectUnionSchedule(projectTasks);
                        const timing = getGanttRowTiming(unionSchedule);
                        const durationText = timing.durationWeeks > 0 ? t('excel_duration_weeks', { count: timing.durationWeeks }) : "-";
                        
                        // Set values on top row of the pair (rowNum)
                        worksheet.getCell(rowNum, 1).value = projName;
                        worksheet.getCell(rowNum, 2).value = uniqueResps;
                        worksheet.getCell(rowNum, 3).value = t('excel_project_tasks_count', { count: projectTasks.length }) + desc;
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
                        
                        // Style all cells in the merged block (rowNum and rowNum + 1)
                        for (let c = 1; c <= 7; c++) {
                            for (let r = rowNum; r <= rowNum + 1; r++) {
                                const cell = worksheet.getCell(r, c);
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
                        const durationText = timing.durationWeeks > 0 ? t('excel_duration_weeks', { count: timing.durationWeeks }) : "-";
                        
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
                        
                        // Style all cells in the merged block (rowNum and rowNum + 1)
                        for (let c = 1; c <= 7; c++) {
                            for (let r = rowNum; r <= rowNum + 1; r++) {
                                const cell = worksheet.getCell(r, c);
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
                worksheet.getCell(rowNum, 1).value = t('excel_legend_title');
                worksheet.getCell(rowNum, 1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
                
                // Row for Plan
                rowNum++;
                worksheet.getCell(rowNum, 1).value = t('excel_legend_top');
                worksheet.getCell(rowNum, 1).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF475569' } };
                
                const planIndicator = worksheet.getCell(rowNum, 2);
                planIndicator.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
                planIndicator.border = thinBorder;
                
                worksheet.getCell(rowNum, 3).value = t('excel_legend_top_val');
                worksheet.getCell(rowNum, 3).font = { name: 'Segoe UI', size: 9, color: { argb: 'FF334155' } };
                
                // Row for Real descriptive header
                rowNum++;
                worksheet.getCell(rowNum, 1).value = t('excel_legend_bottom');
                worksheet.getCell(rowNum, 1).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF475569' } };
                
                // Merge columns 2 to 7 to show the long header text cleanly
                worksheet.mergeCells(rowNum, 2, rowNum, 7);
                const descRealCell = worksheet.getCell(rowNum, 2);
                descRealCell.value = t('excel_legend_bottom_val');
                descRealCell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF334155' } };
                
                // Completed row
                rowNum++;
                const compIndicator = worksheet.getCell(rowNum, 2);
                compIndicator.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
                compIndicator.border = thinBorder;
                
                worksheet.getCell(rowNum, 3).value = t('status_completed');
                worksheet.getCell(rowNum, 3).font = { name: 'Segoe UI', size: 9, color: { argb: 'FF334155' } };
                
                // In Progress row
                rowNum++;
                const progIndicator = worksheet.getCell(rowNum, 2);
                progIndicator.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
                progIndicator.border = thinBorder;
                
                worksheet.getCell(rowNum, 3).value = t('status_in_progress');
                worksheet.getCell(rowNum, 3).font = { name: 'Segoe UI', size: 9, color: { argb: 'FF334155' } };
                
                // Blocked row
                rowNum++;
                const blockIndicator = worksheet.getCell(rowNum, 2);
                blockIndicator.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
                blockIndicator.border = thinBorder;
                
                worksheet.getCell(rowNum, 3).value = t('status_blocked');
                worksheet.getCell(rowNum, 3).font = { name: 'Segoe UI', size: 9, color: { argb: 'FF334155' } };
                
                // Pending/Not Started row
                rowNum++;
                const pendIndicator = worksheet.getCell(rowNum, 2);
                pendIndicator.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64748B' } };
                pendIndicator.border = thinBorder;
                
                worksheet.getCell(rowNum, 3).value = t('excel_legend_pending');
                worksheet.getCell(rowNum, 3).font = { name: 'Segoe UI', size: 9, color: { argb: 'FF334155' } };
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
        thMonth.textContent = translateMonth(m.name);
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
    thActions.innerHTML = t('gantt_th_action');
    monthRow.appendChild(thActions);

    // 2. Renderizar filas de datos
    const tbody = document.getElementById("gantt-body");
    tbody.innerHTML = "";

    if (filteredTasks.length === 0) {
        const tr = document.createElement("tr");
        // colspan=51 (6 columnas fijas + 44 semanas + 1 acción)
        const emptyMsg = currentLanguage === 'en' ? 'No tasks were found matching the filters.' : 'No se encontraron tareas que coincidan con los filtros.';
        tr.innerHTML = `<td colspan="51" style="text-align: center; padding: 2rem; color: var(--text-muted);">${emptyMsg}</td>`;
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
            const durationText = timing.durationWeeks > 0 ? t('excel_duration_weeks', { count: timing.durationWeeks }) : "-";
            
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
                    <span style="color:var(--text-muted); font-size:0.75rem; margin-right:0.25rem;">[${projectTasks.length} ${t('badge_tasks_count')}]</span> ${desc}
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
            const detailsTitle = currentLanguage === 'en' ? 'View Task Details' : 'Ver Detalle de Tareas';
            const detailsLabel = currentLanguage === 'en' ? 'Details' : 'Detalles';
            tdAction.innerHTML = `
                <button class="btn" style="font-size: 0.7rem; padding: 0.2rem 0.4rem;" onclick="drillDownProject('${projName.replace(/'/g, "\\'")}')" title="${detailsTitle}">
                    <i data-lucide="eye" style="width: 12px; height: 12px;"></i> ${detailsLabel}
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
        const durationText = timing.durationWeeks > 0 ? t('excel_duration_weeks', { count: timing.durationWeeks }) : "-";
        
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
        const btnTitle = isViewer ? t('modal_title_details') : t('edit_details_tooltip');
        tdAction.innerHTML = `
            <button class="row-edit-btn" title="${btnTitle}">
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
    
    saveToLocalStorage(task);
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
                <span>${t('excel_duration_weeks', { count: weeksPlanned })}</span>
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
        saveToLocalStorage(task);
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
        const emptyMsg = currentLanguage === 'en' ? 'No tasks found.' : 'No se encontraron tareas.';
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">${emptyMsg}</td></tr>`;
        return;
    }

    filteredTasks.forEach(task => {
        const tr = document.createElement("tr");
        
        let statusBadgeClass = "status-pending";
        let statusText = t('status_not_started');
        
        if (task.status === "Completed") { statusBadgeClass = "status-completed"; statusText = t('status_completed'); }
        else if (task.status === "In Progress") { statusBadgeClass = "status-progress"; statusText = t('status_in_progress'); }
        else if (task.status === "Blocked") { statusBadgeClass = "status-blocked"; statusText = t('status_blocked'); }
        
        let badgeClass = "badge-tbar";
        if (task.compania === "SAR") badgeClass = "badge-sar";
        else if (task.compania === "TBAR/SAR") badgeClass = "badge-both";

        const isViewer = (currentUserRole === "viewer");
        const btnTitle = isViewer ? t('modal_title_details') : t('ctx_edit_task');
        tr.innerHTML = `
            <td style="font-weight: 600;">${task.proyecto}</td>
            <td>${task.responsable}</td>
            <td style="font-weight: 500;">${task.tarea}</td>
            <td><span class="badge ${badgeClass}">${task.compania}</span></td>
            <td><span class="status-pill ${statusBadgeClass}">${statusText}</span></td>
            <td class="row-actions-cell">
                <button class="row-edit-btn" title="${btnTitle}">
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
        deleteBtn.innerHTML = `<i data-lucide="trash-2" style="width:16px; height:16px;"></i> ${t('modal_btn_delete')}`;
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
        
        title.textContent = isViewer ? t('modal_title_details') : t('modal_title_edit');
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
        title.textContent = t('modal_title_new');
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

    let targetTask = null;

    // Si es colaborador, solo permitimos actualizar estado de tarea existente
    if (currentUserRole === "collaborator") {
        if (!idVal) return; // Un colaborador no puede crear tareas nuevas
        const taskId = parseInt(idVal);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            targetTask = task;
            saveToLocalStorage(targetTask);
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
        alert(t('error_fields_required'));
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
            targetTask = task;
        }
    } else {
        // Crear nueva tarea - Generar ID único usando timestamp
        const nextId = Date.now() + Math.floor(Math.random() * 1000);
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
        targetTask = newTask;
    }

    saveToLocalStorage(targetTask);
    populateFilterDropdowns();
    renderCurrentView();
    closeModal();
}

function deleteTaskFromModal() {
    if (currentUserRole === "viewer" || currentUserRole === "collaborator") return;
    const idVal = document.getElementById("edit-task-id").value;
    if (!idVal) return;
    
    const taskId = parseInt(idVal);
    if (confirm(t('confirm_delete_task'))) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveToLocalStorage(taskId, true);
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
    if (isSharePoint) {
        writeSpFile("hoshin_metadata.json", JSON.stringify(projectsMetadata, null, 2))
            .catch(e => console.error("Error guardando metadata de proyectos en SharePoint:", e));
    }
    if (useLocalServer) {
        fetch("/api/metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projectsMetadata)
        }).catch(e => console.error("Error guardando metadatos de proyectos en servidor local:", e));
    }
    if (useFirebase && db) {
        return db.collection("config").doc("projectsMetadata").set(projectsMetadata)
            .catch(e => {
                console.error("Error guardando metadata de proyectos en Firebase:", e);
                alert("Error al guardar metadatos de proyectos en Firebase: " + e.message);
            });
    }
    return Promise.resolve();
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
                    <option value="Not Started" ${proj.status === 'Not Started' ? 'selected' : ''}>${t('status_not_started')}</option>
                    <option value="In Progress" ${proj.status === 'In Progress' ? 'selected' : ''}>${t('status_in_progress')}</option>
                    <option value="Completed" ${proj.status === 'Completed' ? 'selected' : ''}>${t('status_completed')}</option>
                    <option value="Blocked" ${proj.status === 'Blocked' ? 'selected' : ''}>${t('status_blocked')}</option>
                </select>
            </div>
            
            <textarea class="project-desc-textarea" placeholder="${t('project_card_desc_placeholder')}" data-project="${projName}" ${isReadOnlyProj ? 'disabled' : ''}>${proj.description || ''}</textarea>
            
            <div>
                <div class="project-card-meta">
                    <span>${t('project_card_progress')}</span>
                    <span>${completedTasks}/${totalTasks} ${t('nav_tasks').toLowerCase()} (${progressPct}%)</span>
                </div>
                <div class="bar-outer" style="margin-top: 0.25rem; height: 0.375rem;">
                    <div class="bar-inner" style="width: ${progressPct}%; background-color: ${progressPct === 100 ? '#10b981' : 'hsl(var(--primary))'}"></div>
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
                <button class="btn" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="filterByProjectFromCard('${projName}')">
                    <i data-lucide="filter" style="width: 12px; height: 12px;"></i> ${t('project_card_btn_filter')}
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
        togglePlanText.textContent = t('ctx_plan_deactivate');
        togglePlanItem.classList.add("remove-action");
    } else {
        togglePlanText.textContent = t('ctx_plan_activate');
        togglePlanItem.classList.remove("remove-action");
    }
    
    if (isRealScheduled) {
        toggleRealText.textContent = t('ctx_real_deactivate');
        toggleRealItem.classList.add("remove-action");
    } else {
        toggleRealText.textContent = t('ctx_real_activate');
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

// Renderizar ABM de Usuarios (Colaboradores)
function renderUsers() {
    const tbody = document.getElementById("users-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    // Fila fija para el Administrador permanente "nramirez"
    const trAdmin = document.createElement("tr");
    trAdmin.innerHTML = `
        <td><strong>nramirez</strong></td>
        <td><span class="status-pill status-completed">${t('admin_permanent_label')}</span></td>
        <td style="text-align: center;">
            <button class="btn-delete-user" disabled title="${t('admin_cannot_delete')}">
                <i data-lucide="trash-2" style="width: 1rem; height: 1rem;"></i>
            </button>
        </td>
    `;
    tbody.appendChild(trAdmin);
    
    // Fila fija para el Administrador permanente "artez"
    const trAdminArtez = document.createElement("tr");
    trAdminArtez.innerHTML = `
        <td><strong>artez</strong></td>
        <td><span class="status-pill status-completed">${t('admin_permanent_label')}</span></td>
        <td style="text-align: center;">
            <button class="btn-delete-user" disabled title="${t('admin_cannot_delete')}">
                <i data-lucide="trash-2" style="width: 1rem; height: 1rem;"></i>
            </button>
        </td>
    `;
    tbody.appendChild(trAdminArtez);
    
    // Filas para los colaboradores de la lista
    collaboratorsList.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${user}</strong></td>
            <td><span class="status-pill status-progress">${t('role_label_collaborator')}</span></td>
            <td style="text-align: center;">
                <button class="btn-delete-user btn-remove-collab" data-user="${user}" title="${t('delete_collaborator_tooltip')}">
                    <i data-lucide="trash-2" style="width: 1rem; height: 1rem;"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Registrar eventos para los botones de eliminar colaborador
    tbody.querySelectorAll(".btn-remove-collab").forEach(btn => {
        btn.addEventListener("click", () => {
            const user = btn.getAttribute("data-user");
            if (confirm(t('confirm_remove_user', { user: user }))) {
                collaboratorsList = collaboratorsList.filter(c => c !== user);
                saveCollaborators();
                renderUsers();
                
                // Si el usuario eliminado es el usuario actual logueado, re-evaluar rol
                if (windowsUsername && windowsUsername.toLowerCase() === user.toLowerCase()) {
                    currentUserRole = "viewer";
                    localStorage.setItem("hoshin_user_role", currentUserRole);
                    renderCurrentView();
                }
            }
        });
    });
    
    safeCreateIcons();
}
