const DEG2RAD = Math.PI / 180;
const GLOBE_RADIUS = 25;
const dotDensity = 2;
const rows = 200;
const worldDotSize = 0.095;

buildWorldGeometry() {
    for (let lat = -90; lat <= 90; lat += 180 / rows) {
        const radius = Math.cos(Math.abs(lat) * DEG2RAD) * GLOBE_RADIUS;
        const circumference = radius * Math.PI * 2;
        const dotsForLat = circumference * dotDensity;
        for (let r = 0; r < dotsForLat; r++) {
            const long = -180 + r * 360 / dotsForLat;
            if (!this.visibilityForCoordinate(long, lat)) continue;
            const o = Rl(h, s, GLOBE_RADIUS);
            e.position.set(o.x, o.y, o.z);
            const c = Rl(h, s, GLOBE_RADIUS + 5);
            e.lookAt(c.x, c.y, c.z),
                e.updateMatrix(),
                i.push(e.matrix.clone())
        }
    }
}

const dotGeo = new THREE.CircleBufferGeometry(worldDotSize, 5)
const dotMat = new THREE.MeshStandardMaterial({
    color: 3818644,
    color: 3818644,
    metalness: 0,
    roughness: .9,
    transparent: !0,
    alphaTest: .02
})

dotMat.onBeforeCompile = function (t) {
    t.fragmentShader = t.fragmentShader.replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", "\n        gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n        if (gl_FragCoord.z > 0.51) {\n          gl_FragColor.a = 1.0 + ( 0.51 - gl_FragCoord.z ) * 17.0;\n        }\n      ")
}