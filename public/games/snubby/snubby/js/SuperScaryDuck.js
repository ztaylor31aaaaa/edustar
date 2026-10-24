var duckon = localStorage.getItem('duckmode') == 'true';
var duckamount = Math.max(1, parseInt(localStorage.getItem('duckamount')) || 1);
var duckloading = false;
var duckstuff = null;
var duckvalue = document.getElementById('duckvalue');
var duckcount = document.getElementById('duckcount');
var duckcontrols = document.getElementById('duckcontrols');
var quacks = [
    'js/duck-mode-its-seriously-scary-and-you-shouldnt-look-at-it/quack1.mp3',
    'js/duck-mode-its-seriously-scary-and-you-shouldnt-look-at-it/quack2.mp3',
    'js/duck-mode-its-seriously-scary-and-you-shouldnt-look-at-it/quack3.mp3',
    'js/duck-mode-its-seriously-scary-and-you-shouldnt-look-at-it/quack4.mp3',
    'js/duck-mode-its-seriously-scary-and-you-shouldnt-look-at-it/quack5.mp3'
];

function updateduckvalue(text, color) {
    duckvalue.innerText = text || (duckon ? 'Enabled' : 'Disabled');
    duckvalue.style.color = color || (duckon ? 'green' : 'red');
    duckcount.innerText = duckamount;
    duckcontrols.style.display = duckon ? 'block' : 'none';
}

function toggleduckmode() {
    duckon = !duckon;
    localStorage.setItem('duckmode', duckon);

    if (duckon) startduck();
    else stopduck();

    updateduckvalue();
}

function changeduckcount(amount) {
    duckamount = Math.max(1, duckamount + amount);
    localStorage.setItem('duckamount', duckamount);
    duckcount.innerText = duckamount;
    syncducks();
}

function newduck() {
    return {
        x: Math.random() * Math.max(0, window.innerWidth - 180),
        y: Math.random() * Math.max(0, window.innerHeight - 180),
        xspeed: Math.random() < 0.5 ? -3 : 3,
        yspeed: Math.random() < 0.5 ? -2 : 2,
        offset: Math.random() * 10000,
        nextquack: Date.now() + 30000 + Math.random() * 30000
    };
}

function quackduck(duck) {
    duck.nextquack = Date.now() + 30000 + Math.random() * 30000;

    var sound = new Audio(quacks[Math.floor(Math.random() * quacks.length)]);
    sound.volume = 0.5;
    duckstuff.sounds.push(sound);
    sound.onended = function () {
        if (!duckstuff) return;
        duckstuff.sounds = duckstuff.sounds.filter(function (old) {
            return old != sound;
        });
    };
    sound.play().catch(function () {
        console.log('browser blocked the quack lol');
    });
}

function syncducks() {
    if (!duckstuff) return;

    while (duckstuff.ducks.length < duckamount) duckstuff.ducks.push(newduck());
    while (duckstuff.ducks.length > duckamount) duckstuff.ducks.pop();
}

