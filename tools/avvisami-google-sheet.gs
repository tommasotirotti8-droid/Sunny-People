/*
  SUNNY PEOPLE - raccolta contatti "Avvisami per primo"
  ======================================================

  COME ATTIVARLO (una volta sola, 5 minuti):

  1. Accedi a Google con sunnypeopleevents@gmail.com
     e crea un nuovo Foglio Google, ad esempio "Sunny People - Contatti".
  2. Nel foglio: menu Estensioni > Apps Script.
  3. Cancella il codice che trovi e incolla TUTTO questo file. Salva.
  4. In alto a destra: Esegui il deployment > Nuovo deployment.
     - Tipo: App web
     - Esegui come: Me
     - Chi ha accesso: Chiunque
     Premi Esegui il deployment e autorizza l'accesso.
  5. Copia l'URL della App web (finisce con /exec).
  6. Apri event.html, cerca  data-endpoint=""  e incolla l'URL tra le virgolette.

  Da quel momento ogni iscrizione compare come nuova riga nel foglio.
*/

function doPost(e) {
  var p = (e && e.parameter) || {};
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Data", "Nome", "Email", "WhatsApp", "Consenso", "Pagina"]);
  }

  var clean = function (v, max) {
    v = String(v || "").trim().slice(0, max);
    // evita formule nel foglio
    return /^[=+\-@]/.test(v) ? "'" + v : v;
  };

  var email = clean(p.email, 120).toLowerCase();
  if (!p.nome || !email || p.consenso !== "si") {
    return ContentService.createTextOutput("missing");
  }

  // niente doppioni: se l'email c'e' gia' non la riaggiunge
  var last = sheet.getLastRow();
  if (last > 1) {
    var emails = sheet.getRange(2, 3, last - 1, 1).getValues();
    for (var i = 0; i < emails.length; i++) {
      if (String(emails[i][0]).toLowerCase() === email) {
        return ContentService.createTextOutput("ok");
      }
    }
  }

  sheet.appendRow([
    new Date(),
    clean(p.nome, 60),
    email,
    clean(p.whatsapp, 20),
    "si",
    clean(p.pagina, 60)
  ]);

  return ContentService.createTextOutput("ok");
}
