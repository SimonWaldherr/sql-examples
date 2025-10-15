/* 
  Extended script.js for ChatSQL
  - Keeps original behavior
  - Auto visualization with D3.js when useful
*/

var db;
// number of automatic execs run during init; while >0 we suppress auto-scrolling
var initialAutoExecPending = 0;
var initValue = `-- Willkommen bei ChatSQL!

`;

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
    locateFile: filename => `../sqljs/${filename}`
}

initSqlJs(config).then(function(SQL) {
    db = new SQL.Database();
  // Prevent auto-scrolling for initial import + date-update
  initialAutoExecPending += 2;
  execute(northwind);
    
    // Add 11 years to all date fields to make data current (2012-2014 → 2023-2025)
    const dateUpdateQueries = `
        UPDATE Employee SET BirthDate = date(BirthDate, '+11 years') WHERE BirthDate IS NOT NULL;
        UPDATE Employee SET HireDate = date(HireDate, '+11 years') WHERE HireDate IS NOT NULL;
        UPDATE "Order" SET OrderDate = date(OrderDate, '+11 years') WHERE OrderDate IS NOT NULL;
        UPDATE "Order" SET RequiredDate = date(RequiredDate, '+11 years') WHERE RequiredDate IS NOT NULL;
        UPDATE "Order" SET ShippedDate = date(ShippedDate, '+11 years') WHERE ShippedDate IS NOT NULL;
    `;
  execute(dateUpdateQueries);
});

var worker = new Worker("../sqljs/worker.sql-wasm.js");
worker.onerror = error;

/* -------------------------------------------------
   D3 helpers and smart rendering
   ------------------------------------------------- */

function isNumeric(x) {
  return typeof x === 'number' || (typeof x === 'string' && x.trim() !== '' && !isNaN(+x));
}
function looksLikeDateHeader(h) {
  return /date|time|year/i.test(h || '');
}

// Ensure D3 is loaded. If not, attempt to load it via CDN and wait up to `timeoutMs`.
function ensureD3Loaded(timeoutMs) {
  // Increase default timeout to be more robust on slow networks
  timeoutMs = typeof timeoutMs === 'number' ? timeoutMs : 10000;
  return new Promise((resolve, reject) => {
    if (window.d3) return resolve(window.d3);
    // If a loader script is already present and loading, hook onto it
    const existing = Array.from(document.getElementsByTagName('script')).find(s => /d3(\.|@|cdn)/i.test(s.src || ''));
    if (existing) {
      if (window.d3) return resolve(window.d3);
      // If the script exists but d3 isn't available yet, poll for window.d3 until timeout
      const start = Date.now();
      const interval = 150;
      const timer = setInterval(() => {
        if (window.d3) {
          clearInterval(timer);
          return resolve(window.d3);
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(timer);
          return reject(new Error('D3 load timeout'));
        }
      }, interval);
      // Also attach error listener if possible
      existing.addEventListener && existing.addEventListener('error', () => { clearInterval(timer); reject(new Error('D3 failed to load')); });
      return;
    }

    // Otherwise load D3 via dynamic import (ES module)
    console.log('Starting to load D3 via dynamic import...');
    const loadPromise = import('https://cdn.jsdelivr.net/npm/d3@7/+esm').then(d3 => {
      window.d3 = d3;
      console.log('D3 loaded via dynamic import, window.d3:', !!window.d3);
      return d3;
    }).catch(e => {
      console.log('D3 dynamic import failed:', e);
      throw new Error('D3 failed to load');
    });

    // Race with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.log('D3 load timed out after', timeoutMs, 'ms');
        reject(new Error('D3 load timeout'));
      }, timeoutMs);
    });

    Promise.race([loadPromise, timeoutPromise]).then(resolve).catch(reject);
  });
}

function renderD3IfUseful(results) {
  try {
    const auto = document.getElementById('autoD3');
    const viz = document.getElementById('viz');
    if (!viz) return;
    viz.innerHTML = '';
    if (!auto || !auto.checked) return;

    const doRender = () => {
      try {
        if (!results || !results[0] || !results[0].columns || !results[0].values) return;
        const columns = results[0].columns;
        const values = results[0].values;
        if (!values.length) return;

        // Build row objects
        const rows = values.map(r => {
          const o = {};
          columns.forEach((c,i)=> o[c] = r[i]);
          return o;
        });

        // Choose columns
        const numericCols = columns.filter(c => rows.some(row => isNumeric(row[c])));
        const catCols = columns.filter(c => !numericCols.includes(c));

        // Prefer time series if a header looks like date/time/year
        let timeCol = columns.find(c => looksLikeDateHeader(c));
        let metric = numericCols[0];

        // If nothing numeric, bail
        if (!metric) return;

        // Width/height
        const width = Math.max(480, Math.min(920, (viz.clientWidth || 600)));
        const height = 360;
        const svg = d3.select(viz).append("svg")
          .attr("width", width)
          .attr("height", height);

        if (timeCol) {
          // Line chart
          const parse = (v) => {
            if (v == null) return null;
            if (/^\d{4}$/.test(String(v))) return new Date(+v,0,1);
            const d = new Date(v);
            return isNaN(d) ? null : d;
          };
          const data = rows.map(r => ({ x: parse(r[timeCol]), y: +r[metric] }))
                           .filter(d => d.x !== null && !isNaN(d.y));

          if (data.length < 2) { svg.remove(); return; }

          data.sort((a,b)=> a.x - b.x);

          const margin = { top:20, right:20, bottom:30, left:50 };
          const innerW = width - margin.left - margin.right;
          const innerH = height - margin.top - margin.bottom;

          const x = d3.scaleUtc()
              .domain(d3.extent(data, d=>d.x))
              .range([0, innerW]);

          const y = d3.scaleLinear()
              .domain([0, d3.max(data, d=>d.y)]).nice()
              .range([innerH, 0]);

          const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

          g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x));
          g.append("g").call(d3.axisLeft(y));

          const line = d3.line().x(d=>x(d.x)).y(d=>y(d.y));
          g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .attr("d", line);

          g.append("text")
            .attr("x", 0).attr("y", -6)
            .text(`${timeCol} vs ${metric}`);

        } else if (catCols.length) {
          // Bar chart: first categorical + first numeric
          const dim = catCols[0];
          // Aggregate by dim if multiple rows per category
          const byKey = new Map();
          for (const r of rows) {
            const k = r[dim];
            const v = +r[metric];
            if (!isNaN(v)) byKey.set(k, (byKey.get(k)||0) + v);
          }
          let data = Array.from(byKey.entries()).map(([k,v])=>({k, v}));
          // limit categories for readability
          data.sort((a,b)=> b.v - a.v);
          data = data.slice(0, Math.min(30, data.length));

          const margin = { top:20, right:10, bottom:60, left:60 };
          const innerW = width - margin.left - margin.right;
          const innerH = height - margin.top - margin.bottom;

          const x = d3.scaleBand().domain(data.map(d=>String(d.k))).range([0, innerW]).padding(0.1);
          const y = d3.scaleLinear().domain([0, d3.max(data, d=>d.v)]).nice().range([innerH, 0]);

          const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
          g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x)).selectAll("text")
            .attr("transform", "rotate(-30)").attr("text-anchor", "end");
          g.append("g").call(d3.axisLeft(y));

          g.selectAll("rect").data(data).enter().append("rect")
            .attr("x", d=>x(String(d.k)))
            .attr("y", d=>y(d.v))
            .attr("width", d=>x.bandwidth())
            .attr("height", d=>innerH - y(d.v));

          g.append("text")
            .attr("x", 0).attr("y", -6)
            .text(`${dim} vs ${metric}`);
        }
      } catch (e) {
        console.warn('D3 inner render failed:', e);
      }
    };

    if (window.d3) {
      doRender();
    } else {
      // Try to load D3 and then render; don't block main flow if it fails
  ensureD3Loaded().then(() => doRender()).catch(e => console.warn('D3 not available, skipping viz:', e && e.message));
    }
  } catch (e) {
    console.warn('D3 render failed:', e);
  }
}

