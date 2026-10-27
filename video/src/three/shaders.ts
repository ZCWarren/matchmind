import * as THREE from "three";

/** Volumetric floodlight cone: bright at the lamp, soft edges, dusty streaks. */
export const makeBeamMaterial = (color: string) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: 1 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      varying vec2 vUv;
      varying float vAngle;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormalV = normalize(normalMatrix * normal);
        vViewDir = normalize(-mv.xyz);
        vAngle = atan(position.x, position.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uTime;
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      varying vec2 vUv;
      varying float vAngle;
      void main() {
        float along = max(0.0, vUv.y);               // 1 at apex (lamp), 0 at far end
        float fall = along > 0.0 ? pow(along, 1.6) : 0.0;
        float ndv = abs(dot(normalize(vNormalV), normalize(vViewDir)));
        float edge = ndv > 0.0 ? pow(ndv, 1.35) : 0.0;
        float streak = 0.75 + 0.25 * sin(vAngle * 23.0 + uTime * 0.35) * sin(vAngle * 7.0 - uTime * 0.2);
        float a = clamp(fall * edge * streak * uIntensity * 0.42, 0.0, 4.0);
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    fog: false,
  });

/** Light ribbon along a curve (u = along). Reveal front, animated dashes, hot head. */
export const makeRibbonMaterial = (color: string, head = "#ffffff") =>
  new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uHead: { value: new THREE.Color(head) },
      uProgress: { value: 0 },
      uTail: { value: 1 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uDash: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uHead;
      uniform float uProgress;
      uniform float uTail;
      uniform float uTime;
      uniform float uOpacity;
      uniform float uDash;
      varying vec2 vUv;
      void main() {
        float u = vUv.x;
        if (u > uProgress) discard;
        float behind = uProgress - u;
        float tail = 1.0 - smoothstep(0.0, uTail, behind);
        float dash = mix(1.0, 0.7 + 0.3 * sin((u * 9.0 - uTime * 0.12) * 6.2831), uDash);
        float headGlow = exp(-behind * 30.0);
        vec3 col = mix(uColor, uHead, headGlow);
        float a = (0.35 + 0.65 * tail) * dash * uOpacity + headGlow * uOpacity;
        gl_FragColor = vec4(col * (1.0 + headGlow * 2.0) * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

/** Soft radial glow for sprites / ground discs. */
export const makeGlowMaterial = (color: string, opacity = 1, power = 2.2) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uPower: { value: power },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPower;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float base = max(0.0, 1.0 - d);
        float a = (base > 0.0 ? pow(base, uPower) : 0.0) * uOpacity;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

/** Ring band (for pressure pulses) on a plane: thin bright ring with soft falloff. */
export const makeRingMaterial = (color: string) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
      uWidth: { value: 0.06 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uWidth;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float rq = (d - 0.92) / uWidth;
        float ring = exp(-rq * rq);
        float inner = smoothstep(0.92, 0.0, d) * 0.18;
        float a = (ring + inner) * uOpacity;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

/** Vertical sweeping light plane for the line break. u across pitch, v up. */
export const makeCurtainMaterial = (color: string, edge: string) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uEdge: { value: new THREE.Color(edge) },
      uSweep: { value: 0 },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uEdge;
      uniform float uSweep;
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float baseUp = max(0.0, 1.0 - vUv.y);
        float up = baseUp > 0.0 ? pow(baseUp, 2.2) : 0.0;
        float reveal = smoothstep(uSweep, uSweep - 0.08, vUv.x);
        float bq = (vUv.x - uSweep) / 0.03;
        float band = exp(-bq * bq);
        float scan = 0.8 + 0.2 * sin(vUv.y * 120.0 - uTime * 0.6);
        float base = exp(-vUv.y * 40.0);
        vec3 col = mix(uColor, uEdge, band);
        float a = (up * 0.28 * reveal * scan + band * up * 0.9 + base * reveal * 0.5) * uOpacity;
        gl_FragColor = vec4(col * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

/** Round soft points with per-vertex colour and size. */
export const makePointsMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uScale: { value: 1 },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute vec3 aColor;
      varying vec3 vColor;
      uniform float uScale;
      void main() {
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(aSize * uScale * (300.0 / max(1.0, -mv.z)), 1.0, 48.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      uniform float uOpacity;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float base = max(0.0, 1.0 - d);
        float a = (base > 0.0 ? pow(base, 1.8) : 0.0) * uOpacity;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