async function startduck() {
    if (duckstuff || duckloading || !duckon) return;

    duckloading = true;
    updateduckvalue('Loading...', '#e0a800');

    var duckholder;
    var renderer;
    var draco;

    try {
        var modules = await Promise.all([
            import('https://cdn.jsdelivr.net/npm/three@0.162.0/+esm'),
            import('https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/GLTFLoader.js/+esm'),
            import('https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/DRACOLoader.js/+esm')
        ]);

        if (!duckon) return;

        var three = modules[0];
        var gltfloader = modules[1].GLTFLoader;
        var dracoloader = modules[2].DRACOLoader;

        duckholder = document.createElement('div');
        duckholder.id = 'super-scary-duck';
        duckholder.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;user-select:none;overflow:hidden;';

        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:100%;height:100%;pointer-events:none;';
        duckholder.appendChild(canvas);
        document.body.appendChild(duckholder);

        renderer = new three.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: false,
            powerPreference: 'low-power'
        });
        renderer.setPixelRatio(1);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = three.SRGBColorSpace;
        renderer.shadowMap.enabled = false;
        renderer.autoClear = false;

        var scene = new three.Scene();
        var camera = new three.PerspectiveCamera(34, 1, 0.1, 100);
        var duckgroup = new three.Group();
        camera.position.set(0, 0.2, 5);
        camera.lookAt(0, 0, 0);
        scene.add(duckgroup);
        scene.add(new three.HemisphereLight(0xffffff, 0x554422, 2.2));

        var light = new three.DirectionalLight(0xffffff, 1.7);
        light.position.set(3, 4, 5);
        scene.add(light);

        draco = new dracoloader();
        draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/draco/');
        draco.setWorkerLimit(1);

        var loader = new gltfloader();
        loader.setDRACOLoader(draco);
        var loaded = await loader.loadAsync('js/duck-mode-its-seriously-scary-and-you-shouldnt-look-at-it/duck.glb');
        draco.dispose();
        draco = null;

        if (!duckon) {
            renderer.dispose();
            renderer.forceContextLoss();
            duckholder.remove();
            return;
        }

        var model = loaded.scene;
        var box = new three.Box3().setFromObject(model);
        var size = box.getSize(new three.Vector3());
        model.scale.setScalar(2.55 / Math.max(size.x, size.y, size.z));
        model.updateMatrixWorld(true);
        box.setFromObject(model);
        model.position.sub(box.getCenter(new three.Vector3()));
        duckgroup.add(model);

        duckstuff = {
            holder: duckholder,
            renderer: renderer,
            ducks: [],
            group: duckgroup,
            sounds: []
        };
        syncducks();

        // one canvas and one model is reused for every duck
        duckstuff.timer = setInterval(function () {
            if (document.hidden) return;

            var screenwidth = window.innerWidth;
            var screenheight = window.innerHeight;
            var renderwidth = Math.max(1, Math.floor(screenwidth / 2));
            var renderheight = Math.max(1, Math.floor(screenheight / 2));
            var duckwidth = Math.max(1, Math.floor(180 * renderwidth / screenwidth));
            var duckheight = Math.max(1, Math.floor(180 * renderheight / screenheight));
            var maxx = Math.max(0, screenwidth - 180);
            var maxy = Math.max(0, screenheight - 180);
            var time = Date.now();

            if (duckstuff.width != renderwidth || duckstuff.height != renderheight) {
                renderer.setSize(renderwidth, renderheight, false);
                duckstuff.width = renderwidth;
                duckstuff.height = renderheight;
            }
            renderer.setScissorTest(false);
            renderer.setViewport(0, 0, renderwidth, renderheight);
            renderer.clear();
            renderer.setScissorTest(true);

            duckstuff.ducks.forEach(function (duck) {
                if (time >= duck.nextquack) quackduck(duck);

                duck.x += duck.xspeed;
                duck.y += duck.yspeed;

                if (duck.x <= 0 || duck.x >= maxx) duck.xspeed *= -1;
                if (duck.y <= 0 || duck.y >= maxy) duck.yspeed *= -1;
                duck.x = Math.max(0, Math.min(duck.x, maxx));
                duck.y = Math.max(0, Math.min(duck.y, maxy));

                var wave = Math.sin((time + duck.offset) * 0.0017) * 7;
                var drawy = Math.max(0, Math.min(duck.y + wave, maxy));
                var left = Math.floor(duck.x * renderwidth / screenwidth);
                var bottom = Math.floor((screenheight - drawy - 180) * renderheight / screenheight);

                renderer.setViewport(left, bottom, duckwidth, duckheight);
                renderer.setScissor(left, bottom, duckwidth, duckheight);
                duckgroup.scale.x = duck.xspeed < 0 ? -1 : 1;
                duckgroup.rotation.z = Math.sin((time + duck.offset) * 0.0042) * 0.16;
                duckgroup.rotation.y = Math.sin((time + duck.offset) * 0.0013) * 0.22;
                renderer.render(scene, camera);
            });

            renderer.setScissorTest(false);
        }, 66);

        updateduckvalue();
    } catch (error) {
        if (draco) draco.dispose();
        if (renderer) {
            renderer.dispose();
            renderer.forceContextLoss();
        }
        if (duckholder) duckholder.remove();

        duckstuff = null;
        duckon = false;
        localStorage.setItem('duckmode', false);
        updateduckvalue('Unavailable', 'red');
        console.error('duck broke lol', error);
    } finally {
        duckloading = false;
    }
}

function stopduck() {
    if (duckstuff) {
        clearInterval(duckstuff.timer);
        duckstuff.sounds.forEach(function (sound) {
            sound.pause();
        });
        duckstuff.renderer.dispose();
        duckstuff.renderer.forceContextLoss();
        duckstuff.holder.remove();
        duckstuff = null;
    }

    updateduckvalue();
}

if (duckon) startduck();
else updateduckvalue();
