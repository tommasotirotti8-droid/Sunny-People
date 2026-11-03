/* SUNNY PEOPLE - moduli della pagina Collab (collab.html)
   I moduli usano Netlify Forms: le risposte arrivano nel pannello
   Netlify (Forms) e, se attivate, anche per email.
   Questo script invia senza ricaricare la pagina e controlla i campi. */

(function(){

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OK_TEXT = {
  locali: "Grazie! Abbiamo ricevuto la proposta: ti ricontattiamo a breve.",
  ragazzi: "Candidatura inviata! Ti scriviamo presto su WhatsApp o Instagram."
};

document.querySelectorAll("form.collab-form").forEach((form)=>{

  const msg = form.querySelector(".nf-msg");
  const btn = form.querySelector("button[type=submit]");

  function show(text, ok){
    msg.textContent = text;
    msg.className = "nf-msg " + (ok ? "ok" : "err");
  }

  function check(){
    let first = null;
    form.querySelectorAll("[required]").forEach((el)=>{
      let bad;
      if(el.type === "checkbox") bad = !el.checked;
      else if(el.type === "email") bad = !EMAIL_RE.test(el.value.trim());
      else if(el.type === "number") bad = !el.value || +el.value < +el.min || +el.value > +el.max;
      else bad = !el.value.trim();
      el.classList.toggle("invalid", bad && el.type !== "checkbox");
      if(bad && !first) first = el;
    });
    return first;
  }

  form.addEventListener("input", (e)=> e.target.classList.remove("invalid"));

  form.addEventListener("submit", async (e)=>{

    e.preventDefault();

    const bad = check();
    if(bad){
      if(bad.type === "checkbox") show("Per inviare devi accettare l'informativa privacy.", false);
      else if(bad.name === "eta") show("Per candidarti devi avere almeno 14 anni.", false);
      else show("Controlla i campi evidenziati.", false);
      bad.focus();
      return;
    }

    const data = new FormData(form);

    // ruoli scelti in un solo campo, leggibile nel pannello Netlify
    const ruoli = form.querySelector("input[name=ruoli]");
    if(ruoli){
      ruoli.value = data.getAll("ruolo").join(", ");
      data.set("ruoli", ruoli.value);
      data.delete("ruolo");
    }

    btn.disabled = true;
    show("Invio in corso...", true);

    try{
      const res = await fetch("/", {
        method:"POST",
        headers:{ "Content-Type":"application/x-www-form-urlencoded" },
        body:new URLSearchParams(data).toString()
      });
      if(!res.ok) throw new Error(res.status);
      form.reset();
      form.classList.add("sent");
      show(OK_TEXT[form.getAttribute("name")] || "Inviato, grazie!", true);
    }catch(err){
      show("Qualcosa è andato storto. Riprova tra poco o scrivici a sunnypeopleevents@gmail.com.", false);
    }finally{
      btn.disabled = false;
    }

  });

});

})();
