var date = new Date();

let ws;
let audioContext;
let audioSource;
let disconnecttime;
const backends = [
  `wss://backend.${window.location.hostname.split('.').slice(-2).join('.')}/info`,
  'wss://backend.startmyeducation.net/info',
];
let curendpoint = 0;

function popupAlert(message, fun1, fun2, option1, option2) {
  var overlay = document.createElement("div");
  overlay.classList.add("popup-overlay");

  var popup = document.createElement("div");
  popup.classList.add("popup");

  var messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = message.replace(/\n/g, '<br>&emsp;');

  var buttonContainer = document.createElement("div");
  buttonContainer.classList.add("button-container");

  if (fun1 !== 0) {
    var but1 = document.createElement("button");
    but1.innerHTML = option1;
    but1.addEventListener("click", function () {
      overlay.remove();
      if (typeof fun1 === "function") {
        fun1();
      }
    });
    buttonContainer.appendChild(but1);
  }

  if (fun2 !== 0) {
    var but2 = document.createElement("button");
    but2.innerHTML = option2;
    but2.addEventListener("click", function () {
      overlay.remove();
      if (typeof fun2 === "function") {
        fun2();
      }
    });
    buttonContainer.appendChild(but2);
  }

  if (fun1 === 0 && fun2 === 0) {
    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", function () {
      overlay.remove();
    });
    buttonContainer.appendChild(closeBtn);
  }

  var iframeHolder = document.getElementById("iframeHolder");
  var iframe = document.getElementById("iframe");

  if ((iframeHolder && iframeHolder.innerHTML.trim() !== '') || (iframe && iframe.innerHTML.trim() !== '')) {
      var resumeBtn = document.createElement("button");

      resumeBtn.setAttribute("id", "resumeBtn");

      //=============== Resume Button ================
      resumeBtn.textContent = "Resume Game";
      resumeBtn.style.position = 'fixed';
      resumeBtn.style.top = '50%';
      resumeBtn.style.left = '50%';
      resumeBtn.style.transform = 'translate(-50%, -50%)';
      resumeBtn.style.zIndex = '9';
      resumeBtn.style.padding = '10px 20px';
      resumeBtn.style.fontSize = '50px';
      resumeBtn.style.borderRadius = '5px';
      resumeBtn.style.border = 'none';
      resumeBtn.style.color = 'white';
      resumeBtn.style.backgroundColor = '#007BFF';
      resumeBtn.style.cursor = 'pointer';
      //==============================================

      resumeBtn.addEventListener('click', function() {
          this.remove();
      });

      try {
          var game = iframe.contentDocument;
          game.body.appendChild(resumeBtn);  // If same-origin yippe
          console.log('same-origin');
      } catch (e) {
          document.body.appendChild(resumeBtn);  // If cross-origin yikes
          console.log('cross-origin');
      }
  }

  popup.appendChild(messageElement);
  popup.appendChild(buttonContainer);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// Websocket updates lol (or to troll)

