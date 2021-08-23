varying vec3 vNormal;
void main() {
    vNormal = normalize( normalMatrix * normal );
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position.x , position.y, position.z, 1.0 );
}