/* -------------------------------------------------
   Auto explanation (only for small results)
   ------------------------------------------------- */

const OPENAI_KEY_STORAGE = 'OPENAI_API_KEY';
const OPENAI_BASE_URL_STORAGE = 'OPENAI_API_BASE_URL';
// Default to your hosted proxy so the frontend points to simonwaldherr.de
const OPENAI_DEFAULT_BASE_URL = 'https://simonwaldherr.de/openai/api';

// Safe JSON.stringify that drops NaN/Infinity/undefined → null to avoid invalid JSON payloads
function safeStringify(obj) {
  try {
    return JSON.stringify(obj, (k, v) => {
      if (typeof v === 'number' && !isFinite(v)) return null;
      if (v === undefined) return null;
      return v;
    });
  } catch (e) {
    // Fallback
    return JSON.stringify({ error: 'stringify_failed', message: String(e) });
  }
}

function getSavedKey() { try { return localStorage.getItem(OPENAI_KEY_STORAGE) || ''; } catch(e){ return ''; } }
function saveKey(k) { try { if (k && k.startsWith('sk-')) localStorage.setItem(OPENAI_KEY_STORAGE, k); } catch(e){} }
function forgetKey() { try { localStorage.removeItem(OPENAI_KEY_STORAGE); } catch(e){} }

function getSavedBaseUrl() { try { return localStorage.getItem(OPENAI_BASE_URL_STORAGE) || ''; } catch(e){ return ''; } }
function saveBaseUrl(u) { try { if (u) localStorage.setItem(OPENAI_BASE_URL_STORAGE, u); } catch(e){} }
function forgetBaseUrl() { try { localStorage.removeItem(OPENAI_BASE_URL_STORAGE); } catch(e){} }

function resolveBaseUrl() {
  const input = document.getElementById('openaiBaseUrl');
  const fromInput = (input && input.value.trim()) || '';
  const stored = getSavedBaseUrl();
  return (fromInput || stored || OPENAI_DEFAULT_BASE_URL).replace(/\/$/, '');
}

function buildChatEndpoint(baseUrl) {
  const base = (baseUrl || OPENAI_DEFAULT_BASE_URL).replace(/\/$/, '');
  // If user already provided a versioned path or full endpoint, avoid duplicating
  if (/\/v\d+\/chat\/completions$/i.test(base)) return base; // already full endpoint
  if (/\/v\d+$/i.test(base)) return `${base}/chat/completions`; // version only
  return `${base}/v1/chat/completions`;
}

async function callOpenAIJSON({ apiKey, baseUrl, model, messages }) {
  const body = { model, messages, response_format: { type: "json_object" }, temperature: 0.1 };
  
  // If using api.openai.com directly, try SDK approach first
  if (!baseUrl || baseUrl.includes('api.openai.com')) {
    try {
      // Try dynamic import with better error handling
      const OpenAI = await import('https://esm.sh/openai@4.47.1').then(m => m.default);
      console.log('Using OpenAI SDK for direct browser access');
      const client = new OpenAI({ 
        apiKey, 
        dangerouslyAllowBrowser: true,
        baseURL: 'https://api.openai.com/v1'
      });
      const resp = await client.chat.completions.create(body);
      const content = resp?.choices?.[0]?.message?.content || "";
      return JSON.parse(content);
    } catch (sdkError) {
      console.warn('SDK approach failed:', sdkError.message);
      // For api.openai.com, don't fall back to fetch as it will always fail due to CORS
      throw new Error('Direct browser access to OpenAI API failed. Please use a proxy (set Base URL to http://localhost:3000 and run: node server.js)');
    }
  }
  
  // For proxy/custom endpoints, use fetch
  const endpoint = buildChatEndpoint(baseUrl);
  const headers = { "Content-Type":"application/json", "Authorization": `Bearer ${apiKey}` };
  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: safeStringify(body)
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text().catch(()=>res.statusText)}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return JSON.parse(content);
}

