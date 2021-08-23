import * as THREE from '../node_modules/three/build/three.module.js';

export default class Curve {
    constructor(scene, towerStart, towerEnd, data) {
        this.scene = scene;
        this.towerStart = towerStart;
        this.towerEnd = towerEnd;
        this.curve = null;
        this.second_curve = null;
        this.animation = true;
        this.dir = 1;
        this.speed = 40;
        this.drawCounts = 0;
        this.data = data;
        this.maxCounts = 3600 + parseInt(Math.random() * 15000);
        this.init();
    }

    init() {
        const a = new THREE.Vector3(this.towerStart.x, this.towerStart.y, this.towerStart.z);
        const b = new THREE.Vector3(this.towerEnd.x, this.towerEnd.y, this.towerEnd.z);
        this.curve = this.drawCurve(a, b);
        this.scene.add(this.curve);
        this.animate();
        // this.curve.geometry.setDrawRange(0, 3000)
    }

    animate() {
        var second = false;
        const a = new THREE.Vector3(this.towerStart.x, this.towerStart.y, this.towerStart.z);
        const b = new THREE.Vector3(this.towerEnd.x, this.towerEnd.y, this.towerEnd.z);
        this.second_curve = this.drawCurve(b, a);

        var render = () => {
            if (this.drawCounts > this.maxCounts) {
                this.remove(this.curve);
                this.dir = -1;
                if (!second) {
                    this.scene.add(this.second_curve);
                    second = true;
                    this.drawCounts = 3600;
                }
            }
            // if (this.drawCounts < 0) this.dir = 1;
            this.drawCounts += this.dir * this.speed;

            if (this.dir > 0) {
                this.curve.geometry.setDrawRange(0, this.drawCounts);
            }
            if (second) {
                this.second_curve.geometry.setDrawRange(0, this.drawCounts);
                if (this.drawCounts < 0) {
                    this.animation = false;
                    this.remove(this.second_curve);
                }
            }
            requestAnimationFrame(render);
        }
        render();
    }

    remove(m) {
        m.geometry.dispose();
        m.material.dispose();
        this.scene.remove(m);
    }

    drawCurve(start, end) {
        const radius = 25;
        const height = start.distanceTo(end) * 1.1;
        const mid = this.getMid(start, end, 2);
        const sharpPt = this.getPos(new THREE.Vector3(0, 0, 0), mid, radius + height);
        const v1 = this.getMid(start, sharpPt, 3);
        const v2 = this.getMid(end, sharpPt, 3);
        const curve = new THREE.CubicBezierCurve3(start, v1, v2, end);
        const points = curve.getPoints(200);
        // const geometry = new THREE.BufferGeometry().setFromPoints(points);
        let geometry = new THREE.TubeBufferGeometry(curve, 50, .1, 12, false)
        const material = new THREE.MeshBasicMaterial({color: 0xff69b4});
        const curveMesh = new THREE.Mesh(geometry, material);
        curveMesh.name = 'curve';
        curveMesh.data = this.data
        return curveMesh;
    }

    getPos(start, end, distanceFromStart) {
        const L = start.distanceTo(end);
        return new THREE.Vector3(
            (end.x - start.x) * distanceFromStart / L + start.x, (end.y - start.y) * distanceFromStart / L + start.y, (end.z - start.z) * distanceFromStart / L + start.z
        );
    }

    getMid(a, b, division) {
        return new THREE.Vector3((b.x - a.x) / division + a.x, (b.y - a.y) / division + a.y, (b.z - a.z) / division + a.z);
    }
}
