/*
  SUNNY PEOPLE - moduli del sito nel Foglio Google
  =================================================
  Ogni risposta ai moduli del sito (avvisami, locali, ragazzi) arriva
  da Netlify e diventa una riga nella scheda con lo stesso nome.
  Le schede si creano da sole alla prima risposta.

  COME ATTIVARLO (una volta sola):

  1. Crea un nuovo Foglio Google, ad esempio "Sunny People - Moduli sito".
  2. Nel foglio: menu Estensioni > Apps Script.
  3. Cancella il codice che trovi, incolla TUTTO questo file e salva.
  4. In alto a destra: Esegui il deployment > Nuovo deployment.
     - Tipo (icona ingranaggio): App web
     - Esegui come: Me
     - Chi ha accesso: Chiunque
     Premi Esegui il deployment e autorizza l'accesso
     (se compare "App non verificata": Avanzate > Vai al progetto).
  5. Copia l'URL della App web (finisce con /exec).
  6. Su Netlify: Forms > Notifiche di invio > Aggiungi notifica >
     Richiesta HTTP POST
     - Evento: nuovo invio di modulo
     - URL: l'URL copiato + ?token=  + il TOKEN qui sotto
       es.  https://script.google.com/macros/s/.../exec?token=XXXX
     - Modulo: qualsiasi modulo
     Salva.

  Se modifichi questo codice, rifai il deployment con
  Esegui il deployment > Gestisci deployment > Modifica > Nuova versione.
*/

// Chiave segreta: solo Netlify la conosce, cosi' nessun altro puo' scrivere nel foglio.
var TOKEN = "0qLzWduHtWagzJahmJgrc0Wn";

// Ordine delle colonne per ogni modulo. Campi nuovi vengono aggiunti in fondo.
var COLONNE = {
  avvisami: ["nome", "email", "whatsapp", "consenso"],
  locali:   ["locale", "referente", "ruolo", "email", "telefono", "zona", "capienza", "spazi", "messaggio", "consenso"],
  ragazzi:  ["nome", "eta", "email", "whatsapp", "instagram", "ruoli", "zona", "messaggio", "consenso"]
};

// Campi tecnici che non servono nel foglio.
var ESCLUSI = ["form-name", "bot-field", "website", "ruolo[]", "ip", "user_agent", "referrer"];

function doPost(e) {
  if (!e || !e.parameter || e.parameter.token !== TOKEN) {
    return risposta("forbidden");
  }

  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return risposta("bad json");
  }

  var modulo = String(body.form_name || (body.data && body.data["form-name"]) || "altro");
  var dati = body.data || {};

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var foglio = scheda(modulo);
    var intestazioni = foglio.getRange(1, 1, 1, foglio.getLastColumn()).getValues()[0];

    // aggiunge colonne per eventuali campi nuovi
    Object.keys(dati).forEach(function (k) {
      if (ESCLUSI.indexOf(k) === -1 && intestazioni.indexOf(k) === -1) {
        intestazioni.push(k);
        foglio.getRange(1, intestazioni.length).setValue(k).setFontWeight("bold");
      }
    });

    var riga = intestazioni.map(function (k) {
      if (k === "data") return body.created_at ? new Date(body.created_at) : new Date();
      return pulisci(dati[k]);
    });
    foglio.appendRow(riga);
  } finally {
    lock.releaseLock();
  }

  return risposta("ok");
}

function scheda(nome) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var foglio = ss.getSheetByName(nome);
  if (!foglio) {
    foglio = ss.insertSheet(nome);
    var cols = ["data"].concat(COLONNE[nome] || []);
    foglio.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight("bold");
    foglio.setFrozenRows(1);
    // toglie il "Foglio1" vuoto creato da Google
    var vuoto = ss.getSheetByName("Foglio1") || ss.getSheetByName("Sheet1");
    if (vuoto && vuoto.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(vuoto);
  }
  return foglio;
}

function pulisci(v) {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) v = v.join(", ");
  v = String(v).trim().slice(0, 2000);
  // evita che un testo venga letto come formula
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function risposta(testo) {
  return ContentService.createTextOutput(testo);
}
