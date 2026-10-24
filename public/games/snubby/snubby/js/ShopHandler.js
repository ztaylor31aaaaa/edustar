const overlay = document.getElementById("overlay");
const tabs = document.querySelectorAll("#menu li");
const sections = document.querySelectorAll(".main > div");
const comingsoon = document.getElementById("SOONDATA");

function openshop() {
    overlay.style.display = "flex";
}

function closeshop(event) {
    overlay.style.display = "none";
}

tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    sections.forEach((section) => {
        section.style.display = "none";
    });
    const selectedtab = tab.getAttribute("data-tab");
    const showpart = document.getElementById(selectedtab);
    if (showpart) {
        showpart.style.display = "block";
    }
    });
});

document.querySelector("#menu li.active").click();

function plans() {
  fetch(cdndata('soon.txt'), { cache: 'no-store' })
    .then(response => response.text())
    .then(soon => {
      comingsoon.innerHTML = soon;
    })
    .catch(error => comingsoon.innerHTML = ('error getting ideas or sm, error here.. ', error));
}

plans();
