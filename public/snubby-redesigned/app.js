"use strict";
(() => {
  if (sessionStorage.getItem("edustar_access") !== "granted") { location.replace("/signin/"); return; }
  const CODE_KEY = "snubby_redesign_dev_code";
  let devCode = sessionStorage.getItem(CODE_KEY);
  if (!devCode) {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    devCode = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    sessionStorage.setItem(CODE_KEY, devCode);
  }
  // Console shortcut: type devmode = code.
  Object.defineProperty(window, "code", { configurable: false, get: () => "code" });
  Object.defineProperty(window, "devmode", { configurable: false, set(value) {
    if (value === "code") {
      console.info("%cSNUBBY DEV ACCESS", "font-weight:bold;color:#f4c542;font-size:14px");
      console.info("Your session code: %c" + devCode, "font-weight:bold;color:#fff;font-size:18px;letter-spacing:2px");
      console.info("Enter this code in the developer access prompt on this page.");
    } else console.info("Unknown devmode command. Available command: devmode = code");
  }});
  const $ = (s, root=document) => root.querySelector(s);
  const backdrop=$("#modal-backdrop"), modalContent=$("#modal-content"), modalActions=$("#modal-actions");
  let guideStep=0;
  const guide=[
    ["A cleaner home","This is your redesigned home screen. Quick actions and important information are grouped into clear cards, instead of being spread around the screen."],
    ["Find things in the sidebar","The left menu is where the main sections live. Home, Game library and Favourites will become the main ways to move around."],
    ["Cleaner popups and buttons","Messages will use one consistent popup style, with clear actions and a close button. Important actions use the yellow primary button."],
    ["You're ready","That's the first tour complete. You can open it again at any time using Quick guide in the sidebar."]
  ];
  function closeModal(){backdrop.hidden=true;modalContent.innerHTML="";modalActions.innerHTML=""}
  function showModal(title,body,buttons=[{label:"Close",primary:true,action:closeModal}]){
    modalContent.innerHTML='<h2 id="modal-title"></h2>'+body;$("#modal-title",modalContent).textContent=title;modalActions.innerHTML="";
    buttons.forEach(item=>{const b=document.createElement("button");b.className="button "+(item.primary?"button-primary":"button-secondary");b.textContent=item.label;b.addEventListener("click",item.action||closeModal);modalActions.appendChild(b)});backdrop.hidden=false;
  }
  function toast(message){const n=document.createElement("div");n.className="toast";n.textContent=message;$("#toast-region").appendChild(n);setTimeout(()=>n.remove(),2600)}
  function showGuide(){
    const [title,description]=guide[guideStep],last=guideStep===guide.length-1;
    showModal("Quick tour",'<span class="guide-step">STEP '+(guideStep+1)+' OF '+guide.length+'</span><h2>'+title+'</h2><p>'+description+'</p><div class="guide-progress"><span style="width:'+((guideStep+1)/guide.length*100)+'%"></span></div>',[
      {label:guideStep===0?"Skip tour":"Close tour",primary:false,action:closeModal},
      {label:last?"Finish":"Next →",primary:true,action:()=>{if(last){sessionStorage.setItem("snubby_redesign_toured","true");closeModal();toast("Tour completed.")}else{guideStep++;showGuide()}}}
    ]);
  }
  function showSettings(){showModal("Preview settings",'<p>Settings will be added here as the redesign develops. Existing Snubby settings and saved data have not been changed.</p><label class="eyebrow" for="display-mode">DISPLAY MODE</label><select class="field" id="display-mode"><option>System default</option><option>Dark</option><option>Light (planned)</option></select>')}
  function showDeveloperGate(){
    showModal("Developer access",'<p>Enter the one-time code printed by the developer console command for this tab.</p><label class="eyebrow" for="dev-code-input">SESSION CODE</label><input class="field" id="dev-code-input" autocomplete="off" spellcheck="false" placeholder="Enter developer code">',[
      {label:"Cancel",primary:false,action:closeModal},
      {label:"Unlock",primary:true,action:()=>{const input=$("#dev-code-input");if(input&&input.value.trim().toUpperCase()===devCode){sessionStorage.setItem("snubby_redesign_dev_unlocked","true");closeModal();toast("Developer mode enabled for this tab.");document.body.classList.add("dev-unlocked");if(sessionStorage.getItem("snubby_redesign_toured")!=="true"){guideStep=0;showGuide()}}else{toast("That code is not correct for this session.");if(input)input.select()}}}
    ]);$("#dev-code-input").focus();
  }
  function showView(view){
    const labels={home:"Home",games:"Game library",favourites:"Favourites"};
    document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    $("#current-view").textContent=labels[view]||"Home";
    if(view==="games"){$("#page-title").textContent="Game library";$("#page-subtitle").textContent="The game catalogue connection is the next development step."}
    else if(view==="favourites"){$("#page-title").textContent="Favourites";$("#page-subtitle").textContent="Your saved games will appear here once the library is connected."}
    else{$("#page-title").textContent="Welcome back." ;$("#page-subtitle").textContent="A cleaner place to find and launch your games."}
  }
  document.addEventListener("click",event=>{
    const b=event.target.closest("[data-action], [data-view]");if(!b)return;
    if(b.dataset.view)showView(b.dataset.view);
    const a=b.dataset.action;
    if(a==="guide"){guideStep=0;showGuide()}
    if(a==="settings")showSettings();
    if(a==="about")showModal("What's changing?","<p>The redesign is starting with a cleaner layout, consistent buttons, simpler popups and a first-time guide. Game loading and the original game features will be connected after the interface foundation is ready.</p>");
    if(a==="games")showView("games");
    if(a==="original")location.href="/games/snubby/snubby/mathlesson1.html";
    if(a==="profile")showModal("Developer session","<p>Developer access is active for this tab. The session code changes when you start a new browser session.</p>");
  });
  $(".close-modal").addEventListener("click",closeModal);
  backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModal()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!backdrop.hidden)closeModal()});
  if(sessionStorage.getItem("snubby_redesign_dev_unlocked")==="true") document.body.classList.add("dev-unlocked");
  else showDeveloperGate();
  $("#today-label").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}).toUpperCase();
  if(sessionStorage.getItem("snubby_redesign_toured")!=="true" && sessionStorage.getItem("snubby_redesign_dev_unlocked")==="true"){guideStep=0;showGuide()}
  console.info("Snubby redesign preview loaded. Developer command: devmode = code");
})();