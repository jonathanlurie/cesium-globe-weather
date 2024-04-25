

precision highp float;
precision highp int;

uniform sampler2D texA;
uniform sampler2D texB;
uniform float ratio;

in vec2 vUv;
out vec4 fragColor;


void main() {
  vec4 texColorA = texture(texA, vUv);
  vec4 texColorB = texture(texB, vUv);
  float mixedValue = mix(texColorA.r, texColorB.r, ratio);
  fragColor = vec4(1., 1., 1., pow(mixedValue, 2.));
}
