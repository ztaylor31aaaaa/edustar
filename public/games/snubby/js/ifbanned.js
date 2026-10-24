const dbName = 'ban-system';
const dbVersion = 1;

const request = indexedDB.open(dbName, dbVersion);
let banned = null;

request.onerror = function(event) {
  console.error('Database error:', event.target.error);
};

request.onupgradeneeded = function(event) {
  const db = event.target.result;
  const store = db.createObjectStore('settings', { keyPath: 'key' });
  store.createIndex('key', 'key', { unique: true });
};

request.onsuccess = function(event) {
  const db = event.target.result;

  function setSetting(key, value) {
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
  
    store.put({ key: key, value: value });
  }
  
  function getSetting(key, callback) {
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
  
    const request = store.get(key);
  
    request.onsuccess = function(event) {
      const setting = event.target.result;
      if (setting) {
        callback(setting.value);
      } else {
        callback(null);
      }
    };
  }

  getSetting("banned", function(value) {
    banned = value;
    if (banned == null) {
      setSetting("banned", "false");
      banned = "false";
    }
  });
  
  // MDIxOGxvbA== base64 format
  
  var getbanned = "48504956767976";
  var getunbanned = "48504956767976";
  var input2 = "";
  var timer2;
  var mode2 = false;
  
  $(document).keyup(function(e) {
    //console.log(e.which);
    input2 += e.which;
    clearTimeout(timer2);
    timer2 = setTimeout(function() { input2 = ""; }, 500);
    check_input();
  });
  
  
  function check_input() {
    if(banned == 'false' && input2 == getbanned) {
      alert('GET BANNED LOL');
      setSetting("banned", "true");
      banned = "true";
      window.location.reload(true);
    } else if(banned == 'true' && input2 == getunbanned){
      alert('fine get unbanned');
      setSetting("banned", "false");
      banned = "false";
      window.open("/","_self");
    }
  };
  
  $(document).ready(function() {
    setInterval(function() { $('#info').html('Keystroke: ' + input2); }, 100);
  });
};
