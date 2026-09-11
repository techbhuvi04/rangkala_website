// Backup: WebGL slider

class Slide extends THREE.Mesh {
  constructor(width, height, animationPhase, canvasTex) {
    const segmentsX = Math.round(width / 8);
    const segmentsY = Math.round(height / 8);
    const depth = 40; 
    const box = new THREE.BoxGeometry(width, height, depth, segmentsX, segmentsY, 1);
    const geometry = box.toNonIndexed();

    var position = geometry.attributes.position;
    var count = position.count;
    var faceCount = count / 3;

    var aAnimation = new Float32Array(count * 2);
    var aStartPosition = new Float32Array(count * 3);
    var aControl0 = new Float32Array(count * 3);
    var aControl1 = new Float32Array(count * 3);
    var aEndPosition = new Float32Array(count * 3);

    var minDuration = 0.8;
    var maxDuration = 1.2;
    var maxDelayX = 0.9;
    var maxDelayY = 0.125;
    var stretch = 0.11;

    var totalDuration = maxDuration + maxDelayX + maxDelayY + stretch;

    var startPosition = new THREE.Vector3();
    var control0 = new THREE.Vector3();
    var control1 = new THREE.Vector3();
    var endPosition = new THREE.Vector3();
    var tempPoint = new THREE.Vector3();

    function getControlPoint0(centroid) {
      var signY = Math.sign(centroid.y);
      tempPoint.x = THREE.Math.randFloat(0.1, 0.3) * 150;
      tempPoint.y = signY * THREE.Math.randFloat(0.1, 0.3) * 200;
      tempPoint.z = THREE.Math.randFloatSpread(100);
      return tempPoint;
    }

    function getControlPoint1(centroid) {
      var signY = Math.sign(centroid.y);
      tempPoint.x = THREE.Math.randFloat(0.3, 0.6) * 150;
      tempPoint.y = -signY * THREE.Math.randFloat(0.3, 0.6) * 200;
      tempPoint.z = THREE.Math.randFloatSpread(100);
      return tempPoint;
    }

    for (var i = 0, i2 = 0, i3 = 0; i < faceCount; i++, i2 += 6, i3 += 9) {
      var vx1 = position.getX(i*3); var vy1 = position.getY(i*3); var vz1 = position.getZ(i*3);
      var vx2 = position.getX(i*3+1); var vy2 = position.getY(i*3+1); var vz2 = position.getZ(i*3+1);
      var vx3 = position.getX(i*3+2); var vy3 = position.getY(i*3+2); var vz3 = position.getZ(i*3+2);
      
      var centroid = new THREE.Vector3(
        (vx1+vx2+vx3)/3, 
        (vy1+vy2+vy3)/3, 
        (vz1+vz2+vz3)/3
      );

      position.setXYZ(i*3, vx1 - centroid.x, vy1 - centroid.y, vz1 - centroid.z);
      position.setXYZ(i*3+1, vx2 - centroid.x, vy2 - centroid.y, vz2 - centroid.z);
      position.setXYZ(i*3+2, vx3 - centroid.x, vy3 - centroid.y, vz3 - centroid.z);

      var duration = THREE.Math.randFloat(minDuration, maxDuration);
      var delayX = THREE.Math.mapLinear(centroid.x, -width * 0.5, width * 0.5, 0.0, maxDelayX);
      var delayY;

      if (animationPhase === 'in') {
        delayY = THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0.0, maxDelayY);
      } else {
        delayY = THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, maxDelayY, 0.0);
      }

      for (var v = 0; v < 6; v += 2) {
        aAnimation[i2 + v]     = delayX + delayY + (Math.random() * stretch * duration);
        aAnimation[i2 + v + 1] = duration;
      }

      endPosition.copy(centroid);
      startPosition.copy(centroid);

