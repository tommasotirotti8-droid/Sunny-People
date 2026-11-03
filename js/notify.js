/* SUNNY PEOPLE - modulo "Avvisami per primo" (event.html)
   Invia i dati a Netlify Forms (modulo "avvisami"). */

(function(){

const form = document.getElementById("notify-form");
if(!form) return;

const msg = form.querySelector(".nf-msg");
const btn = form.querySelector("button[type=submit]");

function show(text, ok){
  msg.textContent = text;
  msg.className = "nf-msg " + (ok ? "ok" : "err");
}

form.addEventListener("submit", async (e)=>{

  e.preventDefault();

  const data = new FormData(form);

  // campo trappola per i bot
  if(data.get("website")) return;

  const nome = (data.get("nome") || "").trim();
  const email = (data.get("email") || "").trim();

  if(!nome){ show("Please enter your name.", false); return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ show("Please enter a valid email.", false); return; }
  if(!data.get("consenso")){ show("Please accept the privacy policy.", false); return; }

  const body = new URLSearchParams();
  body.set("form-name", "avvisami");
  body.set("nome", nome);
  body.set("email", email);
  body.set("whatsapp", (data.get("whatsapp") || "").trim());
  body.set("consenso", "si");
  body.set("website", "");

  btn.disabled = true;
  show("Sending...", true);

  try{
    const res = await fetch("/", {
      method:"POST",
      headers:{ "Content-Type":"application/x-www-form-urlencoded" },
      body:body.toString()
    });
    if(!res.ok) throw new Error(res.status);
    form.reset();
    show("You're on the list! We'll let you know first.", true);
  }catch(err){
    show("Something went wrong. Please try again in a moment.", false);
  }finally{
    btn.disabled = false;
  }

});

})();
