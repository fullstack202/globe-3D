import * as THREE from '../node_modules/three/build/three.module.js';
import ShaderLoader from '../assets/vendor/ShaderLoader.js';

const buildGlobe = (scene) => {
    var geometry = new THREE.SphereGeometry(25, 60, 60);

    var uniforms = {
        tex: {type: 't', value: null}
    }
    var sl = new ShaderLoader();
    sl.loadShaders({
        earth_vs: '',
        earth_fs: '',
        atmosphere_vs: '',
        atmosphere_fs: ''
    }, 'assets/glsl/', () => {
        const globeMap = new THREE.TextureLoader().load('assets/world.jpg');
        uniforms['tex'].value = globeMap;

        // const mat1 = new THREE.ShaderMaterial({
        //     uniforms: uniforms,
        //     vertexShader: ShaderLoader.get("earth_vs"),
        //     fragmentShader: ShaderLoader.get('earth_fs')
        // });

        const globe = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color: 0x29367f}));
        // const globe = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0x1d132b }));
        globe.name = 'earth';
        globe.rotation.y = Math.PI * .8;
        globe.rotation.x = Math.PI * .1;
        scene.add(globe);

        const mat2 = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: ShaderLoader.get('atmosphere_vs'),
            fragmentShader: ShaderLoader.get('atmosphere_fs'),
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true

        });

        const atmosphere = new THREE.Mesh(geometry, mat2);
        // atmosphere.rotateX(Math.PI * .03);
        // atmosphere.rotateY(Math.PI * .03);
        atmosphere.scale.set(1.11, 1.11, 1.11);
        atmosphere.name = 'atmosphere';
        scene.add(atmosphere);
    });

};

const loadJSON = (url, callback) => {
    const http = new XMLHttpRequest();
    http.overrideMimeType("application/json");
    http.open('GET', url, true); // Replace 'my_data' with the path to your file
    http.onreadystatechange = function () {
        if (http.readyState === 4 && http.status === "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(JSON.parse(http.responseText));
        }
    };
    http.send(null);
};

const calcPosFromLatLonRad = (lat, lon, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    let x = -(radius * Math.sin(phi) * Math.cos(theta));
    let z = (radius * Math.sin(phi) * Math.sin(theta));
    let y = (radius * Math.cos(phi));

    return new THREE.Vector3(x, y, z);
};

const buildCurves = (scene) => {
    let curves = [];
    let circles = [];
    let v = getSphericalPositions(20, 25);

    for (var i = 0; i < 10; ++i) {
        const a = v[i * 2];
        const b = v[i * 2 + 1];
        const curve = drawCurve(a, b);
        scene.add(curve);
        curves.push(curve);

        /* draw circles */
        const circle = new THREE.Mesh(
            new THREE.SphereBufferGeometry(0.3, 10),
            new THREE.MeshBasicMaterial({color: 0x33eeaa})
        )
        circle.name = 'point';
        scene.add(circle);
        circle.position.copy(v[i * 2]);

        circle.lookAt(0, 0, 0);
        const endCircle = circle.clone();
        endCircle.name = 'point';
        scene.add(endCircle);
        endCircle.position.copy(v[i * 2 + 1]);
        endCircle.lookAt(0, 0, 0)
        circles.push(circle);
        circles.push(endCircle);
    }
    return {c: curves, o: circles};
}

const getSphericalPositions = (howMany, radius) => {
    // Create and array to store our vector3 point data
    var vectors = [];
    // Create a spherical object
    var spherical = new THREE.Spherical();
    // Set radius of spherical
    spherical.radius = radius;
    // Create new points using random phi and theta properties of the spherical object
    for (var i = 0; i < howMany; i += 1) {
        spherical.phi = THREE.Math.randFloat(0, Math.PI); // Phi is between 0 - PI
        spherical.theta = THREE.Math.randFloat(0, Math.PI * 2); // Phi is between 0 - 2 PI
        var vec3 = new THREE.Vector3().setFromSpherical(spherical);
        vectors.push(vec3);
    }
    return vectors;
}

const drawCurve = (start, end) => {
    const radius = 25;
    const height = start.distanceTo(end) * 1.5;
    const mid = getMid(start, end, 2);
    const sharpPt = getPos(new THREE.Vector3(0, 0, 0), mid, radius + height);
    const v1 = getMid(start, sharpPt, 3);
    const v2 = getMid(end, sharpPt, 3);
    const curve = new THREE.CubicBezierCurve3(start, v1, v2, end);
    const points = curve.getPoints(200);
    // const geometry = new THREE.BufferGeometry().setFromPoints(points);
    let geometry = new THREE.TubeBufferGeometry(curve, 50, 0.05, 12, false)
    let r = Math.random();
    const material = new THREE.MeshBasicMaterial({color: 0xff0000})
    const curveMesh = new THREE.Mesh(geometry, material);
    return curveMesh;
}

const getPos = (start, end, distanceFromStart) => {
    const L = start.distanceTo(end);
    return new THREE.Vector3(
        (end.x - start.x) * distanceFromStart / L + start.x, (end.y - start.y) * distanceFromStart / L + start.y, (end.z - start.z) * distanceFromStart / L + start.z
    );
}

const getMid = (a, b, division) => {
    return new THREE.Vector3((b.x - a.x) / division + a.x, (b.y - a.y) / division + a.y, (b.z - a.z) / division + a.z);
}

export {buildGlobe, buildCurves, calcPosFromLatLonRad};
