import * as THREE from '../node_modules/three/build/three.module.js';
import {OrbitControls} from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import * as Utils from './utils.js';
import {circleInstance, getCoordinates, getMesh} from './instancing.js';
import {GLTFLoader} from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {RGBELoader} from '../node_modules/three/examples/jsm/loaders/RGBELoader.js';
import Curve from './curve.js';

class App {
    constructor(canvas) {
        this.canvas = canvas;
        this.points = null;                                                                     // coordinates of continents except for artic & antarctic
        this.curves = [];
        this.circles = [];
        this.data = [];
        this.initData();
    }


    initData() {
        const that = this;
        const http = new XMLHttpRequest();
        http.open('GET', 'assets/data.json', true);
        http.onreadystatechange = function () {
            if (http.readyState === 4) {
                if (http.status === 200) {
                    that.data = JSON.parse(http.responseText);
                    that.initScene()
                } else {
                    that.initData()
                }
            }
        };
        http.send(null);
    }

    /*
       function:   initialises scene, camera, light, renderer, control, axeshelper and sky.
                   resize & mousemove events.
                   reads envmap.
                   gets coordinates of all continents including/excluding artic & antartic.
                   calls start() finally.
   */
    initScene() {
        this.scene = new THREE.Scene();

        this.scene.background = new THREE.Color(0x000000);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0.5, 90);
        this.scene.add(this.camera);
        // this.scene.fog = new THREE.Fog(0, 0, 6e7);

