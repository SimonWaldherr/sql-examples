/* ── i18n ─────────────────────────────────────────────── */
var i18n = {
    en: {
        appTitle:          "SQL Examples",
        chooseCourse:      "Choose a Course",
        chooseQuery:       "Choose a Query",
        executeQuery:      "Execute Query",
        copyQuery:         "Copy Query URL",
        resultsPlaceholder:"Results will be displayed here",
        fetching:          "Fetching results…",
        copied:            "✔ URL copied!",
        rowCount:          function(n) { return n === 1 ? "1 row" : n + " rows"; },
        execTime:          function(ms) { return "Executed in " + ms.toFixed(1) + " ms"; },
        coursesHint:       "Select a course category to filter the available example queries.",
        queriesHint:       "Select an example query to load it into the editor.",
        shortcutHint:      "Keyboard shortcut: press F5 to execute the query.",
        editorHint:        "Press F5 or click Execute Query to run the SQL in this editor.",
        editorComment:     "Here you can enter your queries and execute them with F5.\nYou can use the drop-down menus to select the sample queries.\nAs an alternative to the F5 key, you can also click on \"Execute Query\" on the right.\n\nThis query shows you all available tables and columns that are currently loaded in SQLite."
    },
    de: {
        appTitle:          "SQL-Beispiele",
        chooseCourse:      "Kurs auswählen",
        chooseQuery:       "Abfrage auswählen",
        executeQuery:      "Abfrage ausführen",
        copyQuery:         "Abfrage-URL kopieren",
        resultsPlaceholder:"Ergebnisse werden hier angezeigt",
        fetching:          "Ergebnisse werden geladen…",
        copied:            "✔ URL kopiert!",
        rowCount:          function(n) { return n === 1 ? "1 Zeile" : n + " Zeilen"; },
        execTime:          function(ms) { return "Ausgeführt in " + ms.toFixed(1) + " ms"; },
        coursesHint:       "Wählen Sie eine Kurskategorie, um die verfügbaren Beispielabfragen zu filtern.",
        queriesHint:       "Wählen Sie eine Beispielabfrage, um sie in den Editor zu laden.",
        shortcutHint:      "Tastenkürzel: F5 drücken, um die Abfrage auszuführen.",
        editorHint:        "F5 drücken oder auf \"Abfrage ausführen\" klicken, um SQL im Editor auszuführen.",
        editorComment:     "Hier können Sie Abfragen eingeben und mit F5 ausführen.\nNutzen Sie die Dropdown-Menüs, um Beispielabfragen auszuwählen.\nAlternativ zu F5 können Sie auch rechts auf \"Abfrage ausführen\" klicken.\n\nDiese Abfrage zeigt alle verfügbaren Tabellen und Spalten, die derzeit in SQLite geladen sind."
    }
};

var currentLang = (navigator.language || 'en').startsWith('de') ? 'de' : 'en';

function t(key) {
    return (i18n[currentLang] && i18n[currentLang][key]) || i18n['en'][key] || key;
}

function applyI18n() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        var val = t(key);
        if (typeof val === 'string') el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
        el.title = t(el.getAttribute('data-i18n-title'));
    });
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
        var isActive = btn.getAttribute('data-lang') === currentLang;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
    });
    document.getElementById('editor-hint').textContent = t('editorHint');
    document.title = t('appTitle') + ' – Interactive SQLite Playground';
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('sql-examples-lang', lang);
    applyI18n();
}

/* ── Theme ───────────────────────────────────────────── */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
    localStorage.setItem('sql-examples-theme', theme);
    if (typeof editor !== 'undefined') {
        monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    }
}