async function callOpenAIText({ apiKey, baseUrl, model, messages }) {
  const body = { model, messages, temperature: 0.2 };
  
  // If using api.openai.com directly, try SDK approach first
  if (!baseUrl || baseUrl.includes('api.openai.com')) {
    try {
      const OpenAI = await import('https://esm.sh/openai@4.47.1').then(m => m.default);
      console.log('Using OpenAI SDK for direct browser access');
      const client = new OpenAI({ 
        apiKey, 
        dangerouslyAllowBrowser: true,
        baseURL: 'https://api.openai.com/v1'
      });
      const resp = await client.chat.completions.create(body);
      const content = resp?.choices?.[0]?.message?.content || "";
      return content;
    } catch (sdkError) {
      console.warn('SDK approach failed:', sdkError.message);
      throw new Error('Direct browser access to OpenAI API failed. Please use a proxy (set Base URL to http://localhost:3000 and run: node server.js)');
    }
  }
  
  // For proxy/custom endpoints, use fetch
  const endpoint = buildChatEndpoint(baseUrl);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization": `Bearer ${apiKey}` },
    body: safeStringify(body)
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text().catch(()=>res.statusText)}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return content;
}

async function explainResultsIfSmall(firstResultSet) {
  try {
    const autoExplain = document.getElementById('autoExplain');
    const explanationElm = document.getElementById('resultExplanation');
    if (!autoExplain || !autoExplain.checked) { if (explanationElm) explanationElm.style.display='none'; return; }
    if (!firstResultSet || !firstResultSet.columns) { if (explanationElm) explanationElm.style.display='none'; return; }

    const preview = {
      columns: firstResultSet.columns,
      rows: firstResultSet.values.slice(0, 50)
    };
    const json = JSON.stringify(preview);

    if (json.length > 1000) { if (explanationElm) explanationElm.style.display='none'; return; }

    const keyInput = document.getElementById('openaiKey');
    const apiKey = (keyInput && keyInput.value.trim()) || getSavedKey();
    if (!apiKey) { if (explanationElm) explanationElm.style.display='none'; return; }

    const modelSel = document.getElementById('aiModel');
    const model = (modelSel && modelSel.value) || 'gpt-4o-mini';
    const baseUrl = resolveBaseUrl();

    const messages = [
      { role: "system", content: "Du bist ein prägnanter Datenanalyst. Erkläre tabellarische SQL-Ergebnisse in maximal 5 kurzen Bullet-Points auf Deutsch. Keine Floskeln, keine Wiederholung der Daten." },
      { role: "user", content: `Erkläre folgendes Query-Result in Stichpunkten. Nutze Spaltennamen als Bezüge. Result (JSON):\n${json}` }
    ];
    const text = await callOpenAIText({ apiKey, baseUrl, model, messages });
    if (explanationElm) {
      // Convert markdown to HTML if markdownToHtml is available
      if (typeof markdownToHtml === 'function') {
        explanationElm.innerHTML = markdownToHtml(text);
      } else {
        explanationElm.textContent = text;
      }
      explanationElm.style.display = 'block';
    }
  } catch (e) {
    console.warn('Auto explanation failed:', e);
  }
}

