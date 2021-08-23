uniform sampler2D tex;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
    vec3 diffuse = texture2D( tex, vUv ).xyz;
    float intensity = 1.5 - dot( vNormal, vec3( 0.40, 0.85, 1.0 ) );
    vec3 atmosphere = vec3( 0.1, 0.3, 1.0 ) * pow( intensity, 3.0 );
    gl_FragColor = vec4( diffuse + atmosphere, 1.0 );
}