function changeContent(selectedOption) {
    var image = document.getElementById('characterImage');
    var messageText = document.getElementById('messageText');

    switch(selectedOption) {
        case 'option1':
            image.src = cdnicons('preload.webp');
            messageText.innerHTML = 'Hello! How may I help ya?';
            break;
        case 'option2':
            image.src = cdnicons('preload.webp');
            messageText.innerHTML = '<p>The creator! Of the website, server, and me of course. If you have any questions you would ask him!</p>';
            break;
        case 'option3':
            image.src = cdnicons('preload.webp');
            //messageText.innerHTML = `<p>I'm <a href="https://twitter.com/Snubbyjpg/status/1741610594187223139">Sakura-Sensei</a>!</p>`;
            messageText.innerHTML = `<p>3 Dots > Clear Browsing Data > Cached images and files/all time</p>`;
            break;
        case 'option4':
            image.src = cdnicons('preload.webp');
            messageText.innerHTML = `<p> Join the <a href="https://discord.gg/fJxmmchjuR">Discord</a>, or use the message icon on the action bar!</p>`;
            break;
        case 'option5':
            image.src = cdnicons('preload.webp'); // "Bro what" type of face
            messageText.innerHTML = '... are you stupid..?';
            break;
        case 'option6':
            image.src = cdnicons('preload.webp'); // Eww face
            messageText.innerHTML = '....';
            break;
        case 'option7':
            image.src = 'img/sakura/Sensei-skull.png'; // "Bro what" type of face
            messageText.innerHTML = `Ah yes. Snub's reason to live.`;
            break;
        case 'option8':
            image.src = 'img/spong.png';
            messageText.innerHTML = `<img src="img/Sp0ng.png">`;
            break;
        case 'option9':
            image.src = 'img/jumpscare.png'; // Ah so scarrrryyyyy
            messageText.innerHTML = `<p> A helper and developer, he helped with the website starting 8/20/24. He created the naming of the games plus <span class='glow-effect'>glow affect!</span> The Profile dropdown, and the discord bots role system.</p>`;
            break;
        case 'option10':
            image.src = 'img/hardassimage.png'; // Ah so sigma
            messageText.innerHTML = `<p>The most sigma admin and person ever! Very good at drawing and being sigma</p>`;
            break;
        case 'option11':
            image.src = cdnicons('preload.webp');
            messageText.innerHTML = `<p>Log in daily to recieve 5 coins each time!</p>`;
            break;
    
    }
}

changeContent();


function copyandpastedthesettingscodelmao() {
    var x = document.getElementById("SAKURA");
  
    if (x.style.display === "none") {
      x.classList.remove("slide-out2");
      x.style.display = "block";
      x.classList.add("slide-in2");
    } else {
      x.classList.add("slide-out2");
      x.classList.remove("slide-in2");
        setTimeout(function() { 
            x.style.display = "none"; 
        }, 600);
    }
}