/* -------------------------------------------------
   Original execute() with hooks for D3 + Explanation
   ------------------------------------------------- */

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

        // D3 visualization
        renderD3IfUseful(results);

        // Auto-explain (only if small)
        if (results && results[0]) {
          explainResultsIfSmall(results[0]);
        }
        // Scroll to output so the user notices the results
        try {
          if (outputElm) {
            // Ensure it's visible
            outputElm.style.display = 'block';
            // Only auto-scroll if initial auto-exec has finished
            if (initialAutoExecPending <= 0) {
              outputElm.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
            // mark one initial exec as done
            if (initialAutoExecPending > 0) initialAutoExecPending -= 1;
          }
        } catch(e) { }
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
        var html = '<thead>' + valconcat(columns.map(c=>String(c)), 'th') + '</thead>';
        var rows = values.map(function(v) {
            return valconcat(v.map(x => x===null ? '' : String(x)), 'td');
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
    window.performance = { now: Date.now }
}
function tic() { tictime = performance.now() }
function toc(msg) {
    var dt = performance.now() - tictime;
    console.log((msg || 'toc') + ": " + dt + "ms");
}

var outputElm = document.getElementById('output');

function initX() {
    // Older UI with course/query selects was removed. Guard accesses so the script
    // doesn't crash if those elements are not present.
    try {
      if (window.sqlqueries && typeof window.sqlqueries === 'object') {
        const coursesElem = document.getElementById('courses');
        const queriesElem = document.getElementById('queries');
        if (coursesElem && queriesElem) {
          let selectelementCourse = "";
          let selectelementQuery = "";
          let initCourse = "";
          for (const prop in sqlqueries) {
            const courseandquery = prop.split(" - ");
            if (initCourse === "") initCourse = courseandquery[0];
          }
          const courseSet = new Set();
          const querySet = new Set();
          for (const prop in sqlqueries) {
            const courseandquery = prop.split(" - ");
            courseSet.add(courseandquery[0]);
            if (courseandquery[0] === initCourse) querySet.add(courseandquery[1]);
          }
          for (const c of courseSet) selectelementCourse += `<option>${c}</option>`;
          for (const q of querySet) selectelementQuery += `<option>${q}</option>`;
          coursesElem.innerHTML = selectelementCourse;
          queriesElem.innerHTML = selectelementQuery;
        }
      }

      const hashvalue = window.location.hash.substring(1);
      if (hashvalue.length > 4) editor.setValue(b64_to_utf8(hashvalue));

      // hydrate stored credentials (demo only)
      const savedKey = getSavedKey();
      if (savedKey && document.getElementById('openaiKey')) document.getElementById('openaiKey').value = savedKey;
      const savedBase = getSavedBaseUrl();
      if (savedBase && document.getElementById('openaiBaseUrl')) document.getElementById('openaiBaseUrl').value = savedBase;
    } catch (e) {
      console.warn('initX partial init failed (non-fatal):', e && e.message ? e.message : e);
    }
}

function selectCourse() {
  // no-op: sample queries removed}
}

function selectQuery() {
  // no-op: sample queries removed
}

// Small helpers
function quoteIdent(name) {
  return `"` + String(name).replace(/"/g, '""') + `"`;
}

function getColumnDescription(tableName, columnName) {
  const descriptions = {
    'Order': {
      'Id': 'Order identifier',
      'CustomerId': 'Foreign key to Customer table',
      'EmployeeId': 'Foreign key to Employee table', 
      'OrderDate': 'Date when order was placed',
      'RequiredDate': 'Date when order is required',
      'ShippedDate': 'Date when order was shipped',
      'ShipVia': 'Foreign key to Shipper table',
      'Freight': 'Shipping cost',
      'ShipName': 'Name of recipient',
      'ShipAddress': 'Shipping address',
      'ShipCity': 'Shipping city',
      'ShipRegion': 'Shipping region',
      'ShipPostalCode': 'Shipping postal code',
      'ShipCountry': 'Shipping country'
    },
    'OrderDetail': {
      'Id': 'Order detail identifier',
      'OrderId': 'Foreign key to Order table',
      'ProductId': 'Foreign key to Product table',
      'UnitPrice': 'Price per unit at time of order',
      'Quantity': 'Number of units ordered',
      'Discount': 'Discount applied (0.0 to 1.0)'
    },
    'Product': {
      'Id': 'Product identifier',
      'ProductName': 'Name of the product',
      'SupplierId': 'Foreign key to Supplier table',
      'CategoryId': 'Foreign key to Category table',
      'QuantityPerUnit': 'Package description',
      'UnitPrice': 'Current unit price',
      'UnitsInStock': 'Current inventory level',
      'UnitsOnOrder': 'Units currently on order',
      'ReorderLevel': 'Minimum inventory level',
      'Discontinued': '1 if product is discontinued, 0 otherwise'
    },
    'Customer': {
      'Id': 'Customer identifier (typically 5-char code)',
      'CompanyName': 'Company name',
      'ContactName': 'Primary contact person',
      'ContactTitle': 'Title of contact person',
      'Address': 'Street address',
      'City': 'City',
      'Region': 'State/Province',
      'PostalCode': 'Postal/ZIP code',
      'Country': 'Country',
      'Phone': 'Phone number',
      'Fax': 'Fax number'
    },
    'Employee': {
      'Id': 'Employee identifier',
      'LastName': 'Employee last name',
      'FirstName': 'Employee first name', 
      'Title': 'Job title',
      'TitleOfCourtesy': 'Courtesy title (Mr., Ms., etc.)',
      'BirthDate': 'Date of birth',
      'HireDate': 'Date hired',
      'ReportsTo': 'Manager employee ID (self-referencing FK)'
    }
  };
  return descriptions[tableName]?.[columnName] || null;
}

function clamp(str, max) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + `\n…[truncated ${str.length - max} chars]`;
}

// Keep main-thread db in sync with worker db (used for schema introspection)
function applyToLocalDB(sql) {
  try { if (db) db.exec(sql); } catch (e) { console.warn('Local DB exec failed:', e?.message || e); }
}

// Wrap exec to mirror mutations
(function wrapExecButtons() {
  const originalExecQuery = execQuery;
  execQuery = function() {
    originalExecQuery();
    try {
      const selection = editor.getModel().getValueInRange(editor.getSelection());
      const sql = selection.length ? selection : editor.getValue();
      applyToLocalDB(sql);
    } catch (e) {}
  };
})();

// Schema introspection (tables, columns, FKs, samples)
function buildSchemaDoc(opts = { includeSamples: true, maxChars: 12000 }) {
  if (!db) return 'DB not ready';

  const tablesRes = db.exec(`
    SELECT name, type 
    FROM sqlite_master 
    WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `);
  const tables = (tablesRes[0]?.values || []).map(([name, type]) => ({ name, type }));

  const doc = {
    dialect: "SQLite",
    database: "Northwind (in-browser, via sql.js)",
    description: "Classic Northwind sample database with customers, orders, products, employees, and suppliers. Ideal for learning SQL with realistic business data.",
    generated_at: new Date().toISOString(),
    tables: [],
    relationships: [],
    common_patterns: [
      "Sales analysis: JOIN Order + OrderDetail + Product + Customer",
      "Top customers: GROUP BY customer with SUM/COUNT aggregates", 
      "Product performance: GROUP BY product with sales metrics",
      "Time-based analysis: strftime('%Y', date) for yearly grouping",
      "Ranking: ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)",
      "Regional analysis: GROUP BY country/region",
      "Employee hierarchy: self-join on Employee.ReportsTo"
    ],
    query_examples: []
  };

  for (const t of tables) {
    const cols = db.exec(`PRAGMA table_info(${quoteIdent(t.name)});`)[0]?.values || [];
    const columns = cols.map(([cid, name, type, notnull, dflt_value, pk]) => ({
      name, 
      type: type || null, 
      notnull: !!notnull, 
      default: dflt_value, 
      pk: pk === 1,
      description: getColumnDescription(t.name, name)
    }));

    let rowCount = null;
    try {
      rowCount = db.exec(`SELECT COUNT(*) AS c FROM ${quoteIdent(t.name)};`)[0]?.values?.[0]?.[0] ?? null;
    } catch (e) {}

    const fks = db.exec(`PRAGMA foreign_key_list(${quoteIdent(t.name)});`)[0]?.values || [];
    for (const fk of fks) {
      const [, , refTable, fromCol, toCol] = fk;
      doc.relationships.push({ from: `${t.name}.${fromCol}`, to: `${refTable}.${toCol}` });
    }

    let samples = undefined;
    if (opts.includeSamples) {
      samples = {};
      for (const c of columns.slice(0, 8)) {
        try {
          const sampleRes = db.exec(`
            SELECT ${quoteIdent(c.name)} AS v, COUNT(*) AS cnt
            FROM ${quoteIdent(t.name)}
            WHERE ${quoteIdent(c.name)} IS NOT NULL
            GROUP BY ${quoteIdent(c.name)}
            ORDER BY cnt DESC
            LIMIT 3;
          `);
          const vals = (sampleRes[0]?.values || []).map(([v]) => v);
          if (vals.length) samples[c.name] = vals;
        } catch (e) {}
      }
    }

    doc.tables.push({ 
      name: t.name, 
      kind: t.type, 
      rowCount, 
      columns, 
      samples,
      description: getTableDescription(t.name),
      businessContext: getBusinessContext(t.name)
    });
  }

  // Add some example queries to help the LLM understand patterns
  doc.query_examples = [
    {
      description: "Sales revenue by customer",
      sql: `SELECT c.CompanyName, c.Country, 
       SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS Revenue
FROM Customer c
JOIN [Order] o ON c.Id = o.CustomerId  
JOIN OrderDetail od ON o.Id = od.OrderId
GROUP BY c.CompanyName, c.Country
ORDER BY Revenue DESC`
    },
    {
      description: "Top products by quantity sold",  
      sql: `SELECT p.ProductName, cat.CategoryName,
       SUM(od.Quantity) AS TotalQuantity
FROM Product p
JOIN Category cat ON p.CategoryId = cat.Id
JOIN OrderDetail od ON p.Id = od.ProductId
GROUP BY p.ProductName, cat.CategoryName
ORDER BY TotalQuantity DESC`
    },
    {
      description: "Monthly sales trends",
      sql: `SELECT strftime('%Y-%m', o.OrderDate) AS Month,
       COUNT(DISTINCT o.Id) AS Orders,
       SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS Revenue
FROM [Order] o
JOIN OrderDetail od ON o.Id = od.OrderId
GROUP BY strftime('%Y-%m', o.OrderDate)
ORDER BY Month`
    }
  ];

  let json = JSON.stringify(doc, null, 2);
  if (json.length > (opts.maxChars || 12000)) {
    for (const tbl of doc.tables) delete tbl.samples;
    json = JSON.stringify(doc, null, 2);
  }
  return json;
}

function getTableDescription(tableName) {
  const descriptions = {
    'Order': 'Sales orders placed by customers, containing header information like dates, shipping details, and customer references',
    'OrderDetail': 'Line items for each order, containing product quantities, prices, and discounts applied',
    'Product': 'Product catalog with pricing, inventory levels, and supplier information',
    'Customer': 'Customer master data including contact information and addresses', 
    'Employee': 'Employee records with personal information and reporting relationships',
    'Category': 'Product categories for organizing the product catalog',
    'Supplier': 'Vendor/supplier information for product sourcing',
    'Shipper': 'Shipping companies used for order delivery',
    'Region': 'Geographic regions for sales territory management'
  };
  return descriptions[tableName] || 'Business entity table';
}

function getBusinessContext(tableName) {
  const contexts = {
    'Order': 'Central transaction table - join with OrderDetail for line items, Customer for buyer info, Employee for sales rep',
    'OrderDetail': 'Transaction line items - always join with Order and Product for meaningful analysis',
    'Product': 'Inventory and catalog - join with Category and Supplier for full product context',
    'Customer': 'Master data for sales analysis - geographic and demographic segmentation',
    'Employee': 'Human resources and sales performance tracking'
  };
  return contexts[tableName] || null;
}

const SYSTEM_PROMPT = `
You are ChatSQL, an expert SQL assistant for the Northwind database (SQLite dialect).

Context: Northwind is a classic sample database representing a trading company with customers, orders, products, employees, and suppliers. Perfect for business intelligence and sales analysis.

Core Rules:
- ONLY generate SQLite-compatible queries
- Use double quotes for identifiers that need escaping (like "Order" table)
- Always qualify column names in JOINs (e.g., o.CustomerId, c.Id)
- Prefer explicit JOIN syntax over WHERE clause joins
- Use meaningful table aliases (c for Customer, o for Order, od for OrderDetail, p for Product)

Common Analysis Patterns:
- Sales Revenue: od.UnitPrice * od.Quantity * (1 - od.Discount)
- Date Grouping: strftime('%Y', OrderDate) or strftime('%Y-%m', OrderDate)
- Top N: Always include ORDER BY with LIMIT
- Customer Analysis: Join Customer → Order → OrderDetail → Product
- Product Performance: Group by Product with SUM aggregates
- Time Series: Group by date parts with trend analysis
- Geographic: Group by Country/Region for territorial insights

Key Relationships:
- Order.CustomerId → Customer.Id
- Order.EmployeeId → Employee.Id  
- OrderDetail.OrderId → Order.Id
- OrderDetail.ProductId → Product.Id
- Product.CategoryId → Category.Id
- Employee.ReportsTo → Employee.Id (self-join)

Response Format - Return ONLY valid JSON:
{
  "action": "sql" | "clarify",
  "sql": "SELECT ...", 
  "explanation": "Brief explanation of what the query does",
  "follow_up": "Optional follow-up question if clarification needed"
}

Important: 
- If user request is ambiguous, set action="clarify" and ask one specific question
- Always explain business value of the query
- Suggest related insights when appropriate
`.trim();

async function callOpenAI({ apiKey, baseUrl, model, messages }) {
  const body = {
    model,
    messages,
    response_format: { type: "json_object" },
    temperature: 0.1
  };
  
  // If using api.openai.com directly, try SDK approach first
  if (!baseUrl || baseUrl.includes('api.openai.com')) {
    try {
      const OpenAI = await import('https://esm.sh/openai@4.47.1').then(m => m.default);
      console.log('Using OpenAI SDK for direct browser access');
      const client = new OpenAI({ 
        apiKey, 
        dangerouslyAllowBrowser: true,
        baseURL: 'https://api.openai.com/v1'
      });
      const resp = await client.chat.completions.create(body);
      const content = resp?.choices?.[0]?.message?.content || "";
      return JSON.parse(content);
    } catch (sdkError) {
      console.warn('SDK approach failed:', sdkError.message);
      throw new Error('Direct browser access to OpenAI API failed. Please use a proxy (set Base URL to http://localhost:3000 and run: node server.js)');
    }
  }
  
  // For proxy/custom endpoints, use fetch
  const endpoint = buildChatEndpoint(baseUrl);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: safeStringify(body)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${errText || res.statusText}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return JSON.parse(content);
}

(function initChatSQLUI() {
  const keyInput = document.getElementById('openaiKey');
  const baseUrlInput = document.getElementById('openaiBaseUrl');
  const saveBtn = document.getElementById('saveKeyBtn');
  const forgetBtn = document.getElementById('forgetKeyBtn');
  const askBtn = document.getElementById('askAIBtn');
  const insertBtn = document.getElementById('insertSQLBtn');
  const runBtn = document.getElementById('runSQLBtn');
  const promptTA = document.getElementById('aiPrompt');
  const modelSel = document.getElementById('aiModel');
  const includeSamplesCB = document.getElementById('includeSamples');
  const schemaDocElm = document.getElementById('schemaDoc');
  const schemaPreview = document.getElementById('schemaPreview');
  const aiResultElm = document.getElementById('aiResult');
  const copyResultBtn = document.getElementById('copyResultBtn');

  const convo = [];

  try {
    const savedKey = getSavedKey();
    if (savedKey && keyInput) keyInput.value = savedKey;
    const savedBase = getSavedBaseUrl();
    if (savedBase && baseUrlInput && !baseUrlInput.value) baseUrlInput.value = savedBase;
  } catch(e){}

  function showResult(obj) {
    try {
      if (obj && typeof obj === 'object') {
        const explanation = obj.explanation || obj.summary || '';
        const sql = obj.sql || '';
        let out = '';
        if (explanation) out += explanation.trim() + "\n\n";
        if (sql) out += "SQL:\n" + sql;
        if (!out) out = JSON.stringify(obj, null, 2);
        aiResultElm.textContent = out;
      } else {
        aiResultElm.textContent = String(obj);
      }
      if (obj?.sql) {
        insertBtn.disabled = false;
        runBtn.disabled = false;
        insertBtn.dataset.sql = obj.sql;
      } else {
        insertBtn.disabled = true;
        runBtn.disabled = true;
        insertBtn.dataset.sql = "";
      }
    } catch (e) {
      aiResultElm.textContent = String(e?.message || e);
      insertBtn.disabled = true;
      runBtn.disabled = true;
    }
  }

  saveBtn.onclick = () => {
    const k = keyInput.value.trim();
    const base = baseUrlInput ? baseUrlInput.value.trim() : '';
    saveKey(k);
    if (base) {
      saveBaseUrl(base);
    } else {
      forgetBaseUrl();
    }
    updateProxyStatus();
    // gentle, non-modal feedback
    const s = document.getElementById('proxyStatus');
    if (s) { s.textContent = '✅ Einstellungen gespeichert'; s.style.color = '#00cc66'; }
  };
  forgetBtn.onclick = () => {
    forgetKey();
    keyInput.value = '';
    forgetBaseUrl();
    if (baseUrlInput) baseUrlInput.value = '';
    updateProxyStatus();
    const s = document.getElementById('proxyStatus');
    if (s) { s.textContent = '🔒 Einstellungen entfernt'; s.style.color = '#999'; }
  };

  async function updateProxyStatus() {
    const statusElm = document.getElementById('proxyStatus');
    if (!statusElm) return;
    const base = resolveBaseUrl();
    
    if (base.includes('localhost') || base.includes('127.0.0.1')) {
      try {
        const resp = await fetch(base + '/health', { method: 'GET' });
        if (resp.ok) {
          statusElm.innerHTML = '🟢 Lokaler Proxy: aktiv';
          statusElm.style.color = '#00cc66';
        } else {
          statusElm.innerHTML = '🔴 Proxy antwortet nicht korrekt';
          statusElm.style.color = '#ff3333';
        }
      } catch(e) {
        statusElm.innerHTML = '🔴 Proxy nicht erreichbar – klicke „Advanced“ für Hilfe';
        statusElm.style.color = '#ff3333';
      }
    } else if (base.includes('api.openai.com') || !base || base === OPENAI_DEFAULT_BASE_URL) {
      statusElm.innerHTML = '⚠️ Direkte OpenAI API (CORS möglich)';
      statusElm.style.color = '#ff9900';
    } else {
      statusElm.innerHTML = '🟡 Benutzerdefinierte API-URL';
      statusElm.style.color = '#cccc00';
    }
  }

  window.showProxyHelp = function() {
    alert(`Nutze den zentralen Proxy unter https://simonwaldherr.de/openai/api oder deinen lokalen Proxy.`);
  };

  async function askAI() {
    insertBtn.disabled = true;
    runBtn.disabled = true;
    try { if (aiResultElm) { aiResultElm.style.display = 'none'; aiResultElm.textContent = ''; } } catch(e){}
    // Also hide any previous automatic explanation
    try { const explanationElm = document.getElementById('resultExplanation'); if (explanationElm) explanationElm.style.display = 'none'; } catch(e){}

    if (!keyInput.value.trim()) {
      aiResultElm.textContent = "Bitte OpenAI API-Key eingeben.";
      keyInput.focus();
      return;
    }

    const schema = buildSchemaDoc({ includeSamples: includeSamplesCB.checked, maxChars: 12000 });
    const baseUrl = resolveBaseUrl();
    // Optional: basic sanity for proxy (skip for api.openai.com)
    if (/^https?:\/\//.test(baseUrl) && !/api\.openai\.com/i.test(baseUrl)) {
      try {
        const health = await fetch(baseUrl.replace(/\/$/, '') + '/health', { method: 'GET' });
        if (!health.ok) console.warn('Proxy health check not OK:', health.status);
      } catch (e) {
        console.warn('Proxy health check failed:', e?.message || e);
      }
    }
    schemaDocElm.textContent = schema;
    schemaPreview.open = false;

    const userQuestion = promptTA.value.trim();
    if (!userQuestion) {
      aiResultElm.textContent = "Bitte Frage eingeben.";
      return;
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `Database Schema (JSON):\n` +
          schema +
          `\n\nUser Question: "${userQuestion}"\n\n` +
          `Please generate a SQLite query for the Northwind database. ` +
          `Focus on business insights and use appropriate JOINs and aggregations. ` +
          `Respond as JSON only.`
      }
    ];

    try {
      const resp = await callOpenAI({
        apiKey: keyInput.value.trim(),
        baseUrl,
        model: modelSel.value,
        messages
      });
  convo.length = 0;
  convo.push({ role: "system", content: SYSTEM_PROMPT });
  convo.push({ role: "user", content: userQuestion });
  showResult(resp);
  // Reveal AI result panel now that we have an answer
  try { if (aiResultElm) aiResultElm.style.display = 'block'; } catch(e){}

      if (resp?.action === 'clarify' && resp?.follow_up) {
        promptTA.value = resp.follow_up;
        promptTA.focus();
        promptTA.select();
      }
    } catch (e) {
      const baseMsg = e && e.message ? e.message : String(e);
      const base = resolveBaseUrl();
      let finalMsg = `Error: ${baseMsg}`;
      
      if (/Direct browser access.*failed|SDK approach failed/i.test(baseMsg)) {
        finalMsg = `❌ Browser-SDK-Zugriff fehlgeschlagen\n\n`;
        finalMsg += `Die direkte Verbindung zur OpenAI API funktioniert nicht im Browser.\n\n`;
        finalMsg += `LÖSUNG: Lokalen Proxy verwenden\n\n`;
        finalMsg += `1. Terminal öffnen:\n`;
        finalMsg += `   cd /Users/simonwaldherr/Downloads/sql-examples-gh-pages\n`;
        finalMsg += `   export OPENAI_API_KEY=${keyInput.value.slice(0,8)}...\n`;
        finalMsg += `   node server.js\n\n`;
        finalMsg += `2. Oben "API Base URL" auf: http://localhost:3000\n`;
        finalMsg += `3. "Save" klicken und erneut versuchen`;
      } else if (/failed to fetch|cors|preflight/i.test(baseMsg || '')) {
        finalMsg = `❌ Netzwerk-/CORS-Problem\n\n`;
        finalMsg += `Tipps:\n`;
        finalMsg += `• Stelle sicher, dass die Base URL korrekt ist (Standard: https://api.openai.com)\n`;
        finalMsg += `• Teste alternativ mit eingebautem Browser-SDK (wir versuchen es automatisch)\n`;
        finalMsg += `• Optional: Eigener Proxy (http://localhost:3000) falls nötig\n`;
      }
      
      // Show the AI result/error area so user sees the message
      try { if (aiResultElm) { aiResultElm.style.display = 'block'; aiResultElm.textContent = finalMsg; } }
      catch(e) { if (aiResultElm) aiResultElm.textContent = finalMsg; }
      await updateProxyStatus();
    }
  }

  askBtn.onclick = askAI;
  if (copyResultBtn) copyResultBtn.onclick = () => { navigator.clipboard.writeText(aiResultElm.textContent || ''); };
  promptTA.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      askAI();
    }
  });

  insertBtn.onclick = () => {
    const sql = insertBtn.dataset.sql || '';
    if (!sql) return;
    editor.setValue(sql);
  };
  if (runBtn) {
    runBtn.onclick = () => {
      const sql = insertBtn.dataset.sql || '';
      if (!sql) return;
      applyToLocalDB(sql);
      execute(sql);
    };
  }

  // Auto-detect file:// und aktiviere Proxy-Modus
  (async function initProxyMode() {
    if (location.protocol === 'file:') {
      // When running from file:// default to your hosted proxy so the app works without local server
      if (baseUrlInput && !baseUrlInput.value && !getSavedBaseUrl()) {
        baseUrlInput.value = OPENAI_DEFAULT_BASE_URL;
        baseUrlInput.style.border = '2px solid #ff9900';
        baseUrlInput.title = 'file:// verwendet remote Proxy – siehe Status unten';
      }
    }
    await updateProxyStatus();
  })();
})();

