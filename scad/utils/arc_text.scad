module arc_text(
  chars,
  diameter,
  size,
  angle = 180,
  font = "Liberation Sans"
 ) {
  length = len(chars);
  step_angle = (length > 1) ? angle / (length - 1) : 0;

  for (i = [0:length - 1]) {
    rotate_by = 180 - angle / 2 + i * step_angle;

    rotate([ 0, 0, rotate_by ])
    translate([ 0, diameter, 0 ])
    rotate([ 0, 0, 180 ])
    text(chars[i], font = font, size = size, halign = "center");
  }
}

color("yellow", 0.1) circle(30);

arc_text(
  chars = "It works",
  diameter = 30,
  size = 4,
  angle = 90
 );
