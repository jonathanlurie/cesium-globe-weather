

precision highp float;
precision highp int;

uniform sampler2D tex;

in vec2 vUv;
out vec4 fragColor;


void main() {
  vec4 texColor = texture(tex, vUv);
  fragColor = vec4(1., 1., 1., pow(texColor.r, 2.) * 0.9 );
  // fragColor.a = 0.9;
}