/* -------------------------------------------------
   One-click flow: Ask AI → insert SQL → blacklist → execute → evaluate
   ------------------------------------------------- */

const SQL_BLACKLIST = [ /\bDROP\s+TABLE\b/i, /\bDELETE\b/i, /\bUPDATE\b/i, /\bALTER\b/i, /\bTRUNCATE\b/i, /\bATTACH\b/i, /\bPRAGMA\b/i ];

function isSqlAllowed(sql) {
  if (!sql || typeof sql !== 'string') return false;
  for (const re of SQL_BLACKLIST) if (re.test(sql)) return false;
  return true;
}

// Make execute return a Promise that resolves with the array of result sets
function executePromise(commands) {
  return new Promise((resolve, reject) => {
    try {
      tic();
      worker.onmessage = function(event) {
        var results = event.data.results;
        toc("Executing SQL");
        if (!results) {
          reject(new Error(event.data.error || 'Execution failed'));
          return;
        }

          // display
          if (outputElm) outputElm.style.display = 'block';
          outputElm.innerHTML = "";
          // clear viz
          const viz = document.getElementById('viz'); if (viz) viz.innerHTML = '';
        for (var i = 0; i < results.length; i++) {
            outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
        }

        // D3 visualization
        renderD3IfUseful(results);

        // Auto-explain
        if (results && results[0]) explainResultsIfSmall(results[0]);

        // Scroll to output so the user notices the results
        try {
          if (outputElm) {
            outputElm.style.display = 'block';
            if (initialAutoExecPending <= 0) outputElm.scrollIntoView({ behavior: 'smooth', block: 'end' });
            if (initialAutoExecPending > 0) initialAutoExecPending -= 1;
          }
        } catch(e) {}
        resolve(results);
      }
      worker.postMessage({ action: 'exec', sql: commands });
      outputElm.textContent = "Fetching results...";
    } catch (e) { reject(e); }
  });
}