function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    if (!current) {
        current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ── Editor initial comment ─────────────────────────── */
function buildInitValue() {
    return '/* \n' + t('editorComment') + '\n*/\n\nSELECT \n  m.name as table_name, \n  p.name as column_name\nFROM \n  sqlite_master AS m\nJOIN \n  pragma_table_info(m.name) AS p\nORDER BY \n  m.name, \n  p.cid';
}

/* ── Bootstrap theme & lang from localStorage ────────── */
(function() {
    var savedTheme = localStorage.getItem('sql-examples-theme');
    var savedLang  = localStorage.getItem('sql-examples-lang');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedLang)  currentLang = savedLang;
})();

/* db is assigned inside the initSqlJs promise below */
var db;

var editorTheme = (document.documentElement.getAttribute('data-theme') === 'light') ? 'vs' :
    (document.documentElement.getAttribute('data-theme') === 'dark') ? 'vs-dark' :
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs');

var editor = monaco.editor.create(document.getElementById('container'), {
    value: buildInitValue(),
    language: 'sql',
    lineNumbers: "on",
    theme: editorTheme,
    roundedSelection: true,
    scrollBeyondLastLine: false,
    accessibilitySupport: "on"
});

/* update theme toggle button icon on load */
(function() {
    var btn = document.getElementById('theme-toggle');
    if (btn) {
        var dark = editorTheme === 'vs-dark';
        btn.textContent = dark ? '☀️' : '🌙';
        btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }
})();

function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}

var shareQuery = function() {
    var encodedQuery = utf8_to_b64(editor.getValue());
    window.location.hash = encodedQuery;
    var btn = document.getElementById('btn-copy');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).then(function() {
            setStatus(t('copied'));
            if (btn) {
                var original = btn.innerHTML;
                btn.innerHTML = '✔ <span>' + t('copied') + '</span>';
                setTimeout(function() { btn.innerHTML = original; }, 2000);
            }
        }).catch(function() {
            setStatus(window.location.href);
        });
    } else {
        setStatus(window.location.href);
    }
};

var execQuery = function() {
    var sqlcontent = '';
    var selection = editor.getModel().getValueInRange(editor.getSelection());
    var fullcontent = editor.getValue();
    if (selection.length == 0) {
        sqlcontent = fullcontent;
    } else {
        sqlcontent = selection;
    }
    console.log(sqlcontent);
    execute(sqlcontent);
};

editor.addCommand(monaco.KeyCode.F5, function() {
    var sqlcontent = '';
    var selection = editor.getModel().getValueInRange(editor.getSelection());
    var fullcontent = editor.getValue();
    if (selection.length == 0) {
        sqlcontent = fullcontent;
    } else {
        sqlcontent = selection;
    }
    console.log(sqlcontent);
    execute(sqlcontent);
});

var config = {
    locateFile: function(filename) { return './sqljs/' + filename; }
};

initSqlJs(config).then(function(SQL) {
    db = new SQL.Database();
    execute(northwind);
});

var worker = new Worker("./sqljs/worker.sql-wasm.js");
worker.onerror = showError;

function setLoading(loading) {
    var spinner = document.getElementById('exec-spinner');
    var btn = document.getElementById('btn-execute');
    var wrapper = document.getElementById('output-wrapper');
    if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
    if (btn) btn.disabled = loading;
    if (wrapper) wrapper.setAttribute('aria-busy', loading ? 'true' : 'false');
}

function setStatus(msg) {
    var bar = document.getElementById('status-bar');
    if (bar) bar.textContent = msg;
}

function execute(commands) {
    tic();
    noerror();
    setLoading(true);
    outputElm.textContent = t('fetching');
    worker.onmessage = function(event) {
        var results = event.data.results;
        var elapsed = toc("Executing SQL");
        setLoading(false);
        if (!results) {
            showError({ message: event.data.error });
            return;
        }

        tic();
        outputElm.innerHTML = "";
        var totalRows = 0;
        for (var i = 0; i < results.length; i++) {
            var tbl = tableCreate(results[i].columns, results[i].values);
            outputElm.appendChild(tbl);
            totalRows += results[i].values.length;
        }
        if (results.length === 0) {
            outputElm.textContent = t('resultsPlaceholder');
        }
        var displayTime = toc("Displaying results");
        setStatus(t('rowCount')(totalRows) + ' · ' + t('execTime')(elapsed + displayTime));
    };
    worker.postMessage({
        action: 'exec',
        sql: commands
    });
}