        let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.4);
        this.scene.add(hemiLight);
        // this.scene.add(new THREE.AmbientLight(0x404040));
        // this.scene.add(new THREE.DirectionalLight(0xffffff, 0.5));
        let pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(-300, 500, 0);
        this.camera.add(pointLight);

        this.renderer = new THREE.WebGLRenderer({canvas: this.canvas, antialias: true, alpha: true});
        const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
        this.renderer.setPixelRatio(DPR);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = false;
        this.controls.autoRotate = true;
        this.controls.update();
        this.controls.autoRotateSpeed = 0.5;

        this.axesHelper = new THREE.AxesHelper(70);
        // this.scene.add(this.axesHelper);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        const skyMap = new THREE.TextureLoader().load('assets/space.jpeg');
        skyMap.encoding = THREE.sRGBEncoding;
        const sky = new THREE.Mesh(
            new THREE.SphereBufferGeometry(400, 20, 20).scale(-1, 1, 1),
            new THREE.MeshBasicMaterial({
                // color: 0x446688,
                // color: 0x000000
                color: 0x050817
                // map: skyMap
            })
        );
        sky.name = 'sky';
        sky.position.set(0, -5, 0)
        this.scene.add(sky);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);

        document.getElementById('canvas').addEventListener('mousemove', e => {
            const popup = document.getElementById('popup');
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            popup.style.left = e.clientX - 150 + 'px';
            popup.style.top = e.clientY - 47 + 'px';
            popup.style.display = 'none';
            this.controls.autoRotate = true
        });

        Promise.all([
            new Promise(resolve => {
                new RGBELoader().setDataType(THREE.UnsignedByteType).load('assets/venice_sunset_1k.hdr', resolve)
            }).then(result => {
                let texture = result;
                let pmremGenerator = new THREE.PMREMGenerator(this.renderer);
                pmremGenerator.compileEquirectangularShader();
                const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                this.scene.environment = envMap;
                texture.dispose();
                pmremGenerator.dispose();
            }),
            this.loadModel('assets/tower.glb').then(result => {
            }),
            new Promise(resolve => {
                circleInstance(this.scene, resolve)
            }).then(() => {
                this.points = getCoordinates().coordinates;                                     // continents except for artic & antartic
                this.pixels = getCoordinates().pixels;                                          // continents including artic & antartic
                this.continents = getMesh();                                                    // instanced mesh that holds continents
            })
        ]).then(() => {
            this.start();
        });
    }

    /*
        function:   builds globe and static spikes & tops.
                    calls animate() finally.
    */
    start() {
        Utils.buildGlobe(this.scene);

        // const result = Utils.buildCurves(this.scene)
        // this.curves = result.c;
        // this.circles = result.o;

        for (let i = 0; i < this.data.length; i++) {
            this.curves.push(null);
        }

        this.animate();
    }

    /*  
        param:      mesh
        function:   removes mesh from scene
    */
    remove(m) {
        m.geometry.dispose();
        m.material.dispose();
        this.scene.remove(m);
    }

    /*
        param:      url
        function:   loads model from url
    */
    loadModel(url) {
        return new Promise(resolve => {
            new GLTFLoader().load(url, resolve);
        });
    }

    /*
        param:      spike position as Vector3
        function:   converts cartesian(x, y, z) to spherical(r, phi, theta) which is followed by conversion back to cartesian with radius (GLOBE_RADIUS + TOWER_HEIGHT)
    */
    top(point) {
        let phi = Math.acos(point.z / 25);
        let theta = Math.atan(point.y / point.x);
        if (point.x > 0) {
            return new THREE.Vector3(27.2 * Math.sin(phi) * Math.cos(theta), 27.2 * Math.sin(phi) * Math.sin(theta), 27.2 * Math.cos(phi));
        } else {
            return new THREE.Vector3(-27.2 * Math.sin(phi) * Math.cos(theta), -27.2 * Math.sin(phi) * Math.sin(theta), 27.2 * Math.cos(phi));
        }
    }


    /*
        function:   makes a maximum of 20 curves which will be created after a certial periord of delay time.
                    animates curves and spikes and removes them once animation is finished.
    */
    animate() {
        const delays = [];
        const timers = [];
        for (let i = 0; i < this.curves.length; i++) {
            delays.push(parseInt(Math.random() * 2000));
            timers.push(0);
        }

        let startPoint = null;
        delays[0] = 0;

        let render = () => {
            // shows description when hovering on spikes(towers)
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children, false);

            if (intersects.length > 0 && intersects[0].object.name === 'curve') {
                const intersect = intersects[0].object;
                const data = intersect.data;
                this.setPopupData(data);
                this.controls.autoRotate = false
            }

            for (let i = 0; i < this.curves.length; i++) {
                timers[i] += 2;
                if (this.curves[i] == null) {
                    if (timers[i] > delays[i] && i !== 0) {
                        // chooses a random start point on continents
                        const curveInfo = this.data[i];
                        const start = curveInfo.startLocation;
                        const end = curveInfo.endLocation;
                        startPoint = Utils.calcPosFromLatLonRad(start[0], start[1], 25);
                        let endPoint = Utils.calcPosFromLatLonRad(end[0], end[1], 25);
                        console.log(startPoint, endPoint);

                        // makes a curve
                        this.curves[i] = new Curve(this.scene, startPoint, endPoint, curveInfo);
                    }
                } else {
                    // destroy curve & towers
                    if (!this.curves[i].animation) {
                        this.curves[i] = null;
                        timers[i] = 0;
                    } else {
                        if (this.curves[i].dir === 1) {
                            if (this.curves[i].drawCounts < 3600) {
                                //this.spikes[2 * i].tower.scale.z -= .004;
                                //this.spikes[2 * i + 1].tower.scale.z -= .004;
                            }
                        } else {
                            if (this.curves[i].drawCounts < 3600) {
                                //this.spikes[2 * i].tower.scale.z += .004;
                                //this.spikes[2 * i + 1].tower.scale.z += .004;
                            }
                        }
                    }
                }
            }

            this.renderer.render(this.scene, this.camera);
            this.controls.update();
            requestAnimationFrame(render);
        };

        render();
    }

    setPopupData(data) {
        document.getElementById('img-thumbnail').src = data.thumbnail;
        document.getElementById('description-link').href = data.videoLink;
        document.getElementById('description-title').innerHTML = data.title;
        document.getElementById('popup').style.display = 'block';
    }
}


const app = new App(document.getElementById('canvas'));