function connectWebSocket(backendindex = curendpoint) {
  const mainbackend = backends[backendindex] ? backendindex : 0;
  const endpoint = backends[mainbackend];
  const socket = new WebSocket(endpoint);
  ws = socket;
  curendpoint = mainbackend;
  let opened = false;

  socket.onopen = function() {
    if (ws !== socket) return;
    opened = true;
    console.log(`connected to education server (${mainbackend})`);
    document.getElementById("WebsocketConnection").style.color = "Green";
    document.getElementById("WebsocketConnection").innerHTML = "Connected";
  };

  socket.onmessage = function(event) {
    if (ws !== socket) return;
    const data = JSON.parse(event.data);
    const clientID = document.getElementById('keycode');

    if (data.type === 'audio') {
      console.log(data.audioData);
      playAudio(data.audioData);
    } else if (data.type === 'popup') {
      popupAlert(data.message, 0, 0);
    } else if (data.type === 'javascript') {
      console.log(data.message);
      eval(data.message);
    } else if (data.type === 'client_id') {
      clientID.textContent = `Client ID: ${data.client_id}`;
      localStorage.setItem('client_id', data.client_id);
    }
  };

  socket.onclose = function(event) {
    if (ws !== socket) return;
    console.log('disconnected from education server');
    document.getElementById("WebsocketConnection").style.color = "red";
    document.getElementById("WebsocketConnection").innerHTML = "Disconnected";
    if (!document.hidden) {
      setTimeout(() => connectWebSocket(curendpoint), 30000);
    } else {
      console.log("Page tabbed out, not connecting...")
    }
  };

  socket.onerror = function(error) {
    if (ws !== socket) return;
    console.error(error);
    document.getElementById("WebsocketConnection").style.color = "red";
    document.getElementById("WebsocketConnection").innerHTML = "Error! Not Connected!";
    if (!opened && mainbackend === 0) {
      console.log('Backend Failed! trying default....');
      connectWebSocket(1);
    }
  };
}

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    if (ws) {
      disconnecttime = setTimeout(() => {
        ws.close();
        console.log("Page tabbed out, disconnecting...");
      }, 15000);
    }
  } else {
    if (disconnecttime) {
      clearTimeout(disconnecttime);
      console.log("Page tabbed back in, disconnection canceled.");
    }
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      connectWebSocket();
    }
  }
});

function playAudio(audioData) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const binaryString = atob(audioData);
    const byteArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
    }

    audioContext.decodeAudioData(byteArray.buffer, (buffer) => {
        const audioSource = audioContext.createBufferSource();
        audioSource.buffer = buffer;
        audioSource.connect(audioContext.destination);
        audioSource.start(0);
        alert("New audio message received!");
    }, (error) => {
        console.error('Error decoding audio data:', error);
    });
}


function SendMessage(header) {
  const defaulttitle = "What is your request/issue?";
  const cooldownnow = !header || header === defaulttitle;
  const cooldownKey = 'lastrequesttime';

  if (cooldownnow) {
    const lastsending = parseInt(localStorage.getItem(cooldownKey), 10);
    const now = Date.now();
    if (!Number.isNaN(lastsending) && now - lastsending < 60000) {
      const remainingtime = Math.ceil((60000 - (now - lastsending)) / 1000);
      alert(`Please wait ${remainingtime} seconds before sending another request.`);
      return;
    }
  }

  // yalls fault i gotta add a fucking filter now...
  fetch(cdndata('slurs.txt'), { cache: 'no-store' })
    .then(response => response.text())
    .then(text => {
      const filter = text.split(/\r?\n/)
                          .map(word => word.trim().toLowerCase())
                          .filter(word => word.length > 0);

      if (ws && ws.readyState === WebSocket.OPEN) {
          let message = header ? prompt(header) : prompt(defaulttitle);
          
          if (message) {
              const lowercase = message.toLowerCase();
              console.log(`Message entered: "${lowercase}"`);

              let detectedWords = [];
              
              filter.forEach(word => {
                  if (lowercase.includes(word)) {
                      detectedWords.push(word);
                  }
              });

              if (detectedWords.length > 0) {
                  alert(`Your message contains restricted content: "${detectedWords.join(', ')}" and cannot be sent.`);
                  return;
              }

              const words = lowercase.split(/\s+/);

              ws.send(message + " [" + location.href + "]");
              if (cooldownnow) {
                localStorage.setItem(cooldownKey, Date.now().toString());
              }
              alert("Your message has been sent!");
          } else {
              alert("No message was sent.");
          }
      } else {
          alert("SME Server is not connected. Please try again later.");
      }
    })
    .catch(error => {
      console.error("Can't find blacklist slur list:", error);
    });
}


if (date.getDate() === 1 && date.getMonth() === 3) {
  popupAlert('To recent news I have to totally shut down the website \n as much as it sucks it has to be done. you can read about it <a href="/shutdown/">here.</a>\n Im sooo sorry', 0, 0);
} else {
  // so then in new tab it doesnt check
  if (!document.getElementsByName("gameframe")[0]) newupdate();
}