var tableCreate = function() {
    function setCellContent(td, val) {
        if (val === null || val === undefined) {
            var em = document.createElement('em');
            em.style.opacity = '0.5';
            em.textContent = 'NULL';
            td.appendChild(em);
        } else {
            td.textContent = String(val);
        }
    }
    return function(columns, values) {
        var tbl = document.createElement('table');
        tbl.className = 'styled-table';
        tbl.setAttribute('role', 'grid');
        tbl.setAttribute('aria-label', 'Query result');
        var thead = document.createElement('thead');
        var headerRow = document.createElement('tr');
        columns.forEach(function(col) {
            var th = document.createElement('th');
            th.setAttribute('scope', 'col');
            th.textContent = col;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        tbl.appendChild(thead);
        var tbody = document.createElement('tbody');
        values.forEach(function(row) {
            var tr = document.createElement('tr');
            row.forEach(function(cell) {
                var td = document.createElement('td');
                setCellContent(td, cell);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        return tbl;
    };
}();

function showError(e) {
    console.log(e);
    errorElm.style.height = '2em';
    errorElm.textContent = e.message;
    setLoading(false);
    setStatus('');
}

/* keep legacy alias so worker.onerror still works */
function error(e) { showError(e); }

function noerror() {
    errorElm.style.height = '0';
    errorElm.textContent = '';
}

var tictime;
if (!window.performance || !performance.now) {
    window.performance = { now: Date.now };
}

function tic() {
    tictime = performance.now();
}

function toc(msg) {
    var dt = performance.now() - tictime;
    console.log((msg || 'toc') + ': ' + dt + 'ms');
    return dt;
}

var outputElm = document.getElementById('output');
var errorElm  = document.getElementById('error');

function initX() {
    /* restore saved lang preference */
    var savedLang = localStorage.getItem('sql-examples-lang');
    if (savedLang) currentLang = savedLang;

    applyI18n();

    var selectelementCourse = "";
    var selectelementQuery = "";
    var courseandquery = "";
    var courses = [];
    var queries = [];
    var initCourse = "";
    for (var prop in sqlqueries) {
        courseandquery = prop.split(" - ");
        if (initCourse === "") {
            initCourse = courseandquery[0];
        }
        courses[courseandquery[0]] = "";
        if (initCourse === courseandquery[0]) {
            queries[courseandquery[1]] = "";
        }
    }

    for (var course in courses) {
        selectelementCourse += "<option>" + course + "</option>";
    }
    for (var query in queries) {
        selectelementQuery += "<option>" + query + "</option>";
    }
    document.getElementById('courses').innerHTML = selectelementCourse;
    document.getElementById('queries').innerHTML = selectelementQuery;

    var hashvalue = window.location.hash.substring(1);
    if (hashvalue.length > 4) {
        editor.setValue(b64_to_utf8(hashvalue));
    }
}

function selectCourse() {
    var selectedValue = document.getElementById('courses').value;
    var selectelementQuery = "";
    var courseandquery = "";
    var queries = [];
    for (var prop in sqlqueries) {
        courseandquery = prop.split(" - ");
        if (selectedValue === courseandquery[0]) {
            queries[courseandquery[1]] = "";
        }
    }

    for (var query in queries) {
        selectelementQuery += "<option>" + query + "</option>";
    }
    document.getElementById('queries').innerHTML = selectelementQuery;
    selectQuery();
}

function selectQuery() {
    var selectedCourse = document.getElementById('courses').value;
    var selectedQuery = document.getElementById('queries').value;
    editor.setValue(sqlqueries[selectedCourse + " - " + selectedQuery]);
    window.location.hash = '';
}