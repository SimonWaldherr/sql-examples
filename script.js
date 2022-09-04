var db;
var initValue = `/* 
Here you can enter your queries and execute them with F5.
You can use the drop-down menus to select the sample queries.
As an alternative to the F5 key, you can also click on "run" on the right.

This query shows you all available tables and columns that are currently loaded in SQLite.
*/

SELECT 
  m.name as table_name, 
  p.name as column_name
FROM 
  sqlite_master AS m
JOIN 
  pragma_table_info(m.name) AS p
ORDER BY 
  m.name, 
  p.cid`;

var editor = monaco.editor.create(document.getElementById('container'), {
    value: initValue,
    language: 'sql',
    lineNumbers: "on",
    theme: "vs-dark",
    roundedSelection: true,
    scrollBeyondLastLine: false
});

function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}

var shareQuery = function() {
    var encodedQuery = utf8_to_b64(editor.getValue());
    window.location.hash = encodedQuery;
    navigator.clipboard.writeText(window.location.href);
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

var myBinding = editor.addCommand(monaco.KeyCode.F5, function() {
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

config = {
    locateFile: filename => `./sqljs/${filename}`
}

initSqlJs(config).then(function(SQL) {
    db = new SQL.Database();
    execute(northwind);
});

var worker = new Worker("./sqljs/worker.sql-wasm.js");
worker.onerror = error;

function execute(commands) {
    tic();
    worker.onmessage = function(event) {
        var results = event.data.results;
        toc("Executing SQL");
        if (!results) {
            error({
                message: event.data.error
            });
            return;
        }

        tic();
        outputElm.innerHTML = "";
        for (var i = 0; i < results.length; i++) {
            outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
        }
        toc("Displaying results");
    }
    worker.postMessage({
        action: 'exec',
        sql: commands
    });
    outputElm.textContent = "Fetching results...";
}

var tableCreate = function() {
    function valconcat(vals, tagName) {
        if (vals.length === 0) return '';
        var open = '<' + tagName + '>',
            close = '</' + tagName + '>';
        return open + vals.join(close + open) + close;
    }
    return function(columns, values) {
        var tbl = document.createElement('table');
        var html = '<thead>' + valconcat(columns, 'th') + '</thead>';
        var rows = values.map(function(v) {
            return valconcat(v, 'td');
        });
        html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
        tbl.innerHTML = html;
        tbl.className = 'styled-table';
        return tbl;
    }
}();

function error(e) {
    console.log(e);
    errorElm.style.height = '2em';
    errorElm.textContent = e.message;
}

function noerror() {
    errorElm.style.height = '0';
}

var tictime;
if (!window.performance || !performance.now) {
    window.performance = {
        now: Date.now
    }
}

function tic() {
    tictime = performance.now()
}

function toc(msg) {
    var dt = performance.now() - tictime;
    console.log((msg || 'toc') + ": " + dt + "ms");
}

var outputElm = document.getElementById('output');

function initX() {
    var selectelementCourse = "";
    var selectelementQuery = "";
    var courseandquery = "";
    var courses = [];
    var queries = [];
    var initCourse = "";
    for (var prop in sqlqueries) {
        courseandquery = prop.split(" - ");
        if(initCourse=="") {
            initCourse = courseandquery[0];
        }
        courses[courseandquery[0]] = "";
        if(initCourse == courseandquery[0]) {
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
        if(selectedValue == courseandquery[0]) {
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
    editor.setValue(sqlqueries[selectedCourse+" - "+selectedQuery]);
    
    window.location.hash = '';
}