      if (animationPhase === 'in') {
        control0.copy(centroid).sub(getControlPoint0(centroid));
        control1.copy(centroid).sub(getControlPoint1(centroid));
      } else {
        control0.copy(centroid).add(getControlPoint0(centroid));
        control1.copy(centroid).add(getControlPoint1(centroid));
      }

      for (var v = 0; v < 9; v += 3) {
        aStartPosition[i3 + v]     = startPosition.x;
        aStartPosition[i3 + v + 1] = startPosition.y;
        aStartPosition[i3 + v + 2] = startPosition.z;

        aControl0[i3 + v]     = control0.x;
        aControl0[i3 + v + 1] = control0.y;
        aControl0[i3 + v + 2] = control0.z;

        aControl1[i3 + v]     = control1.x;
        aControl1[i3 + v + 1] = control1.y;
        aControl1[i3 + v + 2] = control1.z;

        aEndPosition[i3 + v]     = endPosition.x;
        aEndPosition[i3 + v + 1] = endPosition.y;
        aEndPosition[i3 + v + 2] = endPosition.z;
      }
    }

    geometry.setAttribute('aAnimation', new THREE.BufferAttribute(aAnimation, 2));
    geometry.setAttribute('aStartPosition', new THREE.BufferAttribute(aStartPosition, 3));
    geometry.setAttribute('aControl0', new THREE.BufferAttribute(aControl0, 3));
    geometry.setAttribute('aControl1', new THREE.BufferAttribute(aControl1, 3));
    geometry.setAttribute('aEndPosition', new THREE.BufferAttribute(aEndPosition, 3));

    var material = new THREE.ShaderMaterial({
      flatShading: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        map: { value: new THREE.Texture() },
        mapCanvas: { value: canvasTex }
      },
      vertexShader: `
        uniform float uTime;
        attribute vec2 aAnimation;
        attribute vec3 aStartPosition;
        attribute vec3 aControl0;
        attribute vec3 aControl1;
        attribute vec3 aEndPosition;
        varying vec2 vUv;

        vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t) {
          vec3 tp; float tn = 1.0 - t;
          tp.xyz = tn * tn * tn * p0.xyz + 3.0 * tn * tn * t * c0.xyz + 3.0 * tn * t * t * c1.xyz + t * t * t * p1.xyz;
          return tp;
        }

        void main() {
          vUv = uv;
          float tDelay = aAnimation.x;
          float tDuration = aAnimation.y;
          float tTime = clamp(uTime - tDelay, 0.0, tDuration);
          
          float p = tTime / tDuration;
          float tProgress = p < 0.5 ? 4.0 * p * p * p : 1.0 - pow(-2.0 * p + 2.0, 3.0) / 2.0;

          vec3 transformed = position;
          float shardScale = 1.0 - (sin(tProgress * 3.14159) * 0.2);
          transformed.xy *= shardScale;

          ${animationPhase === 'in' ? 'transformed *= tProgress;' : 'transformed *= 1.0 - tProgress;'}
          transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform sampler2D mapCanvas;
        varying vec2 vUv;
        void main() {
          vec4 tex = texture2D(map, vUv);
          vec4 canvas = texture2D(mapCanvas, vUv * 3.0);
          vec3 finalRGB = tex.rgb * (1.0 + (canvas.rgb - 0.5) * 0.35);
          gl_FragColor = vec4(finalRGB, tex.a);
        }
      `
    });

    super(geometry, material);
    this.totalDuration = totalDuration;
    this.frustumCulled = false;
  }

  get time() {
    return this.material.uniforms['uTime'].value;
  }

  set time(v) {
    this.material.uniforms['uTime'].value = v;
  }

  setImage(image) {
    this.material.uniforms.map.value.image = image;
    this.material.uniforms.map.value.needsUpdate = true;
  }

  transition() {
    return gsap.fromTo(this, 
      { time: 0.0 }, 
      { time: this.totalDuration, duration: 5.0, ease: "power1.inOut" }
    );
  }
}