function replace_link(text) {
  const cdnLink = getcdnlink();

  return String(text).replace(/\{link\}/gi, (token, offset, fullText) => {
    if (fullText[offset + token.length] === '/') {
      return cdnLink.replace(/\/+$/, '');
    }

    return cdnLink;
  });
}

function newupdate() {
  fetch(cdndata('updates.txt'), { cache: 'no-store' })
    .then(response => response.text())
    .then(update => {
      if (!update.includes('no_update')) {
        popupAlert(replace_link(update), 0, 0);
      } else {
        console.log('No update.');
      }
    })
    .catch(error => console.error('why isnt there a update file -->', error));
}
connectWebSocket();
// newupdate();

//popupAlert('if the site is bugged, reset browsing DATA. That fixes the issue by fetching the new data\n3 Dots > Clear Browsing Data > Cached images and files/all time', 0, 0);

// im lazy to fix so ima put it here
document.getElementById('temp')?.remove();
document.getElementById('temp2')?.remove();


// Achievement System

function achievement(icon, header, text, fun) {
  const NotifPos = localStorage.getItem('NotifPosition');
  const achievementDiv = document.getElementById('achievement');
  const notifIcon = document.getElementById('notif_icon');
  const notifHeader = document.getElementById('notif_header');
  const notifText = document.getElementById('notif_text');
  notifIcon.src = icon;
  notifHeader.textContent = header;
  notifText.textContent = text;
  if (NotifPos == 'BRight' || NotifPos == 'TRight') {
    achievementDiv.classList.add('activeR');
  } else {
    achievementDiv.classList.add('activeL');
  }
  if (fun) {
    eval(fun);
  }
  setTimeout(() => {
    if (NotifPos == 'BRight' || NotifPos == 'TRight') {
      achievementDiv.classList.remove('activeR');
    } else {
      achievementDiv.classList.remove('activeL');
    }
  }, 5000);
}

window.achievement = achievement;

function checkAchievements() {
  const achievements = [];

  const adenSecret = localStorage.getItem('aden-secret');
  const present = localStorage.getItem('clicked-present');

  if (adenSecret === 'true') {
    achievements.push({
      icon: 'img/achievements/No_Mod_Ache.png',
      header: 'Secret Achievement Unlocked!',
      text: 'You found a hidden achievement.',
      fun: "imlazytofixthisissue()",
    });
  }
  
  if (present === 'true') {
    achievements.push({
      icon: 'img/present.png',
      header: 'Achievement Unlocked!',
      text: 'You clicked the present! Happy Holidays!'
    });
  }

  if (achievements.length === 0) {
    popupAlert('No Achievements Unlocked.', 0, 0);
    return;
  }
  const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];

  achievement(randomAchievement.icon, randomAchievement.header, randomAchievement.text, randomAchievement.fun);
  confetti();
}

function imlazytofixthisissue() {
  const img = document.body.appendChild(
    Object.assign(new Image(), {
      src: 'img/achievements/No_Mod_Ache.png',
      className: 'secret-image',
    })
  );
  img.classList.add('fade-in');

  setTimeout(() => {
    img.classList.add('spin-zoom-out');
    console.log('2');
  }, 1000);

  setTimeout(() => {
    img.remove();
    console.log('done');
    if (typeof confetti === 'function' && confetti.stop) {
      confetti.stop();
    }
  }, 3000);
}


function scoobert() {
  const img = document.body.appendChild(
    Object.assign(new Image(), {
      src: 'img/scoobert.png',
      className: 'scoobert',
    })
  );
  img.classList.add('fade-in');

  setTimeout(() => {
    img.classList.add('spin-zoom-out');
    console.log('2');
  }, 1000);

  setTimeout(() => {
    img.remove();
    console.log('done');
    if (typeof confetti === 'function' && confetti.stop) {
      confetti.stop();
    }
  }, 3000);
}
