export const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vNoise;

  uniform float uTime;
  
  // Simplex 4D Noise 
  // Source: https://github.com/ashima/webgl-noise/blob/master/src/noise4D.glsl
  
  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  float mod289(float x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 permute289(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
  }
  
  float permute289(float x) {
    return mod289(((x * 34.0) + 1.0) * x);
  }
  
  vec4 taylorInvSqrt289(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }
  
  float taylorInvSqrt289(float r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }
  
  vec4 grad4_289(float j, vec4 ip) {
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
    vec4 p, s;
  
    p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
    s = vec4(lessThan(p, vec4(0.0)));
    p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;
  
    return p;
  }
  
  float snoise4(vec4 v) {
    const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
                          0.276393202250021,  // 2 * G4
                          0.414589803375032,  // 3 * G4
                         -0.447213595499958); // -1 + 4 * G4
  
    // First corner
    vec4 i  = floor(v + dot(v, vec4(0.309016994374947451)) );
    vec4 x0 = v -   i + dot(i, C.xxxx);
  
    // Other corners
    
    // Rank sorting speeds up this part
    vec4 i0;
    vec3 isX = step( x0.yzw, x0.xxx );
    vec3 isYZ = step( x0.zww, x0.yyz );
    //  i0.x = dot( isX, vec3( 1.0 ) );
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;
    //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;
    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;
  
    // i0 now has the relative values 0,1,2,3
    vec4 i3 = clamp( i0, 0.0, 1.0 );
    vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
    vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );
  
    //  x0 = x0 - 0.0 + 0.0 * C.xxxx
    //  x1 = x0 - i1  + 1.0 * C.xxxx
    //  x2 = x0 - i2  + 2.0 * C.xxxx
    //  x3 = x0 - i3  + 3.0 * C.xxxx
    //  x4 = x0 - 1.0 + 4.0 * C.xxxx
    vec4 x1 = x0 - i1 + C.xxxx;
    vec4 x2 = x0 - i2 + C.yyyy;
    vec4 x3 = x0 - i3 + C.zzzz;
    vec4 x4 = x0 + C.wwww;
  
    // Permutations
    i = mod289(i); 
    float j0 = permute289( permute289( permute289( permute289(i.w) + i.z) + i.y) + i.x);
    vec4 j1 = permute289( permute289( permute289( permute289 (
               i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
             + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
             + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
             + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
  
    // Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
    // 7*7*6 = 294, which is close to the ring size 17*17 = 289.
    vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;
  
    vec4 p0 = grad4_289(j0,   ip);
    vec4 p1 = grad4_289(j1.x, ip);
    vec4 p2 = grad4_289(j1.y, ip);
    vec4 p3 = grad4_289(j1.z, ip);
    vec4 p4 = grad4_289(j1.w, ip);
  
    // Normalise gradients
    vec4 norm = taylorInvSqrt289(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    p4 *= taylorInvSqrt289(dot(p4,p4));
  
    // Mix contributions from the five corners
    vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)), 0.0);
    m0 = m0 * m0;
    m1 = m1 * m1;
    return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 ) ) )
                  + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;
  
  }

  void main() {
    vUv = uv;
    vPosition = position;
    
    // Extract translation from instance matrix
    vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    
    // Calculate noise
    // ofNoise usually returns 0.0 to 1.0. snoise4 returns -1.0 to 1.0.
    // We map it: 0.5 + 0.5 * snoise(...)
    // Scaling factors from C++: location * 0.005, time * 0.01
    // The C++ grid is large (-120 to 120), so 0.005 scale makes sense.
    
    float n = 0.5 + 0.5 * snoise4(vec4(instancePos * 0.005, uTime * 0.01));
    vNoise = n;
    
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  varying vec2 vUv;
  varying float vNoise;

  uniform vec3 uColor1; // Red: 239, 39, 39
  uniform vec3 uColor2; // White: 239, 239, 239

  void main() {
    // Thresholds from C++:
    // < 0.45: Discard
    // < 0.5: Transition (Red Face, White Frame)
    // >= 0.5: Solid (White Face, Red Frame)

    if (vNoise < 0.45) {
      discard;
    }

    vec3 faceColor;
    vec3 frameColor;

    if (vNoise < 0.5) {
      // Transition
      faceColor = uColor1;
      frameColor = uColor2;
    } else {
      // Solid
      faceColor = uColor2;
      frameColor = uColor1;
    }

    // Draw Wireframe + Face
    // We use UVs to detect edges.
    // Standard Box UVs are 0..1 per face.
    float edgeThickness = 0.05; // Adjust as needed
    float edgeX = step(edgeThickness, vUv.x) * step(vUv.x, 1.0 - edgeThickness);
    float edgeY = step(edgeThickness, vUv.y) * step(vUv.y, 1.0 - edgeThickness);
    float isCenter = edgeX * edgeY; // 1 if center, 0 if edge

    vec3 finalColor = mix(frameColor, faceColor, isCenter);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