async function autoAskAndRun() {
  try {
    const prompt = (document.getElementById('aiPrompt')||{}).value || '';
    if (!prompt.trim()) { alert('Bitte Frage eingeben.'); return; }

    // Hide AI result area while processing to indicate work in progress
    try { const aiResult = document.getElementById('aiResult'); if (aiResult) { aiResult.style.display = 'none'; aiResult.textContent = ''; } } catch(e){}

    // build schema (include samples if desired)
    const includeSamples = document.getElementById('includeSamples') ? document.getElementById('includeSamples').checked : true;
    const schema = buildSchemaDoc({ includeSamples, maxChars: 12000 });

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Database Schema (JSON):\n${schema}\n\nUser Question: "${prompt}"\nRespond as JSON with {action: 'sql'|'clarify', sql?, explanation?, follow_up?}` }
    ];

    const apiKey = getSavedKey() || (document.getElementById('openaiKey')||{}).value.trim();
    const baseUrl = resolveBaseUrl();

    const resp = await callOpenAI({ apiKey, baseUrl, model: (document.getElementById('aiModel')||{}).value || 'gpt-4o-mini', messages });

    if (!resp || !resp.action) {
      document.getElementById('aiResult').textContent = 'Ungültige Antwort vom LLM.';
      return;
    }

    if (resp.action === 'clarify') {
      // place follow_up into prompt for user to edit and re-run
      if (resp.follow_up) document.getElementById('aiPrompt').value = resp.follow_up;
      const aiResult = document.getElementById('aiResult'); if (aiResult) { aiResult.textContent = resp.explanation || 'Bitte Rückfrage beantworten.'; aiResult.style.display = 'block'; }
      return;
    }

    if (resp.action === 'sql' && resp.sql) {
      const sql = resp.sql.trim();
      // blacklist check
      if (!isSqlAllowed(sql)) {
        document.getElementById('aiResult').textContent = 'Sicherheits-Check fehlgeschlagen: Verbotene SQL-Operation entdeckt.';
        return;
      }

  // insert into editor
      editor.setValue(sql);

      // execute and evaluate
      const results = await executePromise(sql);

  // simple evaluation: row count and columns
      let evalMsg = '';
      if (!results || results.length === 0) evalMsg = 'Keine Ergebnisse.';
      else {
        const first = results[0];
        const rowCount = (first.values || []).length;
        evalMsg = `Ergebnis: ${rowCount} Zeilen, ${first.columns.length} Spalten.`;
      }
        // Also ask the LLM to evaluate whether the SQL answers the original user question.
        try {
                try {
        const evaluationPrompt = `Original question:\n"${prompt}"\n\nSQL generated:\n${sql}\n\nResult (first rows JSON):\n` + JSON.stringify((results && results[0]) ? { columns: results[0].columns, rows: (results[0].values||[]).slice(0,20) } : {}, null, 2) + `\n\nPlease give a short assessment in German (1-2 sentences) whether the SQL answers the user's question and a score from 1 (poor) to 5 (excellent).`;
        const evalText = await callOpenAIText({ apiKey, baseUrl, model: (document.getElementById('aiModel')||{}).value || 'gpt-4o-mini', messages: [ { role: 'user', content: evaluationPrompt } ] });
        const fullResponse = (resp.explanation ? resp.explanation + '\n\n' : '') + evalMsg + '\n\nLLM-Evaluation:\n' + evalText;
        // Use markdown conversion if available and reveal result area
        const aiResult = document.getElementById('aiResult');
        try {
          if (aiResult) {
            if (typeof markdownToHtml === 'function') aiResult.innerHTML = markdownToHtml(fullResponse);
            else aiResult.textContent = fullResponse;
            aiResult.style.display = 'block';
          }
        } catch(e) { if (aiResult) aiResult.textContent = fullResponse; }
      } catch (ee) {
        // don't fail the main flow if evaluation fails
        const aiResult = document.getElementById('aiResult'); if (aiResult) { aiResult.textContent = (resp.explanation ? resp.explanation + '\n\n' : '') + evalMsg + '\n\n(Keine automatische Evaluation verfügbar)'; aiResult.style.display = 'block'; }
      }
          const evalText = await callOpenAIText({ apiKey, baseUrl, model: (document.getElementById('aiModel')||{}).value || 'gpt-4o-mini', messages: [ { role: 'user', content: evaluationPrompt } ] });
          const aiResult2 = document.getElementById('aiResult'); if (aiResult2) { aiResult2.textContent = (resp.explanation ? resp.explanation + '\n\n' : '') + evalMsg + '\n\nLLM-Evaluation:\n' + evalText; aiResult2.style.display = 'block'; }
        } catch (ee) {
          // don't fail the main flow if evaluation fails
          const aiResult3 = document.getElementById('aiResult'); if (aiResult3) { aiResult3.textContent = (resp.explanation ? resp.explanation + '\n\n' : '') + evalMsg + '\n\n(Keine automatische Evaluation verfügbar)'; aiResult3.style.display = 'block'; }
        }
      return;
    }

    document.getElementById('aiResult').textContent = 'LLM Antwort konnte nicht verarbeitet werden.';
  } catch (e) {
    document.getElementById('aiResult').textContent = 'Fehler: ' + (e.message || String(e));
  }
}

// Hook Ask AI to one-click auto flow
const mainAskBtn = document.getElementById('askAIBtn');
if (mainAskBtn) mainAskBtn.onclick = autoAskAndRun;
