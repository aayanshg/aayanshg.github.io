import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const stage = document.querySelector(".space-stage");
const canvas = document.querySelector("#space-background");

if (stage && canvas) {
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
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 18;

    scene.add(new THREE.AmbientLight(0xa8b9e8, 1.45));

    const keyLight = new THREE.DirectionalLight(0xffddbd, 3.5);
    keyLight.position.set(-7, 8, 12);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x7198ff, 28, 48);
    rimLight.position.set(8, -3, 5);
    scene.add(rimLight);

    function seededRandom(seed) {
      let value = seed;
      return () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
      };
    }

    function makeSurfaceTexture(base, colors, seed) {
      const surface = document.createElement("canvas");
      surface.width = 512;
      surface.height = 256;

      const context = surface.getContext("2d");
      const random = seededRandom(seed);
      context.fillStyle = base;
      context.fillRect(0, 0, surface.width, surface.height);

      for (let band = 0; band < 40; band += 1) {
        const y = (band / 40) * surface.height;
        const amplitude = 2 + random() * 11;
        const frequency = 0.008 + random() * 0.025;
        context.beginPath();
        context.moveTo(0, y);

        for (let x = 0; x <= surface.width; x += 12) {
          context.lineTo(x, y + Math.sin(x * frequency + band) * amplitude);
        }

        context.lineTo(surface.width, y + 8 + random() * 12);
        context.lineTo(0, y + 8 + random() * 12);
        context.closePath();
        context.fillStyle = colors[Math.floor(random() * colors.length)];
        context.globalAlpha = 0.18 + random() * 0.34;
        context.fill();
      }

      for (let mark = 0; mark < 90; mark += 1) {
        const x = random() * surface.width;
        const y = random() * surface.height;
        const radius = 1 + random() * 8;
        context.beginPath();
        context.ellipse(x, y, radius * 1.8, radius, random() * Math.PI, 0, Math.PI * 2);
        context.fillStyle = colors[Math.floor(random() * colors.length)];
        context.globalAlpha = 0.08 + random() * 0.16;
        context.fill();
      }

      context.globalAlpha = 1;
      const texture = new THREE.CanvasTexture(surface);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      return texture;
    }

    function makePlanet({ color, bands, seed, scale, speed, phase, ring }) {
      const group = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({
        map: makeSurfaceTexture(color, bands, seed),
        roughness: 0.82,
        metalness: 0.02,
      });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), material);
      group.add(sphere);

      if (ring) {
        const ringMesh = new THREE.Mesh(
          new THREE.RingGeometry(1.3, 1.95, 96),
          new THREE.MeshStandardMaterial({
            color: 0xd7b993,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.76,
            roughness: 0.9,
          }),
        );
        ringMesh.rotation.x = Math.PI * 0.34;
        ringMesh.rotation.y = Math.PI * 0.1;
        group.add(ringMesh);
      }

      scene.add(group);
      return { group, sphere, scale, speed, phase };
    }

    const planets = [
      makePlanet({
        color: "#9d5561",
        bands: ["#e7a274", "#efc486", "#533e68", "#c76e67"],
        seed: 13,
        scale: 1,
        speed: 0.18,
        phase: 0.2,
        ring: true,
      }),
      makePlanet({
        color: "#317d99",
        bands: ["#67c7bf", "#83d4d2", "#234b70", "#50a5be"],
        seed: 29,
        scale: 0.43,
        speed: -0.24,
        phase: 2.1,
        ring: false,
      }),
      makePlanet({
        color: "#c77e4e",
        bands: ["#f0c879", "#ed9c68", "#8c4e57", "#e3b17e"],
        seed: 47,
        scale: 0.28,
        speed: 0.28,
        phase: 4.2,
        ring: false,
      }),
    ];

    let starField;
    let starMaterial;
    let view = { halfWidth: 1, halfHeight: 1, planetRadius: 1 };

    function makeStars(width, height) {
      if (starField) {
        scene.remove(starField);
        starField.geometry.dispose();
      }

      const count = Math.min(950, Math.max(180, Math.round((width * height) / 1900)));
      const positions = new Float32Array(count * 3);
      const random = seededRandom(71);

      for (let star = 0; star < count; star += 1) {
        const index = star * 3;
        positions[index] = (random() - 0.5) * view.halfWidth * 2;
        positions[index + 1] = (random() - 0.5) * view.halfHeight * 2;
        positions[index + 2] = -2 - random() * 16;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      starMaterial = new THREE.PointsMaterial({
        color: 0xdce7ff,
        size: 0.035,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: true,
      });
      starField = new THREE.Points(geometry, starMaterial);
      scene.add(starField);
    }

    function resizeScene() {
      const width = Math.max(stage.clientWidth, 1);
      const height = Math.max(stage.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      view.halfHeight = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      view.halfWidth = view.halfHeight * camera.aspect;
      view.planetRadius = Math.min(view.halfHeight * 0.22, view.halfWidth * 0.28);

      makeStars(width, height);
    }

    function positionPlanets(time) {
      const lanes = [
        { y: -view.halfHeight * 0.02, phase: 0.2 },
        { y: view.halfHeight * 0.49, phase: 2.1 },
        { y: -view.halfHeight * 0.55, phase: 4.2 },
      ];

      planets.forEach((planet, index) => {
        const radius = view.planetRadius * planet.scale;
        const orbit = time * planet.speed + planet.phase;
        const progress = ((orbit / (Math.PI * 2)) % 1 + 1) % 1;
        const lane = lanes[index];
        const travelWidth = view.halfWidth * 2 + radius * 3;

        planet.group.scale.setScalar(radius);
        planet.group.position.set(
          -view.halfWidth - radius * 1.5 + progress * travelWidth,
          lane.y + Math.sin(orbit * 0.2 + lane.phase) * radius * 0.42,
          index * -0.4,
        );
        planet.sphere.rotation.y = time * planet.speed * 1.7;
        planet.sphere.rotation.x = 0.12 + Math.sin(orbit * 0.3) * 0.04;
      });
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let lastTime = 0;

    function render(time) {
      const seconds = reducedMotion ? 0 : time * 0.001;
      positionPlanets(seconds);
      if (starMaterial && !reducedMotion) {
        starMaterial.opacity = 0.68 + Math.sin(seconds * 1.8) * 0.08;
      }
      renderer.render(scene, camera);
    }

    function animate(time) {
      if (document.hidden) return;
      if (time - lastTime > 28) {
        render(time);
        lastTime = time;
      }
      frame = window.requestAnimationFrame(animate);
    }

    function startAnimation() {
      window.cancelAnimationFrame(frame);
      if (reducedMotion) {
        render(0);
      } else {
        frame = window.requestAnimationFrame(animate);
      }
    }

    resizeScene();
    startAnimation();
    window.addEventListener("resize", () => {
      resizeScene();
      if (reducedMotion) render(0);
    }, { passive: true });
    document.addEventListener("visibilitychange", startAnimation);
  } catch {
    canvas.hidden = true;
  }
}