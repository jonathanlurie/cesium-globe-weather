

precision highp float;
precision highp int;

uniform sampler2D texA;
uniform sampler2D texB;
uniform float ratio;

in vec2 vUv;
out vec4 fragColor;



// Since the cloud coverage is quite low resolution and that natively WebGL has only bilinear
// interpolation, it creates some visual artifact that are not very elegant.
// I wanted to have a bicubic interpolation instead, and I found a nice working one online.

// This cubic interpolation was borrowed from https://stackoverflow.com/a/42179924/5885003
vec4 cubic(float v){
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 s = n * n * n;
  float x = s.x;
  float y = s.y - 4.0 * s.x;
  float z = s.z - 4.0 * s.y + 6.0 * s.x;
  float w = 6.0 - x - y - z;
  return vec4(x, y, z, w) * (1.0/6.0);
}

// This cubic interpolation was borrowed from https://stackoverflow.com/a/42179924/5885003
vec4 textureBicubic(sampler2D tex, vec2 texCoords){
  vec2 texSize = vec2(textureSize(tex, 0));
  vec2 invTexSize = 1.0 / texSize;

  texCoords = texCoords * texSize - 0.5;
  vec2 fxy = fract(texCoords);
  texCoords -= fxy;
  vec4 xcubic = cubic(fxy.x);
  vec4 ycubic = cubic(fxy.y);
  vec4 c = texCoords.xxyy + vec2 (-0.5, +1.5).xyxy;
  vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
  vec4 offset = c + vec4 (xcubic.yw, ycubic.yw) / s;
  offset *= invTexSize.xxyy;
  vec4 sample0 = texture(tex, offset.xz);
  vec4 sample1 = texture(tex, offset.yz);
  vec4 sample2 = texture(tex, offset.xw);
  vec4 sample3 = texture(tex, offset.yw);
  float sx = s.x / (s.x + s.y);
  float sy = s.z / (s.z + s.w);

  return mix(
    mix(sample3, sample2, sx), mix(sample1, sample0, sx)
  ,sy);
}


void main() {
  vec4 texColorA = textureBicubic(texA, vUv);
  vec4 texColorB = textureBicubic(texB, vUv);
  float mixedValue = mix(texColorA.r, texColorB.r, ratio);
  fragColor = vec4(1., 1., 1., pow(mixedValue, 2.));
}
