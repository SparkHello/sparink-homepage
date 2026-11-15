import * as THREE from "three";

type Pointer = { x: number; y: number; active: boolean };

// Original rounded-glass shader, inspired by the square lens study credited in /colophon.
const fragmentShader = `
  uniform sampler2D uPhoto;
  uniform vec2 uSize;
  uniform vec2 uCover;
  uniform vec2 uPointer;
  uniform float uAmount;
  uniform float uLensSize;
  varying vec2 vUv;
  vec3 photo(vec2 uv) {
    return texture2D(uPhoto, clamp((uv-.5)*uCover+.5, .001, .999)).rgb;
  }
  float roundedBox(vec2 p, vec2 halfSize, float radius) {
    vec2 q = abs(p)-halfSize+radius;
    return length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
  }
  void main() {
    vec3 base = photo(vUv);
    vec2 p = (vUv-uPointer)*uSize;
    float halfSize = uLensSize*.5;
    float d = roundedBox(p,vec2(halfSize),uLensSize*.18);
    float mask = 1.-smoothstep(-.7,1.2,d);
    vec2 normal = normalize(p+vec2(.001));
    float r = clamp(length(p)/halfSize,0.,1.4);
    float bevel = smoothstep(-11.,-1.,d);
    vec2 uv = uPointer+(vUv-uPointer)*(.82+.075*r*r);
    uv -= normal*bevel*2.4/uSize;
    vec2 dispersion = normal*(.35+bevel*1.4)/uSize;
    vec3 glass = vec3(photo(uv+dispersion).r,photo(uv).g,photo(uv-dispersion).b);
    float rim = exp(-abs(d+1.3)*.8);
    float light = clamp(dot(normal,normalize(vec2(-1.,1.))),0.,1.);
    glass += rim*(.12+.24*light);
    glass += bevel*.015;
    float shadow = exp(-max(d,0.)/7.)*(1.-mask)*.15;
    vec3 color = mix(base*(1.-shadow*uAmount),glass,mask*uAmount);
    gl_FragColor = vec4(color,1.);
    #include <colorspace_fragment>
  }
`;

export async function createPhotoLens(canvas: HTMLCanvasElement, host: HTMLElement, src: string, initial: Pointer, getPointer: () => Pointer, signal: AbortSignal) {
  const texture = await new THREE.TextureLoader().loadAsync(src);
  if (signal.aborted) { texture.dispose(); throw new DOMException("Lens disposed", "AbortError"); }
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" }); }
  catch (error) { texture.dispose(); throw error; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    uPhoto: { value: texture }, uSize: { value: new THREE.Vector2(1, 1) },
    uCover: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2(initial.x, initial.y) },
    uAmount: { value: 0 }, uLensSize: { value: 124 },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}", fragmentShader, depthTest: false, depthWrite: false });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.Camera();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0, visible = true, disposed = false, contextAvailable = true, lastTime = 0;

  function draw(time: number) {
    frame = 0;
    if (disposed || !contextAvailable || !visible || document.hidden) return;
    const target = getPointer();
    const amount = target.active ? 1 : 0;
    const delta = lastTime ? Math.min(50, time - lastTime) : 16;
    lastTime = time;
    const ease = reduceMotion.matches ? 1 : 1-Math.exp(-delta/65);
    uniforms.uPointer.value.lerp(new THREE.Vector2(target.x, target.y), ease);
    uniforms.uAmount.value += (amount-uniforms.uAmount.value)*ease;
    renderer.render(scene, camera);
    if (Math.abs(uniforms.uAmount.value-amount) > .002 || uniforms.uPointer.value.distanceToSquared(new THREE.Vector2(target.x, target.y)) > .000001) request();
  }
  function request() {
    if (!frame && visible && !disposed && contextAvailable && !document.hidden) frame = requestAnimationFrame(draw);
  }
  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height || disposed) return;
    renderer.setSize(width, height, false);
    uniforms.uSize.value.set(width, height);
    uniforms.uLensSize.value = Math.max(90, Math.min(136, width*.35));
    const image = texture.image as HTMLImageElement;
    const imageRatio = image.width/image.height, ratio = width/height;
    uniforms.uCover.value.set(Math.min(1, ratio/imageRatio), Math.min(1, imageRatio/ratio));
    request();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) request(); else { cancelAnimationFrame(frame); frame = 0; lastTime = 0; } });
  visibility.observe(host);
  const onVisibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; } else request(); };
  document.addEventListener("visibilitychange", onVisibility);
  const contextLost = (event: Event) => { event.preventDefault(); contextAvailable = false; canvas.style.opacity = "0"; cancelAnimationFrame(frame); frame = 0; };
  const contextRestored = () => { contextAvailable = true; canvas.style.opacity = ""; resize(); };
  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("webglcontextrestored", contextRestored);
  resize();
  return { request, dispose() {
    disposed = true; cancelAnimationFrame(frame); resizeObserver.disconnect(); visibility.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", contextLost); canvas.removeEventListener("webglcontextrestored", contextRestored);
    geometry.dispose(); material.dispose(); texture.dispose(); renderer.dispose(); renderer.forceContextLoss();
  } };
}
