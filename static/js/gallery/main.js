/*global THREE kaikai LoadAudio cursor*/
var SCALE = 3;

(function() {

    var root = this;


    function Cursor() {
        var geometry = new THREE.RingGeometry(
            0.85 * Cursor.SIZE * SCALE, 1 * Cursor.SIZE * SCALE, 32
        );
        var material = new THREE.MeshBasicMaterial(
            {color: 0xffffff, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }
        );
        THREE.Mesh.call(this, geometry, material);
    }

    Cursor.SIZE = 0.1 * SCALE;
    Cursor.prototype = Object.create(THREE.Mesh.prototype);
    Cursor.prototype.constructor = Cursor;

    function Demo(info) {
        THREE.Object3D.call(this);

        this.slug = info.slug;
        this.href = info.href;

        var geometry = new THREE.PlaneGeometry(this.width, this.height);
        var texture = THREE.ImageUtils.loadTexture(info.preview);
        var material = new THREE.MeshBasicMaterial({map: texture, transparent: true});
        var plane = new THREE.Mesh(geometry, material);
        this.add(plane);
    }

    Demo.prototype = Object.create(THREE.Object3D.prototype);
    Demo.prototype.constructor = Demo;
    Demo.prototype.width = 1 * SCALE;
    Demo.prototype.height = 1 * SCALE;

    // highlight shows it for selection
    Demo.prototype.highlight = function() {
        console.log('highlight');
        this.object.material.color.setHex(0xff0000);
    };

    // begin private gallery setup functions
    function lookToClick() {
        // create the raycaster
        this.projector = new THREE.Projector();
        this.raycaster = new THREE.Raycaster();
    }

    var RADIUS = 4 * SCALE;

    function addDemos(demos) {
        this.intersectables = [];
        var hl = demos.length / 3.0;
        for (var i = 0; i < demos.length; i++) {
            var demo = new Demo(demos[i]);
            window.demo = demo;
            var theta = (i + hl) * 0.3;
            demo.position.x = RADIUS * Math.cos(theta);
            demo.position.z = RADIUS * Math.sin(theta);
            demo.lookAt(kaikai.camera.position);
            this.add(demo);
            this.intersectables.push(demo.children[0]);
        }
    }

    function setupSkybox() {
        var skyBoxTexture = THREE.ImageUtils.loadTextureCube([
            './static/textures/stars/s_px.jpg',
            './static/textures/stars/s_nx.jpg',
            './static/textures/stars/s_py.jpg',
            './static/textures/stars/s_ny.jpg',
            './static/textures/stars/s_pz.jpg',
            './static/textures/stars/s_nz.jpg'
        ]);

        var skyBoxShader = THREE.ShaderLib.cube;
        skyBoxShader.uniforms.tCube.value = skyBoxTexture;

        var skyBoxMaterial = new THREE.ShaderMaterial({
            fragmentShader: skyBoxShader.fragmentShader,
            vertexShader: skyBoxShader.vertexShader,
            uniforms: skyBoxShader.uniforms,
            deptTest: false,
            depthWrite: false,
            side: THREE.BackSide
        });

        var skyBox = new THREE.Mesh(
            new THREE.BoxGeometry(500, 500, 500),
            skyBoxMaterial
        );

        this.add(skyBox);
    }

    function setupPhotosphere() {
        var sphere = new THREE.Mesh(
            new THREE.SphereGeometry(100, 20, 20),
            new THREE.MeshBasicMaterial({
                map: THREE.ImageUtils.loadTexture('./static/photospheres/redwoods_with_code.jpg')
            })
        );
        sphere.scale.x = -1;
        this.add(sphere);
    }

    // end private gallery setup functions

    function Gallery(demos) {
        THREE.Object3D.call(this);

        lookToClick.bind(this)();
        addDemos.bind(this)(demos);

        // skybox
        setupPhotosphere.bind(this)();

        this.openSound = this.selectSound = function() {};
        LoadAudio('./static/audio/open.mp3', function(sound) {
            this.openSound = sound;
        }.bind(this));

        LoadAudio('./static/audio/champions.mp3', function(sound) {
            sound();
        });

    }

    Gallery.prototype = Object.create(THREE.Object3D.prototype);
    Gallery.prototype.constructor = Gallery;

    var TTL = 100;
    Gallery.prototype.findIntersections = function() {
        var gaze = new THREE.Vector3(0, 0, 1);
        window.gaze = gaze;

        this.projector.unprojectVector(gaze, kaikai.camera);

        this.raycaster.set(
            kaikai.camera.position,
            gaze.sub(kaikai.camera.position).normalize()
        );

        var intersects = this.raycaster.intersectObjects(this.intersectables);

        // reset
        this.intersectables.forEach(function(i) {
            i.scale.set(1, 1, 1);
            i.position.z = 0;
        });
        cursor.scale.set(1, 1, 1);

        // if found
        if (intersects.length > 0) {
            var found = intersects[0];
            // highlight
            found.object.scale.set(1.2, 1.2, 1.2);
            found.object.position.z = 0.1;
            if (!this.selected) {
                this.selectSound();
                window.navigator.vibrate(30);
                this.selected = { id: found.object.uuid, ttl: TTL, obj: found.object };
            } else {
                if (this.selected.id == found.object.uuid) {
                    // decrement
                    this.selected.ttl -= 1;
                    var p = (this.selected.ttl / TTL);
                    cursor.scale.set(p, p, p);
                    if (this.selected.ttl <= 0) {
                        p = p * 100;
                        cursor.scale.set(p, p, p);
                        this.open(this.selected.obj.parent);
                        // cursor.scale.set(0,0,0);
                    }
                } else {
                    this.selectSound();
                    window.navigator.vibrate(30);
                    this.selected = { id: found.object.uuid, ttl: TTL, obj: found.object };
                }
            }
        } else {
            this.selected = null;
        }
    };

    var shade = document.getElementById('shade');
    root.shade = shade;

    Gallery.prototype.open = function(demo) {
        if (this.open.opening) {
            return;
        }
        this.openSound();
        window.navigator.vibrate(100);
        shade.style.backgroundColor = 'rgba(0,0,0,1)';
        this.open.opening = true;
        setTimeout(function() {
            window.top.openDemo({slug: demo.slug, href: demo.href});
            this.open.opening = false;
            this.selected = null;
            shade.style.backgroundColor = '';
        }.bind(this), 1000);
        console.log('open demo', demo.href);
        // window.location.href = demo.href;
    };

    root.openDemo = function(demo) {
        window.location.href = demo.href;
    };

    Gallery.prototype.update = function() {
        this.findIntersections();
    };

    // export
    root.Gallery = Gallery;
    root.Demo = Demo;
    root.Cursor = Cursor;

})();
