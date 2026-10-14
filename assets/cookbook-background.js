import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const hero = document.querySelector(".intro");
const canvas = document.querySelector("#cookbook-background");

if (hero && canvas) {
  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
    camera.position.z = 18;
    scene.add(new THREE.AmbientLight(0xffdfb8, 1.7));

    const keyLight = new THREE.DirectionalLight(0xfff0d7, 3.2);
    keyLight.position.set(-5, 7, 10);
    scene.add(keyLight);

    const warmLight = new THREE.PointLight(0xe9a45e, 22, 40);
    warmLight.position.set(7, -2, 7);
    scene.add(warmLight);

    function seededRandom(seed) {
      let value = seed;
      return () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
      };
    }

    function cookieTexture(seed) {
      const textureCanvas = document.createElement("canvas");
      textureCanvas.width = 512;
      textureCanvas.height = 512;
      const context = textureCanvas.getContext("2d");
      const random = seededRandom(seed);
      const dough = context.createRadialGradient(248, 230, 42, 256, 256, 270);
      dough.addColorStop(0, "#e8b96f");
      dough.addColorStop(0.76, "#d89a4e");
      dough.addColorStop(1, "#a95f31");
      context.fillStyle = dough;
      context.fillRect(0, 0, 512, 512);

      for (let crumb = 0; crumb < 750; crumb += 1) {
        const x = random() * 512;
        const y = random() * 512;
        const size = 0.6 + random() * 2.8;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fillStyle = random() > 0.52 ? "#f2cc8c" : "#96532f";
        context.globalAlpha = 0.08 + random() * 0.22;
        context.fill();
      }

      for (let chip = 0; chip < 30; chip += 1) {
        const angle = random() * Math.PI * 2;
        const distance = Math.sqrt(random()) * 215;
        const x = 256 + Math.cos(angle) * distance;
        const y = 256 + Math.sin(angle) * distance;
        const radius = 8 + random() * 10;
        context.beginPath();
        context.ellipse(x, y, radius * 1.15, radius * 0.82, angle, 0, Math.PI * 2);
        context.fillStyle = "#43251d";
        context.globalAlpha = 0.92;
        context.fill();
        context.beginPath();
        context.ellipse(x - radius * 0.18, y - radius * 0.2, radius * 0.34, radius * 0.14, angle, 0, Math.PI * 2);
        context.fillStyle = "#9b6248";
        context.globalAlpha = 0.45;
        context.fill();
      }

      context.globalAlpha = 1;
      const texture = new THREE.CanvasTexture(textureCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      return texture;
    }

    function makeCookie(seed) {
      const group = new THREE.Group();
      const top = new THREE.MeshStandardMaterial({ map: cookieTexture(seed), roughness: 0.92 });
      const edge = new THREE.MeshStandardMaterial({ color: 0x9c5a30, roughness: 0.98 });
      const base = new THREE.MeshStandardMaterial({ color: 0xb9773e, roughness: 0.98 });
      const cookie = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.18, 56), [edge, top, base]);
      cookie.rotation.x = Math.PI / 2;
      group.add(cookie);
      return group;
    }

    function flatShape(points, color, z) {
      const shape = new THREE.Shape();
      shape.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) shape.lineTo(x, y);
      shape.closePath();
      const mesh = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshStandardMaterial({ color, roughness: 0.88, side: THREE.DoubleSide }),
      );
      mesh.position.z = z;
      return mesh;
    }

    function makeCake() {
      const group = new THREE.Group();
      const cakeShape = new THREE.Shape();
      cakeShape.moveTo(-0.9, -0.58);
      cakeShape.lineTo(0.9, -0.58);
      cakeShape.lineTo(0.9, 0.27);
      cakeShape.lineTo(-0.68, 0.27);
      cakeShape.lineTo(-0.9, 0.1);
      cakeShape.closePath();

      const cake = new THREE.Mesh(
        new THREE.ExtrudeGeometry(cakeShape, {
          depth: 0.42,
          bevelEnabled: true,
          bevelSegments: 2,
          bevelSize: 0.035,
          bevelThickness: 0.035,
          curveSegments: 4,
        }),
        new THREE.MeshStandardMaterial({ color: 0xc47d4d, roughness: 0.9 }),
      );
      cake.position.z = -0.22;
      group.add(cake);

      group.add(flatShape([[-0.89, -0.31], [0.89, -0.31], [0.89, -0.2], [-0.89, -0.2]], 0xffe4bb, 0.225));
      group.add(flatShape([[-0.85, -0.02], [0.89, -0.02], [0.89, 0.09], [-0.74, 0.09]], 0xffe4bb, 0.225));
      group.add(flatShape([[-0.9, 0.22], [0.9, 0.22], [0.9, 0.37], [-0.6, 0.37], [-0.76, 0.27]], 0xf5d6d1, 0.23));

      const berryMaterial = new THREE.MeshStandardMaterial({ color: 0xa93636, roughness: 0.55 });
      for (const [x, y] of [[-0.34, 0.47], [0, 0.51], [0.34, 0.47]]) {
        const berry = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), berryMaterial);
        berry.position.set(x, y, 0.27);
        group.add(berry);
      }

      return group;
    }

    const treats = [
      { group: makeCookie(101), size: 1.2, duration: 19, phase: 0.04, lane: 0.06, direction: 1, spin: 0.18 },
      { group: makeCake(), size: 1.08, duration: 15, phase: 0.55, lane: 0.3, direction: -1, spin: -0.13 },
      { group: makeCookie(202), size: 0.82, duration: 22, phase: 0.33, lane: -0.34, direction: 1, spin: -0.2 },
      { group: makeCake(), size: 0.76, duration: 18, phase: 0.84, lane: 0.39, direction: 1, spin: 0.16 },
      { group: makeCookie(303), size: 0.68, duration: 16, phase: 0.7, lane: -0.12, direction: -1, spin: 0.24 },
    ];

    for (const treat of treats) scene.add(treat.group);

    let halfWidth = 1;
    let halfHeight = 1;

    function resize() {
      const width = Math.max(hero.clientWidth, 1);
      const height = Math.max(hero.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      halfHeight = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      halfWidth = halfHeight * camera.aspect;
    }

    function render(milliseconds) {
      const time = milliseconds * 0.001;
      for (const treat of treats) {
        const progress = ((time / treat.duration + treat.phase) % 1 + 1) % 1;
        const travel = treat.direction > 0 ? progress : 1 - progress;
        const size = treat.size * Math.min(halfHeight * 0.2, 1.35);
        const range = halfWidth * 2 + size * 2;
        const sway = Math.sin(time * 0.7 + treat.phase * Math.PI * 2) * size * 0.16;

        treat.group.scale.setScalar(size);
        treat.group.position.set(
          -halfWidth - size + travel * range,
          halfHeight * treat.lane + sway,
          -1 + treat.phase,
        );
        treat.group.rotation.z = Math.sin(time * 0.3 + treat.phase * 6) * 0.08;
        treat.group.rotation.y = Math.sin(time * 0.45 + treat.phase * 4) * 0.12;
        treat.group.rotation.z += time * treat.spin;
      }
      renderer.render(scene, camera);
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let lastFrame = 0;

    function animate(now) {
      if (document.hidden) return;
      if (now - lastFrame >= 30) {
        render(now);
        lastFrame = now;
      }
      frame = window.requestAnimationFrame(animate);
    }

    function start() {
      window.cancelAnimationFrame(frame);
      if (reducedMotion) render(0);
      else if (!document.hidden) frame = window.requestAnimationFrame(animate);
    }

    resize();
    start();
    window.addEventListener("resize", () => {
      resize();
      if (reducedMotion) render(0);
    }, { passive: true });
    document.addEventListener("visibilitychange", start);
  } catch {
    canvas.hidden = true;
  }
}