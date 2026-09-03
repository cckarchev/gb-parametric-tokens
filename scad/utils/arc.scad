module arc(r1, r2, a1, a2, h) {
  r_outer = max(r1, r2);
  r_inner = min(r1, r2);
  clockwise = (a2 < a1);

  angle_diff = clockwise 
    ? (360 - a1 + a2) 
    : (a2 - a1);

  steps = max(5, ceil(angle_diff)); // más pasos = más suave

  linear_extrude(h)
  intersection() {
  difference() {
    circle(r = r_outer, $fn=steps * 2);
    circle(r = r_inner, $fn=steps * 2);
  }

  polygon(concat([[0, 0]],
    [ for (i = [0:steps]) 
      let(a = a1 + (angle_diff * i / steps)) 
      [ cos(a) * (r_outer + 10), sin(a) * (r_outer + 10) ]
    ]));
  }
}

arc(
  r1 = 30,
  r2 = 40,
  a1 = 20,
  a2 = 120,
  h = 3
);
